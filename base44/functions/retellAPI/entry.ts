// Retell AI Unified Endpoint
// POST /api/retellAPI
// All Retell AI actions flow through here. Base44 owns ALL business logic.
// Retell must NEVER calculate prices, determine memberships, or handle scheduling directly.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PRICING = {
  sedan_coupe: {
    exterior_detail:       { price: 150, duration: 60,  label: 'Exterior Detail' },
    interior_detail:       { price: 150, duration: 90,  label: 'Interior Detail' },
    full_detail:           { price: 250, duration: 180, label: 'Full Interior + Exterior Detail' },
    engine_bay:            { price: 75,  duration: 45,  label: 'Engine Bay Detail' },
    headlight_restoration: { price: 75,  duration: 60,  label: 'Headlight Restoration' },
    ceramic_sealant:       { price: 75,  duration: 30,  label: 'Ceramic Sealant' },
    ceramic_coating:       { price: null, duration: null, label: 'Ceramic Coating (Consultation Required)' },
    paint_correction:      { price: null, duration: null, label: 'Paint Correction (Consultation Required)' },
    vds_gold:              { price: 250, duration: 0,   label: 'VDS Gold Membership ($250/mo)' },
  },
  truck_suv: {
    exterior_detail:       { price: 175, duration: 75,  label: 'Exterior Detail' },
    interior_detail:       { price: 175, duration: 105, label: 'Interior Detail' },
    full_detail:           { price: 300, duration: 210, label: 'Full Interior + Exterior Detail' },
    engine_bay:            { price: 100, duration: 60,  label: 'Engine Bay Detail' },
    headlight_restoration: { price: 75,  duration: 60,  label: 'Headlight Restoration' },
    ceramic_sealant:       { price: 100, duration: 45,  label: 'Ceramic Sealant' },
    ceramic_coating:       { price: null, duration: null, label: 'Ceramic Coating (Consultation Required)' },
    paint_correction:      { price: null, duration: null, label: 'Paint Correction (Consultation Required)' },
    vds_gold:              { price: 300, duration: 0,   label: 'VDS Gold Membership ($300/mo)' },
  },
};

const BOOKING_URL = 'https://vdsmobile.com/book';

const GHL_HEADERS = (key) => ({
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Version': '2021-07-28',
});

