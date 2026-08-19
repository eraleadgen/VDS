// ERA Systems SaaS pricing — Stripe product/price IDs for the ERA account layer.
// These are the ERA SaaS billing products (Basic, Foundation, Ad Management), separate
// from any tenant's own business products (VDS Gold, etc.). The Stripe webhook uses
// these IDs to identify ERA SaaS subscription line items and resolve the current tier
// + add-on status from a subscription's items.
//
// Pricing effective 2026-08-19 (net-new signups only):
//   Basic:       $199/mo + $750 setup
//   Foundation:  $499/mo + $1,200 setup
// Legacy prices ($150/$500 Basic, $400/$900 Foundation) were archived — no subscriptions
// existed on them at the time of the change.

export const ERA_PRODUCTS = {
  basic: 'prod_V4vquWlpfB5fwz',
  foundation: 'prod_V4vqBpo9Jf9hqe',
  ad_management: 'prod_V4vqH4UlHUsVpF',
};

export const ERA_PRICES = {
  basic_monthly: 'price_1U6Dc62MUlDjgwKfC9nzTheu',
  basic_setup: 'price_1U6Dcy2MUlDjgwKftVUtg6jf',
  foundation_monthly: 'price_1U6Dcy2MUlDjgwKfoMFmhoVF',
  foundation_setup: 'price_1U6Dcz2MUlDjgwKfA5rKnppk',
  ad_management_monthly: 'price_1U4lzF2MUlDjgwKfzgw32g3O',
};

// Test-mode prices (Stripe test mode — test cards only, no real charges). Used in
// development/preview. createEraCheckoutSession selects these when mode='test'.
export const ERA_PRICES_TEST = {
  basic_monthly: 'price_1U6Dc6IYwvfj5W6AUNkP5MtA',
  basic_setup: 'price_1U6DczIYwvfj5W6AKcr5wGX8',
  foundation_monthly: 'price_1U6DczIYwvfj5W6ADRXrQ7Kh',
  foundation_setup: 'price_1U6Dd0IYwvfj5W6A4yos8MeY',
  ad_management_monthly: 'price_1U4wJ1IYwvfj5W6A4IAvSxdz',
};

// Map each recurring price ID to its role + value for webhook resolution.
// One-time setup-fee prices are excluded — they appear on the first invoice only,
// never on the subscription's recurring line items.
const PRICE_MAP = {
  [ERA_PRICES.basic_monthly]: { role: 'tier', tier: 'basic' },
  [ERA_PRICES.foundation_monthly]: { role: 'tier', tier: 'foundation' },
  [ERA_PRICES.ad_management_monthly]: { role: 'addon', addon: 'ad_management' },
  [ERA_PRICES_TEST.basic_monthly]: { role: 'tier', tier: 'basic' },
  [ERA_PRICES_TEST.foundation_monthly]: { role: 'tier', tier: 'foundation' },
  [ERA_PRICES_TEST.ad_management_monthly]: { role: 'addon', addon: 'ad_management' },
};

// Resolve the current plan tier and ad-management status from a Stripe subscription's
// expanded line items. Returns { tier, ad_management_enabled }.
export function resolveEraSubscriptionState(subscription) {
  const items = (subscription.items?.data) || [];
  let tier = null;
  let ad_management_enabled = false;
  for (const item of items) {
    const priceId = item.price?.id;
    const meta = PRICE_MAP[priceId];
    if (!meta) continue;
    if (meta.role === 'tier') tier = meta.tier;
    if (meta.role === 'addon' && meta.addon === 'ad_management') ad_management_enabled = true;
  }
  return { tier, ad_management_enabled };
}