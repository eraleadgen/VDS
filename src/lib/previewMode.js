// Detects the Base44 builder preview environment so gated pages can relax their
// auth redirects and let the builder see the UI they're iterating on — without
// logging in. This is ONLY true on Base44 preview/sandbox hosts (and local dev),
// never on a published production domain (e.g. vds-mobile.base44.app or a
// tenant's custom domain), so it can never weaken security on the live app.
export function isPreviewMode() {
  if (typeof window === 'undefined') return false;
  const h = (window.location.hostname || '').toLowerCase();
  return h.includes('preview') || h.includes('sandbox') || h.includes('localhost') || h === '127.0.0.1';
}