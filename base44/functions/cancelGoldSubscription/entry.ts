import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import Stripe from 'npm:stripe@17.0.0';

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

    for (const sub of subscriptions) {
      // Check 48-hour refund eligibility
      const startedAt = new Date(sub.started_date || sub.created_date);
      const hoursSinceStart = (Date.now() - startedAt.getTime()) / (1000 * 60 * 60);
      const within48Hours = hoursSinceStart <= 48;

      // Check if any Gold perks have been used (service records for this vehicle)
      const serviceRecords = await base44.asServiceRole.entities.ServiceRecord.filter({ vehicle_id });
      const hasUsedPerks = serviceRecords.length > 0;

      const eligibleForRefund = within48Hours && !hasUsedPerks;

      if (sub.stripe_subscription_id) {
        // Cancel the subscription immediately
        const canceledSub = await stripe.subscriptions.cancel(sub.stripe_subscription_id);

        // Issue refund if eligible
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
      }

      await base44.asServiceRole.entities.VehicleSubscription.update(sub.id, {
        status: 'canceled',
        current_period_end: new Date().toISOString().split('T')[0]
      });
    }

    // Remove Gold status from vehicle
    await base44.entities.MemberVehicle.update(vehicle_id, { is_gold_registered: false });

    return Response.json({ 
      success: true, 
      refund_issued,
      message: refund_issued 
        ? 'Subscription canceled and refund issued.' 
        : 'Subscription canceled successfully.'
    });
  } catch (error) {
    console.error('Cancel Gold subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});