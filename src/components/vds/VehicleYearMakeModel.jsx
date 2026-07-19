import { useState, useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export const MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Lucid',
  'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi',
  'Nissan', 'Polestar', 'Porsche', 'Ram', 'Rivian', 'Rolls-Royce',
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
];

const CURRENT_YEAR = new Date().getFullYear() + 1;
export const YEARS = Array.from({ length: CURRENT_YEAR - 1995 + 1 }, (_, i) => String(CURRENT_YEAR - i));

export default function VehicleYearMakeModel({ value, onChange, disabled = false }) {
  const { year, make, model } = value || {};
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (!year || !make) { setModels([]); return; }
    let cancelled = false;
    setLoadingModels(true);
    base44.functions.invoke('vehicleDatabase', { action: 'models', year, make })
      .then(res => {
        if (cancelled) return;
        const d = res?.data || res;
        setModels(d.models || []);
      })
      .catch(() => { if (!cancelled) setModels([]); })
      .finally(() => { if (!cancelled) setLoadingModels(false); });
    return () => { cancelled = true; };
  }, [year, make]);

  const selectClass =
    'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-grotesk rounded-sm transition-colors duration-200 appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  const inputClass =
    'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-grotesk rounded-sm transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-vapor/30';
  const chevron = (d) => (
    <ChevronDown
      size={14}
      className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${d ? 'text-vapor/20' : 'text-vapor/40'}`}
    />
  );

  const handleYearChange = (val) => onChange({ year: val, make: '', model: '' });
  const handleMakeChange = (val) => onChange({ year, make: val, model: '' });
  const handleModelInput = (val) => onChange({ year, make, model: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="relative">
        <select value={year} onChange={e => handleYearChange(e.target.value)} disabled={disabled} className={selectClass}>
          <option value="">Year</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {chevron(false)}
      </div>
      <div className="relative">
        <select value={make} onChange={e => handleMakeChange(e.target.value)} disabled={disabled || !year} className={selectClass}>
          <option value="">Make</option>
          {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {chevron(disabled || !year)}
      </div>
      <div className="relative">
        <input
          list="vymm-model-list"
          value={model}
          onChange={e => handleModelInput(e.target.value)}
          disabled={disabled || !make || loadingModels}
          placeholder={loadingModels ? 'Loading models...' : (make ? 'Select or type model' : 'Model')}
          className={inputClass}
        />
        <datalist id="vymm-model-list">
          {models.map(m => <option key={m} value={m} />)}
        </datalist>
        {loadingModels && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold animate-spin pointer-events-none" />}
        {!loadingModels && chevron(disabled || !make)}
      </div>
    </div>
  );
}