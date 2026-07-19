import { useState, useEffect, useRef } from 'react';
import { Plus, Save, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import VehicleYearMakeModel from '../vds/VehicleYearMakeModel';

async function classifyVehicle(year, make, model) {
  if (!year || !make || !model) return null;
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Classify this vehicle as either "sedan_coupe" or "truck_suv".

Rules:
- sedan_coupe: 2-door cars, coupes, convertibles, small/mid-size sedans (e.g. Honda Civic, BMW 3 Series, Ford Mustang, Porsche 911, Toyota Camry, Chevrolet Malibu)
- truck_suv: pickup trucks, full-size SUVs, compact SUVs, crossovers, minivans, wagons (e.g. Ford F-150, Toyota RAV4, Honda CR-V, Chevrolet Tahoe, Toyota Highlander, Subaru Outback, Honda Odyssey, Jeep Wrangler)

Vehicle: ${year} ${make} ${model}

Respond with ONLY one of these exact strings: sedan_coupe or truck_suv`,
    response_json_schema: {
      type: 'object',
      properties: { vehicle_type: { type: 'string', enum: ['sedan_coupe', 'truck_suv'] } }
    }
  });
  return result?.vehicle_type || null;
}

const inputClass = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const labelClass = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

export default function AddVehicleForm({ onAdd, onCancel, initialData = null }) {
  const [form, setForm] = useState(
    initialData
      ? { year: initialData.year || '', make: initialData.make || '', model: initialData.model || '', color: initialData.color || '', license_plate: initialData.license_plate || '', notes: initialData.notes || '', vehicle_type: initialData.vehicle_type || '', is_gold_registered: initialData.is_gold_registered || false, vehicle_image: initialData.vehicle_image || '' }
      : { year: '', make: '', model: '', color: '', license_plate: '', notes: '', vehicle_type: '', is_gold_registered: false, vehicle_image: '' }
  );
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const initialised = useRef(false);

  const isEdit = !!initialData;

  // Debounced auto-classification
  useEffect(() => {
    if (!form.year || !form.make || !form.model || form.model.trim().length < 2) return;
    // Skip re-classification on mount if editing an already-classified vehicle
    if (!initialised.current && form.vehicle_type && initialData?.model && initialData.model.trim() === form.model.trim()) {
      initialised.current = true;
      return;
    }
    initialised.current = true;
    setClassifying(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const vt = await classifyVehicle(form.year, form.make, form.model.trim());
      if (cancelled) return;
      if (vt) setForm(f => ({ ...f, vehicle_type: vt }));
      setClassifying(false);
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.model, form.year, form.make]);

  const handleYmmChange = (next) => {
    setForm(f => ({ ...f, ...next, vehicle_type: '' }));
  };

  const handleSubmit = async () => {
    if (!form.year || !form.make || !form.model) return;
    setLoading(true);
    await onAdd(form);
    setLoading(false);
  };

  const vehicleTypeLabel = form.vehicle_type === 'sedan_coupe' ? 'Sedan / Coupe' : form.vehicle_type === 'truck_suv' ? 'Truck / SUV' : null;

  return (
    <div className="glass-panel border border-gold/20 p-6 rounded-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-mono-tech tracking-widest text-gold">{isEdit ? 'EDIT VEHICLE' : 'ADD VEHICLE'}</p>
        <button type="button" onClick={onCancel} className="text-vapor/30 hover:text-vapor transition-colors">
          <X size={16} />
        </button>
      </div>

      <VehicleYearMakeModel value={{ year: form.year, make: form.make, model: form.model }} onChange={handleYmmChange} />

      {/* Vehicle type classification indicator */}
      <div className="flex items-center gap-2 h-6">
        {classifying ? (
          <>
            <Loader2 size={12} className="text-gold animate-spin" />
            <span className="text-xs font-mono-tech text-vapor/40">Classifying vehicle...</span>
          </>
        ) : vehicleTypeLabel ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-mono-tech text-gold tracking-widest">AUTO-CLASSIFIED: {vehicleTypeLabel.toUpperCase()}</span>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>COLOR</label>
          <input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Guards Red" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>LICENSE PLATE</label>
          <input type="text" value={form.license_plate} onChange={e => setForm({ ...form, license_plate: e.target.value })} placeholder="ABC-1234" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>NOTES (OPTIONAL)</label>
        <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. ceramic coated, park in garage" className={inputClass} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || classifying || !form.year || !form.make || !form.model}
          className="flex items-center gap-2 bg-vapor text-obsidian px-6 py-3 text-xs font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm disabled:opacity-50"
        >
          {isEdit ? <><Save size={13} /> {loading ? 'SAVING...' : 'SAVE CHANGES'}</> : <><Plus size={13} /> {loading ? 'SAVING...' : 'ADD VEHICLE'}</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-vapor/20 text-vapor/50 text-xs font-mono-tech tracking-widest hover:border-vapor/40 transition-colors rounded-sm"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}