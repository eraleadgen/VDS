// Era Portal — Website & Connections tab.
// Phase E4: live-site summary + the "Manage site settings" deep-link that
// hands the session off to the client's own admin dashboard Settings tab via
// postMessage SSO (see src/pages/SsoHandoff.jsx). This tab does NOT duplicate
// the domain/email/phone/branding UI — it links into the existing Settings tab
// built in Phase 7, on the client's own domain.
import { useState } from 'react';
import { Globe, Mail, Phone, ExternalLink, CheckCircle2, Clock, AlertCircle, Settings, ArrowRight } from 'lucide-react';

function StatusBadge({ status, label }) {
  const map = {
    verified: { icon: CheckCircle2, color: 'text-gold', text: 'VERIFIED' },
    active: { icon: CheckCircle2, color: 'text-gold', text: 'ACTIVE' },
    pending: { icon: Clock, color: 'text-gold/60', text: 'PENDING' },
    shared: { icon: CheckCircle2, color: 'text-vapor/50', text: 'SHARED' },
    none: { icon: AlertCircle, color: 'text-vapor/40', text: 'NONE' },
    failed: { icon: AlertCircle, color: 'text-red-400', text: 'FAILED' },
  };
  const s = map[status] || map.none;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono-tech tracking-widest ${s.color}`}>
      <Icon size={12} /> {label}: {s.text}
    </span>
  );
}

export default function EraPortalConnectionsTab({ summary }) {
  const siteUrl = summary?.site_url;
  const business = summary?.business;
  const [handoffError, setHandoffError] = useState('');

  // Open the client's admin Settings tab in a new tab, handing off the ERA
  // session via postMessage so the user lands authenticated without re-logging in.
  const handleManageSite = () => {
    setHandoffError('');
    if (!siteUrl) {
      setHandoffError('Your site is not live yet. Complete onboarding first.');
      return;
    }
    // Read the current Base44 access token (localStorage, or sessionStorage if
    // "remember device" was off at login). This is the same-origin token on
    // eraleadgen.com — valid for the same Base44 app's backend from any origin.
    const token = localStorage.getItem('base44_access_token') || sessionStorage.getItem('base44_access_token');
    if (!token) {
      setHandoffError('Your session could not be found. Please refresh and try again.');
      return;
    }
    const clientOrigin = new URL(siteUrl).origin;
    const ssoUrl = `${clientOrigin}/sso?redirect=${encodeURIComponent('/admin?tab=settings')}&issuer=${encodeURIComponent(window.location.origin)}`;

    // One-time listener: the new tab posts an ERA_SSO_REQUEST once loaded.
    // We validate event.origin === clientOrigin before sending the token,
    // so the token only ever goes to the exact client domain we opened.
    let resolved = false;
    const onMessage = (event) => {
      if (event.origin !== clientOrigin) return;
      if (!event.data || event.data.type !== 'ERA_SSO_REQUEST') return;
      resolved = true;
      event.source.postMessage({ type: 'ERA_SSO_TOKEN', token }, clientOrigin);
      window.removeEventListener('message', onMessage);
    };
    window.addEventListener('message', onMessage);
    // Clean up the listener if the new tab never requests (closed, blocked).
    setTimeout(() => {
      if (!resolved) window.removeEventListener('message', onMessage);
    }, 15000);

    const win = window.open(ssoUrl, '_blank');
    if (!win) {
      setHandoffError('Popup blocked. Please allow popups for this site to manage your settings.');
      window.removeEventListener('message', onMessage);
    }
  };

  return (
    <div className="space-y-8">
      {/* Live site */}
      <div>
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">LIVE SITE</p>
        {siteUrl ? (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xl font-grotesk font-bold text-vapor hover:text-gold transition-colors"
          >
            <Globe size={18} className="text-gold" />
            {siteUrl.replace('https://', '')}
            <ExternalLink size={14} className="text-vapor/40" />
          </a>
        ) : (
          <p className="text-vapor/50 text-sm">No live site connected yet.</p>
        )}
        {business && (
          <div className="mt-4">
            <StatusBadge status={business.domain_status} label="DOMAIN" />
          </div>
        )}
      </div>

      {/* Connection details */}
      {business && (
        <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-vapor/10">
          <div className="space-y-2">
            <p className="text-xs font-mono-tech tracking-widest text-vapor/40">EMAIL SENDING</p>
            <StatusBadge status={business.email_domain_status} label="DOMAIN" />
            <p className="text-xs text-vapor/40 font-mono-tech">
              {business.email_mode === 'custom' ? 'Custom domain configured' : 'Shared ERA Systems domain'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono-tech tracking-widest text-vapor/40">PHONE</p>
            <p className="text-sm text-vapor/70 font-mono-tech">{business.business_phone || 'Not set'}</p>
          </div>
        </div>
      )}

      {/* Manage site settings — deep-links into the client's own admin Settings tab */}
      <div className="pt-6 border-t border-vapor/10">
        <div className="glass-panel p-6 rounded-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-sm border border-gold/30 flex items-center justify-center shrink-0">
              <Settings size={18} className="text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-grotesk font-bold text-vapor mb-1">Manage site settings</h3>
              <p className="text-vapor/50 text-sm leading-relaxed mb-4">
                Open your site's settings panel to manage your domain, email sending, phone number,
                and branding. You'll land directly in Settings — no separate login.
              </p>
              <button
                onClick={handleManageSite}
                disabled={!siteUrl}
                className={`inline-flex items-center gap-2 px-5 py-3 text-xs font-mono-tech tracking-widest rounded-sm transition-colors ${
                  siteUrl
                    ? 'bg-gold text-obsidian hover:bg-gold-light'
                    : 'border border-vapor/10 text-vapor/30 cursor-not-allowed'
                }`}
              >
                OPEN SITE SETTINGS <ArrowRight size={14} />
              </button>
              {handoffError && (
                <p className="text-red-400 text-xs font-mono-tech mt-3">{handoffError}</p>
              )}
              {!siteUrl && (
                <p className="text-vapor/30 text-xs font-mono-tech mt-3">
                  Available once your site is live.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}