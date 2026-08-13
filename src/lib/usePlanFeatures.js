import { useBusinessConfig } from '@/lib/BusinessConfigContext';
import { hasFeature, hasAdManagement } from '@/lib/planFeatures';

// Returns { planTier, hasFeature, hasAdManagement } for the current tenant.
// planTier defaults to 'basic' while the config loads (safest fallback — shows
// the website, hides portals). The app root waits for config to load before
// rendering routes, so pages see the real tier on first paint.
export function usePlanFeatures() {
  const config = useBusinessConfig();
  const planTier = config?.plan_tier || 'basic';
  const adManagementEnabled = config?.ad_management_enabled || false;
  return {
    planTier,
    hasFeature: (feature) => hasFeature(planTier, feature),
    hasAdManagement: () => hasAdManagement(planTier, adManagementEnabled),
  };
}