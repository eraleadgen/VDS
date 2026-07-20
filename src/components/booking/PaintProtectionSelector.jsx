import { Check } from 'lucide-react';

export default function PaintProtectionSelector({ value, onChange }) {
  const active = value && value !== 'none';
  return (
    <div>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">PAINT PROTECTION (OPTIONAL)</p>
      <p className="text-xs font-mono-tech text-vapor/30 mb-3">Does this vehicle already have PPF or ceramic coating? Vehicles with paint protection receive 20% off the detail.</p>
      <button type="button" onClick={() => onChange(active ? 'none' : 'paint_protection')}
        className={`flex items-center justify-between gap-3 p-4 rounded-sm border text-left transition-all w-full ${active ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${active ? 'bg-gold border-gold' : 'border-vapor/30'}`}>
            {active && <Check size={13} className="text-obsidian" />}
          </span>
          <div>
            <span className="text-sm text-vapor font-grotesk block">Paint Protection (PPF or Ceramic Coating)</span>
            <span className="text-xs font-mono-tech text-gold/60">20% off detail</span>
          </div>
        </div>
        <span className="text-xs font-mono-tech tracking-widest shrink-0 text-gold/60">{active ? '✓ APPLIED' : 'SELECT'}</span>
      </button>
    </div>
  );
}