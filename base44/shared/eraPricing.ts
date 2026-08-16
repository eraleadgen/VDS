// ERA Systems SaaS pricing — Stripe product/price IDs for the ERA account layer.
// These are the ERA SaaS billing products (Basic, Foundation, Ad Management), separate
// from any tenant's own business products (VDS Gold, etc.). The Stripe webhook uses
// these IDs to identify ERA SaaS subscription line items and resolve the current tier
// + add-on status from a subscription's items.

export const ERA_PRODUCTS = {
  basic: 'prod_V4vquWlpfB5fwz',
  foundation: 'prod_V4vqBpo9Jf9hqe',
  ad_management: 'prod_V4vqH4UlHUsVpF',
};

export const ERA_PRICES = {
  basic_monthly: 'price_1U4lzE2MUlDjgwKfWvDVH0pX',
  basic_setup: 'price_1U4lzF2MUlDjgwKfHuEtxLvg',
  foundation_monthly: 'price_1U4lzF2MUlDjgwKfttITin3I',
  foundation_setup: 'price_1U4lzF2MUlDjgwKfU21LOxuv',
  ad_management_monthly: 'price_1U4lzF2MUlDjgwKfzgw32g3O',
};

// Test-mode prices (Stripe test mode — test cards only, no real charges). Used in
// development/preview. createEraCheckoutSession selects these when mode='test'.
export const ERA_PRICES_TEST = {
  basic_monthly: 'price_1U4wJ1IYwvfj5W6A64BBEpmg',
  basic_setup: 'price_1U4wJ1IYwvfj5W6A9d1zZUpW',
  foundation_monthly: 'price_1U4wJ1IYwvfj5W6Aribekakq',
  foundation_setup: 'price_1U4wJ1IYwvfj5W6A31JR0oxc',
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