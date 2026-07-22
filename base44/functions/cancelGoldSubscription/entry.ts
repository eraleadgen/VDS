import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import Stripe from 'npm:stripe@17.0.0';

// Cancel a single vehicle's VDS Gold membership without affecting other vehicles that
// share the same Stripe subscription. Each VehicleSubscription stores its own
// stripe_item_id; when other vehicles remain active on the subscription we remove only
// this vehicle's line item. When this is the last vehicle on the subscription, the whole
// subscription is canceled (and a 48-hour refund is issued if eligible).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { vehicle_id } = await req.json();
    if (!vehicle_id) return Response.json({ error: 'vehicle_id required' }, { status: 400 });

    // Verify vehicle belongs to user
    const vehicle = await base44.entities.MemberVehicle.get(vehicle_id);
    if (!vehicle || vehicle.created_by_id !== user.id) {
      return Response.json({ error: 'Vehicle not found or unauthorized' }, { status: 404 });
    }

    // Find active subscriptions for this vehicle
    const subscriptions = await base44.asServiceRole.entities.VehicleSubscription.filter({
      vehicle_id,
      status: 'active'
    });

    if (subscriptions.length === 0) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    let refund_issued = false;
    const today = new Date().toISOString().split('T')[0];

    for (const sub of subscriptions) {
      // Are other vehicles still active on the same Stripe subscription?
      const siblings = await base44.asServiceRole.entities.VehicleSubscription.filter({
        stripe_subscription_id: sub.stripe_subscription_id,
        status: 'active'
      });
      const othersActive = siblings.filter(s => s.vehicle_id !== vehicle_id);

      if (othersActive.length > 0) {
        // Other vehicles remain — remove only this vehicle's line item from the shared
        // subscription. Stripe proration credits the unused time automatically.
        if (sub.stripe_item_id) {
          try {
            await stripe.subscriptionItems.del(sub.stripe_item_id, { proration_behavior: 'create_prorations' });
          } catch (e) {
            console.error('Subscription item removal failed:', e.message);
          }
        }
        // Legacy subscriptions without an item id: leave the Stripe subscription intact
        // (other vehicles depend on it) and only mark this vehicle's record canceled locally.
      } else {
        // Last vehicle on this subscription — cancel the whole subscription.
        if (sub.stripe_subscription_id) {
          // 48-hour refund eligibility (only when canceling the entire subscription)
          const startedAt = new Date(sub.started_date || sub.created_date);
          const hoursSinceStart = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60);
          const within48Hours = hoursSinceStart <= 48;
          const serviceRecords = await base44.asServiceRole.entities.ServiceRecord.filter({ vehicle_id });
          const hasUsedPerks = serviceRecords.length > 0;
          const eligibleForRefund = within48Hours && !hasUsedPerks;

          try {
            const canceledSub = await stripe.subscriptions.cancel(sub.stripe_subscription_id);
            if (eligibleForRefund && canceledSub.latest_invoice) {
              try {
                const invoice = await stripe.invoices.retrieve(canceledSub.latest_invoice);
                if (invoice.payment_intent) {
                  await stripe.refunds.create({ payment_intent: invoice.payment_intent });
                  refund_issued = true;
                  console.log(`Refund issued for subscription ${sub.stripe_subscription_id}`);
                }
              } catch (refundErr) {
                console.error('Refund error:', refundErr.message);
              }
            }
          } catch (e) {
            // Subscription may already be canceled (e.g. webhook beat us to it) — non-blocking.
            console.error('Subscription cancel failed (non-blocking):', e.message);
          }
        }
      }

      // Mark this vehicle's membership record as canceled.
      await base44.asServiceRole.entities.VehicleSubscription.update(sub.id, {
        status: 'canceled',
        current_period_end: today
      });
    }

    // Remove Gold status from this vehicle only.
    await base44.entities.MemberVehicle.update(vehicle_id, { is_gold_registered: false });

    return Response.json({
      success: true,
      refund_issued,
      message: refund_issued
        ? 'Membership canceled and refund issued.'
        : 'Membership canceled successfully.'
    });
  } catch (error) {
    console.error('Cancel Gold subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});