import { resolveEraSubscriptionState } from './eraPricing.ts';

// ERA SaaS webhook handler. Called by stripe-webhook when an event is identified as
// ERA SaaS (metadata.era_product_type === 'era_saas'). Handles:
// - checkout.session.completed: stamps EraAccount (stripe IDs, tier, setup_fee_paid)
// - customer.subscription.updated: flips plan_tier / ad_management_enabled on both
//   EraAccount and BusinessConfig atomically (BusinessConfig first, EraAccount second)
// - customer.subscription.deleted: marks EraAccount subscription_status='canceled'
//
// Idempotency: last_stripe_event_id on EraAccount guards against Stripe redelivery.
// Write order on tier/add-on changes: BusinessConfig FIRST (authoritative gate),
// EraAccount SECOND (billing mirror). If either throws, the webhook returns 500 →
// Stripe redelivers. The client never sees a half-applied upgrade on the live site
// because the authoritative gate is written before the mirror.
//
// On subscription deletion: no data deletion, no plan_tier downgrade. The tenant
// keeps their config and data; the portal shows "canceled" and can prompt re-subscription.

export async function handleEraSaaSEvent(base44, stripe, event) {
  const eventType = event.type;
  const eventId = event.id;

  // ── checkout.session.completed: initial purchase (setup fee + first month) ──
  if (eventType === 'checkout.session.completed') {
    const session = event.data.object;
    const ownerUserId = session.metadata?.owner_user_id;
    const eraTier = session.metadata?.era_tier || 'basic';
    const subId = session.subscription;

    if (!ownerUserId || !subId) {
      console.error('ERA SaaS checkout: missing owner_user_id or subscription in metadata');
      return;
    }

    const accounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: ownerUserId });
    const account = accounts && accounts[0];
    if (!account) {
      console.error('ERA SaaS checkout: no EraAccount for owner_user_id', ownerUserId);
      return;
    }

    // Idempotency: skip if this subscription is already stamped and setup fee marked paid.
    if (account.stripe_subscription_id === subId && account.setup_fee_paid) {
      console.log('ERA SaaS checkout: already provisioned for sub', subId);
      return;
    }

    await base44.asServiceRole.entities.EraAccount.update(account.id, {
      stripe_customer_id: session.customer,
      stripe_subscription_id: subId,
      subscription_status: 'active',
      current_plan_tier: eraTier,
      setup_fee_paid: true,
      last_stripe_event_id: eventId,
    });

    // OnboardingSession is NOT created here — the onboarding wizard creates it using
    // the user's own session (so created_by_id = user.id and the ownership RLS works).
    // The wizard reads this EraAccount to get the purchased tier and setup_fee_paid status.

    console.log('ERA SaaS checkout completed for owner', ownerUserId, 'tier', eraTier);
    return;
  }

  // ── customer.subscription.updated: tier change or add-on toggle ──
  if (eventType === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const ownerUserId = subscription.metadata?.owner_user_id;

    // Find the EraAccount by owner_user_id, or fallback to stripe_subscription_id.
    let accounts;
    if (ownerUserId) {
      accounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: ownerUserId });
    } else {
      accounts = await base44.asServiceRole.entities.EraAccount.filter({ stripe_subscription_id: subscription.id });
    }
    const account = accounts && accounts[0];
    if (!account) {
      console.error('ERA SaaS subscription.updated: no EraAccount found');
      return;
    }

    // Idempotency: skip if this event was already processed.
    if (account.last_stripe_event_id === eventId) {
      console.log('ERA SaaS: duplicate event', eventId, '— skipping');
      return;
    }

    // Resolve current tier + ad-management from subscription items.
    const fullSub = await stripe.subscriptions.retrieve(subscription.id, { expand: ['items.data'] });
    const { tier, ad_management_enabled } = resolveEraSubscriptionState(fullSub);
    const newStatus = subscription.status === 'active' ? 'active' :
                      subscription.status === 'past_due' ? 'past_due' :
                      subscription.status === 'canceled' ? 'canceled' : 'trialing';

    // Write BusinessConfig FIRST (authoritative gate) — only if tenant exists.
    if (account.business_id && tier) {
      const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: account.business_id, is_active: true });
      const cfg = configs && configs[0];
      if (cfg) {
        await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, {
          plan_tier: tier,
          ad_management_enabled,
          subscription_status: newStatus === 'trialing' ? 'active' : newStatus,
        });
      }
    }

    // Write EraAccount SECOND (billing mirror).
    const updateData = {
      subscription_status: newStatus,
      last_stripe_event_id: eventId,
    };
    if (tier) updateData.current_plan_tier = tier;
    // Only mirror ad_management_enabled once the tenant exists (pre-tenant, there's
    // no BusinessConfig to mirror from — the flag is meaningless until provisioning).
    if (account.business_id) updateData.ad_management_enabled = ad_management_enabled;

    await base44.asServiceRole.entities.EraAccount.update(account.id, updateData);

    console.log('ERA SaaS subscription updated for owner', account.owner_user_id, 'tier', tier, 'ad_mgmt', ad_management_enabled);
    return;
  }

  // ── customer.subscription.deleted: subscription canceled ──
  if (eventType === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const ownerUserId = subscription.metadata?.owner_user_id;

    let accounts;
    if (ownerUserId) {
      accounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: ownerUserId });
    } else {
      accounts = await base44.asServiceRole.entities.EraAccount.filter({ stripe_subscription_id: subscription.id });
    }
    const account = accounts && accounts[0];
    if (!account) return;

    if (account.last_stripe_event_id === eventId) return;

    // Mark subscription canceled. Do NOT change plan_tier on BusinessConfig —
    // no data deletion, no tier downgrade. The tenant keeps their config and data;
    // the portal shows "canceled" and can prompt re-subscription.
    // Set a 7-day grace period on BusinessConfig so features stay live briefly.
    if (account.business_id) {
      const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: account.business_id, is_active: true });
      const cfg = configs && configs[0];
      if (cfg) {
        const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, {
          subscription_status: 'canceled',
          grace_until: graceUntil,
        });
      }
    }
    await base44.asServiceRole.entities.EraAccount.update(account.id, {
      subscription_status: 'canceled',
      last_stripe_event_id: eventId,
    });

    console.log('ERA SaaS subscription canceled for owner', account.owner_user_id);
    return;
  }
}