// Per-IP rate limiter (per-isolate), shared by public endpoints that call paid
// third-party APIs so a single visitor can't run up cost.

const _rlHits = new Map();

// A request carrying neither forwarding header lands in one shared 'unknown' bucket, so
// limiting it at the per-visitor rate would throttle every such visitor at once. It gets a
// far higher ceiling instead: still a cost backstop, no longer a site-wide quota.
const UNKNOWN_SUFFIX = ':unknown';
const UNKNOWN_MAX_MULTIPLIER = 100;

export function rateLimit(key, max, windowMs) {
  const effectiveMax = key.endsWith(UNKNOWN_SUFFIX) ? max * UNKNOWN_MAX_MULTIPLIER : max;
  const now = Date.now();
  const hits = (_rlHits.get(key) || []).filter((ts) => now - ts < windowMs);
  // Resolved limiter key — shows whether this request carried a real IP or fell into the shared bucket.
  console.log('[rateLimit]', key, hits.length + '/' + effectiveMax);
  if (hits.length >= effectiveMax) return false;
  hits.push(now);
  _rlHits.set(key, hits);
  return true;
}

export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}