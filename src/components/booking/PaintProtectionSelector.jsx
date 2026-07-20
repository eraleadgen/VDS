import { Check } from 'lucide-react';

const OPTIONS = [
  { key: 'none', label: 'No Paint Protection', desc: 'Standard pricing' },
  { key: 'ppf', label: 'PPF', desc: 'Paint Protection Film · 20% off detail' },
  { key: 'ceramic_coating', label: 'Ceramic Coating', desc: '20% off detail' },
];

export default function PaintProtectionSelector({ value, onChange }) {
  return (
    <div>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">PAINT PROTECTION (OPTIONAL)</p>
      <p className="text-xs font-mono-tech text-vapor/30 mb-3">Does this vehicle already have paint protection? Vehicles with PPF or ceramic coating receive 20% off the detail.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {OPTIONS.map(o => (
          <button key={o.key} type="button" onClick={() => onChange(o.key)}
            className={`relative p-4 rounded-sm border text-left transition-all ${value === o.key ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
            {value === o.key && (
              <span className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                <Check size={12} className="text-obsidian" />
              </span>
            )}
            <span className={`block text-sm font-grotesk ${value === o.key ? 'text-vapor' : 'text-vapor/80'}`}>{o.label}</span>
            <span className="text-xs font-mono-tech text-gold/60 mt-0.5 block">{o.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}