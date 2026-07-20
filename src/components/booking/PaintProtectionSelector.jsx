const OPTIONS = [
  { key: 'none', label: 'No Paint Protection' },
  { key: 'ppf', label: 'PPF (20% off)' },
  { key: 'ceramic_coating', label: 'Ceramic Coating (20% off)' },
];

export default function PaintProtectionSelector({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">PAINT PROTECTION (OPTIONAL)</label>
      <p className="text-xs font-mono-tech text-vapor/30 mb-3">Vehicles with PPF or ceramic coating receive 20% off the detail.</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors cursor-pointer pr-10"
        >
          {OPTIONS.map(o => (
            <option key={o.key} value={o.key} className="bg-asphalt text-vapor">{o.label}</option>
          ))}
        </select>
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold/60" width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}