// Valerie Tools — ERA Core Phase 3 (v3 — classification-aware pricing + accurate catalog)
// POST /functions/valerieTools
// Internal tool executor for Valerie's OpenAI function-calling loop. All pricing,
// services, scheduling, and CRM logic lives here — Valerie (the LLM) contains none.
// Reads from BusinessConfig + Customer/Job/Quote/Appointment entities (ERA Core schema).
// Quote delivery routes through sendMessage → Communication Rules Engine.
// Protected by SCHEDULER_TOKEN — called only by the valerie function.
//
// PRICING: Tier resolution matches the pricingEngine exactly — classification key
// first, then pricing group, then first available. This ensures Valerie's quotes
// always match the website's custom pricing engine UI.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

function normalizePhone(p) { return p ? p.replace(/[^\d+]/g, '') : ''; }
function toE164(phone) {
  if (!phone) return '';
  let d = phone.replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length >= 10 ? '+' + d : '';
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
  if (s.includes('correction')) return 'paint_correction';
  if (s.includes('coating')) return 'ceramic_coating';
  if (s.includes('gold')) return 'vds_gold';
  return 'full_detail';
}

async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  const cfg = configs && configs[0];
  if (!cfg) return null;
  const bookingUrl = (cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book';
  return { cfg, services: cfg.services || [], classMap: cfg.classification_to_pricing_group || {}, bookingUrl };
}

// Resolve a service tier: classification key first, then pricing group, then first available.
// Matches the pricingEngine logic exactly so Valerie's quotes always match the website.
function resolveTier(svc, classification, pricingGroup) {
  return (svc.tiers || []).find(t => t.tier === classification)
    || (svc.tiers || []).find(t => t.tier === pricingGroup)
    || (svc.tiers || [])[0];
}

// Map a pricing group back to a default classification (for tier lookup when the
// LLM only provides vehicleType=sedan_coupe|truck_suv, not a specific classification).
function defaultClassification(pricingGroup) {
  return pricingGroup === 'truck_suv' ? 'truck_3_row_suv' : 'sedan';
}

// Find a Customer by phone (E.164 exact, then last-10-digit match) or by email.
async function findCustomer(base44, phone, email) {
  if (phone) {
    const e164 = toE164(phone);
    let customers = await base44.asServiceRole.entities.Customer.filter({ phone: e164 }).catch(() => []);
    if (!customers.length) {
      const d = phone.replace(/\D/g, '');
      if (d.length >= 10) {
        const all = await base44.asServiceRole.entities.Customer.list().catch(() => []);
        customers = (all || []).filter(c => (c.phone || '').replace(/\D/g, '').slice(-10) === d.slice(-10));
      }
    }
    if (customers.length) return customers[0];
  }
  if (email) {
    const e = email.toLowerCase();
    const all = await base44.asServiceRole.entities.Customer.list().catch(() => []);
    const found = (all || []).find(c => c.email && c.email.toLowerCase() === e);
    if (found) return found;
  }
  return null;
}

// Find vehicles for a Customer — tries customer_id (new schema), falls back to linked_user_id (old records).
async function findCustomerVehicles(base44, customer) {
  if (!customer) return [];
  let vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ customer_id: customer.id }).catch(() => []);
  if (!vehicles.length && customer.linked_user_id) {
    vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: customer.linked_user_id }).catch(() => []);
  }
  return vehicles || [];
}

function customerFullName(c) { return c ? [c.first_name, c.last_name].filter(Boolean).join(' ') || 'there' : 'there'; }

