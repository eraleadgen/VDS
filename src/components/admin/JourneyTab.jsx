import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';
import CustomerJourneyCard from '@/components/admin/CustomerJourneyCard';

export default function JourneyTab() {
  const [customers, setCustomers] = useState([]);
  const [partnersById, setPartnersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [list, partners] = await Promise.all([
          base44.entities.Customer.list('-created_date', 200),
          base44.entities.Partner.list('-created_date', 200),
        ]);
        setCustomers(list || []);
        const map = {};
        (partners || []).forEach(p => { map[p.id] = p.name || p.email || ''; });
        setPartnersById(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => {
      const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      return name.includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q) || (c.id || '').includes(q);
    });
  }, [customers, search]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Client Directory</h1>
        <span className="text-xs font-mono-tech tracking-widest text-vapor/40">{filtered.length} CLIENT{filtered.length !== 1 ? 'S' : ''}</span>
      </div>

      <div className="flex items-center gap-2 glass-panel border border-vapor/10 rounded-sm px-4 py-2.5">
        <Search size={14} className="text-gold/60" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email, or customer id…"
          className="bg-transparent text-vapor text-sm font-mono-tech flex-1 outline-none placeholder:text-vapor/30"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-vapor/30 font-mono-tech text-sm py-12">No clients found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <CustomerJourneyCard key={c.id} customer={c} partnerName={partnersById[c.referred_by_partner_id] || ''} />
          ))}
        </div>
      )}
    </div>
  );
}