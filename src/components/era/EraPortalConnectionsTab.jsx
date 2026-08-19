// Era Portal — Website & Connections tab.
// Phase E1: renders the live-site URL + domain/email status from the provisioned summary.
// Phase E4 will add the "Manage site settings" button that deep-links into the client's
// own admin dashboard Settings tab via the postMessage SSO handoff (no duplicated UI).
import { Globe, Mail, Phone, ExternalLink, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

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

  return (
    <div className="space-y-8">
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

      {business && (
        <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-vapor/10">
          <div className="space-y-2">
            <p className="text-xs font-mono-tech tracking-widest text-vapor/40">EMAIL</p>
            <StatusBadge status={business.email_domain_status} label="SENDING" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono-tech tracking-widest text-vapor/40">PHONE</p>
            <p className="text-sm text-vapor/70 font-mono-tech">{business.business_phone || 'Not set'}</p>
          </div>
        </div>
      )}

      <p className="text-vapor/50 text-sm max-w-lg pt-4">
        A direct link into your site's settings panel — to manage domain, email, phone, and
        branding — will appear here.
      </p>
    </div>
  );
}