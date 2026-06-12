import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.0.0';

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

      const subscriptions = await stripe.subscriptions.list({
        customer: session.customer
      });
      
      const subscription = subscriptions.data[0];
      if (!subscription) {
        console.error('No subscription found for customer');
        return Response.json({ error: 'No subscription found' }, { status: 400 });
      }

      for (const vehicleId of vehicleIds) {
        const vehicle = await base44.asServiceRole.entities.MemberVehicle.get(vehicleId);
        const tier = vehicle.vehicle_type || 'sedan_coupe';
        
        await base44.asServiceRole.entities.VehicleSubscription.create({
          vehicle_id: vehicleId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          tier: tier,
          status: 'active',
          started_date: new Date().toISOString().split('T')[0],
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
        });
      }

      console.log(`Gold subscriptions created for user ${userId}, vehicles: ${vehicleIds.join(', ')}`);
    }

    // Handle subscription updates
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
      }

      console.log(`Subscription ${subscription.id} updated to ${newStatus}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});