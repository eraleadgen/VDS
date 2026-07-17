// Pricing Engine — ERA Core Phase 4
// POST /functions/pricingEngine
// Single source of truth for all VDS pricing. Reads entirely from BusinessConfig —
// nothing is hardcoded. Accepts vehicle_classification (preferred) or vehicle_type (legacy)
// and resolves the pricing group via BusinessConfig.classification_to_pricing_group.
// Protected by SCHEDULER_TOKEN — internal calls only (called by valerieTools, website, admin).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  return configs && configs[0] ? configs[0] : null;
}

// Resolve a pricing group from a vehicle classification or legacy vehicle_type.
function resolvePricingGroup(cfg, classification, legacyType) {
  const map = cfg.classification_to_pricing_group || {};
  if (classification && map[classification]) return map[classification];
  if (legacyType === 'truck_suv') return 'truck_suv';
  return 'sedan_coupe';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    if (!SCHEDULER_TOKEN || body.scheduler_token !== SCHEDULER_TOKEN) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { vehicle_classification, vehicle_type, services, condition, add_ons } = body;
    if (!services || !Array.isArray(services)) {
      return Response.json({ error: 'services[] is required.' }, { status: 400 });
    }

    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 500 });

    const pricingGroup = resolvePricingGroup(cfg, vehicle_classification, vehicle_type);
    const bookingUrl = (cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book';

    // Resolve condition multiplier from BusinessConfig pricing_rules.
    const conditionMultipliers = (cfg.pricing_rules && cfg.pricing_rules.condition_multipliers) || [];
    const conditionEntry = condition ? conditionMultipliers.find(c => c.key === condition) : null;
    const conditionMultiplier = conditionEntry ? conditionEntry.multiplier : 1;

    let basePrice = 0;
    let totalDuration = 0;
    let addOnTotal = 0;
    const lineItems = [];
    let requiresConsultation = false;

    for (const svcKey of services) {
      const svc = (cfg.services || []).find(s => s.key === svcKey);
      if (!svc) {
        lineItems.push({ service: svcKey, label: svcKey, price: 0, duration: 0, note: 'Unknown service' });
        continue;
      }
      // Tier lookup: classification key first (per-classification pricing), then pricing group, then first.
      const tier = (svc.tiers || []).find(t => t.tier === vehicle_classification) || (svc.tiers || []).find(t => t.tier === pricingGroup) || (svc.tiers || [])[0];
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

    // Add-ons are priced at face value (not multiplied by condition).
    for (const addOnKey of (add_ons || [])) {
      const svc = (cfg.services || []).find(s => s.key === addOnKey);
      if (!svc) continue;
      const tier = (svc.tiers || []).find(t => t.tier === pricingGroup) || (svc.tiers || [])[0];
      if (!tier) continue;
      addOnTotal += tier.price || 0;
      totalDuration += tier.duration_minutes || 0;
      lineItems.push({ service: addOnKey, label: svc.label, price: tier.price, duration: tier.duration_minutes, is_add_on: true });
    }

    // Custom quote = base services × condition multiplier + add-ons.
    const conditionedBase = Math.round(basePrice * conditionMultiplier);
    const totalPrice = conditionedBase + addOnTotal;

    const durationFormatted = totalDuration >= 60
      ? `${Math.floor(totalDuration / 60)}–${Math.ceil(totalDuration / 60 + 0.5)} hrs`
      : `${totalDuration} min`;

    const summary = lineItems.map(i =>
      i.price != null ? `${i.label} — $${i.price}` : `${i.label} — ${i.note}`
    ).join(' | ');

    return Response.json({
      pricing_group: pricingGroup,
      vehicle_classification: vehicle_classification || null,
      condition: condition || null,
      condition_label: conditionEntry ? conditionEntry.label : null,
      services: lineItems,
      base_price: basePrice,
      condition_multiplier: conditionMultiplier,
      add_on_total: addOnTotal,
      starting_price: totalPrice,
      estimated_duration: durationFormatted,
      estimated_duration_minutes: totalDuration,
      quote_summary: summary,
      requires_consultation: requiresConsultation,
      booking_url: bookingUrl,
    });
  } catch (error) {
    console.error('pricingEngine error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});