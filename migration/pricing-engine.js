/**
 * VDS Pricing Engine — Platform-Agnostic Edition
 * ===============================================
 * Extracted from the Base44 ERA Core pricingEngine function and the client-side
 * quoteCalc.js helper. This module contains ZERO platform dependencies — no Base44
 * SDK, no Deno, no database calls. It operates on a plain config object (the VDS
 * BusinessConfig pricing fields, provided as vds-config.json in this bundle).
 *
 * On Lovable:
 *   - Client-side: import { computeQuote } and pass the config object directly.
 *   - Server-side (Edge Function): import { computeQuoteFromRequest } and pass
 *     the parsed JSON body + a config loader function.
 *
 * The calculation logic is identical to the live Base44 engine. The only difference
 * is that Base44 reads config from the database; here you pass it in.
 *
 * Formula:
 *   custom_quote = (sum of base service prices × condition_multiplier)
 *                + sum of add-on prices
 *                - paint_protection_discount (20% of conditioned base if PPF/ceramic)
 *
 * Add-ons are priced at face value (NOT multiplied by condition).
 * Services with requires_consultation=true return price: null (free consultation).
 */

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Resolve a pricing group from a vehicle classification.
 * @param {Object} config - BusinessConfig pricing fields
 * @param {string} classification - vehicle_classification key (coupe, sedan, etc.)
 * @returns {string} pricing group key: 'sedan_coupe' or 'truck_suv'
 */
export function resolvePricingGroup(config, classification) {
  const map = config.classification_to_pricing_group || {};
  if (classification && map[classification]) return map[classification];
  return 'sedan_coupe'; // fallback
}

/**
 * Look up the price tier for a service, matching by classification first (per-
 * classification pricing), then pricing group, then first available tier.
 * @param {Object} svc - service object from config.services
 * @param {string} classification - vehicle_classification key
 * @param {string} pricingGroup - resolved pricing group key
 * @returns {Object|null} tier object { tier, price, duration_minutes }
 */
export function lookupTier(svc, classification, pricingGroup) {
  return (svc.tiers || []).find(t => t.tier === classification)
    || (svc.tiers || []).find(t => t.tier === pricingGroup)
    || (svc.tiers || [])[0]
    || null;
}

/**
 * Format a duration in minutes as a human-readable string.
 * @param {number} mins
 * @returns {string} e.g. "2–2.5 hrs" or "45 min"
 */
