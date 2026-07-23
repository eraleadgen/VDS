import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import Stripe from 'npm:stripe@17.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { vehicleIds, partnerRef } = await req.json();
    if (!vehicleIds || vehicleIds.length === 0) {
      return Response.json({ error: 'No vehicles selected' }, { status: 400 });
    }
    const partnerReferralCode = (typeof partnerRef === 'string' ? partnerRef : '').trim();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Get vehicle details to determine pricing
    const vehicles = [];
    for (const vehicleId of vehicleIds) {
      const vehicle = await base44.entities.MemberVehicle.get(vehicleId);
      if (!vehicle || vehicle.created_by_id !== user.id) {
        return Response.json({ error: 'Vehicle not found or unauthorized' }, { status: 404 });
      }
      vehicles.push(vehicle);
    }

    // Create Stripe customer if needed (using user email)
    const customers = await stripe.customers.list({ email: user.email });
    let customerId = customers.data[0]?.id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          base44_user_id: user.id,
          base44_app_id: Deno.env.get('BASE44_APP_ID')
        }
      });
      customerId = customer.id;
    }

    // Create line items for each vehicle
    const line_items = vehicles.map(vehicle => {
      const priceId = vehicle.vehicle_type === 'truck_suv' 
        ? 'price_1TgzT42MUlDjgwKfwRW7jAX7' // Truck/SUV $300
        : 'price_1TgzSW2MUlDjgwKfTAhVmkUP'; // Sedan/Coupe $250
      
      return {
        price: priceId,
        quantity: 1,
      };
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items,
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/member-dashboard?gold_success=true`,
      cancel_url: `${req.headers.get('origin')}/vds-gold-signup`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        vehicle_ids: JSON.stringify(vehicleIds),
        partner_referral_code: partnerReferralCode || ''
      }
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Create Gold checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});