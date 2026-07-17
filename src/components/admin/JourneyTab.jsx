import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Clock, Calendar, Car, Sparkles, CreditCard, Star, MessageSquare, UserPlus, CheckCircle2, XCircle } from 'lucide-react';

const ENTRY_ICON = {
  account_created: UserPlus,
  vehicle_added: Car,
  quote_requested: MessageSquare,
  quote_approved: CheckCircle2,
  appointment_scheduled: Calendar,
  appointment_rescheduled: Clock,
  appointment_cancelled: XCircle,
  specialist_assigned: UserPlus,
  service_started: Clock,
  service_completed: CheckCircle2,
  invoice_paid: CreditCard,
  review_requested: Star,
  review_submitted: Star,
  membership_started: Sparkles,
  membership_renewed: Sparkles,
  membership_cancelled: XCircle,
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function JourneyTab() {
  const [customers, setCustomers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [entriesLoading, setEntriesLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Customer.list('-created_date', 200);
        setCustomers(list || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => {
      const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      return name.includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
    });
  }, [customers, search]);

  const selectedCustomer = customers.find(c => c.id === selectedId) || null;

  const loadEntries = async (id) => {
    setEntriesLoading(true);
    try {
      const list = await base44.entities.CustomerJourney.filter({ customer_id: id }, '-created_date', 200);
      setEntries(list || []);
    } catch (e) { console.error(e); setEntries([]); }
    finally { setEntriesLoading(false); }
  };

  const onSelect = (id) => {
    setSelectedId(id);
    if (id) loadEntries(id);
    else setEntries([]);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-grotesk font-bold text-vapor">Customer Journey</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Customer selector ── */}
        <div className="glass-panel border border-vapor/10 rounded-sm p-4 lg:max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Search size={14} className="text-gold/60" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="bg-transparent text-vapor text-sm font-mono-tech flex-1 outline-none placeholder:text-vapor/30"
            />
          </div>
          <div className="space-y-1">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors ${selectedId === c.id ? 'bg-gold/10 border border-gold/30' : 'border border-transparent hover:bg-asphalt/50'}`}
              >
                <div className="text-sm text-vapor font-grotesk">{c.first_name} {c.last_name}</div>
                <div className="text-xs text-vapor/40 font-mono-tech">{c.phone}</div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-vapor/30 font-mono-tech text-xs py-8">No customers found.</p>}
          </div>
        </div>

        {/* ── Journey timeline ── */}
        <div className="lg:col-span-2 glass-panel border border-vapor/10 rounded-sm p-6 lg:max-h-[70vh] overflow-y-auto">
          {!selectedCustomer ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock size={32} className="text-vapor/20 mb-4" />
              <p className="text-vapor/40 font-mono-tech text-sm">Select a customer to view their journey.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-vapor/10">
                <div>
                  <h2 className="text-lg font-grotesk font-bold text-vapor">{selectedCustomer.first_name} {selectedCustomer.last_name}</h2>
                  <p className="text-xs font-mono-tech text-vapor/40 mt-1">{selectedCustomer.phone} {selectedCustomer.email ? `· ${selectedCustomer.email}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-grotesk font-bold text-gold">${(selectedCustomer.lifetime_revenue || 0).toLocaleString()}</p>
                  <p className="text-xs font-mono-tech tracking-widest text-vapor/40">LIFETIME · {selectedCustomer.total_jobs || 0} JOBS</p>
                </div>
              </div>

              {entriesLoading ? (
                <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
              ) : entries.length === 0 ? (
                <p className="text-center text-vapor/30 font-mono-tech text-sm py-12">No journey entries yet.</p>
              ) : (
                <div className="relative pl-8">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-vapor/10" />
                  <div className="space-y-5">
                    {entries.map(e => {
                      const Icon = ENTRY_ICON[e.entry_type] || Clock;
                      const milestone = e.is_milestone;
                      return (
                        <div key={e.id} className="relative">
                          <div className={`absolute -left-[19px] top-1 w-5 h-5 rounded-full flex items-center justify-center border ${milestone ? 'bg-gold/20 border-gold' : 'bg-asphalt border-vapor/20'}`}>
                            <Icon size={11} className={milestone ? 'text-gold' : 'text-vapor/50'} />
                          </div>
                          <div className="ml-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-vapor font-grotesk font-medium">{e.title}</span>
                              {milestone && <span className="text-[10px] font-mono-tech tracking-widest text-gold border border-gold/30 px-1.5 py-0.5 rounded-sm">MILESTONE</span>}
                            </div>
                            {e.description && <p className="text-xs text-vapor/50 mt-1 leading-relaxed">{e.description}</p>}
                            <p className="text-xs font-mono-tech text-vapor/30 mt-1">{fmtDate(e.created_date)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}