// Save Quote — public function called from the Pricing page "Book This Quote" button.
// Creates a draft Quote (status 'pending') storing the selected services, vehicle
// classification, condition, and computed custom price. The booking page fills in
// customer details on submit and links the quote to the created Job.
// No SCHEDULER_TOKEN required — public endpoint with origin allowlist.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
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
    // Origin allowlist (same as submitBooking — public endpoint)
    const originHeader = req.headers.get('Origin') || req.headers.get('Referer') || '';
    let originHost = '';
    try { originHost = new URL(originHeader).host.toLowerCase(); } catch {}
    const allowed = ['vdsmobile.com', 'www.vdsmobile.com'].includes(originHost)
      || originHost === 'localhost'
      || originHost.endsWith('.localhost')
      || originHost.endsWith('.base44.app')
      || originHost.endsWith('.base44.com');
    if (!allowed) {
      return Response.json({ error: 'Forbidden — invalid origin.' }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const {
      vehicle_classification, services, condition, add_ons,
      estimated_price, estimated_duration_minutes, quote_summary,
      customer_name, customer_phone, customer_email,
    } = body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return Response.json({ error: 'services[] is required.' }, { status: 400 });
    }

    // Auth optional — attach customer info if logged in
    let user = null;
    try { user = await base44.auth.me(); } catch {}

    const cfg = await loadConfig(base44);
    const pricingGroup = cfg ? resolvePricingGroup(cfg, vehicle_classification) : 'sedan_coupe';
    const bookingUrl = (cfg && cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book';

    const expiration = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const quote = await base44.asServiceRole.entities.Quote.create({
      customer_name: customer_name || (user ? (user.full_name || '') : ''),
      customer_phone: customer_phone || '',
      customer_email: customer_email || (user ? (user.email || '') : ''),
      vehicle_classification: vehicle_classification || '',
      vehicle_type: pricingGroup,
      requested_services: services,
      add_ons: add_ons || [],
      condition: condition || '',
      starting_price: estimated_price || 0,
      final_price: estimated_price || 0,
      estimated_duration_minutes: estimated_duration_minutes || 0,
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