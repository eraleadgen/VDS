import { useState, useEffect, useRef } from 'react';
import { Check, Loader2, Car, ChevronDown, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Lucid',
  'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi',
  'Nissan', 'Polestar', 'Porsche', 'Ram', 'Rivian', 'Rolls-Royce',
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
];

const CURRENT_YEAR = new Date().getFullYear() + 1;
const YEARS = Array.from({ length: CURRENT_YEAR - 1995 + 1 }, (_, i) => String(CURRENT_YEAR - i));

const CLASSIFICATION_LABEL = {
  coupe: 'Coupe',
  sedan: 'Sedan',
  mid_size_suv: 'Mid Size SUV',
  truck_3_row_suv: 'Truck / 3-Row SUV',
};

async function classifyVehicle4(year, make, model) {
  if (!year || !make || !model) return null;
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Classify this vehicle into exactly ONE of these four categories based on its body style and size:

- coupe: 2-door cars, sports cars, convertibles (e.g. Ford Mustang, Porsche 911, Honda Civic Coupe, Subaru BRZ, BMW 2 Series)
- sedan: 4-door passenger cars, mid-size/full-size sedans, hatchbacks, compact cars (e.g. Toyota Camry, Honda Accord, BMW 3 Series, Subaru Impreza, Honda Civic Sedan)
- mid_size_suv: compact SUVs, crossovers, mid-size SUVs, wagons, minivans (e.g. Toyota RAV4, Honda CR-V, Subaru Outback, Subaru Forester, Ford Explorer, Kia Telluride, Honda Odyssey)
- truck_3_row_suv: pickup trucks, full-size SUVs, 3-row SUVs, large vans (e.g. Ford F-150, Chevrolet Silverado, Chevrolet Tahoe, GMC Yukon, Subaru Ascent, Ram 1500, Toyota Tundra)

Vehicle: ${year} ${make} ${model}

Respond with ONLY the category key.`,
      response_json_schema: {
        type: 'object',
        properties: {
          classification: { type: 'string', enum: ['coupe', 'sedan', 'mid_size_suv', 'truck_3_row_suv'] },
        },
      },
    });
    return result?.classification || null;
  } catch (e) {
    console.error('classifyVehicle4 error:', e);
    return null;
  }
}

export default function VehicleSelector({ onSelect, selected = null }) {
  const [year, setYear] = useState(selected?.year || '');
  const [make, setMake] = useState(selected?.make || '');
  const [model, setModel] = useState(selected?.model || '');
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState(selected?.classification || null);
  const initialised = useRef(false);

  // Fetch models when year + make are set (skip initial mount if pre-selected)
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

  // Debounced auto-classification
  useEffect(() => {
    if (!year || !make || !model || model.trim().length < 2) return;
    setClassifying(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const cls = await classifyVehicle4(year, make, model.trim());
      if (cancelled) return;
      setClassification(cls);
      setClassifying(false);
      if (cls) {
        onSelect({ year, make, model: model.trim(), classification: cls });
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [model, year, make, onSelect]);

  const handleYearChange = (val) => {
    setYear(val);
    setModel('');
    setClassification(null);
    onSelect(null);
  };

  const handleMakeChange = (val) => {
    setMake(val);
    setModel('');
    setClassification(null);
    onSelect(null);
  };

  const handleModelInput = (val) => {
    setModel(val);
    if (classification) { setClassification(null); onSelect(null); }
  };

  const handleReset = () => {
    setYear(''); setMake(''); setModel('');
    setModels([]); setClassification(null);
    onSelect(null);
  };

  const selectClass =
    'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-grotesk rounded-sm transition-colors duration-200 appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  const chevron = (disabled) => (
    <ChevronDown
      size={14}
      className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${disabled ? 'text-vapor/20' : 'text-vapor/40'}`}
    />
  );

  return (
    <div>
      {/* Step header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">1</span>
        <h2 className="text-sm font-mono-tech tracking-widest text-gold">ADD YOUR VEHICLE</h2>
        {classification && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1.5 text-xs font-mono-tech tracking-widest text-vapor/40 hover:text-gold transition-colors"
          >
            <RefreshCw size={11} /> CHANGE
          </button>
        )}
      </div>

      {classification && !classifying ? (
        /* Vehicle summary card */
        <div className="flex items-center gap-4 p-5 rounded-sm border border-gold/40 bg-gold/[0.06] vds-card-hover">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
            <Car size={22} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-grotesk font-bold text-vapor truncate">{year} {make} {model}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Check size={11} className="text-gold" />
              <span className="text-xs font-mono-tech tracking-widest text-gold">AUTO-CLASSIFIED: {CLASSIFICATION_LABEL[classification]?.toUpperCase()}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Dropdowns */
        <>
          <p className="text-xs font-mono-tech text-vapor/40 mb-3">Add your vehicle to get started — select year, make, and model.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Year */}
            <div className="relative">
              <select value={year} onChange={e => handleYearChange(e.target.value)} className={selectClass}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {chevron(false)}
            </div>
            {/* Make */}
            <div className="relative">
              <select value={make} onChange={e => handleMakeChange(e.target.value)} disabled={!year} className={selectClass}>
                <option value="">Make</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {chevron(!year)}
            </div>
            {/* Model (datalist combobox — selectable + free-typable) */}
            <div className="relative">
              <input
                list="vs-model-list"
                value={model}
                onChange={e => handleModelInput(e.target.value)}
                disabled={!make || loadingModels}
                placeholder={loadingModels ? 'Loading models...' : (make ? 'Select or type model' : 'Model')}
                className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-grotesk rounded-sm transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-vapor/30"
              />
              <datalist id="vs-model-list">
                {models.map(m => <option key={m} value={m} />)}
              </datalist>
              {loadingModels && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold animate-spin pointer-events-none" />}
              {!loadingModels && chevron(!make)}
            </div>
          </div>

          {/* Classifying indicator */}
          <div className="flex items-center gap-2 h-6 mt-3">
            {classifying ? (
              <>
                <Loader2 size={12} className="text-gold animate-spin" />
                <span className="text-xs font-mono-tech text-vapor/40">Classifying vehicle...</span>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}