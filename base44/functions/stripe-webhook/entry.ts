import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';
import { onInvoicePaid } from '../../shared/invoicePaid.ts';
import { creditPartnerGoldSignup } from '../../shared/partnerIncentive.ts';
import { sendCareGuideEmail } from '../../shared/careGuideEmail.ts';
import { loadBusinessContact } from '../../shared/businessContact.ts';
import { checkFeature } from '../../shared/planFeatures.ts';
import { handleEraSaaSEvent } from '../../shared/eraWebhook.ts';

// Stripe webhook — provisions VDS Gold memberships and keeps VehicleSubscription
// records in sync with Stripe lifecycle events. GoHighLevel has been fully removed;
// Stripe + ERA Core are the sole sources of truth for memberships.
//
// Each vehicle enrolled in a checkout gets its OWN VehicleSubscription record with its
// individual stripe_item_id, so a single vehicle can be canceled without touching the
// other vehicles sharing the same Stripe subscription.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Dual-secret webhook verification: try the live secret first, fall back to the
    // test secret. This lets the same handler accept both live and test-mode webhook
    // events, so test-mode billing flows can be exercised end-to-end without real
    // charges (the mechanism planned back in Phase A). The Stripe API client is
    // constructed with the key matching whichever secret verified, so subscription
    // retrieves hit the correct account (live vs test).
    const liveSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const testSecret = Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET');
    const verifier = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')); // key unused for verification

    let event;
    let stripe;
    let isTestMode = false;
    try {
      event = await verifier.webhooks.constructEventAsync(body, signature, liveSecret);
      stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    } catch (liveErr) {
      if (!testSecret) {
        console.error('Stripe webhook live verification failed:', liveErr.message);
        return Response.json({ error: 'Signature verification failed' }, { status: 400 });
      }
      try {
        event = await verifier.webhooks.constructEventAsync(body, signature, testSecret);
        stripe = new Stripe(Deno.env.get('STRIPE_TEST_SECRET_KEY'));
        isTestMode = true;
      } catch (testErr) {
        console.error('Stripe webhook verification failed (live + test):', liveErr.message, '/', testErr.message);
        return Response.json({ error: 'Signature verification failed' }, { status: 400 });
      }
    }

    console.log('Stripe webhook received:', event.type, isTestMode ? '(test mode)' : '(live)');

    // Handle checkout session completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.metadata?.base44_app_id !== Deno.env.get('BASE44_APP_ID')) {
        return Response.json({ received: true });
      }

      // ERA SaaS branch: route ERA Systems account/billing events to the dedicated handler.
      if (session.metadata?.era_product_type === 'era_saas') {
        await handleEraSaaSEvent(base44, stripe, event);
        return Response.json({ received: true });
      }

      // Read business_id from the checkout session metadata (stamped by createGoldCheckoutSession).
      const businessId = session.metadata?.business_id || 'vds';

      const userId = session.metadata?.user_id;
      const vehicleIds = JSON.parse(session.metadata?.vehicle_ids || '[]');

      if (!userId || vehicleIds.length === 0) {
        console.error('Missing user or vehicle data in session metadata');
        return Response.json({ error: 'Invalid metadata' }, { status: 400 });
      }

      // Use the subscription created by this checkout session directly (more reliable than
      // listing the customer's subscriptions, which could return a different one when a
      // customer has multiple memberships).
      const subId = session.subscription;
      if (!subId) {
        console.error('No subscription found on checkout session');
        return Response.json({ error: 'No subscription found' }, { status: 400 });
      }

      // Idempotency: if Stripe redelivers this checkout.session.completed event, the
      // VehicleSubscription records already exist for this subscription id — no-op to
      // avoid duplicate provisioning (double partner credit, double care-guide email).
      const alreadyProvisioned = await base44.asServiceRole.entities.VehicleSubscription.filter({
        stripe_subscription_id: subId,
      });
      if (alreadyProvisioned && alreadyProvisioned.length > 0) {
        console.log(`Duplicate checkout.session.completed for ${subId} — already provisioned, skipping`);
        return Response.json({ received: true });
      }

      // Expand the subscription items so each vehicle maps to its own line-item id.
      const fullSub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data'] });
      const items = (fullSub.items && fullSub.items.data) || [];

      for (let i = 0; i < vehicleIds.length; i++) {
        const vehicleId = vehicleIds[i];
        const vehicle = await base44.asServiceRole.entities.MemberVehicle.get(vehicleId);
        // Tenant guard: asServiceRole bypasses RLS — skip cross-tenant vehicles.
        if (vehicle && vehicle.business_id && vehicle.business_id !== businessId) {
          console.error(`Vehicle ${vehicleId} belongs to a different tenant — skipping`);
          continue;
        }
        const tier = vehicle?.vehicle_type || vehicle?.pricing_group || 'sedan_coupe';
        const item = items[i];
        const priceId = item?.price?.id || '';
        const pricing_group = tier === 'truck_suv' ? 'truck_suv' : 'sedan_coupe';

        await base44.asServiceRole.entities.VehicleSubscription.create({
          business_id: businessId,
          vehicle_id: vehicleId,
          stripe_subscription_id: fullSub.id,
          stripe_item_id: item?.id || '',
          stripe_customer_id: session.customer,
          stripe_price_id: priceId,
          pricing_group,
          tier,
          status: 'active',
          started_date: new Date().toISOString().split('T')[0],
          current_period_end: new Date(fullSub.current_period_end * 1000).toISOString().split('T')[0]
        });

        // Mark the vehicle as Gold-registered.
        if (vehicle) {
          try {
            await base44.asServiceRole.entities.MemberVehicle.update(vehicleId, { is_gold_registered: true });
          } catch (e) { console.error('is_gold_registered update failed:', vehicleId, e.message); }
        }
      }

      console.log(`Gold subscriptions created for user ${userId}, vehicles: ${vehicleIds.join(', ')}`);

      // ── Partner Network: attribute a Gold signup to the referring partner ──
      // The partner referral code rides along in the checkout metadata (persisted from
      // the partner link the visitor used). On checkout completion the partner earns the
      // one-time $30 initial_detail incentive (same pot as a first paid detail — idempotent
      // per client) and their gold_members_generated counter increments.
      try {
        const partnerRef = session.metadata?.partner_referral_code;
        if (partnerRef) {
          const fc = await checkFeature(base44, businessId, 'partner_engine');
          if (fc.ok) {
            // Resolve the member's name/email so a Customer record can be created for a
            // member who signed up for Gold before ever booking a detail.
            let goldEmail = null, goldName = null;
            try {
              const u = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
              goldEmail = u?.email || null; goldName = u?.full_name || '';
            } catch (e) { /* non-blocking */ }
            const r = await creditPartnerGoldSignup(base44, { userId, partnerRefCode: partnerRef, email: goldEmail, fullName: goldName, businessId });
            console.log('Partner Gold signup attribution:', JSON.stringify(r));
          } else {
            console.log('Partner Gold attribution skipped — partner_engine not enabled for tenant');
          }
        }
      } catch (e) { console.error('Partner Gold attribution failed:', e.message); }

      // ── Auto-deliver the VDS Gold member care guide ──
      // Gold members are registered app users (they created accounts at checkout), so the
      // SendEmail integration delivers reliably here.
      try {
        const goldEmailForGuide = session.customer_details?.email || goldEmail || null;
        if (goldEmailForGuide) {
          await sendCareGuideEmail(base44, { guideKey: 'vds_gold', to: goldEmailForGuide, customerName: goldName, businessId });
          console.log('VDS Gold care guide sent to', goldEmailForGuide);
        }
      } catch (e) { console.error('VDS Gold care guide send failed:', e.message); }

      // ── Internal notification: a new Gold membership signup ──────────────
      try {
        const contact = await loadBusinessContact(base44, businessId);
        const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        let memberEmail = session.customer_details?.email || null;
        let memberName = '';
        try {
          const u = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
          memberEmail = memberEmail || u?.email || null;
          memberName = u?.full_name || '';
        } catch {}
        const displayName = memberName || memberEmail || 'New Member';
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-bottom:2px solid #D4AF37;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">${contact.businessNameHeader}</td>
      <td align="right" style="font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">New ${contact.goldLabel}</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:'Space Mono','Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Membership Signup</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">${esc(displayName)}</h1>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Email</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${esc(memberEmail || 'N/A')}</td></tr>
      <tr><td style="padding:4px 0;font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Vehicles Enrolled</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${vehicleIds.length}</td></tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-top:2px solid #D4AF37;">
    <p style="margin:0;font-family:'Space Mono','Courier New',monospace;font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} ${contact.legalName.toUpperCase()}. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contact.internalEmail,
          subject: `New ${contact.goldLabel} Membership — ${displayName}`,
          body: html,
          from_name: contact.businessName,
        });
      } catch (e) { console.error('Internal Gold signup email failed:', e.message); }
    }

    // Handle subscription updates / deletion — sync status to every VehicleSubscription
    // sharing this Stripe subscription id.
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;

      // ERA SaaS branch: route ERA Systems subscription updates to the dedicated handler.
      if (subscription.metadata?.era_product_type === 'era_saas') {
        await handleEraSaaSEvent(base44, stripe, event);
        return Response.json({ received: true });
      }

      const newStatus = subscription.status === 'active' ? 'active' :
                       subscription.status === 'canceled' ? 'canceled' :
                       subscription.status === 'past_due' ? 'past_due' : 'trialing';

      const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({
        stripe_subscription_id: subscription.id
      });

      for (const sub of subs) {
        await base44.asServiceRole.entities.VehicleSubscription.update(sub.id, {
          status: newStatus,
          current_period_end: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString().split('T')[0] :
                              new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
        });
        // If the whole subscription was deleted/canceled, clear the Gold flag on each vehicle.
        if (newStatus === 'canceled') {
          try {
            await base44.asServiceRole.entities.MemberVehicle.update(sub.vehicle_id, { is_gold_registered: false });
          } catch (e) { console.error('clear is_gold_registered failed:', sub.vehicle_id, e.message); }
        }
      }

      console.log(`Subscription ${subscription.id} updated to ${newStatus}`);
    }

    // ── One-time service invoices (e.g. a ceramic coating job) ──
    // When a Stripe invoice is paid, mark the linked Base44 Invoice paid and run the
    // shared partner-incentive attribution. Subscription (Gold) invoices are skipped
    // here — Gold memberships are handled by checkout.session.completed above.
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const inv = event.data.object;
      const isSubscription = !!(inv.subscription || inv.billing_reason === 'subscription_cycle' || inv.billing_reason === 'subscription_create');
      const appMatch = inv.metadata?.base44_app_id === Deno.env.get('BASE44_APP_ID');
      if (!isSubscription && appMatch) {
        const invoiceBizId = inv.metadata?.business_id || 'vds';
        try {
          const b44Id = inv.metadata?.base44_invoice_id;
          let invoice = null;
          if (b44Id) {
            invoice = await base44.asServiceRole.entities.Invoice.get(b44Id).catch(() => null);
            // Tenant guard: asServiceRole bypasses RLS — reject cross-tenant invoices.
            if (invoice && invoice.business_id && invoice.business_id !== invoiceBizId) invoice = null;
          }
          if (!invoice && inv.id) {
            const byRef = await base44.asServiceRole.entities.Invoice.filter({ business_id: invoiceBizId, stripe_payment_reference: inv.id }).catch(() => []);
            invoice = byRef && byRef[0];
          }
          if (invoice && invoice.payment_status !== 'paid') {
            // Guard: if the linked job was cancelled after this invoice was issued, a late
            // Stripe retry must NOT mark it paid or run revenue / partner side effects.
            let skipDueToCancellation = false;
            if (invoice.job_id) {
              const linkedJob = await base44.asServiceRole.entities.Job.get(invoice.job_id).catch(() => null);
              // Tenant guard: asServiceRole bypasses RLS — reject cross-tenant jobs.
              if (linkedJob && linkedJob.business_id && linkedJob.business_id !== invoiceBizId) {
                skipDueToCancellation = true;
              } else if (linkedJob && linkedJob.status === 'cancelled') {
                skipDueToCancellation = true;
                console.log(`Stripe invoice ${inv.id} paid but linked job ${linkedJob.id} is cancelled — skipping side effects`);
              }
            }
            if (!skipDueToCancellation) {
              await base44.asServiceRole.entities.Invoice.update(invoice.id, {
                payment_status: 'paid',
                payment_method: 'stripe',
                stripe_payment_reference: inv.id,
                paid_date: new Date().toISOString().split('T')[0],
              });
              await onInvoicePaid(base44, invoice.id, invoiceBizId);
              console.log(`Stripe invoice ${inv.id} paid → Base44 invoice ${invoice.id} marked paid + partner attributed`);
            }
          }
        } catch (e) { console.error('One-time invoice paid handler error:', e.message); }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});