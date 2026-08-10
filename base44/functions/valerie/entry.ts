// Valerie — ERA Core SMS Concierge (Phase 3)
// POST /functions/valerie
// Twilio inbound SMS webhook + OpenAI LLM. SMS-only (no voice/caller ID).
// - Conversation history stored in Base44 (ConversationHistory entity).
// - Tool execution via internal valerieTools function (OpenAI function-calling).
// - Outbound replies routed through sendMessage → Communication Rules Engine.
// - Customer lookups use the Customer entity (ERA Core CRM), not the built-in User.
//
// Auth: SCHEDULER_TOKEN (body or query param — used for internal calls AND the Twilio
// webhook URL, which will include ?scheduler_token=xxx when wired), or an authenticated
// base44 user (for in-app testing).
//
// Until A2P 10DLC is approved (twilio_sms_enabled = false), replies are stored in
// conversation history but not delivered via SMS. The Twilio inbound webhook is wired
// when the verified number is provisioned — that is the final step of Phase 3.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

// ── Twilio webhook signature validation ────────────────────────────────
// Twilio signs every inbound webhook with HMAC-SHA256 using TWILIO_AUTH_TOKEN.
// We validate that signature so the webhook URL needs no shared secret in the
// query string — just https://<domain>/functions/valerie. This is the standard
// Twilio security model and avoids exposing SCHEDULER_TOKEN in Twilio's console.
async function validateTwilioSignature(req, body) {
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!authToken) return false;
  const sig = req.headers.get('X-Twilio-Signature') || req.headers.get('x-twilio-signature');
  if (!sig) return false;
  const u = new URL(req.url);
  const fwdProto = req.headers.get('x-forwarded-proto');
  const fwdHost = req.headers.get('x-forwarded-host');
  // The signature is computed against the exact URL Twilio called. Behind a proxy
  // the internal req.url may differ, so try several candidates (external forwarded
  // URL, req.url as-is, forced https) and accept any that matches.
  const candidates = new Set([req.url, `${u.protocol.replace(':', '')}://${u.host}${u.pathname}${u.search}`]);
  if (fwdHost) {
    candidates.add(`https://${fwdHost}${u.pathname}${u.search}`);
    if (fwdProto) candidates.add(`${fwdProto}://${fwdHost}${u.pathname}${u.search}`);
  }
  // Sorted form params concatenated as key+value pairs (Twilio's spec).
  const params = Object.keys(body).sort().map(k => `${k}${body[k] == null ? '' : body[k]}`).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  for (const fullUrl of candidates) {
    const data = new TextEncoder().encode(fullUrl + params);
    const sigBuf = await crypto.subtle.sign('HMAC', key, data);
    const computed = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    if (computed === sig) return true;
  }
  return false;
}

// ── Config / prompt builders ───────────────────────────────────────────
async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  return configs && configs[0] ? configs[0] : null;
}

function formatCatalog(cfg) {
  const byType = {};
  for (const svc of (cfg.services || [])) {
    for (const t of (svc.tiers || [])) {
      const key = t.tier === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe';
      if (!byType[key]) byType[key] = [];
      const price = t.price != null ? '$' + t.price : 'Consultation';
      byType[key].push(svc.label + ' ' + price + (svc.requires_consultation ? ' (consultation)' : '') + ' (' + t.duration_minutes + 'min)');
    }
  }
  return Object.entries(byType).map(([k, v]) => k + ':\n' + v.map(x => '  - ' + x).join('\n')).join('\n');
}

function formatHours(cfg) {
  return (cfg.business_hours || []).map(h => h.day.toUpperCase() + ' ' + (h.closed ? 'Closed' : h.open + '-' + h.close)).join(' | ');
}

