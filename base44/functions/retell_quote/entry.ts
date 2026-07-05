// Retell AI — Create Quote
// POST /functions/retell_quote
// Base44 owns ALL pricing. Retell never calculates prices — it calls this.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PRICING = {
  sedan_coupe: {
    exterior_detail:       { price: 150, label: 'Exterior Detail' },
    interior_detail:       { price: 150, label: 'Interior Detail' },
    full_detail:           { price: 250, label: 'Full Interior + Exterior Detail' },
    engine_bay:            { price: 75,  label: 'Engine Bay Detail' },
    headlight_restoration: { price: 75,  label: 'Headlight Restoration' },
    ceramic_sealant:       { price: 75,  label: 'Ceramic Sealant' },
    ceramic_coating:       { price: null, label: 'Ceramic Coating (Consultation Required)' },
    paint_correction:      { price: null, label: 'Paint Correction (Consultation Required)' },
    vds_gold:              { price: 250, label: 'VDS Gold Membership ($250/mo)' },
  },
  truck_suv: {
    exterior_detail:       { price: 175, label: 'Exterior Detail' },
    interior_detail:       { price: 175, label: 'Interior Detail' },
    full_detail:           { price: 300, label: 'Full Interior + Exterior Detail' },
    engine_bay:            { price: 100, label: 'Engine Bay Detail' },
    headlight_restoration: { price: 75,  label: 'Headlight Restoration' },
    ceramic_sealant:       { price: 100, label: 'Ceramic Sealant' },
    ceramic_coating:       { price: null, label: 'Ceramic Coating (Consultation Required)' },
    paint_correction:      { price: null, label: 'Paint Correction (Consultation Required)' },
    vds_gold:              { price: 300, label: 'VDS Gold Membership ($300/mo)' },
  },
};

const BOOKING_URL = 'https://vdsmobile.com/book';
const GHL_HEADERS = (key) => ({
  'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Version': '2021-07-28',
});

Deno.serve(async (req) => {
  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const auth = req.headers.get('Authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (!RETELL_API_KEY || !provided || provided !== RETELL_API_KEY) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { customer_name, customer_phone, customer_email, vehicle_year, vehicle_make, vehicle_model, vehicle_type, services, ai_notes, call_id } = body;

    if (!customer_phone || !services || !services.length) {
      return Response.json({ error: 'customer_phone and services[] are required.' }, { status: 400 });
    }

    const tier = PRICING[vehicle_type] || PRICING['sedan_coupe'];
    let totalPrice = 0;
    const lineItems = [];
    for (const svc of services) {
      const entry = tier[svc];
      if (!entry) continue;
      if (entry.price != null) totalPrice += entry.price;
      lineItems.push({ service: svc, label: entry.label, price: entry.price });
    }

    const vehicleDesc = [vehicle_year, vehicle_make, vehicle_model].filter(Boolean).join(' ') || 'Vehicle';
    const summaryLines = lineItems.map(i => i.price != null ? `${i.label} — $${i.price}` : `${i.label} — Consultation Required`);
    const quoteSummary = `Quote for ${vehicleDesc}:\n${summaryLines.join('\n')}\nStarting at $${totalPrice}`;

    const quote = await base44.asServiceRole.entities.Quote.create({
      customer_name: customer_name || 'Unknown', customer_phone,
      customer_email: customer_email || '', vehicle_year: vehicle_year || '',
      vehicle_make: vehicle_make || '', vehicle_model: vehicle_model || '',
      vehicle_type: vehicle_type || 'sedan_coupe', requested_services: services,
      starting_price: totalPrice, quote_summary: quoteSummary,
      booking_url: BOOKING_URL, ai_notes: ai_notes || '', status: 'pending',
    });

    // GHL sync
    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');
    if (GHL_API_KEY && GHL_LOCATION_ID && customer_name && customer_phone) {
      try {
        const firstName = customer_name.split(' ')[0];
        const lastName = customer_name.split(' ').slice(1).join(' ') || '';
        let contactId = null;
        if (customer_email) {
          const res = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(customer_email)}`, { headers: GHL_HEADERS(GHL_API_KEY) });
          if (res.ok) { const d = await res.json(); contactId = d?.contact?.id || null; }
        }
        const payload = { firstName, lastName, phone: customer_phone, email: customer_email || undefined, locationId: GHL_LOCATION_ID, tags: ['retell-ai-quote'], source: 'Retell AI — Valerie' };
        if (contactId) {
          await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, { method: 'PUT', headers: GHL_HEADERS(GHL_API_KEY), body: JSON.stringify(payload) });
        } else {
          const res = await fetch('https://services.leadconnectorhq.com/contacts/', { method: 'POST', headers: GHL_HEADERS(GHL_API_KEY), body: JSON.stringify(payload) });
          const d = await res.json(); contactId = d?.contact?.id || d?.meta?.contactId || null;
        }
        if (contactId) {
          await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
            body: JSON.stringify({ body: `AI QUOTE\n${quoteSummary}\nBooking URL: ${BOOKING_URL}`, userId: '' }),
          });
        }
      } catch (e) { console.error('GHL sync error:', e.message); }
    }

    const result = { success: true, quote_id: quote.id, starting_price: totalPrice, quote_summary: quoteSummary, booking_url: BOOKING_URL };

    await base44.asServiceRole.entities.AILog.create({
      call_id: call_id || '', action: 'create_quote',
      customer_phone, customer_name: customer_name || '',
      vehicle_info: vehicleDesc, outcome: 'quote_created',
      quote_id: quote.id, raw_request: JSON.stringify(body),
      raw_response: JSON.stringify(result),
    });

    return Response.json(result);

  } catch (error) {
    console.error('retell_quote error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});