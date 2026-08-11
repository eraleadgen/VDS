import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import Stripe from 'npm:stripe@17.0.0';
import { getUserBusinessId } from '../../shared/tenantContext.ts';

// Fallback: called when user returns from Stripe checkout with gold_success=true.
// Creates VehicleSubscription records if the webhook hasn't already done so.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const businessId = await getUserBusinessId(base44, user);

    // Find this user's Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      console.log('No Stripe customer found for', user.email);
      return Response.json({ skipped: true, reason: 'No Stripe customer found' });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      console.log('No active Stripe subscriptions for customer', customer.id);
      return Response.json({ skipped: true, reason: 'No active subscriptions' });
    }

    // Validate that each subscription is a genuine VDS Gold membership by matching its
    // product/price against BusinessConfig. This prevents provisioning Gold from a cheap
    // or unrelated subscription on the caller's Stripe account (e.g. a free trial on a
    // different product) — only real Gold subscriptions count toward enrollment.
    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
    const cfg = configs && configs[0];
    const allowedProductIds = new Set();
    const allowedPriceIds = new Set();
    for (const plan of ((cfg && cfg.membership_plans) || [])) {
      if (plan.stripe_product_id) allowedProductIds.add(plan.stripe_product_id);
      for (const pg of (plan.pricing_by_group || [])) {
        if (pg.stripe_price_id) allowedPriceIds.add(pg.stripe_price_id);
      }
    }
    const goldSubscriptions = subscriptions.data.filter(sub => {
      const items = (sub.items && sub.items.data) || [];
      return items.some(it => {
        const priceId = it.price && it.price.id;
        const productId = it.price && it.price.product;
        return (priceId && allowedPriceIds.has(priceId)) || (productId && allowedProductIds.has(productId));
      });
    });
    if (goldSubscriptions.length === 0) {
      console.log('No active VDS Gold subscriptions for customer', customer.id);
      return Response.json({ skipped: true, reason: 'No active VDS Gold subscriptions' });
    }

    // Get all vehicles owned by this user
    const vehicles = await base44.entities.MemberVehicle.list();
    if (!vehicles || vehicles.length === 0) {
      return Response.json({ skipped: true, reason: 'No vehicles found' });
    }

    // Find the most recent checkout session with matching user_id to get specific vehicle_ids
    const sessions = await stripe.checkout.sessions.list({ customer: customer.id, limit: 10 });
    let vehicleIdsToEnroll = [];

    for (const session of sessions.data) {
      if (session.metadata?.vehicle_ids && session.metadata?.user_id === user.id) {
        vehicleIdsToEnroll = JSON.parse(session.metadata.vehicle_ids);
        console.log('Found session metadata with vehicle_ids:', vehicleIdsToEnroll);
        break;
      }
    }

    // Determine which vehicles already have an active Gold subscription.
    const existingActiveSubs = await base44.asServiceRole.entities.VehicleSubscription.filter({ business_id: businessId, status: 'active' });
    const enrolledVehicleIds = new Set(existingActiveSubs.map(s => s.vehicle_id));

    // If no checkout-session metadata was found, we cannot know exactly which vehicles were
    // paid for. Never provision all vehicles unconditionally — that would let a user pay for
    // one vehicle and receive Gold on every vehicle in their garage. Instead, cap enrollment to
    // the total quantity actually covered by active Stripe subscriptions (minus already-enrolled).
    if (vehicleIdsToEnroll.length === 0) {
      const paidQuantity = goldSubscriptions.reduce((sum, sub) => {
        const qty = (sub.items && sub.items.data && sub.items.data.length)
          ? sub.items.data.reduce((s, it) => s + (it.quantity || 1), 0)
          : (sub.quantity || 1);
        return sum + qty;
      }, 0);
      const remaining = Math.max(0, paidQuantity - enrolledVehicleIds.size);
      console.log(`No session metadata; subscription quantity=${paidQuantity}, already enrolled=${enrolledVehicleIds.size}, remaining=${remaining}`);
      if (remaining <= 0) {
        return Response.json({ skipped: true, reason: 'All paid vehicles already enrolled' });
      }
      // Enroll the oldest not-yet-enrolled vehicles up to the remaining paid capacity.
      vehicleIdsToEnroll = vehicles
        .filter(v => !enrolledVehicleIds.has(v.id))
        .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0))
        .slice(0, remaining)
        .map(v => v.id);
      console.log('Fallback capped to paid quantity, enrolling:', vehicleIdsToEnroll);
    }

    // Filter out vehicles that already have an active VehicleSubscription
    vehicleIdsToEnroll = vehicleIdsToEnroll.filter(id => !enrolledVehicleIds.has(id));

    console.log('Vehicles to enroll after dedup:', vehicleIdsToEnroll);

    if (vehicleIdsToEnroll.length === 0) {
      return Response.json({ skipped: true, reason: 'All vehicles already enrolled' });
    }

    const subscription = goldSubscriptions[0];
    let created = 0;

    // Expand the subscription items so each vehicle maps to its own line-item id, enabling
    // per-vehicle cancellation later. Match items to vehicles by the pricing-group price id.
    const priceToGroup = {};
    for (const plan of ((cfg && cfg.membership_plans) || [])) {
      for (const pg of (plan.pricing_by_group || [])) {
        if (pg.stripe_price_id) priceToGroup[pg.stripe_price_id] = pg.pricing_group;
      }
    }
    let itemPool = [];
    try {
      const fullSub = await stripe.subscriptions.retrieve(subscription.id, { expand: ['items.data'] });
      itemPool = (fullSub.items && fullSub.items.data) ? [...fullSub.items.data] : [];
    } catch (e) { console.error('Expand subscription items failed:', e.message); }

    for (const vehicleId of vehicleIdsToEnroll) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        console.log('Vehicle not found:', vehicleId);
        continue;
      }
      const pricing_group = (vehicle.pricing_group || vehicle.vehicle_type) === 'truck_suv' ? 'truck_suv' : 'sedan_coupe';
      const tier = pricing_group;

      // Assign this vehicle a subscription item whose price matches its pricing group.
      let item = itemPool.find(it => priceToGroup[it.price?.id] === pricing_group);
      if (!item) item = itemPool.find(it => priceToGroup[it.price?.id] === 'sedan_coupe' || priceToGroup[it.price?.id] === 'truck_suv');
      if (item) itemPool = itemPool.filter(it => it.id !== item.id);

      await base44.asServiceRole.entities.VehicleSubscription.create({
        business_id: businessId,
        vehicle_id: vehicleId,
        stripe_subscription_id: subscription.id,
        stripe_item_id: item?.id || '',
        stripe_customer_id: customer.id,
        stripe_price_id: item?.price?.id || '',
        pricing_group,
        tier,
        status: 'active',
        started_date: new Date().toISOString().split('T')[0],
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
      });

      // Mark vehicle as gold registered
      await base44.asServiceRole.entities.MemberVehicle.update(vehicleId, { is_gold_registered: true });
      created++;
      console.log(`Provisioned Gold for vehicle ${vehicleId}`);
    }

    console.log(`Total provisioned: ${created} for user ${user.id}`);
    return Response.json({ success: true, created });

  } catch (error) {
    console.error('provisionGoldOnReturn error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});