// Valerie — ERA Core SMS Concierge (Phase 3)
// POST /functions/valerie
// Twilio inbound SMS webhook + OpenAI LLM. SMS-only (no voice/caller ID).
// - Conversation history stored in Base44 (ConversationHistory entity).
// - Tool execution via internal valerieTools function (OpenAI function-calling).
// - Outbound replies routed through sendMessage → Communication Rules Engine.
// - Customer lookups use the Customer entity (ERA Core CRM), not the built-in User.
//
// Auth: SCHEDULER_TOKEN (body or query param — for internal calls), an authenticated
// base44 user (for in-app testing), OR a valid Twilio webhook signature (inbound SMS).
// The Twilio inbound webhook URL is https://<domain>/functions/valerie with no secret
// in the query string — Twilio signs each request with TWILIO_AUTH_TOKEN and we
// validate that signature (validateTwilioSignature below).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { loadConfig, formatCatalog, formatConditions, formatHours, formatGold, formatFaq, callOpenAI } from '../../shared/conciergeHelpers.ts';
import { resolveBusinessIdFromTwilioNumber, logTenantMismatch } from '../../shared/tenantContext.ts';
import { hasFeature } from '../../shared/planFeatures.ts';

// ── Twilio webhook signature validation ────────────────────────────────
// Twilio signs every inbound webhook with HMAC-SHA256 using TWILIO_AUTH_TOKEN.
// We validate that signature so the webhook URL needs no shared secret in the
// query string — just https://<domain>/functions/valerie. This is the standard
// Twilio security model and avoids exposing SCHEDULER_TOKEN in Twilio's console.
async function validateTwilioSignature(req, body, knownUrl) {
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!authToken) return { ok: false, diag: { reason: 'no_auth_token' } };
  const sig = req.headers.get('X-Twilio-Signature') || req.headers.get('x-twilio-signature');
  if (!sig) return { ok: false, diag: { reason: 'no_sig_header' } };
  const u = new URL(req.url);
  const fwdProto = req.headers.get('x-forwarded-proto');
  const fwdHost = req.headers.get('x-forwarded-host');
  const hostHeader = req.headers.get('host');
  // The signature is computed against the exact URL Twilio called. Behind a proxy
  // the internal req.url may differ, so try several candidates (req.url as-is,
  // Host header, x-forwarded-host, forced https, and the known external URL derived
  // from BusinessConfig) and accept any that matches.
  const candidates = new Set([req.url, `${u.protocol.replace(':', '')}://${u.host}${u.pathname}${u.search}`]);
  if (hostHeader) candidates.add(`https://${hostHeader}${u.pathname}${u.search}`);
  if (fwdHost) {
    candidates.add(`https://${fwdHost}${u.pathname}${u.search}`);
    if (fwdProto) candidates.add(`${fwdProto}://${fwdHost}${u.pathname}${u.search}`);
  }
  if (knownUrl) candidates.add(knownUrl);
  // Sorted form params concatenated as key+value pairs (Twilio's spec).
  const params = Object.keys(body).sort().map(k => `${k}${body[k] == null ? '' : body[k]}`).join('');
  // Twilio uses HMAC-SHA1 (NOT SHA-256) for webhook signature validation.
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const diag = {
    reason: 'no_match',
    received_sig: sig,
    knownUrl,
    req_url: req.url,
    host: hostHeader,
    fwd_host: fwdHost,
    fwd_proto: fwdProto,
    params_preview: params.slice(0, 200),
    params_len: params.length,
    body_keys: Object.keys(body).sort().join(','),
    candidates: [...candidates],
    computed_sigs: {},
  };
  for (const fullUrl of candidates) {
    const data = new TextEncoder().encode(fullUrl + params);
    const sigBuf = await crypto.subtle.sign('HMAC', key, data);
    const computed = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
    diag.computed_sigs[fullUrl] = computed;
    if (computed === sig) return { ok: true };
  }
  return { ok: false, diag };
}

