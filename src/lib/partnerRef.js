// Partner referral-code persistence (client-side).
// A partner's vanity link (domain/CODE) redirects to /book?ref=CODE. The code is captured
// into localStorage so it survives navigation — e.g. when a referred visitor clicks
// "VDS Gold" (a different route) the code is still available to attribute their Gold
// signup to the referring partner. Without this, navigating away from /book drops the
// query param and the partner loses attribution.

const KEY = 'vds_partner_ref';
const TS_KEY = 'vds_partner_ref_ts';
// Referral codes are valid for attribution for this many days after first capture.
const MAX_AGE_DAYS = 30;

function readStore() {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

// Capture the partner referral code from the current URL (?ref=CODE) into localStorage.
// Returns the currently-effective referral code (URL takes priority, then stored).
export function capturePartnerRef() {
  if (typeof window === 'undefined') return getPartnerRef();
  const store = readStore();
  if (!store) return null;
  try {
    const urlCode = new URLSearchParams(window.location.search).get('ref');
    if (urlCode) {
      store.setItem(KEY, urlCode.trim());
      store.setItem(TS_KEY, String(Date.now()));
      return urlCode.trim();
    }
  } catch {}
  return getPartnerRef();
}

// Read the stored partner referral code (null if expired or absent).
export function getPartnerRef() {
  const store = readStore();
  if (!store) return null;
  try {
    const code = store.getItem(KEY);
    if (!code) return null;
    const ts = Number(store.getItem(TS_KEY) || 0);
    if (ts && (Date.now() - ts) > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
      clearPartnerRef();
      return null;
    }
    return code;
  } catch { return null; }
}

export function clearPartnerRef() {
  const store = readStore();
  if (!store) return;
  try { store.removeItem(KEY); store.removeItem(TS_KEY); } catch {}
}

// Derive a human-readable acquisition source for the Customer.referral_source field.
// Partner links win; otherwise we infer from the browser referrer (Google, etc.), falling
// back to "Website".
export function deriveReferralSource(partnerRef) {
  if (partnerRef) return 'Partner Referral';
  if (typeof document === 'undefined' || !document.referrer) return 'Website';
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host.includes('google')) return 'Google';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('facebook') || host.includes('meta.com')) return 'Facebook';
    if (host.includes('tiktok')) return 'TikTok';
    return host;
  } catch { return 'Website'; }
}