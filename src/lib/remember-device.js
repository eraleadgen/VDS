// "Remember this device for 30 days" support.
// Base44 stores the access token in localStorage by default (persists indefinitely).
// - Unchecked: relocate the token to sessionStorage so it is cleared when the browser closes.
// - Checked: keep it in localStorage and cap persistence at 30 days via an expiry marker
//   that app-params.js honors on load.

const TOKEN_KEYS = ['base44_access_token', 'token'];
const EXPIRY_KEY = 'vds_remember_expires';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function applyRememberDevice(remember) {
  if (typeof window === 'undefined') return;
  if (remember) {
    window.localStorage.setItem(EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS));
    for (const k of TOKEN_KEYS) {
      const v = window.sessionStorage.getItem(k);
      if (v) { window.localStorage.setItem(k, v); window.sessionStorage.removeItem(k); }
    }
  } else {
    window.localStorage.removeItem(EXPIRY_KEY);
    for (const k of TOKEN_KEYS) {
      const v = window.localStorage.getItem(k);
      if (v) { window.sessionStorage.setItem(k, v); window.localStorage.removeItem(k); }
    }
  }
}