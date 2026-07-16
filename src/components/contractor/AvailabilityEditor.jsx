import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

const DAYS = [
  { key: 'mon', label: 'MON' }, { key: 'tue', label: 'TUE' }, { key: 'wed', label: 'WED' },
  { key: 'thu', label: 'THU' }, { key: 'fri', label: 'FRI' }, { key: 'sat', label: 'SAT' }, { key: 'sun', label: 'SUN' },
];

const TIME_INPUT = 'bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-2 py-2 text-xs font-mono-tech rounded-sm w-24';

export default function AvailabilityEditor({ contractor, onSave, saving }) {
  const [avail, setAvail] = useState(() => {
    const map = {};
    for (const d of DAYS) {
      const ex = (contractor?.weekly_availability || []).find(a => a.day === d.key);
      map[d.key] = ex
        ? { available: ex.available, start: ex.start || '', end: ex.end || '' }
        : { available: false, start: '', end: '' };
    }
    return map;
  });
  const [blocked, setBlocked] = useState(contractor?.blocked_dates || []);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  const toggle = (day) => setAvail(p => ({ ...p, [day]: { ...p[day], available: !p[day].available } }));
  const setField = (day, field, val) => setAvail(p => ({ ...p, [day]: { ...p[day], [field]: val } }));

  const addBlock = () => {
    if (!newDate) return;
    setBlocked(p => [...p, { date: newDate, reason: newReason }]);
    setNewDate(''); setNewReason('');
  };
  const removeBlock = (i) => setBlocked(p => p.filter((_, idx) => idx !== i));

  const buildPayload = () => ({
    weekly_availability: DAYS.map(d => ({
      day: d.key,
      available: avail[d.key].available,
      start: avail[d.key].start || undefined,
      end: avail[d.key].end || undefined,
    })),
    blocked_dates: blocked,
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel border border-vapor/10 rounded-sm p-5">
        <h3 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">WEEKLY AVAILABILITY</h3>
        <div className="space-y-2">
          {DAYS.map(d => {
            const a = avail[d.key];
            return (
              <div key={d.key} className="flex items-center gap-4 py-2 border-b border-vapor/5 last:border-0">
                <button type="button" onClick={() => toggle(d.key)}
                  className={`w-12 text-xs font-mono-tech tracking-widest px-3 py-2 rounded-sm border transition-colors ${a.available ? 'bg-gold/10 text-gold border-gold/30' : 'bg-vapor/5 text-vapor/40 border-vapor/15'}`}>
                  {d.label}
                </button>
                {a.available ? (
                  <div className="flex items-center gap-2 text-xs font-mono-tech text-vapor/50">
                    <span>FROM</span>
                    <input type="time" value={a.start} onChange={e => setField(d.key, 'start', e.target.value)} className={TIME_INPUT} />
                    <span>TO</span>
                    <input type="time" value={a.end} onChange={e => setField(d.key, 'end', e.target.value)} className={TIME_INPUT} />
                    {(!a.start || !a.end) && <span className="text-gold/50">(blank = all day)</span>}
                  </div>
                ) : (
                  <span className="text-xs font-mono-tech text-vapor/30">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel border border-vapor/10 rounded-sm p-5">
        <h3 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">BLOCKED DATES</h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-asphalt border border-vapor/10 text-vapor px-3 py-2 text-xs font-mono-tech rounded-sm" />
          <input value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Reason (optional)" className="flex-1 bg-asphalt border border-vapor/10 text-vapor px-3 py-2 text-xs font-mono-tech rounded-sm" />
          <button type="button" onClick={addBlock} className="flex items-center justify-center gap-2 bg-gold/10 border border-gold/30 text-gold px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/20">
            <Plus size={14} /> ADD
          </button>
        </div>
        {blocked.length ? (
          <div className="space-y-2">
            {blocked.map((b, i) => (
              <div key={i} className="flex items-center justify-between bg-asphalt/60 border border-vapor/10 rounded-sm px-3 py-2">
                <div className="text-xs font-mono-tech text-vapor/70">{b.date} {b.reason ? <span className="text-vapor/40">· {b.reason}</span> : null}</div>
                <button type="button" onClick={() => removeBlock(i)} className="text-vapor/40 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono-tech text-vapor/30">No blocked dates.</p>
        )}
      </div>

      <button type="button" onClick={() => onSave(buildPayload())} disabled={saving}
        className="flex items-center gap-2 bg-gold text-obsidian px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">
        <Save size={14} /> {saving ? 'SAVING...' : 'SAVE AVAILABILITY'}
      </button>
    </div>
  );
}