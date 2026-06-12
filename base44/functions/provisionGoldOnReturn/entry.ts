import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';

// Fallback: called when user returns from Stripe checkout with gold_success=true.
// Creates VehicleSubscription records if the webhook hasn't already done so.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Find this user's Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      return Response.json({ skipped: true, reason: 'No Stripe customer found' });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return Response.json({ skipped: true, reason: 'No active subscriptions' });
    }

    // Get all vehicles owned by this user
    const vehicles = await base44.entities.MemberVehicle.list();
    if (!vehicles || vehicles.length === 0) {
      return Response.json({ skipped: true, reason: 'No vehicles found' });
    }

    // Get existing VehicleSubscription records to avoid duplicates
    const existingSubs = await base44.entities.VehicleSubscription.list();
    const enrolledVehicleIds = new Set(existingSubs.map(s => s.vehicle_id));

    // Find the most recent checkout session to get vehicle_ids metadata
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 5,
    });

    let vehicleIdsToEnroll = [];
    for (const session of sessions.data) {
      if (session.metadata?.vehicle_ids && session.metadata?.user_id === user.id) {
        const ids = JSON.parse(session.metadata.vehicle_ids);
        vehicleIdsToEnroll = ids;
        break;
      }
    }

    // Fallback: enroll all user vehicles not already enrolled
    if (vehicleIdsToEnroll.length === 0) {
      vehicleIdsToEnroll = vehicles.map(v => v.id).filter(id => !enrolledVehicleIds.has(id));
    } else {
      vehicleIdsToEnroll = vehicleIdsToEnroll.filter(id => !enrolledVehicleIds.has(id));
    }

    if (vehicleIdsToEnroll.length === 0) {
      return Response.json({ skipped: true, reason: 'All vehicles already enrolled' });
    }

    const subscription = subscriptions.data[0];
    let created = 0;

    for (const vehicleId of vehicleIdsToEnroll) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) continue;
      const tier = vehicle.vehicle_type || 'sedan_coupe';

      await base44.entities.VehicleSubscription.create({
        vehicle_id: vehicleId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        tier,
        status: 'active',
        started_date: new Date().toISOString().split('T')[0],
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
      });

      // Also mark vehicle as gold registered
      await base44.entities.MemberVehicle.update(vehicleId, { is_gold_registered: true });
      created++;
    }

    console.log(`Provisioned ${created} Gold subscriptions for user ${user.id}`);
    return Response.json({ success: true, created });

  } catch (error) {
    console.error('provisionGoldOnReturn error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});