// ── Action Handlers ────────────────────────────────────────────────────
async function actLookupCustomer(base44, data) {
  const { phone, email } = data;
  if (!phone && !email) return { error: 'phone or email is required.' };
  const customer = await findCustomer(base44, phone, email);
  if (!customer) return { success: true, customer: null, found: false };

  const [vehicles, subs, appts] = await Promise.all([
    findCustomerVehicles(base44, customer),
    base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' }).catch(() => []),
    base44.asServiceRole.entities.Appointment.filter({ customer_phone: customer.phone }).catch(() => []),
  ]);
  const vIds = vehicles.map(v => v.id);
  const goldSubs = (subs || []).filter(s => vIds.includes(s.vehicle_id));
  const recent = (appts || []).filter(a => a.status === 'completed').sort((a, b) => new Date(b.preferred_date || 0) - new Date(a.preferred_date || 0));

  return {
    success: true, found: true,
    customer: {
      customerId: customer.id, name: customerFullName(customer), goldMember: goldSubs.length > 0,
      phone: customer.phone, email: customer.email,
      vehicles: vehicles.map(v => ({ year: v.year, make: v.make, model: v.model, vehicleType: v.vehicle_type || v.pricing_group, isGoldRegistered: v.is_gold_registered })),
      lastService: recent[0]?.service_label || null,
      lastVisit: recent[0]?.preferred_date || null,
      totalVisits: customer.total_jobs || recent.length,
      lifetimeSpend: customer.lifetime_revenue ?? null,
      notes: customer.notes || null,
      preferredContactMethod: customer.preferred_contact_method || 'sms',
    },
  };
}

async function actCreateQuote(base44, data, config) {
  const { phone, service, vehicleType, vehicleClassification, vehicleYear, vehicleMake, vehicleModel, vehicleCount = 1 } = data;
  if (!phone) return { error: 'phone is required.' };
  if (!service) return { error: 'service is required.' };

  const pricingGroup = vehicleTier(vehicleType);
  // Use the specific classification if provided (per-classification pricing like Full Detail);
  // otherwise fall back to a default classification for the pricing group.
  const classification = vehicleClassification || defaultClassification(pricingGroup);
  const svcKey = serviceKey(service);
  const svc = config.services.find(s => s.key === svcKey);
  if (!svc) return { error: `Service '${service}' is not in the catalog.` };

  const tier = resolveTier(svc, classification, pricingGroup);
  if (!tier || tier.price == null) return { error: `No pricing found for ${svc.label} on this vehicle type.` };

  const count = Math.max(1, Number(vehicleCount) || 1);
  const startingPrice = tier.price != null ? tier.price * count : null;
  const vehicleDesc = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ') || (pricingGroup === 'truck_suv' ? 'SUV/Truck' : 'Sedan/Coupe');
  const quoteSummary = `${svc.label} — ${pricingGroup === 'truck_suv' ? 'SUV/Truck' : 'Sedan/Coupe'}`;

  const customer = await findCustomer(base44, phone);
  const customerName = customer ? customerFullName(customer) : 'Unknown';
  const customerEmail = customer?.email || '';
  const smsConsent = customer?.sms_consent ?? true;
  const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const quote = await base44.asServiceRole.entities.Quote.create({
    customer_name: customerName, customer_phone: toE164(phone), customer_email: customerEmail,
    vehicle_year: String(vehicleYear || ''), vehicle_make: vehicleMake || '', vehicle_model: vehicleModel || '',
    vehicle_type: pricingGroup, requested_services: [svcKey],
    starting_price: startingPrice ?? 0, final_price: startingPrice ?? 0,
    quote_summary: quoteSummary, booking_url: config.bookingUrl,
    expiration_date: expiration, status: 'pending', sms_consent: smsConsent,
  });

  const speech = svc.requires_consultation
    ? `For a ${svc.label} on your ${vehicleDesc}, pricing starts at $${startingPrice}, though the final quote and scheduling need a quick specialist consultation. Would you like me to text you this quote with a booking link?`
    : `For a ${svc.label} on your ${vehicleDesc}, pricing starts at $${startingPrice}. Would you like me to text you this quote with a link to book?`;

  return { success: true, quoteId: quote.id, startingPrice, quoteSummary, bookingUrl: config.bookingUrl, speech };
}