// ── Prompt builder ─────────────────────────────────────────────────────
// Config helpers (loadConfig, formatCatalog, formatConditions, formatHours,
// formatGold, callOpenAI) imported from shared/conciergeHelpers.ts.

function buildSystemPrompt(cfg, customerCtx) {
  const c = cfg.concierge || {};
  const name = c.name || 'Valerie';
  const persona = c.persona || 'Warm, professional, concise.';
  const summary = c.business_summary || ('SMS concierge for ' + cfg.business_name + '.');
  return [
    'You are ' + name + ', the SMS concierge for ' + cfg.business_name + '.' + (cfg.tagline ? ' ' + cfg.tagline : ''),
    'ROLE: ' + summary,
    '',
    'PERSONA & FORMAT: ' + persona + ' This is SMS. Reply in plain text only — no markdown, no bullet lists, no headers. Keep messages short and natural (usually 1-3 sentences). Use a single emoji sparingly only if it feels natural. Never invent information.',
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
    'VEHICLE CLASSIFICATIONS & PRICING:',
    '- Some services (like Full Detail) are priced per vehicle classification: ' + ((cfg.vehicle_classifications || []).map(v => v.label || v.key).join(', ') || 'Coupe, Sedan, Hatchback, Mid Size SUV, Truck/3-Row SUV') + '.',
    '- Others are priced by vehicle group: Sedan/Coupe or Truck/SUV.',
    '- Always confirm the customer vehicle type (and year/make/model) before quoting.',
    '- Classification → pricing group map: ' + JSON.stringify(cfg.classification_to_pricing_group || {}),
    '',
    'CONDITION MULTIPLIERS (applied by the pricing engine to the base price):',
    formatConditions(cfg),
    '- Paint protection (PPF or ceramic coating) on the vehicle: 20% discount on the base detail.',
    '- Add-ons are priced at face value (not multiplied by condition).',
    '- The final custom quote = base services × condition multiplier + add-ons − paint protection discount.',
    '',
    'SCHEDULING RULES (informational — you do NOT book over SMS):',
    '- Booking buffer: ' + (cfg.scheduling_rules && cfg.scheduling_rules.booking_buffer_hours != null ? cfg.scheduling_rules.booking_buffer_hours : 24) + 'h',
    '- Minimum notice: ' + (cfg.scheduling_rules && cfg.scheduling_rules.min_notice_hours != null ? cfg.scheduling_rules.min_notice_hours : 24) + 'h',
    '- Slot interval: ' + (cfg.scheduling_rules && cfg.scheduling_rules.slot_interval_minutes != null ? cfg.scheduling_rules.slot_interval_minutes : 60) + ' min',
    '- Max bookings/day: ' + (cfg.scheduling_rules && cfg.scheduling_rules.max_bookings_per_day != null ? cfg.scheduling_rules.max_bookings_per_day : 4),
    '- You do NOT book, reschedule, or cancel appointments over SMS. Always direct the customer to the booking page (see BOOKING & QUOTES).',
    '',
    ((cfg.membership_plans && cfg.membership_plans[0] && cfg.membership_plans[0].label) || 'Membership') + ':',
    formatGold(cfg),
    '- To sign up for VDS Gold, direct customers to ' + ((cfg.website_links && cfg.website_links.gold_signup_url) || 'our website') + '. You do NOT sign customers up over SMS.',
    '',
    'BOOKING & QUOTES:',
    '- For quotes and booking, always direct customers to ' + ((cfg.website_links && cfg.website_links.booking_url) || 'our website') + '. That page captures full vehicle details (year/make/model, condition, add-ons) and computes the exact custom quote.',
    '- You do NOT book, reschedule, or cancel appointments over SMS — always send the booking link.',
    '',
    'FAQ:',
    formatFaq(cfg),
    '',
    'CONSULTATION SERVICES (high-ticket — require specialist follow-up):',
    '- Ceramic Coatings and Paint Correction are high-ticket services that require an in-depth consultation. Do NOT attempt to quote these over SMS.',
    '- When a customer asks about ceramic coatings, paint correction, or wants to speak to a team member, use the specialist_followup tool to flag the request. Our team will reach out to them directly.',
    '- Tell the customer that a specialist will contact them to discuss options and pricing.',
    '',
    'TOOL RULES (CRITICAL):',
    '- PRICING: The SERVICES & STARTING PRICES section above lists the exact per-classification and per-group prices from our live catalog. Use those prices directly when quoting — match the price to the customer vehicle classification (Coupe, Sedan, Hatchback, Mid-Size SUV, Truck/3-Row SUV).',
    '- QUOTES & BOOKING: You do NOT book or quote over SMS. Always direct customers to the booking page (' + ((cfg.website_links && cfg.website_links.booking_url) || 'our website') + ') for quotes and booking.',
    '- VDS GOLD: You do NOT sign customers up over SMS. Direct them to the signup page (' + ((cfg.website_links && cfg.website_links.gold_signup_url) || 'our website') + ').',
    '- To recognize returning customers, use lookup_customer. The phone is already known to the system — never ask the customer for it.',
    '- For ceramic coatings, paint correction, or "speak to a team member" requests, use specialist_followup — do NOT quote these services.',
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
  { type: 'function', function: { name: 'check_gold_status', description: "Check the customer's VDS Gold membership status and remaining monthly benefits.", parameters: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] } } },
  { type: 'function', function: { name: 'specialist_followup', description: 'Flag a request for specialist follow-up (custom work, complex corrections).', parameters: { type: 'object', properties: { phone: { type: 'string' }, reason: { type: 'string' }, notes: { type: 'string' } }, required: ['reason'] } } },
];

