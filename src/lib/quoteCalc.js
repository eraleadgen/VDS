// Shared quote calculation helpers (BusinessConfig-driven, server is source of truth on submit)

export function lookupTier(svc, classification, pricingGroup) {
  return (svc.tiers || []).find(t => t.tier === classification)
    || (svc.tiers || []).find(t => t.tier === pricingGroup)
    || (svc.tiers || [])[0];
}

export function classificationToPricingGroup(mapping, classification) {
  return mapping?.[classification] || 'sedan_coupe';
}

export function deriveClassification(vehicle) {
  if (vehicle?.vehicle_classification) return vehicle.vehicle_classification;
  if (vehicle?.vehicle_type === 'truck_suv' || vehicle?.pricing_group === 'truck_suv') return 'truck_3_row_suv';
  return 'sedan';
}

export function formatDuration(mins) {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const CLASSIFICATION_LABEL = {
  coupe: 'Coupe',
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  mid_size_suv: 'Mid Size SUV',
  truck_3_row_suv: 'Truck / 3-Row SUV',
  other: 'Other',
};

export const CATEGORY_LABEL = {
  detail: 'Detailing Services',
  coating: 'Ceramic Coatings',
  correction: 'Paint Correction',
  addon: 'Add-On Services',
};

// Compute a live client-side quote (display only; server recomputes on submit)
export function computeQuote({ config, classification, condition, selected, addOns, consultations, paintProtection }) {
  const mapping = config?.classification_to_pricing_group || {};
  const pricingGroup = classification ? classificationToPricingGroup(mapping, classification) : null;
  const conditions = config?.pricing_rules?.condition_multipliers || [];
  const conditionEntry = conditions.find(c => c.key === condition);
  const conditionMultiplier = conditionEntry?.multiplier ?? 1;
  const conditionDurationAdd = conditionEntry?.duration_add_minutes ?? 0;
  const allServices = config?.services || [];

  let basePrice = 0;
  let baseMins = 0;
  const lineItems = [];

  for (const key of selected) {
    const svc = allServices.find(s => s.key === key);
    if (!svc) continue;
    if (svc.requires_consultation) { lineItems.push({ key, label: svc.label, consultation: true }); continue; }
    const tier = lookupTier(svc, classification, pricingGroup);
    basePrice += tier?.price || 0;
    baseMins += tier?.duration_minutes || 0;
    lineItems.push({ key, label: svc.label, price: tier?.price || 0, duration: tier?.duration_minutes || 0 });
  }

  let addOnTotal = 0;
  let addOnMins = 0;
  for (const key of addOns) {
    const svc = allServices.find(s => s.key === key);
    if (!svc) continue;
    const tier = lookupTier(svc, classification, pricingGroup);
    addOnTotal += tier?.price || 0;
    addOnMins += tier?.duration_minutes || 0;
    lineItems.push({ key, label: svc.label, price: tier?.price || 0, duration: tier?.duration_minutes || 0, isAddOn: true });
  }

  for (const key of consultations) {
    const svc = allServices.find(s => s.key === key);
    if (!svc) continue;
    lineItems.push({ key, label: svc.label, consultation: true });
  }

  const conditionedBase = Math.round(basePrice * conditionMultiplier);
  const hasProtection = paintProtection && paintProtection !== 'none' && basePrice > 0;
  const paintProtectionDiscount = hasProtection ? Math.round(conditionedBase * 0.2) : 0;
  const total = conditionedBase + addOnTotal - paintProtectionDiscount;
  const totalMins = baseMins + addOnMins + (basePrice > 0 ? conditionDurationAdd : 0);
  const summary = lineItems.map(i => i.consultation ? `${i.label} — Consultation` : `${i.label} — $${i.price}`).join(' | ') + (hasProtection ? ` | Paint Protection (PPF or Ceramic Coating) (-20%)` : '');

  return { lineItems, basePrice, conditionedBase, addOnTotal, paintProtectionDiscount, total, totalMins, pricingGroup, conditionMultiplier, conditionEntry, summary };
}