import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';
import { onInvoicePaid } from '../../shared/invoicePaid.ts';
import { creditPartnerGoldSignup } from '../../shared/partnerIncentive.ts';
import { sendCareGuideEmail } from '../../shared/careGuideEmail.ts';

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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Webhook authentication: Stripe signature is verified here before any data access.
    // This is the correct auth pattern for webhook endpoints (no user session available).
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log('Stripe webhook received:', event.type);

    // Handle checkout session completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.metadata?.base44_app_id !== Deno.env.get('BASE44_APP_ID')) {
        return Response.json({ received: true });
      }

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

      // Expand the subscription items so each vehicle maps to its own line-item id.
      const fullSub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data'] });
      const items = (fullSub.items && fullSub.items.data) || [];

      for (let i = 0; i < vehicleIds.length; i++) {
        const vehicleId = vehicleIds[i];
        const vehicle = await base44.asServiceRole.entities.MemberVehicle.get(vehicleId);
        const tier = vehicle?.vehicle_type || vehicle?.pricing_group || 'sedan_coupe';
        const item = items[i];
        const priceId = item?.price?.id || '';
        const pricing_group = tier === 'truck_suv' ? 'truck_suv' : 'sedan_coupe';

        await base44.asServiceRole.entities.VehicleSubscription.create({
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
          // Resolve the member's name/email so a Customer record can be created for a
          // member who signed up for Gold before ever booking a detail.
          let goldEmail = null, goldName = null;
          try {
            const u = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
            goldEmail = u?.email || null; goldName = u?.full_name || '';
          } catch (e) { /* non-blocking */ }
          const r = await creditPartnerGoldSignup(base44, { userId, partnerRefCode: partnerRef, email: goldEmail, fullName: goldName });
          console.log('Partner Gold signup attribution:', JSON.stringify(r));
        }
      } catch (e) { console.error('Partner Gold attribution failed:', e.message); }

      // ── Auto-deliver the VDS Gold member care guide ──
      // Gold members are registered app users (they created accounts at checkout), so the
      // SendEmail integration delivers reliably here.
      try {
        const goldEmailForGuide = session.customer_details?.email || goldEmail || null;
        if (goldEmailForGuide) {
          await sendCareGuideEmail(base44, { guideKey: 'vds_gold', to: goldEmailForGuide, customerName: goldName });
          console.log('VDS Gold care guide sent to', goldEmailForGuide);
        }
      } catch (e) { console.error('VDS Gold care guide send failed:', e.message); }
    }

    // Handle subscription updates / deletion — sync status to every VehicleSubscription
    // sharing this Stripe subscription id.
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
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
        try {
          const b44Id = inv.metadata?.base44_invoice_id;
          let invoice = null;
          if (b44Id) invoice = await base44.asServiceRole.entities.Invoice.get(b44Id).catch(() => null);
          if (!invoice && inv.id) {
            const byRef = await base44.asServiceRole.entities.Invoice.filter({ stripe_payment_reference: inv.id }).catch(() => []);
            invoice = byRef && byRef[0];
          }
          if (invoice && invoice.payment_status !== 'paid') {
            await base44.asServiceRole.entities.Invoice.update(invoice.id, {
              payment_status: 'paid',
              payment_method: 'stripe',
              stripe_payment_reference: inv.id,
              paid_date: new Date().toISOString().split('T')[0],
            });
            await onInvoicePaid(base44, invoice.id);
            console.log(`Stripe invoice ${inv.id} paid → Base44 invoice ${invoice.id} marked paid + partner attributed`);
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