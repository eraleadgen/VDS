import { useState } from 'react';
import { X } from 'lucide-react';

const genCode = () => 'VDS-' + Math.random().toString(36).slice(2, 7).toUpperCase();
const INPUT = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const LABEL = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

// Simplified new-partner form: the admin only enters contact info. The partner fills in
// dealership / type / photo themselves on the setup page after clicking their invite link.
export default function PartnerModal({ onClose, onSave, partner }) {
  const [form, setForm] = useState({
    first_name: partner?.first_name || '',
    last_name: partner?.last_name || '',
    email: partner?.email || '',
    phone: partner?.phone || '',
    partner_type: partner?.partner_type || 'dealership_salesperson',
    status: partner?.status || 'active',
    referral_code: partner?.referral_code || genCode(),
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const name = `${form.first_name} ${form.last_name}`.trim();
      await onSave({ ...form, name }, !partner);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/80 flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-panel border border-gold/20 rounded-sm w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-grotesk font-bold text-vapor">{partner ? 'Edit Partner' : 'New Partner'}</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-vapor/50 hover:text-vapor" /></button>
        </div>
        <p className="text-xs font-mono-tech text-vapor/40 -mt-1">
          {partner ? 'Update contact info.' : 'Enter their contact info — we’ll send them a link to finish setting up their account.'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>FIRST NAME</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={INPUT} required /></div>
          <div><label className={LABEL}>LAST NAME</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={INPUT} required /></div>
        </div>
        <div><label className={LABEL}>EMAIL</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} required /></div>
        <div><label className={LABEL}>PHONE</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={INPUT} /></div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-4 py-2.5">CANCEL</button>
          <button type="submit" disabled={busy} className="bg-gold text-obsidian px-6 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">{partner ? 'SAVE CHANGES' : 'CREATE & SEND SETUP LINK'}</button>
        </div>
      </form>
    </div>
  );
}