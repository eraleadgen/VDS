// Retell AI — Unified Orchestration Endpoint
// POST /functions/retellExecute
// The ONLY endpoint Retell calls for business actions.
// All business logic lives here; Retell never prices, schedules, or queries GHL directly.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Pricing & Service Catalog (Base44 is source of truth) ──────────────
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

const VEHICLE_TYPE_MAP = {
  suv: 'truck_suv', truck: 'truck_suv', 'truck/suv': 'truck_suv',
  sedan: 'sedan_coupe', coupe: 'sedan_coupe', 'sedan/coupe': 'sedan_coupe',
};
const BOOKING_URL = 'https://vdsmobile.com/book';

const GHL_HEADERS = (key) => ({
  'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Version': '2021-07-28',
});

// ── Helpers ────────────────────────────────────────────────────────────
function normalizePhone(p) { return p ? p.replace(/[^\d+]/g, '') : ''; }
function vehicleTier(type) {
  if (!type) return 'sedan_coupe';
  return VEHICLE_TYPE_MAP[type.toLowerCase()] || (PRICING[type] ? type : 'sedan_coupe');
}
function serviceKey(service) {
  if (!service) return 'full_detail';
  const s = service.toLowerCase();
  if (s.includes('full')) return 'full_detail';
  if (s.includes('exterior')) return 'exterior_detail';
  if (s.includes('interior')) return 'interior_detail';
  if (s.includes('engine')) return 'engine_bay';
  if (s.includes('headlight')) return 'headlight_restoration';
  if (s.includes('sealant')) return 'ceramic_sealant';
  if (s.includes('coating')) return 'ceramic_coating';
  if (s.includes('correction')) return 'paint_correction';
  if (s.includes('gold')) return 'vds_gold';
  return 'full_detail';
}

async function findUser(base44, phone, email) {
  const all = await base44.asServiceRole.entities.User.list();
  if (phone) { const d = phone.replace(/\D/g, ''); const m = all.find(u => u.phone && u.phone.replace(/\D/g, '') === d); if (m) return m; }
  if (email) { const e = email.toLowerCase(); return all.find(u => u.email && u.email.toLowerCase() === e) || null; }
  return null;
}

async function upsertGHLContact(name, phone, email, ghlKey, ghlLoc, tags = []) {
  const firstName = (name || 'Valued').split(' ')[0];
  const lastName = (name || '').split(' ').slice(1).join(' ') || '';
  let contactId = null;
  if (email) {
    const r = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${ghlLoc}&email=${encodeURIComponent(email)}`, { headers: GHL_HEADERS(ghlKey) });
    if (r.ok) { const d = await r.json(); contactId = d?.contact?.id || null; }
  }
  if (!contactId && phone) {
    const r = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${ghlLoc}&phone=${encodeURIComponent(phone)}`, { headers: GHL_HEADERS(ghlKey) });
    if (r.ok) { const d = await r.json(); contactId = d?.contacts?.[0]?.id || null; }
  }
  const payload = { firstName, lastName, phone: phone || undefined, email: email || undefined, locationId: ghlLoc, tags, source: 'Retell AI — Valerie' };
  if (contactId) {
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, { method: 'PUT', headers: GHL_HEADERS(ghlKey), body: JSON.stringify(payload) });
  } else {
    const r = await fetch('https://services.leadconnectorhq.com/contacts/', { method: 'POST', headers: GHL_HEADERS(ghlKey), body: JSON.stringify(payload) });
    if (r.ok) { const d = await r.json(); contactId = d?.contact?.id || d?.meta?.contactId || null; }
  }
  return contactId;
}

async function addGHLNote(ghlKey, contactId, body) {
  if (!contactId) return;
  try {
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST', headers: GHL_HEADERS(ghlKey), body: JSON.stringify({ body, userId: '' }),
    });
  } catch (e) { console.error('GHL note error:', e.message); }
}

async function sendGHLSms(ghlKey, contactId, message) {
  const r = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
    method: 'POST', headers: GHL_HEADERS(ghlKey),
    body: JSON.stringify({ type: 'SMS', contactId, message }),
  });
  return r.ok;
}

