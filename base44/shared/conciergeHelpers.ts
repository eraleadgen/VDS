// Shared helpers for AI concierge functions (valerie SMS + webChat widget).
// Extracted so both functions use identical config loading, catalog formatting,
// and OpenAI calling — no duplicated logic. BusinessConfig is the single source
// of truth for all pricing, services, hours, and persona data.

// Load the active BusinessConfig (single-tenant today; multi-tenant ready).
export async function loadConfig(base44) {
  const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
  return configs && configs[0] ? configs[0] : null;
}

// Format the service catalog for the system prompt. Shows each service with its
// per-classification or per-group prices so the concierge can quote accurately
// without calling a tool. Matches what the pricing engine computes.
export function formatCatalog(cfg) {
  const classLabels = {
    coupe: 'Coupe', sedan: 'Sedan', hatchback: 'Hatchback', mid_size_suv: 'Mid-Size SUV',
    truck_3_row_suv: 'Truck/3-Row SUV', other: 'Other',
    sedan_coupe: 'Sedan/Coupe', truck_suv: 'Truck/SUV',
  };
  const lines = [];
  for (const svc of (cfg.services || [])) {
    if (svc.category === 'membership') continue;
    const tiers = svc.tiers || [];
    if (!tiers.length || tiers.every(t => t.price == null)) {
      lines.push('  - ' + svc.label + ': Consultation' + (svc.requires_consultation ? ' (consultation required)' : ''));
      continue;
    }
    const priceParts = tiers.filter(t => t.price != null).map(t => (classLabels[t.tier] || t.tier) + ' $' + t.price);
    const consult = svc.requires_consultation ? ' (consultation required)' : '';
    lines.push('  - ' + svc.label + ': ' + priceParts.join(', ') + consult);
  }
  return lines.join('\n');
}

// Format condition multipliers from BusinessConfig.
export function formatConditions(cfg) {
  const conditions = (cfg.pricing_rules && cfg.pricing_rules.condition_multipliers) || [];
  if (!conditions.length) return 'Standard pricing (no condition multipliers configured).';
  return conditions.map(c => c.label + ' (' + c.key + '): ' + c.multiplier + 'x' + (c.duration_add_minutes ? ' +' + c.duration_add_minutes + 'min' : '')).join(', ');
}

export function formatHours(cfg) {
  return (cfg.business_hours || []).map(h => h.day.toUpperCase() + ' ' + (h.closed ? 'Closed' : h.open + '-' + h.close)).join(' | ');
}

export function formatGold(cfg) {
  return (cfg.membership_plans || []).map(p => {
    const prices = (p.pricing_by_group || []).map(g => (g.pricing_group === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe') + ': $' + g.price_monthly + '/mo').join(', ');
    return p.label + ' (' + prices + ') — ' + ((p.benefits || []).join(', '));
  }).join('\n');
}

// Format FAQ entries from BusinessConfig for the system prompt.
export function formatFaq(cfg) {
  const faqs = cfg.faq || [];
  if (!faqs.length) return 'No FAQ entries configured.';
  return faqs.map((f, i) => (i + 1) + '. Q: ' + f.question + '\n   A: ' + f.answer).join('\n');
}

// Shared OpenAI call — uses the OpenAI_Valerie secret and gpt-4o-mini for fast
// conversational responses (2-4 second latency, handles tool-calling).
export async function callOpenAI(messages, tools) {
  const KEY = Deno.env.get('OpenAI_Valerie');
  if (!KEY) throw new Error('OpenAI_Valerie secret is not set.');
  const payload = { model: 'gpt-4o-mini', temperature: 0.7, messages };
  if (tools) { payload.tools = tools; payload.tool_choice = 'auto'; }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('OpenAI error (' + res.status + '): ' + t);
  }
  const data = await res.json();
  return data.choices && data.choices[0] ? data.choices[0].message : null;
}