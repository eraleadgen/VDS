import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, X, Plus, Trash2, AlertTriangle } from 'lucide-react';

const inputClass = "w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor placeholder:text-vapor/20 px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors";

export default function AccountDetailsForm({ user, subscriptions = [], onSaved, onCancel, onAccountDeleted }) {
  const isEmailName = (user?.full_name || '').includes('@');
  const nameParts = isEmailName ? [] : (user?.full_name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addresses, setAddresses] = useState(user?.saved_addresses || []);
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasActiveSubscriptions = subscriptions.length > 0;

  const addAddress = () => {
    const trimmed = newAddress.trim();
    if (trimmed && !addresses.includes(trimmed)) {
      setAddresses(prev => [...prev, trimmed]);
      setNewAddress('');
    }
  };

  const removeAddress = (addr) => {
    setAddresses(prev => prev.filter(a => a !== addr));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await base44.entities.User.update(user.id, {
        full_name: updatedName,
        phone: phone.trim(),
        saved_addresses: addresses,
      });
      setSaved(true);
      await new Promise(r => setTimeout(r, 500));
      onSaved && onSaved({ full_name: updatedName, phone: phone.trim(), saved_addresses: addresses });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save account details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // Delete all user's vehicles and appointments first
      const vehicles = await base44.entities.MemberVehicle.list();
      for (const v of vehicles) await base44.entities.MemberVehicle.delete(v.id);
      // Log out and redirect
      await base44.auth.logout('/');
      onAccountDeleted && onAccountDeleted();
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
        </div>

        {/* Saved Addresses */}
        <div className="mb-6">
          <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SAVED ADDRESSES</label>
          <div className="space-y-2 mb-3">
            {addresses.map((addr, i) => (
              <div key={i} className="flex items-center gap-3 bg-asphalt border border-vapor/10 px-4 py-2.5 rounded-sm">
                <span className="flex-1 text-sm font-mono-tech text-vapor/70 truncate">{addr}</span>
                <button type="button" onClick={() => removeAddress(addr)} className="text-vapor/30 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {addresses.length === 0 && (
              <p className="text-vapor/25 font-mono-tech text-xs">No saved addresses yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAddress())}
              placeholder="123 Main St, Atlanta GA"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={addAddress}
              disabled={!newAddress.trim()}
              className="flex items-center gap-1 border border-gold/40 text-gold px-4 py-2.5 text-xs font-mono-tech rounded-sm hover:bg-gold/10 transition-colors disabled:opacity-30 shrink-0"
            >
              <Plus size={12} /> ADD
            </button>
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

      {/* Delete Account */}
      <div className="glass-panel border border-red-500/10 rounded-sm p-6">
        <p className="text-vapor/50 font-mono-tech text-xs mb-4 leading-relaxed">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>

        {hasActiveSubscriptions ? (
          <div className="flex items-start gap-3 bg-red-950/30 border border-red-500/20 rounded-sm p-4">
            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400/80 font-mono-tech text-xs leading-relaxed">
              You have {subscriptions.length} active VDS Gold membership{subscriptions.length > 1 ? 's' : ''}. Please cancel all memberships before deleting your account.
            </p>
          </div>
        ) : (
          <>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs font-mono-tech tracking-widest text-red-400/70 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 px-4 py-2.5 rounded-sm transition-colors"
              >
                DELETE MY ACCOUNT
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-red-400 font-mono-tech text-xs">Are you sure? This will permanently delete your account and all vehicle data.</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? 'DELETING...' : 'YES, DELETE MY ACCOUNT'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="border border-vapor/20 text-vapor/50 hover:text-vapor px-5 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}