// ── Action Handlers ────────────────────────────────────────────────────
async function actLookupCustomer(base44, data) {
  const { phone, email } = data;
  if (!phone && !email) return { error: 'phone or email is required.' };
  const user = await findUser(base44, phone, email);
  if (!user) return { success: true, customer: null, found: false };

  const [vehicles, subs, appts] = await Promise.all([
    base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: user.id }).catch(() => []),
    base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' }).catch(() => []),
    base44.asServiceRole.entities.Appointment.filter({ customer_phone: user.phone }).catch(() => []),
  ]);
  const vIds = vehicles.map(v => v.id);
  const goldSubs = subs.filter(s => vIds.includes(s.vehicle_id));
  const recent = appts.filter(a => a.status === 'completed').sort((a, b) => new Date(b.preferred_date || 0) - new Date(a.preferred_date || 0));

  return {
    success: true, found: true,
    customer: {
      customerId: user.id, name: user.full_name, goldMember: goldSubs.length > 0,
      phone: user.phone, email: user.email,
      vehicles: vehicles.map(v => ({ year: v.year, make: v.make, model: v.model, vehicleType: v.vehicle_type, isGoldRegistered: v.is_gold_registered })),
      lastService: recent[0]?.service_label || null,
      lastVisit: recent[0]?.preferred_date || user.last_detail_date || null,
      totalVisits: user.total_details_completed || recent.length,
      lifetimeSpend: user.lifetime_spend ?? null,
      notes: user.notes || null,
    },
  };
}

async function actCreateQuote(base44, data) {
  const { phone, service, vehicleType, vehicleYear, vehicleMake, vehicleModel, vehicleCount = 1 } = data;
  if (!phone) return { error: 'phone is required.' };
  if (!service) return { error: 'service is required.' };

  const tier = vehicleTier(vehicleType);
  const svcKey = serviceKey(service);
  const entry = PRICING[tier][svcKey] || PRICING.sedan_coupe[svcKey];
  const count = Math.max(1, Number(vehicleCount) || 1);
  const startingPrice = entry.price != null ? entry.price * count : null;
  const vehicleDesc = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ') || (tier === 'truck_suv' ? 'SUV/Truck' : 'Sedan/Coupe');
  const quoteSummary = `${entry.label} — ${tier === 'truck_suv' ? 'SUV/Truck' : 'Sedan/Coupe'}`;

  const user = await findUser(base44, phone);
  const quote = await base44.asServiceRole.entities.Quote.create({
    customer_name: user?.full_name || 'Unknown', customer_phone: normalizePhone(phone),
    customer_email: user?.email || '', vehicle_year: String(vehicleYear || ''),
    vehicle_make: vehicleMake || '', vehicle_model: vehicleModel || '',
    vehicle_type: tier, requested_services: [svcKey],
    starting_price: startingPrice ?? 0, quote_summary: quoteSummary,
    booking_url: BOOKING_URL, status: 'pending',
  });

  const speech = startingPrice != null
    ? `A ${entry.label} for your ${vehicleDesc} starts at $${startingPrice}. Would you like me to text this quote along with a link to book your appointment?`
    : `A ${entry.label} for your ${vehicleDesc} requires a specialist consultation. Would you like me to connect you with our team?`;

  return {
    success: true, quoteId: quote.id,
    startingPrice, quoteSummary, bookingUrl: BOOKING_URL, speech,
  };
}

