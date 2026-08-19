// ERA Core — Plan tier feature gating.
//
// Single source of truth for the tier hierarchy and feature → minimum tier map.
// Used by backend functions to check whether a feature is active for a tenant.
// The frontend mirror lives at src/lib/planFeatures.js (same logic, JS syntax).
//
// Feature matrix:
//   Basic:      website, AI chat widget, core engines, booking, payments, admin dashboard,
//               self-serve domain/email/phone, email automations (welcome, reminders, review requests)
//   Foundation: + customer member portal, specialist/employee portal
//   Growth:     + SMS automations (reminders, review requests), AI SMS agent, AI voice agent
//   Enterprise: + partner/referral engine, advanced analytics & reporting
//   Ad Management: paid add-on on any tier (flag = true), or included at Enterprise

const TIER_RANK: Record<string, number> = { basic: 0, foundation: 1, growth: 2, enterprise: 3 };

const FEATURE_MIN_TIER: Record<string, string> = {
  // Basic+
  website: 'basic',
  ai_chat_widget: 'basic',
  core_engines: 'basic',
  booking: 'basic',
  payments: 'basic',
  admin_dashboard: 'basic',
  self_serve_domain: 'basic',
  email_automations: 'basic',
  // Foundation+
  member_portal: 'foundation',
  specialist_portal: 'foundation',
  // Growth+
  sms_automations: 'growth',
  ai_sms_agent: 'growth',
  ai_voice_agent: 'growth',
  // Enterprise+
  partner_engine: 'enterprise',
  advanced_analytics: 'enterprise',
};

// Check whether a plan tier has access to a feature.
// ad_management is NOT a tier-gated feature — use hasAdManagement() instead.
export function hasFeature(planTier: string, feature: string): boolean {
  const minTier = FEATURE_MIN_TIER[feature];
  if (!minTier) return false;
  return (TIER_RANK[planTier] || 0) >= (TIER_RANK[minTier] || 0);
}

// Ad Management: paid add-on on any tier (flag = true), or included at Enterprise.
export function hasAdManagement(planTier: string, adManagementEnabled: boolean): boolean {
  return planTier === 'enterprise' || adManagementEnabled === true;
}

// Load config for a tenant and check a feature. Returns { ok, cfg } or { ok: false, reason }.
// Use this in functions that don't already load BusinessConfig.
export async function checkFeature(base44: any, businessId: string, feature: string) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter(
    { business_id: businessId, is_active: true }
  );
  const cfg = configs && configs[0];
  if (!cfg) return { ok: false as const, reason: 'no_config' };
  if (!hasFeature(cfg.plan_tier || 'basic', feature)) {
    return { ok: false as const, reason: 'feature_not_enabled' as const, cfg };
  }
  return { ok: true as const, cfg };
}