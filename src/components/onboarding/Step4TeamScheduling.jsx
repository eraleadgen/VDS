import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const SKILL_OPTIONS = ['interior_detail', 'exterior_detail', 'full_detail', 'paint_correction', 'ceramic_coating', 'engine_bay', 'headlight_restoration'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function Step4TeamScheduling({ data, planTier, onNext, onBack, saving }) {
  const [form, setForm] = useState(data || {});
  const isFoundation = planTier === 'foundation';

  useEffect(() => { setForm(data || {}); }, [data]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateRule = (key, val) => setForm((f) => ({ ...f, scheduling_rules: { ...(f.scheduling_rules || {}), [key]: val } }));

  // Technicians (Basic)
  const updateTech = (idx, field, val) => {
    const list = [...(form.technicians || [])];
    list[idx] = { ...list[idx], [field]: val };
    update('technicians', list);
  };
  const addTech = () => update('technicians', [...(form.technicians || []), { name: '', phone: '', email: '', color: '#D4AF37' }]);
  const removeTech = (idx) => update('technicians', (form.technicians || []).filter((_, i) => i !== idx));

  // Specialists (Foundation)
  const updateSpecialist = (idx, field, val) => {
    const list = [...(form.specialists || [])];
    list[idx] = { ...list[idx], [field]: val };
    update('specialists', list);
  };
  const addSpecialist = () => update('specialists', [...(form.specialists || []), { name: '', phone: '', email: '', skills: [], weekly_availability: DAYS.map((d) => ({ day: d, available: d !== 'sat' && d !== 'sun', start: '09:00', end: '17:00' })), service_areas: {} }]);
  const removeSpecialist = (idx) => update('specialists', (form.specialists || []).filter((_, i) => i !== idx));
  const toggleSkill = (sIdx, skill) => {
    const list = [...(form.specialists || [])];
    const skills = list[sIdx].skills || [];
    updateSpecialist(sIdx, 'skills', skills.includes(skill) ? skills.filter((s) => s !== skill) : [...skills, skill]);
  };
  const toggleAvailDay = (sIdx, dayKey) => {
    const list = [...(form.specialists || [])];
    const avail = [...(list[sIdx].weekly_availability || [])];
    const idx = avail.findIndex((a) => a.day === dayKey);
    if (idx >= 0) avail[idx] = { ...avail[idx], available: !avail[idx].available };
    updateSpecialist(sIdx, 'weekly_availability', avail);
  };

  const ruleFields = [
    { key: 'booking_buffer_hours', label: 'Booking Buffer (hours)', default: 24 },
    { key: 'min_notice_hours', label: 'Minimum Notice (hours)', default: 24 },
    { key: 'cancellation_hours', label: 'Cancellation Window (hours)', default: 48 },
    { key: 'slot_interval_minutes', label: 'Slot Interval (minutes)', default: 60 },
    { key: 'max_bookings_per_day', label: 'Max Bookings Per Day', default: 4 },
  ];

  return (
    <div className="space-y-8">
      {/* Scheduling Rules */}
      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider mb-3 block">SCHEDULING RULES</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ruleFields.map((r) => (
            <div key={r.key}>
              <Label className="text-vapor/60 text-xs">{r.label}</Label>
              <Input type="number" value={(form.scheduling_rules || {})[r.key] ?? r.default} onChange={(e) => updateRule(r.key, parseInt(e.target.value) || 0)} className="bg-asphalt border-vapor/15 text-vapor mt-1 text-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        {isFoundation ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">SPECIALISTS</Label>
              <button type="button" onClick={addSpecialist} className="text-gold text-xs font-mono-tech flex items-center gap-1 hover:text-gold-light"><Plus size={14} /> Add Specialist</button>
            </div>
            <div className="space-y-3">
              {(form.specialists || []).map((s, idx) => (
                <div key={idx} className="border border-vapor/10 rounded-sm p-3 bg-asphalt/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input value={s.name || ''} onChange={(e) => updateSpecialist(idx, 'name', e.target.value)} placeholder="Name" className="bg-asphalt border-vapor/15 text-vapor text-sm flex-1" />
                    <Input value={s.phone || ''} onChange={(e) => updateSpecialist(idx, 'phone', e.target.value)} placeholder="Phone" className="bg-asphalt border-vapor/15 text-vapor text-sm w-36" />
                    <Input value={s.email || ''} onChange={(e) => updateSpecialist(idx, 'email', e.target.value)} placeholder="Email" className="bg-asphalt border-vapor/15 text-vapor text-sm w-48" />
                    <button type="button" onClick={() => removeSpecialist(idx)} className="text-vapor/30 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {SKILL_OPTIONS.map((skill) => {
                      const selected = (s.skills || []).includes(skill);
                      return (
                        <button key={skill} type="button" onClick={() => toggleSkill(idx, skill)} className={`px-2 py-1 rounded-sm text-xs font-mono-tech border transition-colors ${selected ? 'bg-gold/20 border-gold text-gold' : 'bg-asphalt border-vapor/15 text-vapor/40'}`}>
                          {skill.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                  {/* Weekly Availability */}
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((day) => {
                      const avail = (s.weekly_availability || []).find((a) => a.day === day) || {};
                      return (
                        <button key={day} type="button" onClick={() => toggleAvailDay(idx, day)} className={`py-1.5 rounded-sm text-xs font-mono-tech uppercase border transition-colors ${avail.available ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-asphalt border-vapor/10 text-vapor/30'}`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {(!form.specialists || form.specialists.length === 0) && <p className="text-vapor/40 text-xs text-center py-4">No specialists added yet.</p>}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">TECHNICIANS</Label>
              <button type="button" onClick={addTech} className="text-gold text-xs font-mono-tech flex items-center gap-1 hover:text-gold-light"><Plus size={14} /> Add Technician</button>
            </div>
            <div className="space-y-2">
              {(form.technicians || []).map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={t.name || ''} onChange={(e) => updateTech(idx, 'name', e.target.value)} placeholder="Name" className="bg-asphalt border-vapor/15 text-vapor text-sm flex-1" />
                  <Input value={t.phone || ''} onChange={(e) => updateTech(idx, 'phone', e.target.value)} placeholder="Phone" className="bg-asphalt border-vapor/15 text-vapor text-sm w-36" />
                  <Input value={t.email || ''} onChange={(e) => updateTech(idx, 'email', e.target.value)} placeholder="Email" className="bg-asphalt border-vapor/15 text-vapor text-sm w-48" />
                  <input type="color" value={t.color || '#D4AF37'} onChange={(e) => updateTech(idx, 'color', e.target.value)} className="w-8 h-8 rounded-sm border border-vapor/15 cursor-pointer" />
                  <button type="button" onClick={() => removeTech(idx)} className="text-vapor/30 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              ))}
              {(!form.technicians || form.technicians.length === 0) && <p className="text-vapor/40 text-xs text-center py-4">No technicians added yet.</p>}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving} className="text-vapor/60 hover:text-vapor">
          <ChevronLeft size={18} className="mr-1" /> Back
        </Button>
        <Button onClick={() => onNext(form)} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk font-bold">
          {saving ? 'Saving...' : 'Next'} <ChevronRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}