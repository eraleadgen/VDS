// Retell AI — Unified Orchestration Endpoint (Valerie — SMS)
// POST /functions/retellExecute
// Base44 is the single source of truth. Valerie contains NO business logic.
// All pricing & services are read from the BusinessConfig entity — nothing is hardcoded.
// GoHighLevel has been fully removed. Retell (Valerie) is the SMS transport; Base44 stores all data.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Helpers ────────────────────────────────────────────────────────────
function normalizePhone(p) { return p ? p.replace(/[^\d+]/g, '') : ''; }
function toE164(phone) {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  else if (d.length === 11 && d.startsWith('1')) d = d;
  return '+' + d;
}
function vehicleTier(type) {
  if (!type) return 'sedan_coupe';
  const map = { suv: 'truck_suv', truck: 'truck_suv', 'truck/suv': 'truck_suv', sedan: 'sedan_coupe', coupe: 'sedan_coupe', 'sedan/coupe': 'sedan_coupe' };
  return map[type.toLowerCase()] || (type === 'truck_suv' || type === 'sedan_coupe' ? type : 'sedan_coupe');
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
  if (s.includes('correction')) return 'paint_correction_stage1';
  if (s.includes('coating')) return 'ceramic_coating_2yr';
  if (s.includes('gold')) return 'vds_gold';
  return 'full_detail';
}

// Load the active BusinessConfig and build a fast pricing lookup.
async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  const cfg = configs && configs[0];
  if (!cfg) return null;
  const pricing = {};
  for (const svc of (cfg.services || [])) {
    for (const tier of (svc.tiers || [])) {
      if (!pricing[tier.tier]) pricing[tier.tier] = {};
      pricing[tier.tier][svc.key] = {
        price: tier.price,
        duration: tier.duration_minutes,
        label: svc.label,
        requiresConsultation: svc.requires_consultation || false,
      };
    }
  }
  const bookingUrl = (cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book';
  return { cfg, pricing, bookingUrl };
}

async function findUser(base44, phone, email) {
  const all = await base44.asServiceRole.entities.User.list();
  if (phone) { const d = phone.replace(/\D/g, ''); const m = all.find(u => u.phone && u.phone.replace(/\D/g, '') === d); if (m) return m; }
  if (email) { const e = email.toLowerCase(); return all.find(u => u.email && u.email.toLowerCase() === e) || null; }
  return null;
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
      notes: user.internal_notes || user.notes || null,
      preferredContactMethod: user.preferred_contact_method || 'sms',
    },
  };
}

async function actCreateQuote(base44, data, config) {
  const { phone, service, vehicleType, vehicleYear, vehicleMake, vehicleModel, vehicleCount = 1 } = data;
  if (!phone) return { error: 'phone is required.' };
  if (!service) return { error: 'service is required.' };

  const tier = vehicleTier(vehicleType);
  const svcKey = serviceKey(service);
  const entry = (config.pricing[tier] && config.pricing[tier][svcKey]) || (config.pricing['sedan_coupe'] && config.pricing['sedan_coupe'][svcKey]);
  if (!entry) return { error: `Service '${service}' is not in the catalog.` };

  const count = Math.max(1, Number(vehicleCount) || 1);
  const startingPrice = entry.price != null ? entry.price * count : null;
  const vehicleDesc = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ') || (tier === 'truck_suv' ? 'SUV/Truck' : 'Sedan/Coupe');
  const quoteSummary = `${entry.label} — ${tier === 'truck_suv' ? 'SUV/Truck' : 'Sedan/Coupe'}`;

  const user = await findUser(base44, phone);
  const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const quote = await base44.asServiceRole.entities.Quote.create({
    customer_name: user?.full_name || 'Unknown', customer_phone: toE164(phone),
    customer_email: user?.email || '', vehicle_year: String(vehicleYear || ''),
    vehicle_make: vehicleMake || '', vehicle_model: vehicleModel || '',
    vehicle_type: tier, requested_services: [svcKey],
    starting_price: startingPrice ?? 0, final_price: startingPrice ?? 0,
    quote_summary: quoteSummary, booking_url: config.bookingUrl,
    expiration_date: expiration, status: 'pending',
  });

  const speech = entry.requiresConsultation
    ? `For a ${entry.label} on your ${vehicleDesc}, pricing starts at $${startingPrice}, though the final quote and scheduling need a quick specialist consultation. Would you like me to text you this quote with a booking link?`
    : (startingPrice != null
      ? `For a ${entry.label} on your ${vehicleDesc}, pricing starts at $${startingPrice}. Would you like me to text you this quote with a link to book?`
      : `A ${entry.label} for your ${vehicleDesc} needs a specialist consultation. Would you like me to connect you with our team?`);

  return { success: true, quoteId: quote.id, startingPrice, quoteSummary, bookingUrl: config.bookingUrl, speech };
}