function formatGold(cfg) {
  return (cfg.membership_plans || []).map(p => {
    const prices = (p.pricing_by_group || []).map(g => (g.pricing_group === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe') + ': $' + g.price_monthly + '/mo').join(', ');
    return p.label + ' (' + prices + ') — ' + ((p.benefits || []).join(', '));
  }).join('\n');
}

function buildSystemPrompt(cfg, customerCtx) {
  return [
    'You are Valerie, the SMS concierge for ' + cfg.business_name + '.' + (cfg.tagline ? ' ' + cfg.tagline : ''),
    'You assist customers with detailing quotes, booking appointments, VDS Gold membership questions, and general inquiries.',
    '',
    'PERSONA & FORMAT: Warm, professional, concise. This is SMS. Reply in plain text only — no markdown, no bullet lists, no headers. Keep messages short and natural (usually 1-3 sentences). Use a single emoji sparingly only if it feels natural. Never invent information.',
    '',
    'BUSINESS INFO:',
    '- Phone: ' + (cfg.business_phone || 'n/a'),
    '- Email: ' + (cfg.business_email || 'n/a'),
    '- Service areas: ' + (cfg.service_areas || []).join(', '),
    '- Hours: ' + formatHours(cfg),
    '- Timezone: ' + (cfg.timezone || 'America/New_York'),
    '',
    'SERVICES & STARTING PRICES (always say "starting at"):',
    formatCatalog(cfg),
    '',
    'VEHICLE TYPES: Sedan/Coupe or Truck/SUV. Pricing differs by type — confirm the customer vehicle type (and year/make/model) before quoting.',
    '',
    'SCHEDULING RULES:',
    '- Booking buffer: ' + (cfg.scheduling_rules && cfg.scheduling_rules.booking_buffer_hours != null ? cfg.scheduling_rules.booking_buffer_hours : 24) + 'h',
    '- Minimum notice: ' + (cfg.scheduling_rules && cfg.scheduling_rules.min_notice_hours != null ? cfg.scheduling_rules.min_notice_hours : 24) + 'h',
    '- Slot interval: ' + (cfg.scheduling_rules && cfg.scheduling_rules.slot_interval_minutes != null ? cfg.scheduling_rules.slot_interval_minutes : 60) + ' min',
    '- Max bookings/day: ' + (cfg.scheduling_rules && cfg.scheduling_rules.max_bookings_per_day != null ? cfg.scheduling_rules.max_bookings_per_day : 4),
    '- To book: prefer directing the customer to the booking page (see BOOKING) for the fastest experience. If they prefer to book over SMS, call check_availability for a date, present the open slots naturally, then call book_appointment once they pick one.',
    '',
    'VDS GOLD MEMBERSHIP:',
    formatGold(cfg),
    '',
    'BOOKING:',
    '- For the fastest, most accurate quote and instant booking, point customers to ' + ((cfg.website_links && cfg.website_links.booking_url) || 'https://vdsmobile.com/book') + ' — that page captures full vehicle details (year/make/model, condition, add-ons).',
    '- If a customer wants to book, direct them to that booking page rather than completing the entire booking over SMS. You may still check availability and walk them through a conversational quote using get_services / create_quote.',
    '',
    'TOOL RULES (CRITICAL):',
    '- NEVER state prices from memory. Always use create_quote or get_services to pull live pricing.',
    '- NEVER invent time slots. Always use check_availability, then book_appointment.',
    '- To recognize returning customers, use lookup_customer. The phone is already known to the system — never ask the customer for it.',
    '- Quote flow: confirm vehicle type + year/make/model -> create_quote -> offer to text it -> send_quote.',
    '- For custom/complex requests (specialty coatings, heavy correction), use specialist_followup.',
    '- Execute all required tools FIRST, then write your final plain-text reply to the customer.',
    '',
    customerCtx
      ? 'CUSTOMER CONTEXT: Name: ' + customerCtx.name + '; Gold member: ' + (customerCtx.gold ? 'yes' : 'no') + '; Vehicles: ' + (customerCtx.vehicles.length ? customerCtx.vehicles.join(', ') : 'none on file') + '.'
      : 'CUSTOMER CONTEXT: New customer (no record yet).'
  ].join('\n');
}

// ── Tool definitions (OpenAI function-calling) ─────────────────────────
const TOOLS = [
  { type: 'function', function: { name: 'lookup_customer', description: 'Look up an existing customer by phone. Returns name, vehicles, VDS Gold status, and visit history.', parameters: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] } } },
  { type: 'function', function: { name: 'get_services', description: 'Get the full service catalog with current pricing and durations.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'create_quote', description: 'Create a price quote for a service on the customer vehicle. Returns the starting price and quote ID.', parameters: { type: 'object', properties: { phone: { type: 'string' }, service: { type: 'string' }, vehicleType: { type: 'string', enum: ['sedan_coupe', 'truck_suv'] }, vehicleYear: { type: 'string' }, vehicleMake: { type: 'string' }, vehicleModel: { type: 'string' }, vehicleCount: { type: 'number' } }, required: ['service'] } } },
  { type: 'function', function: { name: 'send_quote', description: 'Text the most recent pending quote to the customer. Returns the SMS text to deliver.', parameters: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] } } },
  { type: 'function', function: { name: 'check_gold_status', description: "Check the customer's VDS Gold membership status and remaining monthly benefits.", parameters: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] } } },
  { type: 'function', function: { name: 'check_availability', description: 'Get available appointment time slots for a given date and service.', parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD' }, service: { type: 'string' }, vehicleType: { type: 'string', enum: ['sedan_coupe', 'truck_suv'] } }, required: ['date'] } } },
  { type: 'function', function: { name: 'book_appointment', description: 'Book an appointment at a chosen time slot. Use the startUtc returned by check_availability.', parameters: { type: 'object', properties: { date: { type: 'string' }, startUtc: { type: 'string' }, service: { type: 'string' }, vehicleType: { type: 'string', enum: ['sedan_coupe', 'truck_suv'] }, customerName: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, vehicleYear: { type: 'string' }, vehicleMake: { type: 'string' }, vehicleModel: { type: 'string' }, serviceAddress: { type: 'string' }, notes: { type: 'string' } }, required: ['date', 'startUtc', 'service'] } } },
  { type: 'function', function: { name: 'reschedule_appointment', description: 'Reschedule an existing appointment to a new time.', parameters: { type: 'object', properties: { appointmentId: { type: 'string' }, newStartUtc: { type: 'string' }, newDate: { type: 'string' }, phone: { type: 'string' } }, required: ['appointmentId', 'newStartUtc'] } } },
  { type: 'function', function: { name: 'cancel_appointment', description: 'Cancel an existing appointment.', parameters: { type: 'object', properties: { appointmentId: { type: 'string' }, phone: { type: 'string' } }, required: ['appointmentId'] } } },
  { type: 'function', function: { name: 'specialist_followup', description: 'Flag a request for specialist follow-up (custom work, complex corrections).', parameters: { type: 'object', properties: { phone: { type: 'string' }, reason: { type: 'string' }, notes: { type: 'string' } }, required: ['reason'] } } },
];

// ── OpenAI call ────────────────────────────────────────────────────────
async function callOpenAI(messages) {
  const KEY = Deno.env.get('OpenAI_Valerie');
  if (!KEY) throw new Error('OpenAI_Valerie secret is not set.');
  // GPT-5.5 is a reasoning model and only supports the default temperature (1);
  // sending a custom temperature is rejected by the API, so we omit it.
  const payload = { model: 'gpt-5.5', messages, tools: TOOLS, tool_choice: 'auto' };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('OpenAI error (' + res.status + '): ' + t);
  }
  const data = await res.json();
  return data.choices && data.choices[0] ? data.choices[0].message : null;
}

