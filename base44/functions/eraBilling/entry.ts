import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@17.0.0';
import { ERA_PRICES, ERA_PRICES_TEST } from '../../shared/eraPricing.ts';

// ERA SaaS billing self-service for provisioned account holders.
// Actions:
//   change_tier          — swap the tier price item on the subscription (Stripe prorates).
//                         The webhook (customer.subscription.updated) flips plan_tier on
//                         EraAccount + BusinessConfig — flags never change on button click.
//   toggle_ad_management — add/remove the ad_management line item (prorated).
//   portal_session       — Stripe Customer Portal session for invoice history.
//
// Mode: live by default; mode='test' uses the test key + test prices (dev/preview only).
// The frontend selects mode by hostname (eraleadgen.com → live), matching
// createEraCheckoutSession, so a provisioned customer's live subscription is always
// operated on with the live key.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    if (!action) return Response.json({ error: 'action is required' }, { status: 400 });

    const isTest = body.mode === 'test';
    const stripeKey = isTest ? Deno.env.get('STRIPE_TEST_SECRET_KEY') : Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return Response.json({ error: 'Stripe key not configured' }, { status: 500 });
    const stripe = new Stripe(stripeKey);
    const prices = isTest ? ERA_PRICES_TEST : ERA_PRICES;

    // Resolve the caller's EraAccount + subscription.
    const accounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: me.id });
    const account = accounts && accounts[0];
    if (!account) return Response.json({ error: 'No ERA account found' }, { status: 404 });
    if (!account.stripe_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // ── change_tier: swap the tier price item (Stripe prorates automatically) ──
    if (action === 'change_tier') {
      const newTier = body.tier;
      if (!['basic', 'foundation'].includes(newTier)) {
        return Response.json({ error: 'Invalid tier' }, { status: 400 });
      }
      if (newTier === account.current_plan_tier) {
        return Response.json({ error: 'You are already on this plan' }, { status: 400 });
      }
      const sub = await stripe.subscriptions.retrieve(account.stripe_subscription_id, { expand: ['items.data'] });
      // Find the current tier line item (the recurring monthly tier price).
      const tierItem = sub.items.data.find(item => {
        const pid = item.price?.id;
        return pid === prices.basic_monthly || pid === prices.foundation_monthly;
      });
      if (!tierItem) {
        return Response.json({ error: 'Could not find current plan item on subscription' }, { status: 500 });
      }
      const newPriceId = newTier === 'foundation' ? prices.foundation_monthly : prices.basic_monthly;
      await stripe.subscriptions.update(account.stripe_subscription_id, {
        items: [{ id: tierItem.id, price: newPriceId }],
        proration_behavior: 'create_prorations',
        metadata: { ...sub.metadata, era_tier: newTier },
      });
      // The webhook flips plan_tier on EraAccount + BusinessConfig on confirmation.
      return Response.json({
        success: true,
        message: `Plan change to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} submitted. Your features will update once Stripe confirms.`,
      });
    }

    // ── toggle_ad_management: add or remove the ad_management line item ──
    if (action === 'toggle_ad_management') {
      const enable = !!body.enable;
      const sub = await stripe.subscriptions.retrieve(account.stripe_subscription_id, { expand: ['items.data'] });
      const adItem = sub.items.data.find(item => item.price?.id === prices.ad_management_monthly);

      if (enable && !adItem) {
        // Add the ad_management line item (item without `id` = new item).
        await stripe.subscriptions.update(account.stripe_subscription_id, {
          items: [{ price: prices.ad_management_monthly, quantity: 1 }],
          proration_behavior: 'create_prorations',
        });
      } else if (!enable && adItem) {
        // Remove by setting quantity to 0 on the existing item id.
        await stripe.subscriptions.update(account.stripe_subscription_id, {
          items: [{ id: adItem.id, quantity: 0 }],
          proration_behavior: 'create_prorations',
        });
      }
      return Response.json({
        success: true,
        message: `Ad Management ${enable ? 'added' : 'removed'}. Your dashboard will update once Stripe confirms.`,
      });
    }

    // ── portal_session: Stripe Customer Portal for invoice history ──
    if (action === 'portal_session') {
      if (!account.stripe_customer_id) {
        return Response.json({ error: 'No billing customer found' }, { status: 400 });
      }
      const origin = (req.headers.get('origin') || '').toLowerCase();
      let returnUrl = '';
      try {
        const host = new URL(origin).host;
        if (host.endsWith('.base44.app') || host.endsWith('.base44.com') || host === 'localhost' || host.endsWith('.localhost') || host.includes('eraleadgen')) {
          returnUrl = `${origin}/era-portal`;
        }
      } catch {}
      if (!returnUrl) return Response.json({ error: 'Unable to determine return URL' }, { status: 400 });
      const session = await stripe.billingPortal.sessions.create({
        customer: account.stripe_customer_id,
        return_url: returnUrl,
      });
      return Response.json({ url: session.url });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('eraBilling error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});