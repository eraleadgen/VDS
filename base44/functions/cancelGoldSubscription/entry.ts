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

    // Find active subscription for this vehicle
    const subscriptions = await base44.entities.VehicleSubscription.filter({ 
      vehicle_id, 
      status: 'active' 
    });

    if (subscriptions.length === 0) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Cancel each active subscription
    for (const sub of subscriptions) {
      if (sub.stripe_subscription_id) {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      }
      // Update subscription record
      await base44.entities.VehicleSubscription.update(sub.id, {
        status: 'canceled',
        current_period_end: new Date().toISOString().split('T')[0]
      });
    }

    // Update vehicle Gold status
    await base44.entities.MemberVehicle.update(vehicle_id, {
      is_gold_registered: false
    });

    return Response.json({ success: true, message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Cancel Gold subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});