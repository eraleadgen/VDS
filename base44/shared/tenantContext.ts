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