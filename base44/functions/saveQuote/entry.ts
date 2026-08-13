// Save Quote — public function called from the Pricing page "Book This Quote" button.
// Creates a draft Quote (status 'pending') storing the selected services, vehicle
// classification, condition, and computed custom price. The booking page fills in
// customer details on submit and links the quote to the created Job.
// No SCHEDULER_TOKEN required — public endpoint with origin allowlist.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { resolveBusinessIdFromHost, logTenantMismatch } from '../../shared/tenantContext.ts';

async function loadConfig(base44, businessId) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
  return configs && configs[0] ? configs[0] : null;
}

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

    // Phase 4: resolve business_id from the request hostname (multi-tenant).
    const businessId = await resolveBusinessIdFromHost(base44, req);
    const cfg = await loadConfig(base44, businessId);
    // Mismatch logging (non-blocking) — if an authenticated user's tenant differs from
    // the hostname's, log it but proceed with the hostname's business_id (the quote
    // belongs to the visited business).
    try {
      const me = await base44.auth.me();
      if (me && me.id) {
        const user = await base44.asServiceRole.entities.User.get(me.id);
        if (user && user.business_id && user.business_id !== businessId) {
          await logTenantMismatch(base44, user.business_id, businessId, 'saveQuote');
        }
      }
    } catch {}

    // Origin allowlist — tenant domains derived from BusinessConfig website_links.
    const originHeader = req.headers.get('Origin') || req.headers.get('Referer') || '';
    let originHost = '';
    try { originHost = new URL(originHeader).host.toLowerCase(); } catch {}
    const tenantHosts = [];
    if (cfg && cfg.website_links) {
      for (const url of Object.values(cfg.website_links)) {
        if (url) { try { tenantHosts.push(new URL(url).host.toLowerCase()); } catch {} }
      }
    }
    const allowed = tenantHosts.includes(originHost)
      || originHost === 'localhost'
      || originHost.endsWith('.localhost')
      || originHost.endsWith('.base44.app')
      || originHost.endsWith('.base44.com');
    if (!allowed) {
      return Response.json({ error: 'Forbidden — invalid origin.' }, { status: 403 });
    }

    const {
      vehicle_classification, vehicle_year, vehicle_make, vehicle_model,
      services, condition, add_ons, paint_protection,
      estimated_price, estimated_duration_minutes, quote_summary,
      customer_name, customer_phone, customer_email,
    } = body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return Response.json({ error: 'services[] is required.' }, { status: 400 });
    }

    // Auth optional — attach customer info if logged in
    let user = null;
    try { user = await base44.auth.me(); } catch {}

    const pricingGroup = cfg ? resolvePricingGroup(cfg, vehicle_classification) : 'sedan_coupe';
    const bookingUrl = (cfg && cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book';

    // Compute the quote price server-side from BusinessConfig — never trust the client-supplied
    // estimate (prevents forged $0 / $1 quotes from being booked at an arbitrary price).
    let computedPrice = 0;
    let computedDuration = 0;
    if (cfg) {
      const conditionMultipliers = (cfg.pricing_rules && cfg.pricing_rules.condition_multipliers) || [];
      const conditionEntry = condition ? conditionMultipliers.find(c => c.key === condition) : null;
      const conditionMultiplier = conditionEntry ? conditionEntry.multiplier : 1;
      let basePrice = 0;
      let addOnTotal = 0;
      for (const svcKey of services) {
        const svc = (cfg.services || []).find(s => s.key === svcKey);
        if (!svc || svc.requires_consultation) continue;
        const tier = (svc.tiers || []).find(t => t.tier === vehicle_classification)
          || (svc.tiers || []).find(t => t.tier === pricingGroup)
          || (svc.tiers || [])[0];
        if (tier) { basePrice += tier.price || 0; computedDuration += tier.duration_minutes || 0; }
      }
      for (const addOnKey of (add_ons || [])) {
        const svc = (cfg.services || []).find(s => s.key === addOnKey);
        if (!svc) continue;
        const tier = (svc.tiers || []).find(t => t.tier === pricingGroup) || (svc.tiers || [])[0];
        if (tier) { addOnTotal += tier.price || 0; computedDuration += tier.duration_minutes || 0; }
      }
      if (basePrice > 0) computedDuration += (conditionEntry && conditionEntry.duration_add_minutes) || 0;
      const conditionedBase = Math.round(basePrice * conditionMultiplier);
      const hasProtection = paint_protection && paint_protection !== 'none' && basePrice > 0;
      const protectionDiscount = hasProtection ? Math.round(conditionedBase * 0.2) : 0;
      computedPrice = conditionedBase + addOnTotal - protectionDiscount;
    }

    const expiration = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const quote = await base44.asServiceRole.entities.Quote.create({
      business_id: businessId,
      customer_name: customer_name || (user ? (user.full_name || '') : ''),
      customer_phone: customer_phone || '',
      customer_email: customer_email || (user ? (user.email || '') : ''),
      vehicle_classification: vehicle_classification || '',
      vehicle_year: vehicle_year || '',
      vehicle_make: vehicle_make || '',
      vehicle_model: vehicle_model || '',
      vehicle_type: pricingGroup,
      requested_services: services,
      add_ons: add_ons || [],
      condition: condition || '',
      paint_protection: paint_protection || 'none',
      starting_price: computedPrice,
      final_price: computedPrice,
      estimated_duration_minutes: estimated_duration_minutes || computedDuration || 0,
      quote_summary: quote_summary || '',
      booking_url: bookingUrl,
      expiration_date: expiration,
      status: 'pending',
      sms_consent: true,
    });

    return Response.json({ success: true, quote_id: quote.id, quote });
  } catch (error) {
    console.error('saveQuote error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});