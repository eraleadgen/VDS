// Web Chat — ERA Core AI Chat Widget Backend
// POST /functions/webChat
// Public endpoint (no auth required) — powers the floating chat widget on the website.
// Uses OpenAI tool-calling (gpt-4o-mini) with the same BusinessConfig-grounded system prompt
// pattern as Valerie (SMS concierge). Conversation history stored in ConversationHistory
// keyed by "web:" + conversation_id.
//
// Configurability: persona, greeting, services, pricing, hours, scheduling rules, gold
// membership, and feature flag all come from BusinessConfig — nothing is hardcoded.
// The feature_flags.web_chat_enabled flag toggles the widget off entirely.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { loadConfig, formatCatalog, formatConditions, formatHours, formatGold, formatFaq, callOpenAI } from '../../shared/conciergeHelpers.ts';
import { loadBusinessContact } from '../../shared/businessContact.ts';
import { resolveBusinessIdFromHost } from '../../shared/tenantContext.ts';

// ── Per-IP rate limiter ─────────────────────────────────────────────────
const _rlHits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const hits = (_rlHits.get(key) || []).filter(ts => now - ts < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  _rlHits.set(key, hits);
  return true;
}
function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// ── Prompt builder ─────────────────────────────────────────────────────
// Config helpers imported from shared/conciergeHelpers.ts

function buildSystemPrompt(cfg) {
  const c = cfg.concierge || {};
  const name = c.name || 'Valerie';
  const persona = c.persona || 'Warm, professional, concise.';
  const summary = c.business_summary || ('Chat concierge for ' + cfg.business_name + '.');
  const goldLabel = (cfg.membership_plans && cfg.membership_plans[0] && (cfg.membership_plans[0].short_label || cfg.membership_plans[0].label)) || 'Gold';
  return [
    'You are ' + name + ', the chat concierge for ' + cfg.business_name + '.' + (cfg.tagline ? ' ' + cfg.tagline : ''),
    'ROLE: ' + summary,
    '',
    'PERSONA & FORMAT: ' + persona + ' This is a web chat interface. Keep messages concise and natural (usually 1-4 sentences). You may use short line breaks for lists. Never invent information.',
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
    '- Some services are priced per vehicle classification: ' + ((cfg.vehicle_classifications || []).map(v => v.label || v.key).join(', ')) + '.',
    '- Others are priced by vehicle group: Sedan/Coupe or Truck/SUV.',
    '- Always confirm the customer vehicle type (and year/make/model) before quoting.',
    '',
    'CONDITION MULTIPLIERS (applied by the pricing engine to the base price):',
    formatConditions(cfg),
    '- Paint protection (PPF or ceramic coating) on the vehicle: 20% discount on the base detail.',
    '- Add-ons are priced at face value (not multiplied by condition).',
    '',
    'SCHEDULING RULES:',
    '- Booking buffer: ' + (cfg.scheduling_rules && cfg.scheduling_rules.booking_buffer_hours != null ? cfg.scheduling_rules.booking_buffer_hours : 24) + 'h',
    '- Minimum notice: ' + (cfg.scheduling_rules && cfg.scheduling_rules.min_notice_hours != null ? cfg.scheduling_rules.min_notice_hours : 24) + 'h',
    '- Slot interval: ' + (cfg.scheduling_rules && cfg.scheduling_rules.slot_interval_minutes != null ? cfg.scheduling_rules.slot_interval_minutes : 60) + ' min',
    '- Max bookings/day: ' + (cfg.scheduling_rules && cfg.scheduling_rules.max_bookings_per_day != null ? cfg.scheduling_rules.max_bookings_per_day : 4),
    '',
    goldLabel + ':',
    formatGold(cfg),
    '- To sign up, direct customers to ' + ((cfg.website_links && cfg.website_links.gold_signup_url) || 'our website') + '.',
    '',
    'CONSULTATION SERVICES (high-ticket — require specialist follow-up):',
    '- Ceramic Coatings and Paint Correction are high-ticket services that require an in-depth consultation. Do NOT attempt to quote these directly.',
    '- When a client asks about ceramic coatings, paint correction, or wants to speak to a team member, use the request_consultation tool to send their contact info and description to our team. Collect their name, phone, and what they need before calling the tool.',
    '- Tell the client that a specialist will reach out to them directly to discuss options and pricing.',
    '',
    'BOOKING & QUOTES:',
    '- For quotes on standard services (full detail, exterior detail, etc.), use the create_quote tool. The quote will be displayed with a "Book Now" button that takes them to the booking page.',
    '- For actual booking, ALWAYS direct customers to the booking page: ' + ((cfg.website_links && cfg.website_links.booking_url) || 'our website') + '. Do NOT book directly through the chat — the booking page captures full vehicle details and computes the exact quote.',
    '- For availability, use check_availability to see open time slots for a specific date.',
    '- For pricing questions, use lookup_pricing to get exact starting prices.',
    '',
    'FAQ:',
    formatFaq(cfg),
    '',
    'NAVIGATION & APP GUIDE:',
    '- You are a general assistant helping clients navigate our website and services.',
    '- Booking page: ' + ((cfg.website_links && cfg.website_links.booking_url) || 'our website'),
    '- Membership signup: ' + ((cfg.website_links && cfg.website_links.gold_signup_url) || 'our website'),
    '- Gallery: ' + ((cfg.website_links && cfg.website_links.gallery_url) || 'our website'),
    '- Help clients find the right page for their needs (booking, membership, gallery, FAQ, pricing, services).',
    '',
    'TOOL RULES:',
    '- Always confirm the vehicle type (classification) before creating a quote.',
    '- For ceramic coatings, paint correction, or "speak to a team member" requests, use request_consultation — do NOT quote these services.',
    '- Execute all required tools FIRST, then write your final reply to the customer.',
    '- When you create a quote, mention the final price and that a "Book Now" button has been provided to take them to the booking page.',
  ].join('\n');
}