async function actSendQuote(base44, data, config) {
  let { quoteId } = data;
  const lookupPhone = toE164(data.phone || data.customer_phone);

  // No quoteId? Find the most recent unsent quote for this phone.
  if (!quoteId) {
    if (!lookupPhone) return { error: "I need the customer's phone number to find the quote. Ask them for it, then call send_quote again." };
    const quotes = await base44.asServiceRole.entities.Quote.filter({ customer_phone: lookupPhone });
    const recent = quotes.filter(q => !q.sms_sent && q.status !== 'expired').sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    quoteId = recent?.id;
    if (!quoteId) return { error: 'No pending quote found for that number. Please create a quote first using create_quote.' };
  }

  const quote = await base44.asServiceRole.entities.Quote.get(quoteId);
  if (!quote) return { error: 'Quote not found.' };

  const name = quote.customer_name || 'there';
  const firstName = name.split(' ')[0];
  const serviceLabel = quote.quote_summary || 'Detail Service';
  const vehicleDesc = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'Vehicle';
  const priceText = quote.final_price != null ? `$${quote.final_price}` : (quote.starting_price != null ? `$${quote.starting_price}` : '—');

  // Valerie is the SMS transport — she delivers this text herself.
  const smsText = `Hi ${firstName}! Here's your VDS quote:\n\n• Service: ${serviceLabel}\n• Vehicle: ${vehicleDesc}\n• Starting Price: ${priceText}\n\nBook online:\n${config.bookingUrl}\n\nReply if you have questions!\n-Valerie`;

  await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'sent', sms_sent: true });
  return { success: true, sms_text: smsText, speech: "I've sent your quote to your phone — check your texts! Anything else I can help with?" };
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
  const interiorDetails = Math.max(0, 1 - interiorUsed);

  return {
    success: true, active: true,
    renewalDate: goldSubs[0]?.current_period_end || goldSubs[0]?.started_date || null,
    remainingBenefits: { interiorDetails },
    vehicleCount: goldSubs.length,
  };
}

async function actSpecialistFollowup(base44, data) {
  const { phone, reason, notes } = data;
  if (!phone) return { error: 'phone is required.' };
  if (!reason) return { error: 'reason is required.' };
  const cleanPhone = toE164(phone);
  const user = await findUser(base44, phone);
  const name = user?.full_name || 'Customer';

  // Log the escalation — team notification (email/dashboard) wired in a later phase.
  await base44.asServiceRole.entities.AILog.create({
    action: 'specialist_followup', customer_phone: cleanPhone, customer_name: name,
    outcome: 'other', raw_request: JSON.stringify({ phone: cleanPhone, reason, notes }),
    raw_response: JSON.stringify({ success: true }),
  });

  return { success: true, speech: `I've flagged this for our specialist team. They'll reach out to you at ${cleanPhone} shortly.` };
}

async function actCreateLead(base44, data) {
  const { customerName, phone, service, quoteSummary } = data;
  if (!phone) return { error: 'phone is required.' };
  const cleanPhone = toE164(phone);

  await base44.asServiceRole.entities.AILog.create({
    action: 'create_lead', customer_phone: cleanPhone, customer_name: customerName || '',
    outcome: 'other', raw_request: JSON.stringify({ customerName, phone: cleanPhone, service, quoteSummary }),
    raw_response: JSON.stringify({ success: true }),
  });

  return { success: true, speech: "Got it — I've recorded your details. Is there anything else I can help with?" };
}

async function actEndConversation(base44, data) {
  const { conversationId, summary, duration } = data;
  if (!summary && !conversationId) return { error: 'summary or conversationId is required.' };
  await base44.asServiceRole.entities.AILog.create({
    call_id: conversationId || '', action: 'end_conversation',
    transcript: summary || '', duration_seconds: typeof duration === 'number' ? duration : 0,
    outcome: 'other', raw_request: JSON.stringify(data), raw_response: JSON.stringify({ success: true }),
  });
  return { success: true };
}

function actGetServices(config) {
  const catalog = [];
  for (const [tier, services] of Object.entries(config.pricing)) {
    for (const [key, info] of Object.entries(services)) {
      catalog.push({
        key, label: info.label, vehicleType: tier,
        price: info.price, durationMinutes: info.duration,
        requiresConsultation: info.requiresConsultation,
      });
    }
  }
  return { success: true, services: catalog };
}

