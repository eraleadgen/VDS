import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Star, Copy, Check, Mail } from 'lucide-react';
import ExpandableCard from '@/components/portal/ExpandableCard';
import PartnerModal from '@/components/admin/PartnerModal';

const STATUS_BADGE = {
  active: 'text-green-300 bg-green-300/5 border-green-300/20',
  inactive: 'text-vapor/50 bg-vapor/5 border-vapor/20',
  prospect: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
};
const TYPE_LABEL = { dealership_salesperson: 'Dealership Salesperson', strategic_partner: 'Strategic Partner', other: 'Other' };

export default function PartnersTab() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [copied, setCopied] = useState('');

  const load = async () => {
    setLoading(true);
    try { const list = await base44.entities.Partner.list('-created_date', 200); setPartners(list || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

  const save = async (data, sendInvite) => {
    try {
      let id;
      if (editing) { await base44.entities.Partner.update(editing.id, data); id = editing.id; }
      else { const created = await base44.entities.Partner.create(data); id = created?.id; }
      if (sendInvite && id) {
        const r = await invoke({ action: 'send_partner_invite', partner_id: id });
        if (r.error) alert(r.error); else alert(`Setup link sent to ${data.email || 'partner'}.`);
      }
      setEditing(null); setAdding(false); await load();
    } catch (e) { alert(e.message); }
  };

  const sendInvite = async (p) => {
    try {
      const r = await invoke({ action: 'send_partner_invite', partner_id: p.id });
      if (r.error) alert(r.error); else { alert(`Setup link sent to ${p.email}.`); await load(); }
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try { await base44.entities.Partner.delete(id); setConfirmId(null); await load(); }
    catch (e) { alert(e.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const copy = (code) => {
    navigator.clipboard?.writeText(`${window.location.origin}/${code}`);
    setCopied(code); setTimeout(() => setCopied(''), 1500);
  };

  // A partner only counts as "onboarded" once they've completed their own account setup.
  // Pending invites (record created, account not yet created) are shown separately so the
  // dashboard reflects actual partners, not outstanding invitations.
  const onboarded = partners.filter(p => p.account_created);
  const pending = partners.filter(p => !p.account_created);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Partners</h1>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/20">
          <Plus size={14} /> NEW PARTNER
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : partners.length === 0 ? (
        <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No partners yet. Add your first partner to launch the network.</p>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono-tech tracking-widest text-vapor/40">PENDING INVITES ({pending.length})</p>
              {pending.map(p => (
                <div key={p.id} className="glass-panel border border-vapor/10 rounded-sm px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-grotesk font-semibold text-vapor truncate">{p.name}</p>
                    <p className="text-xs font-mono-tech text-vapor/40 truncate">{p.email} — invite sent, awaiting account setup</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => sendInvite(p)} className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/60 hover:text-gold border border-vapor/20 px-2 py-1.5 rounded-sm">
                      <Mail size={12} /> RESEND
                    </button>
                    {confirmId === p.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setConfirmId(null)} className="text-xs font-mono-tech text-vapor/50 px-2 py-1.5">CANCEL</button>
                        <button onClick={() => remove(p.id)} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 px-2 py-1.5 rounded-sm">DELETE</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(p.id)} className="text-vapor/50 hover:text-red-400 px-1.5 py-1.5"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {onboarded.length > 0 && (
            <div className="space-y-3">
              {onboarded.map(p => (
                <ExpandableCard
                  key={p.id}
                  header={
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-grotesk font-bold text-vapor truncate">{p.name}</h3>
                        {p.is_founding_partner && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono-tech tracking-widest text-gold border border-gold/40 bg-gold/10 px-1.5 py-0.5 rounded-sm">
                            <Star size={9} className="fill-gold" /> FOUNDING
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-vapor/50 font-mono-tech truncate">{p.dealership || TYPE_LABEL[p.partner_type]}</p>
                    </div>
                  }
                  right={
                    <div className="text-right">
                      <p className="text-xs font-mono-tech text-gold mb-1">${(p.revenue_generated || 0).toLocaleString()}</p>
                      <span className={`inline-block text-xs font-mono-tech tracking-widest px-2 py-1 rounded-sm border whitespace-nowrap ${STATUS_BADGE[p.status] || 'text-vapor/50 border-vapor/10'}`}>{p.status}</span>
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Metric label="REFERRALS" value={p.referral_count || 0} />
                    <Metric label="CONVERSIONS" value={p.conversions_count || 0} />
                    <Metric label="GOLD" value={p.gold_members_generated || 0} />
                    <Metric label="CERAMIC" value={p.ceramic_coatings_generated || 0} />
                    <Metric label="INCENTIVES" value={`$${(p.incentives_earned || 0).toLocaleString()}`} />
                  </div>
                  <p className="text-xs font-mono-tech text-vapor/40 mt-1">{p.signup_date ? `SIGNED UP ${p.signup_date}` : 'NOT SIGNED UP'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs font-mono-tech text-gold bg-gold/5 border border-gold/20 px-2 py-1 rounded-sm">{p.referral_code}</code>
                    <button onClick={() => copy(p.referral_code)} className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/60 hover:text-gold border border-vapor/20 px-2 py-1.5 rounded-sm">
                      {copied === p.referral_code ? <Check size={12} /> : <Copy size={12} />} COPY LINK
                    </button>
                    <button onClick={() => setEditing(p)} className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/60 hover:text-gold border border-vapor/20 px-2 py-1.5 rounded-sm">
                      <Pencil size={12} /> EDIT
                    </button>
                    {confirmId === p.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setConfirmId(null)} disabled={busy[p.id]} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-2 py-1.5">CANCEL</button>
                        <button onClick={() => remove(p.id)} disabled={busy[p.id]} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-2 py-1.5 rounded-sm">CONFIRM DELETE</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(p.id)} disabled={busy[p.id]} className="text-vapor/50 hover:text-red-400 disabled:opacity-50 px-1.5 py-1.5"><Trash2 size={14} /></button>
                    )}
                  </div>
                </ExpandableCard>
              ))}
            </div>
          )}
        </div>
      )}

      {(adding || editing) && <PartnerModal onClose={() => { setAdding(false); setEditing(null); }} onSave={save} partner={editing} />}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-lg font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-[10px] font-mono-tech tracking-widest text-vapor/40">{label}</p>
    </div>
  );
}