import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, Clock, CheckCircle2, X, CreditCard } from 'lucide-react';
import ExpandableCard from '@/components/portal/ExpandableCard';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

const STATUS_STYLES = {
  pending: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
  paid: 'text-green-300 bg-green-300/5 border-green-300/20',
  partial: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  refunded: 'text-vapor/60 bg-vapor/5 border-vapor/20',
  failed: 'text-red-300 bg-red-300/5 border-red-300/20',
  waived: 'text-vapor/60 bg-vapor/5 border-vapor/20',
};

const PAYMENT_METHODS = ['cash', 'card', 'check', 'other'];

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [payModal, setPayModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await invoke({ action: 'admin_invoices', payment_status: filter === 'all' ? undefined : filter });
      if (r.error) { setError(r.error); return; }
      setInvoices(r.invoices || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const markPaid = async (invoiceId, method) => {
    setSaving(true);
    try {
      const r = await invoke({ action: 'admin_update_invoice', invoice_id: invoiceId, payment_status: 'paid', payment_method: method });
      if (r.error) { alert(r.error); return; }
      setPayModal(null);
      await load();
    } finally { setSaving(false); }
  };

  const total = invoices.reduce((s, i) => s + (i.final_amount || i.amount || 0), 0);
  const paidCount = invoices.filter(i => i.payment_status === 'paid').length;
  const pendingCount = invoices.filter(i => i.payment_status === 'pending').length;
  const collected = invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.final_amount || i.amount || 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-grotesk font-bold text-vapor">Invoices</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat icon={DollarSign} label="OUTSTANDING" value={`$${(total - collected).toLocaleString()}`} />
        <MiniStat icon={CheckCircle2} label="COLLECTED" value={`$${collected.toLocaleString()}`} />
        <MiniStat icon={Clock} label="PENDING" value={pendingCount} />
        <MiniStat icon={DollarSign} label="PAID" value={paidCount} />
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'paid', 'partial', 'refunded', 'failed', 'waived'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-mono-tech tracking-widest px-3 py-1.5 rounded-sm border transition-colors ${filter === s ? 'bg-gold/10 border-gold/40 text-gold' : 'border-vapor/10 text-vapor/50 hover:text-vapor'}`}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="glass-panel border border-red-400/20 rounded-sm p-6 text-center text-red-400 text-sm font-mono-tech">{error}</div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel border border-vapor/10 rounded-sm p-8 text-center text-sm text-vapor/40 font-mono-tech">No invoices yet. Invoices are created automatically when a specialist marks a job as invoice-complete.</div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <ExpandableCard
              key={inv.id}
              header={
                <div className="min-w-0">
                  <p className="text-xs font-mono-tech tracking-widest text-gold/70 truncate">{inv.invoice_number || '—'}</p>
                  <h3 className="text-sm font-grotesk font-bold text-vapor truncate">{inv.customer_name || '—'}</h3>
                </div>
              }
              right={
                <div className="text-right">
                  <p className="text-sm font-grotesk font-bold text-vapor font-mono-tech">${(inv.final_amount || inv.amount || 0).toLocaleString()}</p>
                  <span className={`inline-block text-xs font-mono-tech tracking-widest px-2 py-1 rounded-sm border whitespace-nowrap ${STATUS_STYLES[inv.payment_status] || STATUS_STYLES.pending}`}>{inv.payment_status.toUpperCase()}</span>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-3 text-xs font-mono-tech text-vapor/50">
                <p><span className="text-vapor/40">Issued:</span> {inv.issued_date || '—'}</p>
                <p><span className="text-vapor/40">Paid:</span> {inv.paid_date || '—'}</p>
              </div>
              {inv.payment_status === 'pending' && (
                <button onClick={() => setPayModal(inv)} disabled={saving} className="text-xs font-mono-tech tracking-widest text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-3 py-2 rounded-sm w-full sm:w-auto disabled:opacity-50">
                  MARK PAID
                </button>
              )}
              {inv.payment_status === 'paid' && inv.payment_method && (
                <p className="text-xs font-mono-tech text-vapor/50 uppercase">Paid via {inv.payment_method}</p>
              )}
            </ExpandableCard>
          ))}
        </div>
      )}

      {payModal && (
        <PayModal invoice={payModal} onClose={() => setPayModal(null)} onConfirm={markPaid} saving={saving} />
      )}
    </div>
  );
}

function PayModal({ invoice, onClose, onConfirm, saving }) {
  const [method, setMethod] = useState('card');
  return (
    <div className="fixed inset-0 z-[100] bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel border border-gold/20 rounded-sm w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-grotesk font-bold text-vapor">Mark Invoice Paid</h3>
          <button onClick={onClose}><X size={18} className="text-vapor/50 hover:text-vapor" /></button>
        </div>
        <p className="text-xs font-mono-tech text-gold/70 mb-1">{invoice.invoice_number}</p>
        <p className="text-sm text-vapor/60 mb-4">{invoice.customer_name} — ${(invoice.final_amount || invoice.amount || 0).toLocaleString()}</p>
        <label className="block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2">PAYMENT METHOD</label>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {PAYMENT_METHODS.map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className={`flex items-center justify-center gap-2 text-xs font-mono-tech tracking-widest py-3 rounded-sm border transition-colors ${method === m ? 'bg-gold/10 border-gold/40 text-gold' : 'border-vapor/10 text-vapor/50 hover:text-vapor'}`}>
              <CreditCard size={12} /> {m.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={() => onConfirm(invoice.id, method)} disabled={saving}
          className="w-full bg-gold text-obsidian py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50">
          {saving ? 'SAVING...' : 'CONFIRM PAYMENT'}
        </button>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="glass-panel border border-vapor/10 rounded-sm p-4">
      <Icon size={16} className="text-gold/60 mb-2" />
      <p className="text-xl font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mt-1">{label}</p>
    </div>
  );
}