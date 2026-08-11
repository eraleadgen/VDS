import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, Calendar, Shield } from 'lucide-react';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

const ROLE_BADGE = {
  admin: 'text-gold bg-gold/5 border-gold/30',
  contractor: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  partner: 'text-green-300 bg-green-300/5 border-green-300/20',
  user: 'text-vapor/60 bg-vapor/5 border-vapor/20',
};

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await invoke({ action: 'admin_users' });
      if (r.error) setError(r.error);
      else setUsers(r.users || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  if (error) return <div className="p-8 text-center text-red-400 font-mono-tech text-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Users</h1>
        <span className="text-xs font-mono-tech tracking-widest text-vapor/40">{users.length} TOTAL</span>
      </div>
      <p className="text-xs font-mono-tech text-vapor/40 -mt-2">Users in your business, filtered by your tenant scope.</p>
      {users.length === 0 ? (
        <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No users found.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="glass-panel border border-vapor/10 rounded-sm px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-grotesk font-semibold text-vapor truncate">
                  {u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs font-mono-tech text-vapor/40 truncate">
                    <Mail size={11} /> {u.email}
                  </span>
                  {u.phone && (
                    <span className="flex items-center gap-1 text-xs font-mono-tech text-vapor/40">
                      <Phone size={11} /> {u.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`flex items-center gap-1 text-xs font-mono-tech tracking-widest px-2 py-1 rounded-sm border ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>
                  <Shield size={10} /> {u.role?.toUpperCase() || 'USER'}
                </span>
                {u.created_date && (
                  <span className="flex items-center gap-1 text-xs font-mono-tech text-vapor/30">
                    <Calendar size={11} /> {new Date(u.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}