// OpenAI call imported from shared/conciergeHelpers.ts

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
async function getCustomerContext(base44, phone, businessId = 'vds') {
  if (!phone) return null;
  try {
    const d = phone.replace(/\D/g, '');
    if (d.length < 10) return null;
    const e164 = d.length === 10 ? '+1' + d : '+' + d;
    let customers = await base44.asServiceRole.entities.Customer.filter({ business_id: businessId, phone: e164 }).catch(() => []);
    if (!customers.length) {
      const all = await base44.asServiceRole.entities.Customer.filter({ business_id: businessId }).catch(() => []);
      customers = (all || []).filter(c => (c.phone || '').replace(/\D/g, '').slice(-10) === d.slice(-10));
    }
    const customer = customers[0];
    if (!customer) return null;

    let vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ business_id: businessId, customer_id: customer.id }).catch(() => []);
    if (!vehicles.length && customer.linked_user_id) {
      vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ business_id: businessId, created_by_id: customer.linked_user_id }).catch(() => []);
    }
    const vIds = (vehicles || []).map(v => v.id);
    const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ business_id: businessId, status: 'active' }).catch(() => []);
    const gold = (subs || []).some(s => vIds.includes(s.vehicle_id));
    const vList = (vehicles || []).map(v => [v.year, v.make, v.model].filter(Boolean).join(' '));
    const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'there';
    return { id: customer.id, name, gold, vehicles: vList };
  } catch {
    return null;
  }
}