async function actSendQuote(base44, data, config) {
  let { quoteId } = data;
  const lookupPhone = toE164(data.phone || data.customer_phone);

  if (!quoteId) {
    if (!lookupPhone) return { error: "I need the customer's phone number to find the quote. Ask them for it, then call send_quote again." };
    const quotes = await base44.asServiceRole.entities.Quote.filter({ customer_phone: lookupPhone });
    const recent = (quotes || []).filter(q => !q.sms_sent && q.status !== 'expired').sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    quoteId = recent?.id;
    if (!quoteId) return { error: 'No pending quote found for that number. Create a quote first using create_quote.' };
  }

  const quote = await base44.asServiceRole.entities.Quote.get(quoteId);
  if (!quote) return { error: 'Quote not found.' };

  const firstName = (quote.customer_name || 'there').split(' ')[0];
  const serviceLabel = quote.quote_summary || 'Detail Service';
  const vehicleDesc = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'Vehicle';
  const priceText = quote.final_price != null ? `$${quote.final_price}` : (quote.starting_price != null ? `$${quote.starting_price}` : '—');
  const smsText = `Hi ${firstName}! Here's your VDS quote:\n\n• Service: ${serviceLabel}\n• Vehicle: ${vehicleDesc}\n• Starting Price: ${priceText}\n\nBook online:\n${config.bookingUrl}\n\nReply if you have questions!\n-Valerie`;

  // Deliver the quote through the Rules Engine + sendMessage (consent-aware).
  try {
    await base44.asServiceRole.functions.invoke('sendMessage', {
      customer_phone: lookupPhone || quote.customer_phone,
      message_type: 'quote_delivery', content: smsText,
      customer_name: quote.customer_name, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
  } catch (e) { console.error('sendQuote delivery error:', e.message); }

  await base44.asServiceRole.entities.Quote.update(quoteId, { status: 'sent', sms_sent: true });
  return { success: true, sms_text: smsText, speech: "I've sent your quote to your phone — check your texts! Anything else I can help with?" };
}

async function actCheckGoldStatus(base44, data) {
  const { phone, email } = data;
  if (!phone && !email) return { error: 'phone or email is required.' };
  const customer = await findCustomer(base44, phone, email);
  if (!customer) return { success: true, active: false };

  const [vehicles, subs, records] = await Promise.all([
    findCustomerVehicles(base44, customer),
    base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' }).catch(() => []),
    base44.asServiceRole.entities.ServiceRecord.list().catch(() => []),
  ]);
  const vIds = vehicles.map(v => v.id);
  const goldSubs = (subs || []).filter(s => vIds.includes(s.vehicle_id));
  if (!goldSubs.length) return { success: true, active: false };

  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const myRecords = (records || []).filter(r => vIds.includes(r.vehicle_id) && r.month_year === monthYear);
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
  const customer = await findCustomer(base44, phone);
  const name = customer ? customerFullName(customer) : 'Customer';

  await base44.asServiceRole.entities.AILog.create({
    action: 'specialist_followup', customer_phone: cleanPhone, customer_name: name,
    outcome: 'other', raw_request: JSON.stringify({ phone: cleanPhone, reason, notes }),
    raw_response: JSON.stringify({ success: true }),
  });

  return { success: true, speech: `I've flagged this for our specialist team. They'll reach out to you at ${cleanPhone} shortly.` };
}

function actGetServices(config) {
  const catalog = config.services
    .filter(s => s.category !== 'membership')
    .map(svc => ({
      key: svc.key,
      label: svc.label,
      category: svc.category,
      requiresConsultation: svc.requires_consultation || false,
      tiers: (svc.tiers || []).map(t => ({ tier: t.tier, price: t.price, durationMinutes: t.duration_minutes })),
    }));
  return { success: true, services: catalog, classificationToPricingGroup: config.classMap };
}

// ── Main Handler ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    if (!SCHEDULER_TOKEN || body.scheduler_token !== SCHEDULER_TOKEN) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    delete body.scheduler_token;

    const action = body.action;
    const data = body.data || {};
    if (!action) return Response.json({ error: 'action is required.' }, { status: 400 });

    const config = await loadConfig(base44);
    if (!config) return Response.json({ error: 'Business configuration not found.' }, { status: 500 });

    let result = {};
    let outcome = 'other';

    switch (action) {
      case 'lookup_customer':
        result = await actLookupCustomer(base44, data); outcome = 'info_provided'; break;
      case 'get_services':
        result = actGetServices(config); outcome = 'info_provided'; break;
      case 'create_quote':
        result = await actCreateQuote(base44, data, config); outcome = result.success ? 'quote_created' : 'error'; break;
      case 'send_quote':
        result = await actSendQuote(base44, data, config); outcome = result.success ? 'info_provided' : 'error'; break;
      case 'check_gold_status':
        result = await actCheckGoldStatus(base44, data); outcome = 'info_provided'; break;
      case 'specialist_followup':
        result = await actSpecialistFollowup(base44, data); outcome = 'other'; break;
      case 'check_availability': {
        const r = await base44.asServiceRole.functions.invoke('scheduler', { action: 'check_availability', date: data.date, service: data.service, vehicle_type: data.vehicleType });
        result = r?.data ?? r; outcome = 'info_provided'; break;
      }
      case 'book_appointment': {
        const r = await base44.asServiceRole.functions.invoke('scheduler', {
          action: 'book', date: data.date, startUtc: data.startUtc, service: data.service,
          vehicle_type: data.vehicleType, customer_name: data.customerName, customer_phone: data.phone,
          customer_email: data.email, vehicle_info: [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(' '),
          service_address: data.serviceAddress, notes: data.notes,
        });
        result = r?.data ?? r; outcome = result && result.success ? 'appointment_booked' : 'error'; break;
      }
      case 'reschedule_appointment':
      case 'cancel_appointment': {
        // Verify the requested appointment actually belongs to the customer whose phone
        // initiated this SMS conversation (data.phone). Without this check, the trusted
        // SCHEDULER_TOKEN would let an anonymous SMS caller cancel/reschedule any
        // customer's appointment by guessing the ID (IDOR / CWE-639).
        if (!data.appointmentId) {
          result = { error: 'No appointment specified.' }; outcome = 'error'; break;
        }
        if (!data.phone) {
          result = { error: 'Caller phone is required to modify an appointment.' }; outcome = 'error'; break;
        }
        let appt = null;
        try {
          appt = await base44.asServiceRole.entities.Appointment.get(data.appointmentId).catch(() => null);
        } catch (e) { /* not found below */ }
        if (!appt) {
          result = { error: 'Appointment not found.' }; outcome = 'error'; break;
        }
        const callerDigits = normalizePhone(data.phone).replace(/\D/g, '').slice(-10);
        const ownerDigits = (appt.customer_phone || '').replace(/\D/g, '').slice(-10);
        if (!callerDigits || callerDigits !== ownerDigits) {
          result = { error: 'You can only modify appointments booked from your own phone number.' }; outcome = 'error'; break;
        }
        if (action === 'cancel_appointment') {
          const r = await base44.asServiceRole.functions.invoke('scheduler', {
            action: 'cancel', appointment_id: data.appointmentId,
            scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
          });
          result = r?.data ?? r; outcome = 'other';
        } else {
          const r = await base44.asServiceRole.functions.invoke('scheduler', {
            action: 'reschedule', appointment_id: data.appointmentId, new_startUtc: data.newStartUtc, new_date: data.newDate,
            scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
          });
          result = r?.data ?? r; outcome = result && result.success ? 'appointment_booked' : 'error';
        }
        break;
      }
      default:
        result = { error: `Unknown action: ${action}` }; outcome = 'error';
    }

    // Log every tool execution for auditability.
    try {
      await base44.asServiceRole.entities.AILog.create({
        action, customer_phone: normalizePhone(data.phone || ''), customer_name: data.customerName || '',
        vehicle_info: [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(' '),
        outcome, quote_id: result?.quoteId || '', duration_seconds: Date.now() - t0,
        raw_request: JSON.stringify({ action, data }), raw_response: JSON.stringify(result),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json(result);
  } catch (error) {
    console.error('valerieTools error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});