import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';

// Locked operational tab. Two lock reasons:
//   tierLocked   — the member's plan doesn't include this module (upgrade to unlock)
//   reviewLocked — the 24h ERA provisioning review hasn't been approved yet
export default function EraPortalLockedTab({ tab, reviewDeadline, onNavigate }) {
  const tierLocked = tab.tierLocked;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono-tech tracking-[0.3em] text-gold/70 mb-1">OPERATIONS</p>
        <h1 className="text-3xl font-grotesk font-bold text-vapor/60">{tab.label}</h1>
      </div>
      <div className="rounded-md border border-vapor/10 bg-asphalt/40 p-8 text-center">
        <Lock size={32} className="text-vapor/30 mx-auto mb-4" />
        {tierLocked ? (
          <>
            <p className="text-vapor mb-1">{tab.label} is included in {tab.minTierName} and above.</p>
            <p className="text-vapor/50 text-sm mb-6">Upgrade your plan to unlock this module.</p>
            <button onClick={() => onNavigate('plan')} className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-gold/40 text-gold text-xs font-mono-tech tracking-widest hover:bg-gold hover:text-obsidian transition-colors">
              UPGRADE PLAN <ArrowRight size={14} />
            </button>
          </>
        ) : (
          <>
            <p className="text-vapor mb-1">Pending ERA review.</p>
            <p className="text-vapor/50 text-sm mb-2">This unlocks once ERA Systems approves your site — usually within 24 hours.</p>
            {reviewDeadline && <p className="text-vapor/40 text-xs font-mono-tech">Review window in progress</p>}
          </>
        )}
      </div>
    </div>
  );
}