async function actSendQuote(base44, data, ghlKey, ghlLoc) {
  const { quoteId } = data;
  if (!quoteId) return { error: 'quoteId is required.' };
  const quote = await base44.asServiceRole.entities.Quote.get(quoteId);
  if (!quote) return { error: 'Quote not found.' };

  if (!ghlKey || !ghlLoc) return { error: 'SMS gateway not configured.' };

  const phone = normalizePhone(quote.customer_phone);
  const name = quote.customer_name || 'there';
  const firstName = name.split(' ')[0];
  const serviceLabel = quote.quote_summary || 'Detail Service';
  const vehicleDesc = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'Vehicle';

  const contactId = await upsertGHLContact(name, phone, quote.customer_email, ghlKey, ghlLoc, ['retell-ai-quote']);
  if (!contactId) return { error: 'Could not resolve customer contact for SMS.' };

  const smsBody = `Hi ${firstName}!

Here's your VDS quote:

• Service: ${serviceLabel}
• Vehicle: ${vehicleDesc}
• Starting Price: $${quote.starting_price ?? '—'}

Book online:
${BOOKING_URL}

Reply if you have any questions!

-Valerie`;

  const sent = await sendGHLSms(ghlKey, contactId, smsBody);
  if (!sent) return { error: 'SMS delivery failed.' };

  await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'sent', sms_sent: true });
  return { success: true, message: 'Quote sent successfully.' };
}

async function actCheckGoldStatus(base44, data) {
  const { phone, email } = data;
  if (!phone && !email) return { error: 'phone or email is required.' };
  const user = await findUser(base44, phone, email);
  if (!user) return { success: true, active: false };

  const [vehicles, subs, records] = await Promise.all([
    base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: user.id }).catch(() => []),
    base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' }).catch(() => []),
    base44.asServiceRole.entities.ServiceRecord.list().catch(() => []),
  ]);
  const vIds = vehicles.map(v => v.id);
  const goldSubs = subs.filter(s => vIds.includes(s.vehicle_id));
  if (!goldSubs.length) return { success: true, active: false };

  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const myRecords = records.filter(r => vIds.includes(r.vehicle_id) && r.month_year === monthYear);
  const interiorUsed = myRecords.filter(r => r.service_type === 'full_detail').length;
  const interiorDetails = Math.max(0, 1 - interiorUsed); // 1 interior detail per month

  return {
    success: true, active: true,
    renewalDate: goldSubs[0]?.current_period_end || goldSubs[0]?.started_date || null,
    remainingBenefits: { interiorDetails },
    vehicleCount: goldSubs.length,
  };
}

