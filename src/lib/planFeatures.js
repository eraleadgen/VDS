// ERA Core — Plan tier feature gating (frontend mirror).
// Same logic as base44/shared/planFeatures.ts — kept in sync manually.
// Used by usePlanFeatures() hook and FeatureGate component.

const TIER_RANK = { basic: 0, foundation: 1, growth: 2, enterprise: 3 };

const FEATURE_MIN_TIER = {
  website: 'basic',
  ai_chat_widget: 'basic',
  core_engines: 'basic',
  booking: 'basic',
  payments: 'basic',
  admin_dashboard: 'basic',
  self_serve_domain: 'basic',
  email_automations: 'basic',
  member_portal: 'foundation',
  specialist_portal: 'foundation',
  sms_automations: 'growth',
  ai_sms_agent: 'growth',
  ai_voice_agent: 'growth',
  partner_engine: 'enterprise',
  advanced_analytics: 'enterprise',
};

export function hasFeature(planTier, feature) {
  const minTier = FEATURE_MIN_TIER[feature];
  if (!minTier) return false;
  return (TIER_RANK[planTier] || 0) >= (TIER_RANK[minTier] || 0);
}

export function hasAdManagement(planTier, adManagementEnabled) {
  return planTier === 'enterprise' || adManagementEnabled === true;
}