async function upsertGHLContact(name, phone, email, locationId, apiKey) {
  const firstName = name.split(' ')[0];
  const lastName = name.split(' ').slice(1).join(' ') || '';
  let contactId = null;
  if (email) {
    const res = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`, { headers: GHL_HEADERS(apiKey) });
    if (res.ok) { const d = await res.json(); contactId = d?.contact?.id || null; }
  }
  const payload = { firstName, lastName, phone, email: email || undefined, locationId, tags: ['retell-ai'], source: 'Retell AI — Valerie' };
  if (contactId) {
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, { method: 'PUT', headers: GHL_HEADERS(apiKey), body: JSON.stringify(payload) });
  } else {
    const res = await fetch('https://services.leadconnectorhq.com/contacts/', { method: 'POST', headers: GHL_HEADERS(apiKey), body: JSON.stringify(payload) });
    const d = await res.json();
    contactId = d?.contact?.id || d?.meta?.contactId || null;
  }
  return contactId;
}

async function handleLookupCustomer(base44, data) {
  const { phone, email } = data;
  if (!phone && !email) return { error: 'phone or email required' };

  const all = await base44.asServiceRole.entities.User.list();
  let match = null;
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === digits);
  }
  if (!match && email) {
    match = all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }
  if (!match) return { found: false, customer: null };

  const vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: match.id });
  const vehicleIds = vehicles.map(v => v.id);
  const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
  const goldSubs = subs.filter(s => vehicleIds.includes(s.vehicle_id));

  return {
    found: true,
    customer: {
      id: match.id, full_name: match.full_name, email: match.email, phone: match.phone,
      saved_addresses: match.saved_addresses || [],
      total_details_completed: match.total_details_completed || 0,
      last_detail_date: match.last_detail_date || null,
      is_gold_member: goldSubs.length > 0,
      gold_vehicle_count: goldSubs.length,
    },
    vehicles: vehicles.map(v => ({ id: v.id, year: v.year, make: v.make, model: v.model, vehicle_type: v.vehicle_type, is_gold_registered: v.is_gold_registered })),
  };
}

async function handleCreateQuote(base44, data) {
  const { customer_name, customer_phone, customer_email, vehicle_year, vehicle_make, vehicle_model, vehicle_type, services, ai_notes } = data;
  if (!customer_phone || !services || !services.length) return { error: 'customer_phone and services[] required' };

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
      const contactId = await upsertGHLContact(customer_name, customer_phone, customer_email, GHL_LOCATION_ID, GHL_API_KEY);
      if (contactId) {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
          method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
          body: JSON.stringify({ body: `AI QUOTE\n${quoteSummary}\nBooking URL: ${BOOKING_URL}`, userId: '' }),
        });
      }
    } catch (e) { console.error('GHL sync error:', e.message); }
  }

  return {
    success: true, quote_id: quote.id,
    starting_price: totalPrice, quote_summary: quoteSummary, booking_url: BOOKING_URL,
  };
}

async function handleCheckGoldStatus(base44, data) {
  const { phone, email } = data;
  const all = await base44.asServiceRole.entities.User.list();
  let match = null;
  if (phone) { const d = phone.replace(/\D/g, ''); match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === d); }
  if (!match && email) { match = all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()); }
  if (!match) return { found: false, is_gold_member: false };

  const vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: match.id });
  const vehicleIds = vehicles.map(v => v.id);
  const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
  const goldSubs = subs.filter(s => vehicleIds.includes(s.vehicle_id));

  return {
    found: true, is_gold_member: goldSubs.length > 0,
    gold_vehicle_count: goldSubs.length,
    monthly_rate: goldSubs.reduce((sum, s) => sum + (s.tier === 'truck_suv' ? 300 : 250), 0),
  };
}

async function handleUpdateCustomer(base44, data) {
  const { phone, email, updates } = data;
  if (!updates) return { error: 'updates object required' };

  const all = await base44.asServiceRole.entities.User.list();
  let match = null;
  if (phone) { const d = phone.replace(/\D/g, ''); match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === d); }
  if (!match && email) { match = all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()); }
  if (!match) return { error: 'Customer not found' };

  const allowed = ['phone', 'notes', 'preferred_contact_method', 'saved_addresses'];
  const safeUpdates = {};
  for (const k of allowed) { if (updates[k] !== undefined) safeUpdates[k] = updates[k]; }

  await base44.asServiceRole.entities.User.update(match.id, safeUpdates);
  return { success: true, customer_id: match.id };
}

async function handleSpecialistFollowup(base44, data, ghlApiKey, ghlLocationId) {
  const { customer_name, customer_phone, customer_email, reason, ai_notes } = data;
  if (!customer_phone) return { error: 'customer_phone required' };

  if (ghlApiKey && ghlLocationId) {
    try {
      const contactId = await upsertGHLContact(customer_name || 'Unknown', customer_phone, customer_email, ghlLocationId, ghlApiKey);
      if (contactId) {
        const noteBody = `SPECIALIST FOLLOWUP REQUESTED\nReason: ${reason || 'Customer requested callback'}\nAI Notes: ${ai_notes || 'None'}\nPhone: ${customer_phone}`;
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
          method: 'POST', headers: GHL_HEADERS(ghlApiKey),
          body: JSON.stringify({ body: noteBody, userId: '' }),
        });
      }
    } catch (e) { console.error('GHL specialist followup error:', e.message); }
  }
  return { success: true, message: 'Specialist followup requested. A team member will contact you shortly.' };
}

Deno.serve(async (req) => {
  try {
    // ── Shared-secret auth: only Retell may call this endpoint ────────────
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (RETELL_API_KEY) {
      const auth = req.headers.get('Authorization') || '';
      const provided = auth.replace(/^Bearer\s+/i, '').trim();
      if (!provided || provided !== RETELL_API_KEY) {
        console.error('retellAPI auth failed: invalid or missing API key');
        return Response.json({ error: 'Unauthorized — invalid API key.' }, { status: 401 });
      }
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, data, call_id, transcript, duration } = body;

    if (!action) return Response.json({ error: 'action is required.' }, { status: 400 });

    console.log(`Retell action: ${action}`, JSON.stringify(data));

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    let result = {};
    let outcome = 'other';

    switch (action) {
      case 'lookup_customer':
        result = await handleLookupCustomer(base44, data || {});
        outcome = result.found ? 'info_provided' : 'info_provided';
        break;
      case 'create_quote':
        result = await handleCreateQuote(base44, data || {});
        outcome = result.success ? 'quote_created' : 'error';
        break;
      case 'check_gold_status':
        result = await handleCheckGoldStatus(base44, data || {});
        outcome = 'info_provided';
        break;
      case 'update_customer':
        result = await handleUpdateCustomer(base44, data || {});
        outcome = result.success ? 'customer_updated' : 'error';
        break;
      case 'specialist_followup':
        result = await handleSpecialistFollowup(base44, data || {}, GHL_API_KEY, GHL_LOCATION_ID);
        outcome = 'other';
        break;
      case 'book_service':
        // Booking is handled by the website booking form / submitBookingToGHL
        // For AI, return the booking URL and let the customer complete it
        result = { success: true, booking_url: BOOKING_URL, message: 'Direct the customer to the booking link.' };
        outcome = 'appointment_booked';
        break;
      default:
        result = { error: `Unknown action: ${action}` };
        outcome = 'error';
    }

    // Log every AI interaction
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '',
        action,
        customer_phone: data?.customer_phone || data?.phone || '',
        customer_name: data?.customer_name || '',
        vehicle_info: [data?.vehicle_year, data?.vehicle_make, data?.vehicle_model].filter(Boolean).join(' '),
        transcript: transcript || '',
        duration_seconds: duration || 0,
        outcome,
        quote_id: result?.quote_id || '',
        raw_request: JSON.stringify({ action, data }),
        raw_response: JSON.stringify(result),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json(result);

  } catch (error) {
    console.error('retellAPI error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});