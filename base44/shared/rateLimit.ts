// Per-IP rate limiter (per-isolate), shared by public endpoints that call paid
// third-party APIs so a single visitor can't run up cost.

const _rlHits = new Map();

export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const hits = (_rlHits.get(key) || []).filter((ts) => now - ts < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  _rlHits.set(key, hits);
  return true;
}

export function clientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}