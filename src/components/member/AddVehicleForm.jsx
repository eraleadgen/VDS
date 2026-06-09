import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';

export default function AddVehicleForm({ onAdd, onCancel, initialData = null }) {
  const [form, setForm] = useState(
    initialData
      ? { year: initialData.year || '', make: initialData.make || '', model: initialData.model || '', color: initialData.color || '', license_plate: initialData.license_plate || '', notes: initialData.notes || '' }
      : { year: '', make: '', model: '', color: '', license_plate: '', notes: '' }
  );
  const [loading, setLoading] = useState(false);

  const isEdit = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onAdd(form);
    setLoading(false);
  };

  const field = (key, label, placeholder, required = false) => (
    <div>
      <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        required={required}
        placeholder={placeholder}
        className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="glass-panel border border-gold/20 p-6 rounded-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-mono-tech tracking-widest text-gold">{isEdit ? 'EDIT VEHICLE' : 'ADD VEHICLE'}</p>
        <button type="button" onClick={onCancel} className="text-vapor/30 hover:text-vapor transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {field('year', 'YEAR', '2022', true)}
        {field('make', 'MAKE', 'Porsche', true)}
        {field('model', 'MODEL', '911', true)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('color', 'COLOR', 'Guards Red')}
        {field('license_plate', 'LICENSE PLATE', 'ABC-1234')}
      </div>
      {field('notes', 'NOTES (OPTIONAL)', 'e.g. ceramic coated, park in garage')}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
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
    </form>
  );
}