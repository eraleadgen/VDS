// Valerie — SMS Conversation Orchestrator
// POST /functions/valerie  { phone, message, customer_name? }
//
// Architecture:
//  - GPT-5.5 (customer's OpenAI key) handles all conversation.
//  - System prompt is built LIVE from BusinessConfig — nothing hardcoded, no OpenAI Prompt Manager.
//  - Conversation history is stored in Base44 (ConversationHistory entity).
//  - When tools are needed (quotes, scheduling, gold, CRM), Base44 executes them
//    internally via retellExecute BEFORE the final customer-facing reply is generated.
//  - Replies are plain text (SMS-friendly). Temperature ~0.6.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
  return (cfg.membership_plans || []).map(p =>
    p.label + ' (' + (p.tier === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe') + '): $' + p.price_monthly + '/mo — ' + ((p.benefits || []).join(', '))
  ).join('\n');
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
    '- To book: call check_availability for a date, present the open slots naturally, then call book_appointment once the customer picks one.',
    '',
    'VDS GOLD MEMBERSHIP:',
    formatGold(cfg),
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
  { type: 'function', function: {
    name: 'lookup_customer',
    description: 'Look up an existing customer by phone. Returns name, vehicles, VDS Gold status, and visit history.',
    parameters: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] }
  }},
  { type: 'function', function: {
    name: 'get_services',
    description: 'Get the full service catalog with current pricing and durations.',
    parameters: { type: 'object', properties: {} }
  }},
  { type: 'function', function: {
    name: 'create_quote',
    description: 'Create a price quote for a service on the customer vehicle. Returns the starting price and quote ID.',
    parameters: { type: 'object', properties: {
      phone: { type: 'string' },
      service: { type: 'string', description: 'service name or description (e.g. "full detail", "ceramic coating")' },
      vehicleType: { type: 'string', enum: ['sedan_coupe', 'truck_suv'] },
      vehicleYear: { type: 'string' }, vehicleMake: { type: 'string' }, vehicleModel: { type: 'string' },
      vehicleCount: { type: 'number' }
    }, required: ['service'] }
  }},
  { type: 'function', function: {
    name: 'send_quote',
    description: 'Text the most recent pending quote to the customer. Returns the SMS text to deliver.',
    parameters: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] }
  }},
  { type: 'function', function: {
    name: 'check_gold_status',
    description: "Check the customer's VDS Gold membership status and remaining monthly benefits.",
    parameters: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] }
  }},
  { type: 'function', function: {
    name: 'check_availability',
    description: 'Get available appointment time slots for a given date and service.',
    parameters: { type: 'object', properties: {
      date: { type: 'string', description: 'YYYY-MM-DD' },
      service: { type: 'string' },
      vehicleType: { type: 'string', enum: ['sedan_coupe', 'truck_suv'] }
    }, required: ['date'] }
  }},
  { type: 'function', function: {
    name: 'book_appointment',
    description: 'Book an appointment at a chosen time slot. Use the startUtc returned by check_availability.',
    parameters: { type: 'object', properties: {
      date: { type: 'string' }, startUtc: { type: 'string' }, service: { type: 'string' },
      vehicleType: { type: 'string', enum: ['sedan_coupe', 'truck_suv'] },
      customerName: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' },
      vehicleYear: { type: 'string' }, vehicleMake: { type: 'string' }, vehicleModel: { type: 'string' },
      serviceAddress: { type: 'string' }, notes: { type: 'string' }
    }, required: ['date', 'startUtc', 'service'] }
  }},
  { type: 'function', function: {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing appointment to a new time.',
    parameters: { type: 'object', properties: {
      appointmentId: { type: 'string' }, newStartUtc: { type: 'string' }, newDate: { type: 'string' }, phone: { type: 'string' }
    }, required: ['appointmentId', 'newStartUtc'] }
  }},
  { type: 'function', function: {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment.',
    parameters: { type: 'object', properties: { appointmentId: { type: 'string' }, phone: { type: 'string' } }, required: ['appointmentId'] }
  }},
  { type: 'function', function: {
    name: 'specialist_followup',
    description: 'Flag a request for specialist follow-up (custom work, complex corrections).',
    parameters: { type: 'object', properties: { phone: { type: 'string' }, reason: { type: 'string' }, notes: { type: 'string' } }, required: ['reason'] }
  }},
];