// ── Tool definitions (OpenAI function-calling) ─────────────────────────
const TOOLS = [
  { type: 'function', function: {
    name: 'lookup_pricing',
    description: 'Look up the starting price and duration for a service, optionally for a specific vehicle classification.',
    parameters: { type: 'object', properties: {
      service_key: { type: 'string', description: 'Service key from the catalog (e.g. full_detail, exterior_detail)' },
      vehicle_classification: { type: 'string', description: 'Vehicle classification key (coupe, sedan, hatchback, mid_size_suv, truck_3_row_suv, other)' },
    }, required: ['service_key'] },
  } },
  { type: 'function', function: {
    name: 'check_availability',
    description: 'Check available appointment time slots for a specific date.',
    parameters: { type: 'object', properties: {
      date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      service_type: { type: 'string', description: 'Service key (e.g. full_detail)' },
      vehicle_type: { type: 'string', description: 'Pricing group: sedan_coupe or truck_suv' },
    }, required: ['date'] },
  } },
  { type: 'function', function: {
    name: 'create_quote',
    description: 'Create a custom quote for a set of services. Computes the exact price using the pricing engine (base x condition multiplier + add-ons - paint protection discount). Returns a quote ID and booking URL displayed to the customer.',
    parameters: { type: 'object', properties: {
      services: { type: 'array', items: { type: 'string' }, description: 'Array of service keys' },
      vehicle_classification: { type: 'string', description: 'Vehicle classification key' },
      condition: { type: 'string', description: 'Vehicle condition key (e.g. light, moderate, heavy) — optional' },
      add_ons: { type: 'array', items: { type: 'string' }, description: 'Add-on service keys — optional' },
      paint_protection: { type: 'string', enum: ['none', 'paint_protection'], description: 'Existing paint protection — optional' },
    }, required: ['services', 'vehicle_classification'] },
  } },
  { type: 'function', function: {
    name: 'book_appointment',
    description: 'Book an appointment directly. Requires customer name, phone, address, service type, preferred date and time.',
    parameters: { type: 'object', properties: {
      name: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string' },
      address: { type: 'string' },
      service_type: { type: 'string', description: 'Service key from the catalog' },
      preferred_date: { type: 'string', description: 'YYYY-MM-DD' },
      preferred_time: { type: 'string', description: 'Time slot (e.g. "10:00 AM")' },
    }, required: ['name', 'phone', 'address', 'service_type', 'preferred_date', 'preferred_time'] },
  } },
  { type: 'function', function: {
    name: 'request_consultation',
    description: 'Request a specialist consultation for high-ticket services (ceramic coatings, paint correction) or when a client wants to speak to a team member. Sends the client contact info and description to the business team who will reach out directly.',
    parameters: { type: 'object', properties: {
      name: { type: 'string', description: 'Client name' },
      phone: { type: 'string', description: 'Client phone number' },
      email: { type: 'string', description: 'Client email — optional' },
      service_interest: { type: 'string', description: 'What the client is interested in (e.g. ceramic_coating, paint_correction, speak_to_team)' },
      description: { type: 'string', description: 'Brief description of what the client needs' },
    }, required: ['name', 'phone', 'service_interest', 'description'] },
  } },
];

