import { useState } from 'react';
import { X, Star } from 'lucide-react';

const genCode = () => 'VDS-' + Math.random().toString(36).slice(2, 7).toUpperCase();
const INPUT = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const LABEL = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

export default function PartnerModal({ onClose, onSave, partner }) {
  const [form, setForm] = useState({
    first_name: partner?.first_name || '',
    last_name: partner?.last_name || '',
    email: partner?.email || '',
    phone: partner?.phone || '',
    dealership: partner?.dealership || '',
    partner_type: partner?.partner_type || 'dealership_salesperson',
    status: partner?.status || 'active',
    photo_url: partner?.photo_url || '',
    is_founding_partner: partner?.is_founding_partner || false,
    referral_code: partner?.referral_code || genCode(),
    last_contact_date: partner?.last_contact_date || '',
    next_follow_up_date: partner?.next_follow_up_date || '',
    notes: partner?.notes || '',
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
      <form onSubmit={submit} className="glass-panel border border-gold/20 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-grotesk font-bold text-vapor">{partner ? 'Edit Partner' : 'New Partner'}</h2>
          <button type="button" onClick={onClose}><X size={18} className="text-vapor/50 hover:text-vapor" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>FIRST NAME</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={INPUT} required /></div>
          <div><label className={LABEL}>LAST NAME</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={INPUT} required /></div>
          <div><label className={LABEL}>EMAIL</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} required /></div>
          <div><label className={LABEL}>PHONE</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>DEALERSHIP / COMPANY</label><input value={form.dealership} onChange={e => set('dealership', e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>PARTNER TYPE</label><select value={form.partner_type} onChange={e => set('partner_type', e.target.value)} className={INPUT}><option value="dealership_salesperson">Dealership Salesperson</option><option value="strategic_partner">Strategic Partner</option><option value="other">Other</option></select></div>
          <div><label className={LABEL}>STATUS</label><select value={form.status} onChange={e => set('status', e.target.value)} className={INPUT}><option value="active">Active</option><option value="inactive">Inactive</option><option value="prospect">Prospect</option></select></div>
          <div><label className={LABEL}>REFERRAL CODE</label><input value={form.referral_code} onChange={e => set('referral_code', e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>LAST CONTACT</label><input type="date" value={form.last_contact_date} onChange={e => set('last_contact_date', e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>NEXT FOLLOW-UP</label><input type="date" value={form.next_follow_up_date} onChange={e => set('next_follow_up_date', e.target.value)} className={INPUT} /></div>
        </div>
        <div><label className={LABEL}>PHOTO URL (OPTIONAL)</label><input value={form.photo_url} onChange={e => set('photo_url', e.target.value)} className={INPUT} /></div>
        <div><label className={LABEL}>NOTES</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={INPUT} /></div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_founding_partner} onChange={e => set('is_founding_partner', e.target.checked)} className="w-4 h-4 accent-gold bg-asphalt border-gold/30 rounded-sm" />
          <span className="text-xs font-mono-tech tracking-widest text-gold inline-flex items-center gap-1"><Star size={12} className="fill-gold" /> FOUNDING PARTNER</span>
        </label>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-4 py-2.5">CANCEL</button>
          <button type="submit" disabled={busy} className="bg-gold text-obsidian px-6 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">{partner ? 'SAVE CHANGES' : 'CREATE & SEND SETUP LINK'}</button>
        </div>
      </form>
    </div>
  );
}