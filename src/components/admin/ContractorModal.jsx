import { useState } from 'react';
import { X } from 'lucide-react';

const ALL_SKILLS = ['interior_detail', 'exterior_detail', 'full_detail', 'paint_correction', 'ceramic_coating', 'engine_bay', 'headlight_restoration'];
const SKILL_LABELS = {
  interior_detail: 'Interior', exterior_detail: 'Exterior', full_detail: 'Full Detail',
  paint_correction: 'Paint Correction', ceramic_coating: 'Ceramic Coating', engine_bay: 'Engine Bay', headlight_restoration: 'Headlight Restoration',
};
const DAYS = [
  { key: 'mon', label: 'MON' }, { key: 'tue', label: 'TUE' }, { key: 'wed', label: 'WED' },
  { key: 'thu', label: 'THU' }, { key: 'fri', label: 'FRI' }, { key: 'sat', label: 'SAT' }, { key: 'sun', label: 'SUN' },
];
const TIME_INPUT = 'bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-2 py-2 text-xs font-mono-tech rounded-sm w-24 [color-scheme:dark]';
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
    linked_user_emails: contractor.linked_user_emails || '',
  });
  const [avail, setAvail] = useState(() => {
    const map = {};
    for (const d of DAYS) {
      const ex = (contractor.weekly_availability || []).find(a => a.day === d.key);
      map[d.key] = ex
        ? { available: ex.available, start: ex.start || '', end: ex.end || '' }
        : { available: false, start: '', end: '' };
    }
    return map;
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSkill = (s) => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s] }));
  const toggleDay = (day) => setAvail(p => ({ ...p, [day]: { ...p[day], available: !p[day].available } }));
  const setDayField = (day, field, val) => setAvail(p => ({ ...p, [day]: { ...p[day], [field]: val } }));

  // 12h time options (value = "HH:MM" 24h, label = "h:MM AM/PM")
  const TIME_OPTIONS = (() => {
    const opts = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const period = h < 12 ? 'AM' : 'PM';
        const dispH = h % 12 === 0 ? 12 : h % 12;
        opts.push({ val, label: `${dispH}:${String(m).padStart(2, '0')} ${period}` });
      }
    }
    return opts;
  })();

  const toMin = (t) => { const [h, m] = (t || '').split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null; };
  const weeklyHours = DAYS.reduce((sum, d) => {
    const a = avail[d.key];
    if (!a.available) return sum;
    if (a.start && a.end) {
      const s = toMin(a.start), e = toMin(a.end);
      if (s != null && e != null && e > s) return sum + (e - s) / 60;
    }
    return sum + 8; // blank = all day → standard 8h workday
  }, 0);

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
      linked_user_emails: form.linked_user_emails,
      weekly_availability: DAYS.map(d => ({
        day: d.key,
        available: avail[d.key].available,
        start: avail[d.key].start || undefined,
        end: avail[d.key].end || undefined,
      })),
    }, isNew);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel border border-gold/20 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-grotesk font-bold text-vapor">{isNew ? 'New Specialist' : 'Edit Specialist'}</h3>
          <button onClick={onClose}><X size={18} className="text-vapor/50 hover:text-vapor" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>NAME</label><input value={form.name} onChange={e => set('name', e.target.value)} required className={INPUT} /></div>
            <div><label className={LABEL}>PHONE</label><input value={form.phone} onChange={e => set('phone', e.target.value)} required className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>EMAIL {isNew && <span className="text-gold/60">(used for invite & login)</span>}</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required={isNew} disabled={!isNew} className={INPUT} /></div>
          <div><label className={LABEL}>SHARED PARTNERS <span className="text-gold/40">(comma-separated emails)</span></label>
            <input value={form.linked_user_emails} onChange={e => set('linked_user_emails', e.target.value)} className={INPUT} placeholder="partner@example.com" /></div>
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
            <div className="col-span-2"><label className={LABEL}>SERVICE CITIES (comma separated)</label>
              <input value={form.counties} onChange={e => set('counties', e.target.value)} className={INPUT} placeholder="Alpharetta, Johns Creek, Roswell" /></div>
            <div><label className={LABEL}>MAX TRAVEL (mi)</label><input type="number" value={form.max_travel} onChange={e => set('max_travel', e.target.value)} className={INPUT} /></div>
          </div>
          <div>
            <label className={LABEL}>WEEKLY AVAILABILITY</label>
            <div className="glass-panel border border-vapor/10 rounded-sm p-3 space-y-1">
              {DAYS.map(d => {
                const a = avail[d.key];
                return (
                  <div key={d.key} className="flex items-center gap-3 py-1.5 border-b border-vapor/5 last:border-0">
                    <button type="button" onClick={() => toggleDay(d.key)}
                      className={`w-12 text-xs font-mono-tech tracking-widest px-3 py-2 rounded-sm border transition-colors ${a.available ? 'bg-gold/10 text-gold border-gold/30' : 'bg-vapor/5 text-vapor/40 border-vapor/15'}`}>
                      {d.label}
                    </button>
                    {a.available ? (
                      <div className="flex items-center gap-2 text-xs font-mono-tech text-vapor/50">
                        <span>FROM</span>
                        <select value={a.start} onChange={e => setDayField(d.key, 'start', e.target.value)} className={TIME_INPUT}>
                          <option value="">All day</option>
                          {TIME_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                        <span>TO</span>
                        <select value={a.end} onChange={e => setDayField(d.key, 'end', e.target.value)} className={TIME_INPUT}>
                          <option value="">All day</option>
                          {TIME_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs font-mono-tech text-vapor/30">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono-tech tracking-widest text-vapor/40">WEEKLY CAPACITY</span>
                <span className="text-xs font-mono-tech text-gold">{Math.round(weeklyHours)}h / week</span>
              </div>
              <div className="h-2 bg-asphalt rounded-full overflow-hidden border border-vapor/10">
                <div className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-all duration-500"
                  style={{ width: `${Math.min(100, (weeklyHours / 40) * 100)}%` }} />
              </div>
              <p className="text-[10px] font-mono-tech text-vapor/30 mt-1">Based on times set (blank days count as a standard 8h workday). 40h = full-time.</p>
            </div>
          </div>
          <button type="submit" disabled={busy}
            className="w-full bg-gold text-obsidian py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">
            {busy ? 'SAVING...' : isNew ? 'CREATE SPECIALIST' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
}