// ── API-based webhook verification (fallback) ──────────────────────────
// When the Twilio Account Auth Token is not available (e.g. only an API Key
// is configured), signature validation cannot work — Twilio only signs
// webhooks with the Account Auth Token, not API Keys. As a secure fallback,
// we verify the inbound MessageSid by fetching it from the Twilio API using
// the configured API Key credentials. If the message exists and the From/Body
// match the webhook payload, the request is authentic.
async function verifyMessageViaApi(body) {
  const apiKeySid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const apiKeySecret = Deno.env.get('TWILIO_AUTH_TOKEN');
  const accountSid = body.AccountSid;
  const messageSid = body.MessageSid || body.SmsSid;
  if (!apiKeySid || !apiKeySecret || !accountSid || !messageSid) return false;
  const auth = btoa(apiKeySid + ':' + apiKeySecret);
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`, {
      headers: { Authorization: 'Basic ' + auth },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.from === body.From && data.body === body.Body;
  } catch {
    return false;
  }
}

// ── Main ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse body — JSON (internal/testing) or form-urlencoded (Twilio webhook).
    // Use req.text() + URLSearchParams instead of req.formData() — Deno's formData()
    // parser can decode certain values differently, which breaks Twilio signature
    // validation (the signature is computed over decoded parameter values).
    const contentType = req.headers.get('content-type') || '';
    let body;
    let rawBody = '';
    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else {
      rawBody = await req.text().catch(() => '');
      const params = new URLSearchParams(rawBody);
      body = Object.fromEntries(params.entries());
    }

    // Phase 4: config is loaded after business_id resolution (below). For Twilio
    // signature validation, knownUrl is null — validateTwilioSignature falls back to
    // req.url, Host, and x-forwarded-host candidates, which is sufficient.
    const knownUrl = null;

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
    let twilioDiag = null;
    let authMethod = 'none';
    if (!tokenOk && !authedOk) {
      const twilioResult = await validateTwilioSignature(req, body, knownUrl);
      twilioOk = twilioResult.ok;
      if (twilioOk) {
        authMethod = 'twilio_signature';
      } else {
        twilioDiag = twilioResult.diag;
        // Fallback: verify the MessageSid via the Twilio API. This is needed
        // because the configured TWILIO_AUTH_TOKEN is an API Key Secret (not
        // the Account Auth Token), which cannot validate webhook signatures.
        const apiVerified = await verifyMessageViaApi(body);
        if (apiVerified) {
          twilioOk = true;
          authMethod = 'twilio_api_verify';
        }
      }
    }
    if (!tokenOk && !authedOk && !twilioOk) {
      try {
        await base44.asServiceRole.entities.SystemEventLog.create({
          business_id: 'vds',
          event_type: 'valerie_auth_failed',
          entity_type: 'valerie',
          description: 'Twilio webhook authentication failed (signature + API verify)',
          metadata: twilioDiag || { reason: 'unknown' },
        });
      } catch (e) { console.error('auth fail log error:', e.message); }
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (body.scheduler_token) delete body.scheduler_token;
    if (body._internal_token) delete body._internal_token;

    // Extract phone + message — JSON or Twilio webhook format.
    let phone = (body.phone || body.From || body.customer_phone || '').trim();
    const message = (body.message || body.Body || body.text || '').trim();
    if (!message) return Response.json({ error: 'message is required.' }, { status: 400 });

    // Security: when invoked by an authenticated user session (not SCHEDULER_TOKEN or
    // a verified Twilio webhook), force the phone to the caller's own registered number.
    // Never trust body.phone for authenticated callers — that would let any logged-in
    // user exfiltrate another customer's CRM data by supplying an arbitrary phone (CWE-639).
    if (authedOk && !tokenOk && !twilioOk) {
      try {
        const me = await base44.auth.me();
        if (!me || !me.id) return Response.json({ error: 'Unable to verify your identity.' }, { status: 403 });
        const myCustomers = await base44.asServiceRole.entities.Customer.filter({ linked_user_id: me.id });
        const myCustomer = myCustomers && myCustomers[0];
        if (myCustomer && myCustomer.phone) {
          phone = myCustomer.phone;
        } else {
          const user = await base44.asServiceRole.entities.User.get(me.id).catch(() => null);
          if (user && user.phone) {
            phone = user.phone;
          } else {
            return Response.json({ error: 'No phone number on file for your account.' }, { status: 403 });
          }
        }
      } catch {
        return Response.json({ error: 'Unable to verify your identity.' }, { status: 403 });
      }
    }
    if (!phone) return Response.json({ error: 'phone is required.' }, { status: 400 });

    // Phase 4: resolve business_id.
    // - SCHEDULER_TOKEN calls (internal): use body.business_id if provided.
    // - Twilio SMS webhooks: resolve from the Twilio To number (the business's
    //   destination number). SMS has no HTTP hostname to resolve from.
    // - Authenticated non-Twilio calls (admin testing via API explorer / in-app):
    //   no body.To exists, so the Twilio lookup returns 'vds'; the authenticated
    //   user's business_id then overrides so an admin tests their own concierge.
    //   This tier never applies to genuine SMS webhooks — Twilio requests carry no
    //   Base44 session, so authedOk is always false for them.
    let businessId;
    if (tokenOk && body.business_id) {
      businessId = body.business_id;
    } else {
      const toNumber = (body.To || '').trim();
      businessId = toNumber ? await resolveBusinessIdFromTwilioNumber(base44, toNumber) : 'vds';
      if (authedOk) {
        try {
          const me = await base44.auth.me();
          if (me && me.id) {
            const user = await base44.asServiceRole.entities.User.get(me.id);
            if (user && user.business_id) {
              if (user.business_id !== businessId) {
                await logTenantMismatch(base44, user.business_id, businessId, 'valerie');
              }
              businessId = user.business_id;
            }
          }
        } catch {}
      }
    }
    const cfg = await loadConfig(base44, businessId);
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 500 });
    if (!hasFeature(cfg.plan_tier || 'basic', 'ai_sms_agent')) {
      return Response.json({ error: 'AI SMS agent is not available on your current plan.' }, { status: 403 });
    }

    // Normalize to E.164 for consistent conversation history keys.
    const d = phone.replace(/\D/g, '');
    const e164 = d.length === 10 ? '+1' + d : (d.length > 10 ? '+' + d : phone);

    // Load conversation history (last 20 exchanges), order chronologically.
    const history = await base44.asServiceRole.entities.ConversationHistory.filter(
      { business_id: businessId, customer_phone: e164 }, '-created_date', 20
    ).catch(() => []);
    const ordered = history.slice().reverse();

    const customerCtx = await getCustomerContext(base44, phone, businessId);
    const systemPrompt = buildSystemPrompt(cfg, customerCtx);

    const messages = [{ role: 'system', content: systemPrompt }];
    for (const m of ordered) {
      if (m.role === 'user') messages.push({ role: 'user', content: m.content });
      else if (m.role === 'assistant' && m.content) messages.push({ role: 'assistant', content: m.content });
    }
    messages.push({ role: 'user', content: message });

    // Agent loop — execute tools, then produce the final reply (max 5 tool rounds).
    let msg = await callOpenAI(messages, TOOLS);
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
      msg = await callOpenAI(messages, TOOLS);
    }

    const finalText = (msg && msg.content) ? String(msg.content).trim() : "I'm sorry, I had trouble with that — could you rephrase?";

    // Persist conversation history (always — even if SMS delivery is suppressed by the Rules Engine).
    try {
      await base44.asServiceRole.entities.ConversationHistory.bulkCreate([
        { business_id: businessId, customer_phone: e164, customer_name: customerCtx ? customerCtx.name : '', role: 'user', content: message },
        { business_id: businessId, customer_phone: e164, customer_name: customerCtx ? customerCtx.name : '', role: 'assistant', content: finalText },
      ]);
    } catch (e) { console.error('History save error:', e.message); }

    // Deliver the reply through the Communication Rules Engine.
    let delivery = { sent: false, channel: 'suppressed', reason: 'not_attempted' };
    try {
      const r = await base44.asServiceRole.functions.invoke('sendMessage', {
        customer_phone: e164, message_type: 'valerie_reply', content: finalText,
        customer_name: customerCtx ? customerCtx.name : '', business_id: businessId, scheduler_token: SCHEDULER_TOKEN,
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