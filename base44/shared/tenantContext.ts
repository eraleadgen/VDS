// ERA Core — Multi-tenant business_id resolution and stamping helpers.
//
// Every asServiceRole entity operation must explicitly set or filter by business_id
// rather than relying on the schema's "vds" default. This module provides the shared
// resolution + stamping logic so every backend function uses the same pattern.
//
// Resolution priority for authenticated endpoints:
//   1. Explicit business_id in the request body (internal function-to-function calls)
//   2. Authenticated user's User.business_id
//   3. Fallback 'vds' (single-tenant safety net)
//
// Phase 4 will add origin-domain → BusinessConfig mapping for public endpoints.
// Until then, public endpoints (submitBooking, saveQuote, webChat, getGoogleReviews,
// valerie, valerieTools) use the fallback 'vds' — safe for single-tenant VDS but
// MUST be revisited before onboarding a second tenant.

const FALLBACK_BUSINESS_ID = 'vds';

// Resolve business_id for an authenticated user endpoint.
// Reads from the User entity (auth.me() doesn't reliably return custom fields).
export async function getUserBusinessId(base44, me) {
  if (!me) return FALLBACK_BUSINESS_ID;
  try {
    const u = await base44.asServiceRole.entities.User.get(me.id).catch(() => null);
    return (u && u.business_id) || FALLBACK_BUSINESS_ID;
  } catch { return FALLBACK_BUSINESS_ID; }
}

// Resolve business_id for an internal SCHEDULER_TOKEN call.
// Internal callers pass business_id in the body; fall back to 'vds'.
export function getInternalBusinessId(body = {}) {
  if (body.business_id && typeof body.business_id === 'string') return body.business_id;
  return FALLBACK_BUSINESS_ID;
}

// Resolve business_id from any context (authenticated user OR body field).
// Use this for endpoints that accept EITHER an authenticated user OR a SCHEDULER_TOKEN.
export async function getCallerBusinessId(base44, body = {}) {
  if (body.business_id && typeof body.business_id === 'string') return body.business_id;
  try {
    const me = await base44.auth.me().catch(() => null);
    if (me && me.id) return await getUserBusinessId(base44, me);
  } catch {}
  return FALLBACK_BUSINESS_ID;
}

// Merge business_id into a filter query object.
export function tenantFilter(bizId, extra = {}) {
  return { business_id: bizId, ...extra };
}

// Ensure business_id is set on a create payload.
// If the payload already has business_id, keep it; otherwise stamp the resolved bizId.
export function stampCreate(data, bizId) {
  return { ...data, business_id: data.business_id || bizId };
}

// ── Phase 4: Hostname / phone-number → business_id resolution ──────────────
//
// Public/unauthenticated endpoints resolve their tenant from the incoming request
// hostname. SMS-based endpoints (valerie) resolve from the Twilio destination number.
// Both look up the TenantMapping entity (exact match, active records only) and fall
// back to 'vds' for unmapped hostnames/numbers (preview domains, localhost, etc.).

// Extract the original request hostname from a Base44 function request.
// Base44's proxy rewrites the Host header to an internal dispatcher hostname
// (base44-dispatcher-production.base44.workers.dev), so Host/x-forwarded-host are
// useless for tenant resolution. The proxy injects `base44-api-url` with the
// original full URL (e.g. "https://eraleadgen.com") — that's the reliable source.
export function getRequestHostname(req) {
  const apiUrl = req.headers.get('base44-api-url') || '';
  if (apiUrl) {
    try { return new URL(apiUrl).hostname.toLowerCase().trim(); } catch {}
  }
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return host.split(':')[0].toLowerCase().trim();
}

// Resolve business_id from the incoming request hostname.
export async function resolveBusinessIdFromHost(base44, req) {
  const hostname = getRequestHostname(req);
  if (!hostname) return FALLBACK_BUSINESS_ID;
  try {
    const mappings = await base44.asServiceRole.entities.TenantMapping.filter({ hostname, is_active: true });
    if (mappings && mappings[0]) return mappings[0].business_id || FALLBACK_BUSINESS_ID;
  } catch (e) { console.error('TenantMapping hostname lookup failed:', e.message); }
  return FALLBACK_BUSINESS_ID;
}

// Check if a hostname is a Base44 preview/dev host (no real TenantMapping expected).
// Used to gate the ?tenant= dev override in getBusinessConfig so a client-supplied
// parameter can never hijack tenant resolution on a real mapped domain.
export function isPreviewHost(hostname) {
  if (!hostname) return false;
  return hostname.endsWith('.base44.app')
    || hostname.endsWith('.base44.com')
    || hostname === 'localhost'
    || hostname.endsWith('.localhost');
}

// Resolve business_id from hostname, returning whether a real TenantMapping matched.
// Use this (instead of resolveBusinessIdFromHost) when you need to distinguish "no
// mapping found, fell back to vds" from "mapping found and points to vds".
export async function resolveBusinessIdFromHostWithMatch(base44, req) {
  const hostname = getRequestHostname(req);
  if (!hostname) return { businessId: FALLBACK_BUSINESS_ID, matched: false, hostname: '' };
  try {
    const mappings = await base44.asServiceRole.entities.TenantMapping.filter({ hostname, is_active: true });
    if (mappings && mappings[0]) return { businessId: mappings[0].business_id || FALLBACK_BUSINESS_ID, matched: true, hostname };
  } catch (e) { console.error('TenantMapping hostname lookup failed:', e.message); }
  return { businessId: FALLBACK_BUSINESS_ID, matched: false, hostname };
}

// Resolve business_id from a Twilio phone number (for SMS-based functions like valerie).
// Accepts E.164 or raw digits; normalizes to E.164 for the lookup.
export async function resolveBusinessIdFromTwilioNumber(base44, rawNumber) {
  if (!rawNumber) return FALLBACK_BUSINESS_ID;
  const d = String(rawNumber).replace(/\D/g, '');
  const e164 = d.length === 10 ? '+1' + d : (d.length > 10 ? '+' + d : rawNumber);
  try {
    const mappings = await base44.asServiceRole.entities.TenantMapping.filter({ twilio_number: e164, is_active: true });
    if (mappings && mappings[0]) return mappings[0].business_id || FALLBACK_BUSINESS_ID;
  } catch (e) { console.error('TenantMapping phone lookup failed:', e.message); }
  return FALLBACK_BUSINESS_ID;
}

// Log a tenant mismatch to SystemEventLog (log-and-allow: logs but does not block).
// Called when an authenticated user's business_id differs from the hostname-resolved
// business_id. The caller proceeds with the user's own business_id (priority 2 over 3).
export async function logTenantMismatch(base44, userBusinessId, hostBusinessId, context) {
  if (userBusinessId === hostBusinessId) return;
  try {
    await base44.asServiceRole.entities.SystemEventLog.create({
      business_id: userBusinessId,
      event_type: 'tenant_mismatch',
      entity_type: 'auth',
      description: `Authenticated user (tenant ${userBusinessId}) accessed a different tenant's domain (resolved ${hostBusinessId})`,
      metadata: { userBusinessId, hostBusinessId, context },
      suppression_reason: 'tenant_mismatch_log_and_allow',
    });
  } catch (e) { console.error('Mismatch log failed:', e.message); }
}