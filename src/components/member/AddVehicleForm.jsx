import { useState, useEffect, useRef } from 'react';
import { Plus, Save, X, Loader2, ChevronDown } from 'lucide-react';
import VehicleYearMakeModel from '../vds/VehicleYearMakeModel';
import { classifyVehicle4, CLASSIFICATION_LABEL, defaultPricingGroupFor } from '@/lib/vehicleClassification';
import { useBusinessConfig } from '@/lib/BusinessConfigContext';

const inputClass = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const labelClass = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

export default function AddVehicleForm({ onAdd, onCancel, initialData = null }) {
  const [form, setForm] = useState(
    initialData
      ? { year: initialData.year || '', make: initialData.make || '', model: initialData.model || '', color: initialData.color || '', license_plate: initialData.license_plate || '', notes: initialData.notes || '', vehicle_classification: initialData.vehicle_classification || '', vehicle_type: initialData.vehicle_type || '', is_gold_registered: initialData.is_gold_registered || false, vehicle_image: initialData.vehicle_image || '' }
      : { year: '', make: '', model: '', color: '', license_plate: '', notes: '', vehicle_classification: '', vehicle_type: '', is_gold_registered: false, vehicle_image: '' }
  );
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const initialised = useRef(false);

  const isEdit = !!initialData;

  // Classification options come from BusinessConfig (hatchback + other included); 'Other' is
  // always selectable even before the config classifications are seeded.
  const config = useBusinessConfig();
  const baseClassifications = config?.vehicle_classifications || [];
  const classifications = baseClassifications.some(c => c.key === 'other')
    ? baseClassifications
    : [...baseClassifications, { key: 'other', label: 'Other' }];
  const mapping = config?.classification_to_pricing_group || {};
  const pricingGroupFor = (cls) => mapping[cls] || defaultPricingGroupFor(cls) || '';

  // Debounced auto-classification into the 4 operational classifications
  useEffect(() => {
    if (!form.year || !form.make || !form.model || form.model.trim().length < 2) return;
    // Skip re-classification on mount if editing an already-classified vehicle
    if (!initialised.current && form.vehicle_classification && initialData?.model && initialData.model.trim() === form.model.trim()) {
      initialised.current = true;
      return;
    }
    initialised.current = true;
    setClassifying(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const cls = await classifyVehicle4(form.year, form.make, form.model.trim());
      if (cancelled) return;
      if (cls) {
        setForm(f => ({ ...f, vehicle_classification: cls, vehicle_type: defaultPricingGroupFor(cls) || '' }));
      }
      setClassifying(false);
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.model, form.year, form.make]);

  const handleYmmChange = (next) => {
    setForm(f => ({ ...f, ...next, vehicle_classification: '', vehicle_type: '' }));
  };

  const handleSubmit = async () => {
    if (!form.year || !form.make || !form.model) return;
    setLoading(true);
    await onAdd(form);
    setLoading(false);
  };

  const classificationLabel = form.vehicle_classification ? CLASSIFICATION_LABEL[form.vehicle_classification] : null;

  return (
    <div className="glass-panel border border-gold/20 p-6 rounded-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-mono-tech tracking-widest text-gold">{isEdit ? 'EDIT VEHICLE' : 'ADD VEHICLE'}</p>
        <button type="button" onClick={onCancel} className="text-vapor/30 hover:text-vapor transition-colors">
          <X size={16} />
        </button>
      </div>

      <VehicleYearMakeModel value={{ year: form.year, make: form.make, model: form.model }} onChange={handleYmmChange} />

      {/* Vehicle classification indicator */}
      <div className="flex items-center gap-2 h-6">
        {classifying ? (
          <>
            <Loader2 size={12} className="text-gold animate-spin" />
            <span className="text-xs font-mono-tech text-vapor/40">Classifying vehicle...</span>
          </>
        ) : classificationLabel ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-xs font-mono-tech text-gold tracking-widest">AUTO-CLASSIFIED: {classificationLabel.toUpperCase()}</span>
          </>
        ) : null}
      </div>

      {/* Manual classification override (auto-classification sets the default; user can change,
          including selecting 'Other' for vehicles that don't fit a standard class). */}
      <div>
        <label className={labelClass}>VEHICLE CLASSIFICATION</label>
        <div className="relative">
          <select
            value={form.vehicle_classification}
            onChange={e => {
              const cls = e.target.value;
              setForm(f => ({ ...f, vehicle_classification: cls, vehicle_type: pricingGroupFor(cls) }));
            }}
            className={`${inputClass} appearance-none cursor-pointer pr-10`}
          >
            <option value="">Select classification</option>
            {classifications.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-vapor/40" />
        </div>
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