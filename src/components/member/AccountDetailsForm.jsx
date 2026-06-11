import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, X } from 'lucide-react';

const inputClass = "w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor placeholder:text-vapor/20 px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors";

export default function AccountDetailsForm({ user, onSaved, onCancel }) {
  const nameParts = (user?.full_name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.auth.updateMe({
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      phone,
      address,
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved && onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel border border-vapor/10 rounded-sm p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">FIRST NAME</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputClass} placeholder="John" />
        </div>
        <div>
          <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">LAST NAME</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} placeholder="Smith" />
        </div>
        <div>
          <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">PHONE NUMBER</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="(404) 555-0000" />
        </div>
        <div>
          <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">EMAIL</label>
          <input value={user?.email || ''} disabled className={`${inputClass} opacity-40 cursor-not-allowed`} />
          <p className="text-vapor/25 text-xs font-mono-tech mt-1">Email cannot be changed</p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">SERVICE ADDRESS</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="123 Main St, Atlanta GA" />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gold text-obsidian px-5 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          <Save size={12} />
          {saved ? 'SAVED!' : loading ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 border border-vapor/20 text-vapor/50 hover:text-vapor px-5 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm transition-colors"
        >
          <X size={12} /> CANCEL
        </button>
      </div>
    </form>
  );
}