async function actSpecialistFollowup(base44, data, ghlKey, ghlLoc, teamPhone) {
  const { phone, reason, notes } = data;
  if (!phone) return { error: 'phone is required.' };
  if (!reason) return { error: 'reason is required.' };

  if (!ghlKey || !ghlLoc) return { error: 'CRM not configured.' };
  const cleanPhone = normalizePhone(phone);
  const user = await findUser(base44, phone);
  const name = user?.full_name || 'Customer';
  const contactId = await upsertGHLContact(name, cleanPhone, user?.email, ghlKey, ghlLoc, ['valerie-escalation', 'high-priority']);

  const escalationNote = `🚨 VALERIE ESCALATION\n\n${name}\n${cleanPhone}\n\nReason:\n${reason}\n\nNotes:\n${notes || 'None'}`;
  await addGHLNote(ghlKey, contactId, escalationNote);

  // Internal SMS to VDS team
  if (teamPhone) {
    try {
      const r = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${ghlLoc}&phone=${encodeURIComponent(teamPhone)}`, { headers: GHL_HEADERS(ghlKey) });
      let teamId = null;
      if (r.ok) { const d = await r.json(); teamId = d?.contacts?.[0]?.id || null; }
      if (!teamId) {
        const c = await fetch('https://services.leadconnectorhq.com/contacts/', { method: 'POST', headers: GHL_HEADERS(ghlKey), body: JSON.stringify({ firstName: 'VDS', lastName: 'Team', phone: teamPhone, locationId: ghlLoc, tags: ['internal-team'] }) });
        if (c.ok) { const d = await c.json(); teamId = d?.contact?.id || d?.meta?.contactId || null; }
      }
      if (teamId) await sendGHLSms(ghlKey, teamId, escalationNote);
    } catch (e) { console.error('Team SMS error:', e.message); }
  }

  return { success: true, message: 'Specialist notified.' };
}

async function actCreateLead(base44, data, ghlKey, ghlLoc) {
  const { customerName, phone, service, quoteSummary } = data;
  if (!customerName) return { error: 'customerName is required.' };
  if (!phone) return { error: 'phone is required.' };
  if (!ghlKey || !ghlLoc) return { error: 'CRM not configured.' };

  const cleanPhone = normalizePhone(phone);
  const contactId = await upsertGHLContact(customerName, cleanPhone, null, ghlKey, ghlLoc, ['retell-ai-lead', `service:${service || 'general'}`]);
  const noteBody = `VALERIE LEAD\nService: ${service || 'Not specified'}\nQuote: ${quoteSummary || 'N/A'}`;
  await addGHLNote(ghlKey, contactId, noteBody);
  return { success: true };
}

async function actEndCall(base44, data) {
  const { callId, summary, duration } = data;
  if (!summary && !callId) return { error: 'summary or callId is required.' };
  await base44.asServiceRole.entities.AILog.create({
    call_id: callId || '', action: 'end_call',
    transcript: summary || '', duration_seconds: typeof duration === 'number' ? duration : 0,
    outcome: 'other', raw_request: JSON.stringify(data), raw_response: JSON.stringify({ success: true }),
  });
  return { success: true };
}

function actGetServices() {
  const catalog = [];
  for (const [tier, services] of Object.entries(PRICING)) {
    for (const [key, info] of Object.entries(services)) {
      catalog.push({
        key, label: info.label, vehicleType: tier,
        price: info.price, durationMinutes: info.duration,
        requiresConsultation: info.price == null,
      });
    }
  }
  return { success: true, services: catalog };
}

// ── Main Handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    // ── Auth ──
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (RETELL_API_KEY) {
      const auth = req.headers.get('Authorization') || '';
      const provided = auth.replace(/^Bearer\s+/i, '').trim();
      if (!provided || provided !== RETELL_API_KEY) {
        return Response.json({ error: 'Unauthorized — invalid or missing API key.' }, { status: 401 });
      }
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;
    const data = body.data || {};

    if (!action) return Response.json({ error: 'action is required.' }, { status: 400 });

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');
    const VDS_TEAM_PHONE = Deno.env.get('VDS_TEAM_PHONE');

    let result = {};
    let outcome = 'other';

    switch (action) {
      case 'lookup_customer':
        result = await actLookupCustomer(base44, data);
        outcome = 'info_provided';
        break;
      case 'create_quote':
        result = await actCreateQuote(base44, data);
        outcome = result.success ? 'quote_created' : 'error';
        break;
      case 'send_quote':
        result = await actSendQuote(base44, data, GHL_API_KEY, GHL_LOCATION_ID);
        outcome = result.success ? 'info_provided' : 'error';
        break;
      case 'check_gold_status':
        result = await actCheckGoldStatus(base44, data);
        outcome = 'info_provided';
        break;
      case 'specialist_followup':
        result = await actSpecialistFollowup(base44, data, GHL_API_KEY, GHL_LOCATION_ID, VDS_TEAM_PHONE);
        outcome = 'other';
        break;
      case 'create_lead':
        result = await actCreateLead(base44, data, GHL_API_KEY, GHL_LOCATION_ID);
        outcome = 'customer_updated';
        break;
      case 'end_call':
        result = await actEndCall(base44, data);
        outcome = 'other';
        break;
      case 'get_services':
        result = actGetServices();
        outcome = 'info_provided';
        break;
      default:
        result = { error: `Unknown action: ${action}` };
        outcome = 'error';
    }

    // ── Log every interaction ──
    const elapsed = Date.now() - t0;
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: data.callId || data.call_id || '', action,
        customer_phone: normalizePhone(data.phone || data.customer_phone || ''),
        customer_name: data.customerName || data.customer_name || '',
        vehicle_info: [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(' '),
        outcome,
        quote_id: result?.quoteId || result?.quote_id || '',
        duration_seconds: elapsed,
        raw_request: JSON.stringify({ action, data }),
        raw_response: JSON.stringify(result),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json(result);

  } catch (error) {
    console.error('retellExecute error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});