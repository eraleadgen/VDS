import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import Stripe from 'npm:stripe@17.0.0';
import { getUserBusinessId } from '../../shared/tenantContext.ts';

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
    const businessId = await getUserBusinessId(base44, user);

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

    // Derive the redirect base URL from the tenant's BusinessConfig website_links
    // (trusted server-side config) — never from the client-supplied Origin header,
    // which is spoofable and would enable open-redirect / phishing (CWE-601).
    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
    const cfg = configs && configs[0];
    const bookingUrl = (cfg && cfg.website_links && cfg.website_links.booking_url) || '';
    let baseUrl = '';
    try { baseUrl = bookingUrl ? new URL(bookingUrl).origin : ''; } catch {}
    // Fallback to the request origin only if it matches a known trusted host pattern.
    if (!baseUrl) {
      const origin = (req.headers.get('origin') || '').toLowerCase();
      try {
        const host = new URL(origin).host;
        if (host.endsWith('.base44.app') || host.endsWith('.base44.com') || host === 'localhost' || host.endsWith('.localhost')) {
          baseUrl = origin;
        }
      } catch {}
    }
    if (!baseUrl) return Response.json({ error: 'Unable to determine redirect URL.' }, { status: 400 });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items,
      mode: 'subscription',
      success_url: `${baseUrl}/member-dashboard?gold_success=true`,
      cancel_url: `${baseUrl}/membership-signup`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        business_id: businessId,
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