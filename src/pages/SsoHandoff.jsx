import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Cross-domain SSO handoff receiver. Lives on the client's own domain.
//
// The era-portal (eraleadgen.com) opens this page via window.open and, on
// request, posts the user's Base44 access token back via postMessage. This
// page writes the token to localStorage under the same key the Base44 SDK
// reads on init (base44_access_token), then hard-redirects to the target
// admin route — landing the user already authenticated at the right tab.
//
// Security: the token moves only window-to-window (never via URL, server, or
// logs). This page validates event.origin === issuer before trusting any
// message, and degrades to the admin login page if window.opener is absent
// (e.g. a client's own Cloudflare COOP severed it, or the era-portal tab was
// closed before the ~1s handshake completed). Fails safe — never breaks.
// Only the ERA portal may drive this handoff. Pinned — never taken from the URL.
const ERA_ISSUERS = ['https://eraleadgen.com', 'https://www.eraleadgen.com'];

export default function SsoHandoff() {
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // The redirect must be a same-origin path. This rejects absolute URLs,
    // "javascript:", protocol-relative "//host" and "/\host" — browsers treat a
    // backslash after the leading slash like a second slash.
    const rawRedirect = params.get('redirect') || '/admin';
    const redirect = /^\/(?![\/\\])/.test(rawRedirect) ? rawRedirect : '/admin';

    // The issuer is pinned to the ERA portal origins. Reading it from the URL let
    // a caller nominate which origin this page would trust.
    const issuerParam = params.get('issuer');
    const issuer = ERA_ISSUERS.includes(issuerParam) ? issuerParam : null;

    // No valid issuer, or no opener available — fall back to login.
    // This is the safe degradation path if COOP ever severs window.opener
    // on a client's custom domain (their own Cloudflare settings, not ours).
    if (!issuer || !window.opener || window.opener.closed) {
      window.location.replace('/admin-login');
      return;
    }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.location.replace('/admin-login');
      }
    }, 4000);

    const onMessage = (event) => {
      // Only trust messages from the era-portal origin that opened us.
      if (event.origin !== issuer) return;
      if (!event.data || event.data.type !== 'ERA_SSO_TOKEN') return;
      const token = event.data.token;
      if (!token) return;
      resolved = true;
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      // Write to the same localStorage key the Base44 SDK reads on init.
      try { localStorage.setItem('base44_access_token', token); } catch {}
      try { localStorage.setItem('token', token); } catch {}
      window.location.replace(redirect);
    };

    window.addEventListener('message', onMessage);
    // Request the token from the era-portal opener. The request carries no
    // secrets; targetOrigin scopes it to the issuer only.
    window.opener.postMessage({ type: 'ERA_SSO_REQUEST', redirect }, issuer);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-4" />
        <p className="text-xs font-mono-tech tracking-widest text-vapor/50">SECURING YOUR SESSION…</p>
      </div>
    </div>
  );
}