// ── Tool execution (internally via valerieTools) ───────────────────────
async function executeTool(base44, name, args) {
  try {
    const r = await base44.asServiceRole.functions.invoke('valerieTools', {
      action: name, data: args, scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
    return r && r.data !== undefined ? r.data : r;
  } catch (e) {
    return { error: e.message };
  }
}

// ── Customer context (Customer entity) ─────────────────────────────────
async function getCustomerContext(base44, phone) {
  if (!phone) return null;
  try {
    const d = phone.replace(/\D/g, '');
    if (d.length < 10) return null;
    const e164 = d.length === 10 ? '+1' + d : '+' + d;
    let customers = await base44.asServiceRole.entities.Customer.filter({ phone: e164 }).catch(() => []);
    if (!customers.length) {
      const all = await base44.asServiceRole.entities.Customer.list().catch(() => []);
      customers = (all || []).filter(c => (c.phone || '').replace(/\D/g, '').slice(-10) === d.slice(-10));
    }
    const customer = customers[0];
    if (!customer) return null;

    let vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ customer_id: customer.id }).catch(() => []);
    if (!vehicles.length && customer.linked_user_id) {
      vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: customer.linked_user_id }).catch(() => []);
    }
    const vIds = (vehicles || []).map(v => v.id);
    const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' }).catch(() => []);
    const gold = (subs || []).some(s => vIds.includes(s.vehicle_id));
    const vList = (vehicles || []).map(v => [v.year, v.make, v.model].filter(Boolean).join(' '));
    const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'there';
    return { id: customer.id, name, gold, vehicles: vList };
  } catch {
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse body — JSON (internal/testing) or form-urlencoded (Twilio webhook)
    const contentType = req.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else {
      const form = await req.formData().catch(() => new FormData());
      body = Object.fromEntries(form.entries());
    }

    // Auth: SCHEDULER_TOKEN (body or query param), authenticated base44 user,
    // OR a valid Twilio webhook signature (inbound SMS from Twilio).
    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('scheduler_token') || url.searchParams.get('token');
    const bodyToken = body.scheduler_token || body._internal_token;
    const tokenOk = !!(SCHEDULER_TOKEN && (queryToken === SCHEDULER_TOKEN || bodyToken === SCHEDULER_TOKEN));
    let authedOk = false;
    if (!tokenOk) {
      try { authedOk = await base44.auth.isAuthenticated(); } catch {}
    }
    let twilioOk = false;
    if (!tokenOk && !authedOk) {
      twilioOk = await validateTwilioSignature(req, body);
    }
    if (!tokenOk && !authedOk && !twilioOk) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (body.scheduler_token) delete body.scheduler_token;
    if (body._internal_token) delete body._internal_token;

    // Extract phone + message — JSON or Twilio webhook format.
    const phone = (body.phone || body.From || body.customer_phone || '').trim();
    const message = (body.message || body.Body || body.text || '').trim();
    if (!phone) return Response.json({ error: 'phone is required.' }, { status: 400 });
    if (!message) return Response.json({ error: 'message is required.' }, { status: 400 });

    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 500 });

    // Normalize to E.164 for consistent conversation history keys.
    const d = phone.replace(/\D/g, '');
    const e164 = d.length === 10 ? '+1' + d : (d.length > 10 ? '+' + d : phone);

    // Load conversation history (last 20 exchanges), order chronologically.
    const history = await base44.asServiceRole.entities.ConversationHistory.filter(
      { customer_phone: e164 }, '-created_date', 20
    ).catch(() => []);
    const ordered = history.slice().reverse();

    const customerCtx = await getCustomerContext(base44, phone);
    const systemPrompt = buildSystemPrompt(cfg, customerCtx);

    const messages = [{ role: 'system', content: systemPrompt }];
    for (const m of ordered) {
      if (m.role === 'user') messages.push({ role: 'user', content: m.content });
      else if (m.role === 'assistant' && m.content) messages.push({ role: 'assistant', content: m.content });
    }
    messages.push({ role: 'user', content: message });

    // Agent loop — execute tools, then produce the final reply (max 5 tool rounds).
    let msg = await callOpenAI(messages);
    let rounds = 0;
    while (msg && msg.tool_calls && msg.tool_calls.length && rounds < 5) {
      rounds++;
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        const name = tc.function.name;
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
        // Always force the caller's verified E.164 phone — never trust an LLM-generated
        // or request-supplied `phone` argument. valerieTools validates ownership against
        // this value, so it must be the authenticated caller's real number.
        args.phone = e164;
        const result = await executeTool(base44, name, args);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      msg = await callOpenAI(messages);
    }

    const finalText = (msg && msg.content) ? String(msg.content).trim() : "I'm sorry, I had trouble with that — could you rephrase?";

    // Persist conversation history (always — even if SMS delivery is suppressed by the Rules Engine).
    try {
      await base44.asServiceRole.entities.ConversationHistory.bulkCreate([
        { customer_phone: e164, customer_name: customerCtx ? customerCtx.name : '', role: 'user', content: message },
        { customer_phone: e164, customer_name: customerCtx ? customerCtx.name : '', role: 'assistant', content: finalText },
      ]);
    } catch (e) { console.error('History save error:', e.message); }

    // Deliver the reply through the Communication Rules Engine.
    let delivery = { sent: false, channel: 'suppressed', reason: 'not_attempted' };
    try {
      const r = await base44.asServiceRole.functions.invoke('sendMessage', {
        customer_phone: e164, message_type: 'valerie_reply', content: finalText,
        customer_name: customerCtx ? customerCtx.name : '', scheduler_token: SCHEDULER_TOKEN,
      });
      delivery = r?.data || r || delivery;
    } catch (e) { console.error('sendMessage error:', e.message); }

    return Response.json({ reply: finalText, tool_rounds: rounds, delivery });
  } catch (error) {
    console.error('valerie error:', error.message);
    return Response.json(
      { error: error.message, reply: "I'm sorry, something went wrong on my end — please try again in a moment." },
      { status: 500 }
    );
  }
});