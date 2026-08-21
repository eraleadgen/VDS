import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import EraClientList from './EraClientList';
import EraClientDetail from './EraClientDetail';

const invoke = (body) => base44.functions.invoke('eraAdmin', body).then(r => r.data ?? r);

export default function EraAdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    invoke({ action: 'get_clients' })
      .then(r => { if (r.success) setClients(r.clients); else setError(r.error || 'Failed to load clients'); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = (updated) => {
    setClients(prev => prev.map(c => c.business_id === updated.business_id ? { ...c, ...updated } : c));
  };

  if (loading) return <div className="flex items-center gap-2 text-white/40 text-sm font-mono"><Loader2 size={16} className="animate-spin" /> Loading clients…</div>;
  if (error) return <p className="text-red-400 text-sm font-mono">{error}</p>;

  if (selected) {
    return (
      <EraClientDetail
        client={selected}
        onBack={() => setSelected(null)}
        onUpdated={(updated) => { handleUpdated(updated); setSelected(prev => ({ ...prev, ...updated })); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono tracking-[0.3em] text-[#D4AF37]/60 mb-1">ERA SYSTEMS</p>
        <h1 className="text-3xl font-bold text-white">Clients</h1>
      </div>
      <EraClientList clients={clients} onSelect={setSelected} search={search} onSearch={setSearch} />
    </div>
  );
}