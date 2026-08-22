import React from 'react';
import { ExternalLink } from 'lucide-react';

// Unlocked operational tab. Operational modules deep-link to the member's live admin
// dashboard (their own domain), where all their data and branding live.
// Settings tab gets a special Documents section here instead of a standalone Resources tab.
const DOCS = [
  { label: 'ERA Systems Service Agreement', desc: 'Your signed service contract with ERA Systems LLC.' },
  { label: 'Terms of Service (Your Site)', desc: 'Standard ToS ERA Systems drafted for your customer-facing site.' },
  { label: 'Privacy Policy (Your Site)', desc: 'Standard privacy policy for your customer-facing site.' },
  { label: 'Liability Waiver', desc: 'Liability disclaimer for services performed by your business.' },
];

export default function EraPortalOpsTab({ tab, siteUrl }) {
  const dashUrl = siteUrl ? `${siteUrl}/admin?tab=${tab.key}` : null;

  if (tab.key === 'settings') {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-[10px] font-mono-tech tracking-[0.3em] text-gold/70 mb-1">OPERATIONS</p>
          <h1 className="text-3xl font-grotesk font-bold text-vapor">SETTINGS</h1>
        </div>
        {dashUrl && (
          <div className="rounded-md border border-vapor/10 bg-asphalt/40 p-5 flex items-center justify-between gap-4">
            <p className="text-vapor text-sm">Manage business settings, automations, and integrations on your live dashboard.</p>
            <a href={dashUrl} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-gold/40 text-gold text-xs font-mono-tech hover:bg-gold hover:text-obsidian transition-colors">
              OPEN SETTINGS <ExternalLink size={13} />
            </a>
          </div>
        )}
        <div>
          <p className="text-xs font-mono-tech tracking-[0.2em] text-gold/70 mb-4">DOCUMENTS</p>
          <div className="space-y-3">
            {DOCS.map(d => (
              <div key={d.label} className="rounded-md border border-vapor/10 bg-asphalt/40 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-vapor text-sm font-medium">{d.label}</p>
                  <p className="text-vapor/50 text-xs mt-0.5">{d.desc}</p>
                </div>
                <span className="shrink-0 text-vapor/30 text-xs font-mono-tech">COMING SOON</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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