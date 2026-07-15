import { useState } from 'react';
import { X } from 'lucide-react';

const ALL_SKILLS = ['interior_detail', 'exterior_detail', 'full_detail', 'paint_correction', 'ceramic_coating', 'engine_bay', 'headlight_restoration'];
const SKILL_LABELS = {
  interior_detail: 'Interior', exterior_detail: 'Exterior', full_detail: 'Full Detail',
  paint_correction: 'Paint Correction', ceramic_coating: 'Ceramic Coating', engine_bay: 'Engine Bay', headlight_restoration: 'Headlight Restoration',
};
const INPUT = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const LABEL = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

export default function ContractorModal({ contractor, onClose, onSave, busy }) {
  const isNew = !contractor.id;
  const [form, setForm] = useState({
    name: contractor.name || '',
    phone: contractor.phone || '',
    email: contractor.email || '',
    status: contractor.status || 'active',
    is_enabled: contractor.is_enabled !== false,
    skills: contractor.skills || [],
    counties: (contractor.service_areas?.counties || []).join(', '),
    max_travel: contractor.service_areas?.max_travel_distance_miles || 0,
    home_address: contractor.home_address || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSkill = (s) => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s] }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name,
      phone: form.phone,
      email: form.email,
      status: form.status,
      is_enabled: form.is_enabled,
      skills: form.skills,
      service_areas: {
        counties: form.counties.split(',').map(s => s.trim()).filter(Boolean),
        max_travel_distance_miles: Number(form.max_travel) || 0,
      },
      home_address: form.home_address,
    }, isNew);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel border border-gold/20 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-grotesk font-bold text-vapor">{isNew ? 'New Contractor' : 'Edit Contractor'}</h3>
          <button onClick={onClose}><X size={18} className="text-vapor/50 hover:text-vapor" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>NAME</label><input value={form.name} onChange={e => set('name', e.target.value)} required className={INPUT} /></div>
            <div><label className={LABEL}>PHONE</label><input value={form.phone} onChange={e => set('phone', e.target.value)} required className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>EMAIL {isNew && <span className="text-gold/60">(will be invited as contractor)</span>}</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required={isNew} disabled={!isNew} className={INPUT} /></div>
          <div><label className={LABEL}>HOME ADDRESS</label><input value={form.home_address} onChange={e => set('home_address', e.target.value)} className={INPUT} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>STATUS</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={INPUT}>
                <option value="active">Active</option><option value="vacation">Vacation</option><option value="offline">Offline</option>
              </select>
            </div>
            <div><label className={LABEL}>ENABLED</label>
              <select value={form.is_enabled ? 'yes' : 'no'} onChange={e => set('is_enabled', e.target.value === 'yes')} className={INPUT}>
                <option value="yes">Enabled</option><option value="no">Disabled</option>
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>SKILLS</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map(s => (
                <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className={`text-xs font-mono-tech px-3 py-1.5 rounded-sm border transition-colors ${form.skills.includes(s) ? 'bg-gold/10 text-gold border-gold/30' : 'bg-vapor/5 text-vapor/40 border-vapor/15'}`}>
                  {SKILL_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><label className={LABEL}>SERVICE COUNTIES (comma separated)</label>
              <input value={form.counties} onChange={e => set('counties', e.target.value)} className={INPUT} placeholder="Orange, Seminole" /></div>
            <div><label className={LABEL}>MAX TRAVEL (mi)</label><input type="number" value={form.max_travel} onChange={e => set('max_travel', e.target.value)} className={INPUT} /></div>
          </div>
          <button type="submit" disabled={busy}
            className="w-full bg-gold text-obsidian py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">
            {busy ? 'SAVING...' : isNew ? 'CREATE CONTRACTOR' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
}