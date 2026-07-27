// Config-driven helpers for VDS Gold membership pricing and pricing-group labels.
// All Gold pricing originates from BusinessConfig (membership_plans[].pricing_by_group
// and pricing_groups[].label) — never hardcoded in components. Safe fallbacks keep
// components rendering before the config resolves (the app gates first paint on
// useBusinessConfigLoading, so config is normally present by the time these run).

// Resolve a vehicle's pricing group from its classification via the config mapping,
// falling back to the stored pricing_group / legacy vehicle_type, then sedan_coupe.
export function resolvePricingGroup(vehicle, config) {
  const map = config?.classification_to_pricing_group;
  const cls = vehicle?.vehicle_classification;
  if (map && cls && map[cls]) return map[cls];
  if (vehicle?.pricing_group) return vehicle.pricing_group;
  if (vehicle?.vehicle_type) return vehicle.vehicle_type === 'truck_suv' ? 'truck_suv' : 'sedan_coupe';
  return 'sedan_coupe';
}

// Monthly Gold price for a pricing group, from the plan's pricing_by_group.
export function getGoldMonthlyPrice(plan, pricingGroup) {
  const groups = plan?.pricing_by_group || [];
  const match = groups.find(g => g.pricing_group === pricingGroup);
  if (match && match.price_monthly != null) return match.price_monthly;
  return pricingGroup === 'truck_suv' ? 300 : 250;
}

// Human label for a pricing-group key, from config.pricing_groups.
export function getPricingGroupLabel(config, pricingGroup) {
  const groups = config?.pricing_groups || [];
  const match = groups.find(g => g.key === pricingGroup);
  if (match && match.label) return match.label;
  return pricingGroup === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe';
}