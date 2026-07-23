import { Library } from 'lucide-react';
import CareGuides from '@/components/shared/CareGuides';
import WelcomePacket from '@/components/shared/WelcomePacket';

// Shared Resource Center — wired into Admin, Specialist & Partner portals as a "Resources" tab.
// variant: 'admin' | 'specialist' | 'partner'
export default function ResourceCenter({ variant }) {
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

      <CareGuides compact />
      <WelcomePacket variant={variant} />
    </div>
  );
}