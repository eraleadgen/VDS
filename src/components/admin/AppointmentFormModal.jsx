import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const INPUT = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const LABEL = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

export default function AppointmentFormModal({ onClose, onSaved, busy }) {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    date: '', time: '09:00', service: '', customer_name: '', customer_phone: '',
    customer_email: '', vehicle_info: '', service_address: '', notes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.BusinessConfig.filter({ is_active: true })
      .then(cfgs => {
        const cfg = cfgs && cfgs[0];
        const list = (cfg?.services || []).filter(s => s.category !== 'membership').map(s => ({ key: s.key, label: s.label }));
        setServices(list);
      })
      .catch(() => setServices([]));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.date || !form.time || !form.service || !form.customer_name || !form.customer_phone) {
      setError('Date, time, service, customer name and phone are required.');
      return;
    }
    onSaved(form);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel border border-gold/20 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-grotesk font-bold text-vapor">New Appointment</h3>
          <button onClick={onClose}><X size={18} className="text-vapor/50 hover:text-vapor" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>DATE</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} required className={INPUT} /></div>
            <div><label className={LABEL}>TIME</label><input type="time" value={form.time} onChange={e => set('time', e.target.value)} required className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>SERVICE</label>
            <select value={form.service} onChange={e => set('service', e.target.value)} required className={INPUT}>
              <option value="">Select service…</option>
              {services.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>CUSTOMER NAME</label><input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} required className={INPUT} /></div>
            <div><label className={LABEL}>CUSTOMER PHONE</label><input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} required className={INPUT} placeholder="(470) 555-0000" /></div>
          </div>
          <div><label className={LABEL}>CUSTOMER EMAIL</label><input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>VEHICLE</label><input value={form.vehicle_info} onChange={e => set('vehicle_info', e.target.value)} className={INPUT} placeholder="2022 Porsche 911" /></div>
          <div><label className={LABEL}>SERVICE ADDRESS</label><input value={form.service_address} onChange={e => set('service_address', e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>NOTES</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={INPUT} rows={2} /></div>
          {error && <p className="text-red-400 text-xs font-mono-tech">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full bg-gold text-obsidian py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">
            {busy ? 'CREATING…' : 'CREATE APPOINTMENT'}
          </button>
        </form>
      </div>
    </div>
  );
}