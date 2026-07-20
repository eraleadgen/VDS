import { Check } from 'lucide-react';

const CONDITION_IMAGES = {
  light: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/8f156a44a_generated_image.png',
  moderate: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/3e0d6c61e_generated_image.png',
  heavy: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/8be897528_generated_image.png',
};

export default function ConditionSelector({ conditions, value, onChange }) {
  if (!conditions || conditions.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-mono-tech text-vapor/40 mb-3">Match your vehicle to the reference photos below.</p>
      <div className="grid grid-cols-3 gap-3">
        {conditions.map(c => (
          <button key={c.key} type="button" onClick={() => onChange(c.key)}
            className={`relative rounded-sm border overflow-hidden text-left transition-all vds-card-hover ${value === c.key ? 'border-gold ring-1 ring-gold' : 'border-vapor/10 bg-asphalt/40 hover:border-vapor/30'}`}>
            {value === c.key && (
              <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                <Check size={13} className="text-obsidian" />
              </span>
            )}
            {CONDITION_IMAGES[c.key] && (
              <div className="aspect-square w-full overflow-hidden bg-asphalt">
                <img src={CONDITION_IMAGES[c.key]} alt={`${c.label} condition reference`} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-3">
              <span className={`block text-sm font-grotesk ${value === c.key ? 'text-vapor' : 'text-vapor/80'}`}>{c.label}</span>
              <span className="text-xs font-mono-tech text-vapor/40 mt-0.5 block">{c.multiplier > 1 ? `+${Math.round((c.multiplier - 1) * 100)}%` : 'Base rate'}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs font-mono-tech text-vapor/40 mt-3 leading-relaxed">
        By selecting a vehicle condition, you acknowledge that your quote is based on the condition provided. If a VDS specialist determines the vehicle is in worse or different condition than stated at the time of service, VDS Mobile reserves the right to adjust pricing according to the actual condition.
      </p>
    </div>
  );
}