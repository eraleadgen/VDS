import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, X, Check, Loader2, DollarSign } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'text-slate-300 bg-slate-300/5 border-slate-300/20',
  sent: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  booked: 'text-cyan-300 bg-cyan-300/5 border-cyan-300/20',
  finalized: 'text-gold bg-gold/5 border-gold/20',
  expired: 'text-vapor/40 bg-vapor/5 border-vapor/20',
  declined: 'text-red-400 bg-red-400/5 border-red-400/20',
};
const STATUS_LABEL = (s) => s ? s.replace(/_/g, ' ') : '';
const STATUSES = ['pending', 'booked', 'finalized', 'expired'];

const CLASSIFICATION_LABEL = {
  coupe: 'Coupe', sedan: 'Sedan', mid_size_suv: 'Mid Size SUV', truck_3_row_suv: 'Truck / 3-Row SUV',
};

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

export default function QuotesTab() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await invoke({ action: 'admin_quotes' });
      setQuotes(r?.quotes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = statusFilter ? quotes.filter(q => q.status === statusFilter) : quotes;

  const openEdit = (q) => setEditing({ id: q.id, final_price: q.final_price ?? q.starting_price ?? 0, status: q.status, customer_name: q.customer_name, quote_summary: q.quote_summary });

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      if (editing.status === 'finalized') {
        // Finalized quotes are auto-archived (logged to service history, then deleted)
        const r = await invoke({ action: 'admin_archive_quote', quote_id: editing.id, final_price: Number(editing.final_price) || 0 });
        if (r.error) { alert(r.error); return; }
      } else {
        await base44.entities.Quote.update(editing.id, {
          final_price: Number(editing.final_price) || 0,
          status: editing.status,
        });
      }
      setEditing(null);
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Quotes</h1>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-3 py-2 rounded-sm">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL(s)}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="text-gold animate-spin" /></div>
      ) : (
        <div className="glass-panel border border-vapor/10 rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead className="bg-asphalt/60 text-xs font-mono-tech tracking-widest text-vapor/50">
              <tr>
                <th className="text-left p-4">DATE</th>
                <th className="text-left p-4">CUSTOMER</th>
                <th className="text-left p-4">VEHICLE</th>
                <th className="text-left p-4">SERVICES</th>
                <th className="text-left p-4">EST. PRICE</th>
                <th className="text-left p-4">FINAL PRICE</th>
                <th className="text-left p-4">STATUS</th>
                <th className="text-left p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} className="border-t border-vapor/10">
                  <td className="p-4 text-vapor/70 font-mono-tech text-xs">
                    {q.created_date ? new Date(q.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="p-4 text-vapor">
                    <div className="text-sm">{q.customer_name || 'Guest'}</div>
                    <div className="text-xs text-vapor/50 font-mono-tech">{q.customer_phone || q.customer_email || ''}</div>
                  </td>
                  <td className="p-4 text-vapor/70 text-xs font-mono-tech">
                    {CLASSIFICATION_LABEL[q.vehicle_classification] || q.vehicle_type || '—'}
                  </td>
                  <td className="p-4 text-vapor/60 text-xs max-w-[240px]">
                    <div className="truncate" title={q.quote_summary}>{q.quote_summary || (q.requested_services || []).join(', ')}</div>
                    {q.condition && <span className="text-vapor/30">Condition: {q.condition.replace(/_/g, ' ')}</span>}
                  </td>
                  <td className="p-4 text-vapor/70 font-grotesk">${q.starting_price ?? 0}</td>
                  <td className="p-4 text-gold font-grotesk font-bold">${q.final_price ?? 0}</td>
                  <td className="p-4">
                    <span className={`text-xs font-mono-tech px-2 py-1 rounded-sm border ${STATUS_BADGE[q.status] || 'text-vapor/50 border-vapor/10'}`}>{STATUS_LABEL(q.status)}</span>
                    {q.job_id && <div className="text-xs text-cyan-300/60 font-mono-tech mt-1">linked to job</div>}
                  </td>
                  <td className="p-4">
                    <button onClick={() => openEdit(q)} className="flex items-center gap-1.5 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-3 py-1.5 rounded-sm">
                      <DollarSign size={12} /> FINALIZE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No quotes match this filter.</p>}
        </div>
      )}

      {/* Finalize modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setEditing(null)}>
          <div className="glass-panel border border-gold/20 rounded-sm p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono-tech tracking-widest text-gold">FINALIZE QUOTE</h3>
              <button onClick={() => setEditing(null)} className="text-vapor/40 hover:text-vapor"><X size={18} /></button>
            </div>
            <p className="text-xs font-mono-tech text-vapor/40 mb-1">Customer</p>
            <p className="text-sm text-vapor font-grotesk mb-1">{editing.customer_name || 'Guest'}</p>
            <p className="text-xs font-mono-tech text-vapor/30 mb-4">{editing.quote_summary}</p>
            <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">FINAL AMOUNT ($)</label>
            <input type="number" min="0" step="0.01" value={editing.final_price} onChange={e => setEditing(ed => ({ ...ed, final_price: e.target.value }))}
              className="w-full bg-asphalt border border-vapor/10 text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm mb-4 outline-none focus:border-gold/40" />
            <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">STATUS</label>
            <select value={editing.status} onChange={e => setEditing(ed => ({ ...ed, status: e.target.value }))}
              className="w-full bg-asphalt border border-vapor/10 text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm mb-6 outline-none focus:border-gold/40">
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL(s)}</option>)}
            </select>
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(null)} disabled={busy} className="flex-1 text-xs font-mono-tech tracking-widest text-vapor/50 border border-vapor/20 px-4 py-3 rounded-sm hover:text-vapor">CANCEL</button>
              <button onClick={save} disabled={busy} className="flex-1 flex items-center justify-center gap-2 text-xs font-mono-tech tracking-widest bg-gold text-obsidian px-4 py-3 rounded-sm hover:bg-gold-light disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> SAVE</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}