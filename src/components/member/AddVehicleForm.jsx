import { useState } from 'react';
import { Plus, Save, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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

export default function AddVehicleForm({ onAdd, onCancel, initialData = null }) {
  const [form, setForm] = useState(
    initialData
      ? { year: initialData.year || '', make: initialData.make || '', model: initialData.model || '', color: initialData.color || '', license_plate: initialData.license_plate || '', notes: initialData.notes || '', vehicle_type: initialData.vehicle_type || '', is_gold_registered: initialData.is_gold_registered || false, vehicle_image: initialData.vehicle_image || '' }
      : { year: '', make: '', model: '', color: '', license_plate: '', notes: '', vehicle_type: '', is_gold_registered: false, vehicle_image: '' }
  );
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isEdit = !!initialData;

  const handleClassify = async () => {
    if (!form.year || !form.make || !form.model) return;
    setClassifying(true);
    const vt = await classifyVehicle(form.year, form.make, form.model);
    if (vt) setForm(f => ({ ...f, vehicle_type: vt }));
    setClassifying(false);
  };

  const handleModelBlur = () => handleClassify();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, vehicle_image: file_url }));
    setUploadingImage(false);
  };

  const handleSubmit = async () => {
    if (!form.year || !form.make || !form.model) return;
    setLoading(true);
    await onAdd(form);
    setLoading(false);
  };

  const field = (key, label, placeholder, required = false, onBlur) => (
    <div>
      <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        onBlur={onBlur}
        required={required}
        placeholder={placeholder}
        className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
      />
    </div>
  );

  const vehicleTypeLabel = form.vehicle_type === 'sedan_coupe' ? 'Sedan / Coupe' : form.vehicle_type === 'truck_suv' ? 'Truck / SUV' : null;

  return (
    <div className="glass-panel border border-gold/20 p-6 rounded-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-mono-tech tracking-widest text-gold">{isEdit ? 'EDIT VEHICLE' : 'ADD VEHICLE'}</p>
        <button type="button" onClick={onCancel} className="text-vapor/30 hover:text-vapor transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('year', 'YEAR', '2022', true)}
        {field('make', 'MAKE', 'Porsche', true)}
        {field('model', 'MODEL', '911', true, handleModelBlur)}
      </div>

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
        {field('color', 'COLOR', 'Guards Red')}
        {field('license_plate', 'LICENSE PLATE', 'ABC-1234')}
      </div>
      {field('notes', 'NOTES (OPTIONAL)', 'e.g. ceramic coated, park in garage')}
      
      {/* Vehicle Image Upload */}
      <div>
        <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">VEHICLE PHOTO (OPTIONAL)</label>
        <div className="border border-vapor/10 rounded-sm p-4 bg-asphalt/50">
          {form.vehicle_image ? (
            <div className="relative">
              <img src={form.vehicle_image} alt="Vehicle" className="w-full h-48 object-cover rounded-sm mb-3" />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, vehicle_image: '' }))}
                className="absolute top-2 right-2 bg-obsidian/80 text-vapor/70 hover:text-vapor p-2 rounded-sm transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-vapor/20 hover:border-gold/50 transition-colors cursor-pointer rounded-sm">
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="text-gold animate-spin" />
                  <span className="text-xs font-mono-tech text-vapor/40">UPLOADING...</span>
                </div>
              ) : (
                <>
                  <Plus size={24} className="text-vapor/30 mb-2" />
                  <span className="text-xs font-mono-tech text-vapor/40">CLICK TO UPLOAD VEHICLE PHOTO</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
            </label>
          )}
        </div>
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