// ── Main Handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // ── Auth: external Retell (Bearer RETELL_API_KEY) or internal Base44 function call (_internal_token) ──
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    const auth = req.headers.get('Authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    const externalOk = !!(RETELL_API_KEY && provided && provided === RETELL_API_KEY);
    const internalOk = !!(SCHEDULER_TOKEN && body._internal_token && body._internal_token === SCHEDULER_TOKEN);
    if (!externalOk && !internalOk) {
      return Response.json({ error: 'Unauthorized — invalid or missing API key.' }, { status: 401 });
    }
    if (body._internal_token) delete body._internal_token;
    // Accept both payload formats:
    //   - Manual/internal: { action, data, conversation_id }
    //   - Retell native:    { name, args, call: {...} / conversation: {...} }
    const action = body.action || body.name;
    const data = body.data || body.args || {};
    const conversation_id = body.conversation_id || body.conversationId || body.call_id || (body.call && body.call.call_id) || '';

    // Auto-inject the caller's phone from metadata (voice or SMS) so Valerie never has to ask.
    const callerPhone = (body.call && (body.call.from_number || body.call.to_number)) || (body.conversation && body.conversation.customer_phone) || (body.message && body.message.from) || '';
    if (callerPhone && !data.phone && !data.customer_phone) data.phone = callerPhone;

    if (!action) return Response.json({ error: 'action is required.' }, { status: 400 });

    const config = await loadConfig(base44);
    if (!config) return Response.json({ error: 'Business configuration not found. Seed the BusinessConfig entity first.' }, { status: 500 });

    let result = {};
    let outcome = 'other';

    switch (action) {
      case 'check_existing_customer':
      case 'lookup_customer':
        result = await actLookupCustomer(base44, data);
        outcome = 'info_provided';
        break;
      case 'create_quote':
        result = await actCreateQuote(base44, data, config);
        outcome = result.success ? 'quote_created' : 'error';
        break;
      case 'send_quote':
        result = await actSendQuote(base44, data, config);
        outcome = result.success ? 'info_provided' : 'error';
        break;
      case 'check_gold_status':
        result = await actCheckGoldStatus(base44, data);
        outcome = 'info_provided';
        break;
      case 'specialist_followup':
        result = await actSpecialistFollowup(base44, data);
        outcome = 'other';
        break;
      case 'create_lead':
        result = await actCreateLead(base44, data);
        outcome = 'customer_updated';
        break;
      case 'end_call':
      case 'end_conversation':
        result = await actEndConversation(base44, data);
        outcome = 'other';
        break;
      case 'get_services':
        result = actGetServices(config);
        outcome = 'info_provided';
        break;
      case 'check_availability': {
        const r = await base44.functions.invoke('scheduler', { action: 'check_availability', date: data.date, service: data.service, vehicle_type: data.vehicleType });
        result = r?.data ?? r;
        outcome = 'info_provided';
        break;
      }
      case 'book_appointment': {
        const r = await base44.functions.invoke('scheduler', {
          action: 'book', date: data.date, startUtc: data.startUtc, service: data.service,
          vehicle_type: data.vehicleType, customer_name: data.customerName || data.customer_name,
          customer_phone: data.phone || data.customer_phone, customer_email: data.customerEmail || data.customer_email,
          vehicle_info: [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(' '),
          service_address: data.serviceAddress, notes: data.notes,
        });
        result = r?.data ?? r;
        outcome = result && result.success ? 'appointment_booked' : 'error';
        break;
      }
      case 'reschedule_appointment': {
        const r = await base44.functions.invoke('scheduler', {
          action: 'reschedule', appointment_id: data.appointmentId || data.appointment_id,
          new_startUtc: data.newStartUtc || data.startUtc, new_date: data.newDate || data.date,
          customer_phone: data.phone || data.customer_phone,
        });
        result = r?.data ?? r;
        outcome = result && result.success ? 'appointment_booked' : 'error';
        break;
      }
      case 'cancel_appointment': {
        const r = await base44.functions.invoke('scheduler', {
          action: 'cancel', appointment_id: data.appointmentId || data.appointment_id,
          customer_phone: data.phone || data.customer_phone,
        });
        result = r?.data ?? r;
        outcome = 'other';
        break;
      }
      case 'book_service':
        result = { success: true, booking_url: config.bookingUrl, speech: `You can book online at ${config.bookingUrl}. Would you like me to send you the link?` };
        outcome = 'appointment_booked';
        break;
      case 'test_tool':
        // Retell's connectivity probe — always ack so the "Test" button passes.
        result = { success: true, message: 'retellExecute reachable.' };
        outcome = 'other';
        break;
      default:
        result = { error: `Unknown action: ${action}` };
        outcome = 'error';
    }

    // ── Log every interaction ──
    const elapsed = Date.now() - t0;
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: conversation_id, action,
        customer_phone: normalizePhone(data.phone || data.customer_phone || ''),
        customer_name: data.customerName || data.customer_name || '',
        vehicle_info: [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(' '),
        outcome, quote_id: result?.quoteId || result?.quote_id || '',
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