// ── OpenAI call ────────────────────────────────────────────────────────
async function callOpenAI(messages) {
  const KEY = Deno.env.get('OpenAI_Valerie');
  if (!KEY) throw new Error('OpenAI_Valerie secret is not set.');
  // GPT-5.5 is a reasoning model and only supports the default temperature (1);
  // sending 0.6 is rejected by the API. We omit temperature so it uses the supported default.
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

// ── Tool execution (internally via retellExecute) ───────────────────────
async function executeTool(base44, name, args) {
  const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
  try {
    const r = await base44.asServiceRole.functions.invoke('retellExecute', {
      action: name, data: args, _internal_token: SCHEDULER_TOKEN,
    });
    return r && r.data !== undefined ? r.data : r;
  } catch (e) {
    return { error: e.message };
  }
}

// ── Customer context (lightweight, injected into the system prompt) ───
async function getCustomerContext(base44, phone) {
  if (!phone) return null;
  try {
    const all = await base44.asServiceRole.entities.User.list();
    const d = phone.replace(/\D/g, '');
    const u = all.find(x => x.phone && x.phone.replace(/\D/g, '') === d);
    if (!u) return null;
    const vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: u.id }).catch(() => []);
    const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' }).catch(() => []);
    const vIds = vehicles.map(v => v.id);
    const gold = subs.some(s => vIds.includes(s.vehicle_id));
    const vList = vehicles.map(v => [v.year, v.make, v.model].filter(Boolean).join(' '));
    return { name: u.full_name || 'there', gold, vehicles: vList };
  } catch {
    return null;
  }
}

// ── Main ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth: external Retell (Bearer RETELL_API_KEY), internal function call (_internal_token), or authenticated base44 user.
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    const provided = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const externalOk = !!(RETELL_API_KEY && provided && provided === RETELL_API_KEY);
    const internalOk = !!(SCHEDULER_TOKEN && body._internal_token && body._internal_token === SCHEDULER_TOKEN);
    let authedOk = false;
    if (!externalOk && !internalOk) {
      try { authedOk = await base44.auth.isAuthenticated(); } catch {}
    }
    if (!externalOk && !internalOk && !authedOk) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (body._internal_token) delete body._internal_token;

    const phone = (body.phone || body.customer_phone || '').trim();
    const message = (body.message || body.text || '').trim();
    if (!phone) return Response.json({ error: 'phone is required.' }, { status: 400 });
    if (!message) return Response.json({ error: 'message is required.' }, { status: 400 });

    const cfg = await loadConfig(base44);
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 500 });

    // Load conversation history (last 20 exchanges) and order chronologically.
    const history = await base44.asServiceRole.entities.ConversationHistory.filter(
      { customer_phone: phone }, '-created_date', 20
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
        if (!args.phone) args.phone = phone;
        const result = await executeTool(base44, name, args);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      msg = await callOpenAI(messages);
    }

    const finalText = (msg && msg.content) ? String(msg.content).trim() : "I'm sorry, I had trouble with that — could you rephrase?";

    // Persist conversation history.
    try {
      await base44.asServiceRole.entities.ConversationHistory.bulkCreate([
        { customer_phone: phone, customer_name: customerCtx ? customerCtx.name : '', role: 'user', content: message },
        { customer_phone: phone, customer_name: customerCtx ? customerCtx.name : '', role: 'assistant', content: finalText },
      ]);
    } catch (e) { console.error('History save error:', e.message); }

    return Response.json({ reply: finalText, tool_rounds: rounds });
  } catch (error) {
    console.error('valerie error:', error.message);
    return Response.json(
      { error: error.message, reply: "I'm sorry, something went wrong on my end — please try again in a moment." },
      { status: 500 }
    );
  }
});