// OpenAI call imported from shared/conciergeHelpers.ts

// ── Tool execution ────────────────────────────────────────────────────
async function executeTool(base44, cfg, businessId, name, args) {
  const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
  switch (name) {
    case 'lookup_pricing': {
      const svc = (cfg.services || []).find(s => s.key === args.service_key);
      if (!svc) return { error: 'Service not found: ' + args.service_key };
      const map = cfg.classification_to_pricing_group || {};
      const pricingGroup = (args.vehicle_classification && map[args.vehicle_classification]) || 'sedan_coupe';
      const tier = (svc.tiers || []).find(t => t.tier === args.vehicle_classification)
        || (svc.tiers || []).find(t => t.tier === pricingGroup)
        || (svc.tiers || [])[0];
      return {
        service: svc.label,
        starting_price: tier ? tier.price : null,
        duration_minutes: tier ? tier.duration_minutes : null,
        requires_consultation: svc.requires_consultation || false,
        pricing_group: pricingGroup,
      };
    }
    case 'check_availability': {
      const res = await base44.asServiceRole.functions.invoke('scheduler', {
        action: 'check_availability',
        business_id: businessId,
        service: args.service_type || 'full_detail',
        vehicle_type: args.vehicle_type || 'sedan_coupe',
        date: args.date,
      });
      const data = res?.data || res;
      const slots = (data && Array.isArray(data.slots)) ? data.slots.map(s => s.time) : [];
      return { date: args.date, available_slots: slots };
    }
    case 'create_quote': {
      const res = await base44.asServiceRole.functions.invoke('pricingEngine', {
        scheduler_token: SCHEDULER_TOKEN,
        business_id: businessId,
        services: args.services,
        vehicle_classification: args.vehicle_classification,
        condition: args.condition,
        add_ons: args.add_ons,
        paint_protection: args.paint_protection,
      });
      const data = res?.data || res;
      if (data.error) return { error: data.error };
      const quote = await base44.asServiceRole.entities.Quote.create({
        business_id: businessId,
        requested_services: args.services,
        vehicle_classification: args.vehicle_classification,
        condition: args.condition || null,
        add_ons: args.add_ons || [],
        paint_protection: args.paint_protection || 'none',
        starting_price: data.base_price,
        final_price: data.starting_price,
        estimated_duration_minutes: data.estimated_duration_minutes,
        quote_summary: data.quote_summary,
        booking_url: data.booking_url,
        status: 'pending',
      });
      return {
        quote_id: quote.id,
        final_price: data.starting_price,
        quote_summary: data.quote_summary,
        estimated_duration: data.estimated_duration,
        requires_consultation: data.requires_consultation,
        booking_url: data.booking_url,
      };
    }
    case 'book_appointment': {
      const res = await base44.asServiceRole.functions.invoke('submitBooking', {
        scheduler_token: SCHEDULER_TOKEN,
        business_id: businessId,
        name: args.name,
        phone: args.phone,
        email: args.email || '',
        address: args.address,
        service_type: args.service_type,
        preferred_date: args.preferred_date,
        preferred_time: args.preferred_time,
        sms_consent: false,
      });
      const data = res?.data || res;
      return {
        success: data.success,
        job_id: data.job_id,
        error: data.error,
      };
    }
    case 'request_consultation': {
      try {
        const contact = await loadBusinessContact(base44, businessId);
        const serviceLabels = { ceramic_coating: 'Ceramic Coating', paint_correction: 'Paint Correction', speak_to_team: 'Speak to a Team Member' };
        const interestLabel = serviceLabels[args.service_interest] || args.service_interest;
        const subject = 'Consultation Request — ' + interestLabel + ' — ' + args.name;
        const html = '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0A0B0D;color:#E2E8F0;padding:24px;">'
          + '<h2 style="color:#D4AF37;margin:0 0 16px 0;">Consultation Request</h2>'
          + '<table style="width:100%;border-collapse:collapse;">'
          + '<tr><td style="padding:6px 0;color:#94A3B8;font-size:12px;text-transform:uppercase;">Service Interest</td><td style="padding:6px 0;color:#E2E8F0;font-weight:600;">' + interestLabel + '</td></tr>'
          + '<tr><td style="padding:6px 0;color:#94A3B8;font-size:12px;text-transform:uppercase;">Client Name</td><td style="padding:6px 0;color:#E2E8F0;font-weight:600;">' + args.name + '</td></tr>'
          + '<tr><td style="padding:6px 0;color:#94A3B8;font-size:12px;text-transform:uppercase;">Phone</td><td style="padding:6px 0;color:#E2E8F0;font-weight:600;">' + args.phone + '</td></tr>'
          + (args.email ? '<tr><td style="padding:6px 0;color:#94A3B8;font-size:12px;text-transform:uppercase;">Email</td><td style="padding:6px 0;color:#E2E8F0;font-weight:600;">' + args.email + '</td></tr>' : '')
          + '</table>'
          + '<p style="margin:16px 0 6px 0;color:#94A3B8;font-size:12px;text-transform:uppercase;">Description</p>'
          + '<div style="background:#14161A;padding:14px;border-radius:8px;border:1px solid rgba(212,175,55,0.15);color:#CBD5E1;line-height:1.6;">' + args.description + '</div>'
          + '<p style="color:#64748B;font-size:11px;margin-top:20px;">This consultation request was submitted via the web chat widget.</p>'
          + '</body></html>';
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contact.internalEmail,
          subject,
          body: html,
          from_name: contact.businessName,
        });
        return { success: true, message: 'Consultation request sent. A specialist will reach out directly.' };
      } catch (e) {
        return { error: e.message };
      }
    }
    default:
      return { error: 'Unknown tool: ' + name };
  }
}

