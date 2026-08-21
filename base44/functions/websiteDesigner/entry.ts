import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Whitelist of BusinessConfig fields the designer may modify (customer-facing visual/content).
const ALLOWED: Record<string, string> = {
  business_name: 'string',
  business_short_name: 'string',
  tagline: 'string',
  logo_url: 'string',
  brand_colors: 'object',
  service_areas: 'array',
  seo: 'array',
  faq: 'array',
  concierge: 'object',
  dictionary: 'object',
  social_links: 'object',
  website_links: 'object',
  featured_services: 'array',
};
const OBJECT_KEYS = new Set(['brand_colors', 'concierge', 'dictionary', 'social_links', 'website_links']);

function typeOf(v: any): string {
  if (Array.isArray(v)) return 'array';
  if (v !== null && typeof v === 'object') return 'object';
  return typeof v;
}

function deepMerge(base: any, patch: any): any {
  const out = { ...(base || {}) };
  for (const k of Object.keys(patch || {})) {
    if (patch[k] !== null && typeof patch[k] === 'object' && !Array.isArray(patch[k])) {
      out[k] = deepMerge(out[k], patch[k]);
    } else {
      out[k] = patch[k];
    }
  }
  return out;
}

function canonical(v: any): any {
  if (Array.isArray(v)) return v.map(canonical);
  if (v !== null && typeof v === 'object') {
    return Object.keys(v).sort().reduce((acc: any, k: string) => { acc[k] = canonical(v[k]); return acc; }, {});
  }
  return v;
}
function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function sanitizeUpdates(updates: any, cfg: any): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const k of Object.keys(updates || {})) {
    if (!ALLOWED[k]) continue;
    if (typeOf(updates[k]) !== ALLOWED[k]) continue;
    if (k === 'featured_services') {
      const arr = updates[k];
      if (!arr.every((it: any) => it && typeof it === 'object' && it.service_key && it.title)) continue;
    }
    const newVal: any = OBJECT_KEYS.has(k) ? deepMerge(cfg[k], updates[k]) : updates[k];
    // Drop no-ops (model echoed an unchanged field).
    if (deepEqual(newVal, cfg[k])) continue;
    // Protect non-empty arrays from being wiped by an empty replacement.
    if (ALLOWED[k] === 'array' && Array.isArray(newVal) && newVal.length === 0 && Array.isArray(cfg[k]) && cfg[k].length > 0) continue;
    clean[k] = newVal;
  }
  return clean;
}

function websiteSnapshot(cfg: any): any {
  return {
    business_name: cfg.business_name,
    business_short_name: cfg.business_short_name,
    tagline: cfg.tagline,
    logo_url: cfg.logo_url,
    brand_colors: cfg.brand_colors,
    service_areas: cfg.service_areas,
    seo: cfg.seo,
    faq: cfg.faq,
    concierge: cfg.concierge,
    dictionary: cfg.dictionary,
    social_links: cfg.social_links,
    website_links: cfg.website_links,
    featured_services: (cfg.featured_services || []).map((s: any) => ({
      service_key: s.service_key, title: s.title, subtitle: s.subtitle, specs: s.specs, display_order: s.display_order,
    })),
  };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const message = (body?.message || '').trim();
    if (!message) return Response.json({ error: 'No message provided' }, { status: 400 });
    const history: any[] = Array.isArray(body?.history) ? body.history.slice(-6) : [];

    const businessId = (user.data as any)?.business_id || 'vds';
    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
    const cfg = configs && configs[0];
    if (!cfg) return Response.json({ error: 'No active BusinessConfig for this tenant' }, { status: 404 });

    const snapshot = websiteSnapshot(cfg);

    const systemPrompt = `You are a website design assistant for ${cfg.business_name || 'this business'}, a service business. The admin is chatting to "vibe code" visual and content changes to their customer-facing website, which is driven by a BusinessConfig object.

CURRENT state of the editable website-facing fields:
${JSON.stringify(snapshot, null, 2)}

You may modify ONLY these top-level fields:
- business_name (string), business_short_name (string), tagline (string), logo_url (string)
- brand_colors (object: primary, secondary, background, surface, text — hex strings like "#D4AF37")
- service_areas (array of strings)
- seo (array of { route, title, description })
- faq (array of { question, answer })
- concierge (object: name, persona, business_summary, greeting)
- dictionary (object: item_noun, item_plural, service_noun, service_verb, etc.)
- social_links (object: instagram, tiktok)
- website_links (object: booking_url, gold_signup_url, gallery_url, google_review_url)
- featured_services (array of { service_key, title, subtitle, specs[], display_order })

Rules:
- "reply": a friendly 1-2 sentence confirmation of what you changed.
- "updates": a PARTIAL patch — only the fields to change. For object fields, include only the nested keys to change (they are merged). For arrays, return the FULL new array.
- CRITICAL: Always put the concrete new values in "updates". Never describe a change in "reply" without also including the actual value in "updates". If the request is subjective ("punchier", "warmer", "cooler"), choose a concrete value yourself and put it in "updates".
- CRITICAL: Return ONLY the specific fields that are changing. Do NOT echo back unchanged fields. Only include "featured_services" if the user explicitly asked to modify featured services.
- For brand_colors, provide hex strings (e.g. "#1B2A4A") for each nested key you change.
- Stay on-brand and professional. Match the business's existing tone.
- Never invent fields outside the list above.
- If the request is unclear or not a visual/content change, return updates={} and ask for clarification in the reply.`;

    const convo = [
      { role: 'SYSTEM', content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'ASSISTANT' : 'USER', content: h.content })),
      { role: 'USER', content: message },
    ];
    const prompt = convo.map((m: any) => `[${m.role}]\n${m.content}`).join('\n\n');

    const llm: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          updates: {
            type: 'object',
            properties: {
              business_name: { type: 'string' },
              business_short_name: { type: 'string' },
              tagline: { type: 'string' },
              logo_url: { type: 'string' },
              brand_colors: { type: 'object', additionalProperties: true },
              service_areas: { type: 'array', items: { type: 'string' } },
              seo: { type: 'array', items: { type: 'object', additionalProperties: true } },
              faq: { type: 'array', items: { type: 'object', additionalProperties: true } },
              concierge: { type: 'object', additionalProperties: true },
              dictionary: { type: 'object', additionalProperties: true },
              social_links: { type: 'object', additionalProperties: true },
              website_links: { type: 'object', additionalProperties: true },
              featured_services: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
            additionalProperties: true,
          },
        },
        required: ['reply', 'updates'],
      },
    });

    const parsed = typeof llm === 'string' ? JSON.parse(llm) : llm;
    const reply = parsed?.reply || 'Done.';
    const updates = sanitizeUpdates(parsed?.updates || {}, cfg);

    let applied: Record<string, any> = {};
    if (Object.keys(updates).length) {
      await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, updates);
      applied = updates;
    }

    return Response.json({
      reply,
      applied,
      changed_fields: Object.keys(applied),
      config: websiteSnapshot({ ...cfg, ...updates }),
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}