export function formatDuration(mins) {
  if (!mins || mins <= 0) return '0 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ── Client-Side Quote Calculation (display only) ────────────────────────

/**
 * Compute a live client-side quote for display. This mirrors the server-side
 * calculation exactly; the server recomputes on submit for authority.
 *
 * @param {Object} params
 * @param {Object} params.config - BusinessConfig pricing fields (see vds-config.json)
 * @param {string} params.classification - vehicle_classification key
 * @param {string} [params.condition] - condition key: 'light' | 'moderate' | 'heavy'
 * @param {string[]} params.selected - main service keys
 * @param {string[]} [params.addOns] - add-on service keys
 * @param {string[]} [params.consultations] - consultation service keys (display only)
 * @param {string} [params.paintProtection] - 'none' | 'paint_protection' (20% discount)
 * @returns {Object} quote result (see below)
 */
export function computeQuote({ config, classification, condition, selected, addOns = [], consultations = [], paintProtection = 'none' }) {
  const pricingGroup = classification ? resolvePricingGroup(config, classification) : null;
  const conditions = config.pricing_rules?.condition_multipliers || [];
  const conditionEntry = conditions.find(c => c.key === condition);
  const conditionMultiplier = conditionEntry?.multiplier ?? 1;
  const conditionDurationAdd = conditionEntry?.duration_add_minutes ?? 0;
  const allServices = config.services || [];

  let basePrice = 0;
  let baseMins = 0;
  const lineItems = [];

  // Main services (multiplied by condition)
  for (const key of selected) {
    const svc = allServices.find(s => s.key === key);
    if (!svc) continue;
    if (svc.requires_consultation) {
      lineItems.push({ key, label: svc.label, consultation: true });
      continue;
    }
    const tier = lookupTier(svc, classification, pricingGroup);
    basePrice += tier?.price || 0;
    baseMins += tier?.duration_minutes || 0;
    lineItems.push({ key, label: svc.label, price: tier?.price || 0, duration: tier?.duration_minutes || 0 });
  }

  // Add-ons (face value, NOT multiplied by condition)
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

  // Consultations (display only, no price)
  for (const key of consultations) {
    const svc = allServices.find(s => s.key === key);
    if (!svc) continue;
    lineItems.push({ key, label: svc.label, consultation: true });
  }

  // Paint protection discount: 20% off the conditioned base if PPF or ceramic coating exists
  const conditionedBase = Math.round(basePrice * conditionMultiplier);
  const hasProtection = paintProtection && paintProtection !== 'none' && basePrice > 0;
  const paintProtectionDiscount = hasProtection ? Math.round(conditionedBase * 0.2) : 0;
  const total = conditionedBase + addOnTotal - paintProtectionDiscount;
  const totalMins = baseMins + addOnMins + (basePrice > 0 ? conditionDurationAdd : 0);

  const summary = lineItems
    .map(i => i.consultation ? `${i.label} — Consultation` : `${i.label} — $${i.price}`)
    .join(' | ')
    + (hasProtection ? ' | Paint Protection (PPF or Ceramic Coating) (-20%)' : '');

  return {
    lineItems,
    basePrice,
    conditionedBase,
    addOnTotal,
    paintProtectionDiscount,
    total,
    totalMins,
    pricingGroup,
    conditionMultiplier,
    conditionEntry,
    summary,
  };
}

// ── Server-Side Quote Calculation (Edge Function entry point) ────────────

/**
 * Compute a quote from a request body, identical to the Base44 pricingEngine
 * function output shape. Use this in your Lovable Edge Function.
 *
 * @param {Object} body - parsed request body
 * @param {string} body.vehicle_classification - vehicle classification key
 * @param {string} [body.vehicle_type] - legacy: 'sedan_coupe' | 'truck_suv'
 * @param {string[]} body.services - main service keys (REQUIRED)
 * @param {string} [body.condition] - condition key
 * @param {string[]} [body.add_ons] - add-on service keys
 * @param {string} [body.paint_protection] - 'none' | 'paint_protection'
 * @param {Object} config - BusinessConfig pricing fields (load from your DB or import the JSON)
 * @returns {Object} quote result matching the Base44 pricingEngine response shape
 */
export function computeQuoteFromRequest(body, config) {
  const { vehicle_classification, vehicle_type, services, condition, add_ons, paint_protection } = body;

  if (!services || !Array.isArray(services)) {
    return { error: 'services[] is required.' };
  }

  const pricingGroup = vehicle_classification
    ? resolvePricingGroup(config, vehicle_classification)
    : (vehicle_type === 'truck_suv' ? 'truck_suv' : 'sedan_coupe');

  const bookingUrl = config.website_links?.booking_url || 'https://vdsmobile.com/book';

  const conditionMultipliers = config.pricing_rules?.condition_multipliers || [];
  const conditionEntry = condition ? conditionMultipliers.find(c => c.key === condition) : null;
  const conditionMultiplier = conditionEntry ? conditionEntry.multiplier : 1;

  let basePrice = 0;
  let totalDuration = 0;
  let addOnTotal = 0;
  const lineItems = [];
  let requiresConsultation = false;

  // Main services
  for (const svcKey of services) {
    const svc = (config.services || []).find(s => s.key === svcKey);
    if (!svc) {
      lineItems.push({ service: svcKey, label: svcKey, price: 0, duration: 0, note: 'Unknown service' });
      continue;
    }
    const tier = lookupTier(svc, vehicle_classification, pricingGroup);
    if (!tier) {
      lineItems.push({ service: svcKey, label: svc.label, price: 0, duration: 0, note: 'No pricing for this vehicle group' });
      continue;
    }
    if (svc.requires_consultation) {
      requiresConsultation = true;
      lineItems.push({ service: svcKey, label: svc.label, price: null, duration: null, note: 'Free consultation required' });
    } else {
      basePrice += tier.price || 0;
      totalDuration += tier.duration_minutes || 0;
      lineItems.push({ service: svcKey, label: svc.label, price: tier.price, duration: tier.duration_minutes });
    }
  }

  // Add-ons (face value)
  for (const addOnKey of (add_ons || [])) {
    const svc = (config.services || []).find(s => s.key === addOnKey);
    if (!svc) continue;
    const tier = lookupTier(svc, vehicle_classification, pricingGroup);
    if (!tier) continue;
    addOnTotal += tier.price || 0;
    totalDuration += tier.duration_minutes || 0;
    lineItems.push({ service: addOnKey, label: svc.label, price: tier.price, duration: tier.duration_minutes, is_add_on: true });
  }

  // Condition duration add-on (only if there are base services)
  if (basePrice > 0) totalDuration += (conditionEntry && conditionEntry.duration_add_minutes) || 0;

  const conditionedBase = Math.round(basePrice * conditionMultiplier);
  const hasProtection = paint_protection && paint_protection !== 'none' && basePrice > 0;
  const protectionDiscount = hasProtection ? Math.round(conditionedBase * 0.2) : 0;
  const totalPrice = conditionedBase + addOnTotal - protectionDiscount;

  const durationFormatted = totalDuration >= 60
    ? `${Math.floor(totalDuration / 60)}–${Math.ceil(totalDuration / 60 + 0.5)} hrs`
    : `${totalDuration} min`;

  const summary = lineItems.map(i =>
    i.price != null ? `${i.label} — $${i.price}` : `${i.label} — ${i.note}`
  ).join(' | ');

  return {
    pricing_group: pricingGroup,
    vehicle_classification: vehicle_classification || null,
    condition: condition || null,
    condition_label: conditionEntry ? conditionEntry.label : null,
    services: lineItems,
    base_price: basePrice,
    condition_multiplier: conditionMultiplier,
    add_on_total: addOnTotal,
    paint_protection_discount: protectionDiscount,
    starting_price: totalPrice,
    estimated_duration: durationFormatted,
    estimated_duration_minutes: totalDuration,
    quote_summary: summary,
    requires_consultation: requiresConsultation,
    booking_url: bookingUrl,
  };
}

// ── Default export for CommonJS environments (Lovable Edge Functions) ───

export default { computeQuote, computeQuoteFromRequest, resolvePricingGroup, lookupTier, formatDuration };