// ── Main ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Rate limit — public endpoint, no auth required.
    const ip = clientIp(req);
    if (!rateLimit('webChat:' + ip, 30, 15 * 60 * 1000)) {
      return Response.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { message, conversation_id } = body;
    if (!message || !message.trim()) return Response.json({ error: 'message is required.' }, { status: 400 });
    if (!conversation_id) return Response.json({ error: 'conversation_id is required.' }, { status: 400 });

    // Phase 4: resolve business_id from the request hostname (multi-tenant).
    const businessId = await resolveBusinessIdFromHost(base44, req);
    const cfg = await loadConfig(base44, businessId);
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 500 });

    // Respect the feature flag — admins can disable the widget from BusinessConfig.
    if (cfg.feature_flags && cfg.feature_flags.web_chat_enabled === false) {
      return Response.json({ error: 'Web chat is not available.' }, { status: 403 });
    }

    const sessionKey = 'web:' + conversation_id;

    // Load conversation history (last 20 exchanges), order chronologically.
    const history = await base44.asServiceRole.entities.ConversationHistory.filter(
      { business_id: businessId, customer_phone: sessionKey }, '-created_date', 20
    ).catch(() => []);
    const ordered = history.slice().reverse();

    const systemPrompt = buildSystemPrompt(cfg);
    const messages = [{ role: 'system', content: systemPrompt }];
    for (const m of ordered) {
      if (m.role === 'user') messages.push({ role: 'user', content: m.content });
      else if (m.role === 'assistant' && m.content) messages.push({ role: 'assistant', content: m.content });
    }
    messages.push({ role: 'user', content: message });

    // Agent loop — execute tools, then produce final reply (max 5 tool rounds).
    let msg = await callOpenAI(messages, TOOLS);
    let rounds = 0;
    let lastQuote = null;
    while (msg && msg.tool_calls && msg.tool_calls.length && rounds < 5) {
      rounds++;
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        const toolName = tc.function.name;
        let toolArgs = {};
        try { toolArgs = JSON.parse(tc.function.arguments || '{}'); } catch {}
        const result = await executeTool(base44, cfg, businessId, toolName, toolArgs);
        if (toolName === 'create_quote' && result && result.quote_id) lastQuote = result;
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      msg = await callOpenAI(messages, TOOLS);
    }

    const finalText = (msg && msg.content) ? String(msg.content).trim() : "I'm sorry, I had trouble with that — could you rephrase?";

    // Persist conversation history.
    try {
      await base44.asServiceRole.entities.ConversationHistory.bulkCreate([
        { business_id: businessId, customer_phone: sessionKey, role: 'user', content: message },
        { business_id: businessId, customer_phone: sessionKey, role: 'assistant', content: finalText },
      ]);
    } catch (e) { console.error('History save error:', e.message); }

    return Response.json({ reply: finalText, quote: lastQuote, tool_rounds: rounds });
  } catch (error) {
    console.error('webChat error:', error.message);
    return Response.json(
      { error: error.message, reply: "I'm sorry, something went wrong — please try again in a moment." },
      { status: 500 }
    );
  }
});