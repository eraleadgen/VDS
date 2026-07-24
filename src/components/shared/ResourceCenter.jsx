import { useState } from 'react';
import { Library, Lock } from 'lucide-react';
import CareGuides from '@/components/shared/CareGuides';
import WelcomePacket from '@/components/shared/WelcomePacket';

// Shared Resource Center — wired into Admin, Specialist & Partner portals as a "Resources" tab.
// The Welcome Packet is hidden by default and only revealed after a guide is viewed or downloaded,
// keeping the page focused on the care guide selector until the user takes an action.
// variant: 'admin' | 'specialist' | 'partner'
export default function ResourceCenter({ variant }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-sm flex items-center justify-center border border-gold/40 text-gold bg-gold/10 shrink-0">
          <Library size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-grotesk font-bold text-vapor">Resource Center</h1>
          <p className="text-sm text-vapor/50 font-mono-tech mt-1">Client care guides &amp; printable resources. Print any item to save it as a PDF.</p>
        </div>
      </div>

      <CareGuides compact from={variant} onAction={() => setRevealed(true)} />

      {revealed ? (
        <WelcomePacket variant={variant} />
      ) : (
        <div className="glass-panel border border-vapor/10 rounded-sm p-5 flex items-center gap-3 text-xs font-mono-tech text-vapor/40">
          <Lock size={14} className="text-gold/60" />
          Select a guide above and click VIEW GUIDE or DOWNLOAD to unlock the welcome packet preview.
        </div>
      )}
    </div>
  );
}