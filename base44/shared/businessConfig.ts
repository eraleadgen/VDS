// Single accessor for the active BusinessConfig across backend functions.
// Import this instead of each function fetching the config ad hoc — one query,
// one shape, one place to evolve. Service-role read bypasses RLS so public and
// authenticated functions alike get the same config.
//
// Usage:
//   const config = await getConfig(base44);
//   const concierge = config.concierge?.name || 'Valerie';

export async function getConfig(base44, businessId = "vds") {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({
    business_id: businessId,
    is_active: true,
  });
  if (!configs || configs.length === 0) {
    throw new Error(`No active BusinessConfig for business_id=${businessId}`);
  }
  return configs[0];
}

// Concierge display name with a safe fallback for functions that run before a
// config record carries the new concierge sub-object.
export function conciergeName(config) {
  return config?.concierge?.name || "Valerie";
}

// Dictionary with VDS defaults merged over the config record's values, so a
// partially-populated config still yields a complete vocabulary.
export function getDictionary(config) {
  return {
    item_noun: "Vehicle",
    item_plural: "Vehicles",
    item_category_noun: "Classification",
    item_category_label: "Vehicle Classification",
    service_noun: "Detail",
    service_verb: "detail",
    service_area_noun: "Service Area",
    before_photo_label: "Before",
    after_photo_label: "After",
    appointment_noun: "Appointment",
    ...(config?.dictionary || {}),
  };
}