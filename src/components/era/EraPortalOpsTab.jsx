import React from 'react';
import { ExternalLink } from 'lucide-react';

// Unlocked operational tab. The operational data, branding, and config live on the
// member's own tenant domain (not eraleadgen.com, which resolves to the era_systems
// tenant), so an unlocked module deep-links to their live admin dashboard.
export default function EraPortalOpsTab({ tab, siteUrl }) {
  const dashUrl = siteUrl ? `${siteUrl}/admin?tab=${tab.key}` : null;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono-tech tracking-[0.3em] text-gold/70 mb-1">OPERATIONS</p>
        <h1 className="text-3xl font-grotesk font-bold text-vapor">{tab.label}</h1>
      </div>
      <div className="rounded-md border border-vapor/10 bg-asphalt/40 p-8 text-center">
        <tab.icon size={32} className="text-gold/60 mx-auto mb-4" />
        <p className="text-vapor mb-1">{tab.label} is part of your operations dashboard.</p>
        <p className="text-vapor/50 text-sm mb-6">Manage it on your live site — your data, domain, and branding live there.</p>
        {dashUrl ? (
          <a href={dashUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-gold/40 text-gold text-xs font-mono-tech tracking-widest hover:bg-gold hover:text-obsidian transition-colors">
            OPEN {tab.label} <ExternalLink size={14} />
          </a>
        ) : (
          <p className="text-vapor/40 text-sm font-mono-tech">Your site is still provisioning.</p>
        )}
      </div>
    </div>
  );
}