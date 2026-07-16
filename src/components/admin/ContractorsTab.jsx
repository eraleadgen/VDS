import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Power, Trash2, Mail } from 'lucide-react';
import ContractorModal from '@/components/admin/ContractorModal';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);
const SKILL_LABELS = {
  interior_detail: 'Interior', exterior_detail: 'Exterior', full_detail: 'Full Detail',
  paint_correction: 'Paint Correction', ceramic_coating: 'Ceramic Coating', engine_bay: 'Engine Bay', headlight_restoration: 'Headlight',
};

export default function ContractorsTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await invoke({ action: 'admin_contractors' });
      if (r.error) alert(r.error); else setList(r.contractors || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleEnable = async (c) => {
    setBusy(true);
    try { const r = await invoke({ action: 'admin_update_contractor', contractor_id: c.id, is_enabled: c.is_enabled === false }); if (r.error) alert(r.error); else await load(); }
    finally { setBusy(false); }
  };

  const remove = async (c) => {
    setBusy(true);
    try {
      const r = await invoke({ action: 'admin_delete_contractor', contractor_id: c.id });
      if (r.error) alert(r.error); else { setConfirmingId(null); await load(); }
    } finally { setBusy(false); }
  };

  const sendInvite = async (c) => {
    setInviteBusy(true);
    try {
      const r = await invoke({ action: 'send_specialist_invite', contractor_id: c.id });
      if (r.error) alert(r.error); else { alert(`Invite email sent to ${c.email}.`); await load(); }
    } finally { setInviteBusy(false); }
  };

  const save = async (data, isNew) => {
    setBusy(true);
    try {
      const r = isNew
        ? await invoke({ action: 'admin_create_contractor', ...data })
        : await invoke({ action: 'admin_update_contractor', contractor_id: editing.id, ...data });
      if (r.error) { alert(r.error); return; }
      setEditing(null); await load();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Specialists</h1>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/20">
          <Plus size={14} /> NEW SPECIALIST
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-panel border border-vapor/10 rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-asphalt/60 text-xs font-mono-tech tracking-widest text-vapor/50">
              <tr>
                <th className="text-left p-4">NAME</th><th className="text-left p-4">CONTACT</th>
                <th className="text-left p-4">SKILLS</th><th className="text-left p-4">STATUS</th>
                <th className="text-left p-4">JOBS</th><th className="text-left p-4">INVITE</th><th className="text-left p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id} className="border-t border-vapor/10">
                  <td className="p-4 text-vapor font-grotesk">
                    {c.name}
                    {c.linked_user_emails && <div className="text-xs text-gold/60 font-mono-tech mt-1">👥 Shared: {c.linked_user_emails}</div>}
                  </td>
                  <td className="p-4 text-vapor/60 font-mono-tech text-xs">{c.phone}<br />{c.email}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {(c.skills || []).slice(0, 3).map(s => <span key={s} className="text-xs font-mono-tech bg-gold/10 text-gold px-2 py-0.5 rounded-sm">{SKILL_LABELS[s] || s}</span>)}
                      {(c.skills || []).length > 3 && <span className="text-xs text-vapor/40 font-mono-tech">+{c.skills.length - 3}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-mono-tech px-2 py-1 rounded-sm border ${c.status === 'active' ? 'text-green-300 bg-green-300/5 border-green-300/20' : 'text-amber-300 bg-amber-300/5 border-amber-300/20'}`}>{c.status}</span>
                    {c.is_enabled === false && <span className="block text-xs text-red-400 font-mono-tech mt-1">DISABLED</span>}
                  </td>
                  <td className="p-4 text-vapor/60 font-mono-tech">{c.metrics?.jobs_completed || 0}</td>
                  <td className="p-4">
                    {c.account_created ? <span className="text-xs font-mono-tech text-green-300">ACTIVE</span>
                      : c.invite_sent ? <span className="text-xs font-mono-tech text-amber-300">SENT</span>
                      : <span className="text-xs font-mono-tech text-vapor/30">NOT SENT</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {!c.account_created && <button onClick={() => sendInvite(c)} disabled={inviteBusy} title="Send invite email" className="text-vapor/50 hover:text-gold"><Mail size={15} /></button>}
                      <button onClick={() => setEditing(c)} className="text-vapor/50 hover:text-gold"><Edit size={15} /></button>
                      <button onClick={() => toggleEnable(c)} disabled={busy} className="text-vapor/50 hover:text-gold">
                        <Power size={15} className={c.is_enabled === false ? 'text-red-400' : 'text-green-400'} />
                      </button>
                      {confirmingId === c.id ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setConfirmingId(null)} disabled={busy} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-1 py-1">CANCEL</button>
                          <button onClick={() => remove(c)} disabled={busy} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-2 py-1 rounded-sm">CONFIRM DELETE</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmingId(c.id)} className="text-vapor/50 hover:text-red-400"><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No specialists yet. Click "New Specialist" to add one.</p>}
        </div>
      )}
      {editing && <ContractorModal contractor={editing} onClose={() => setEditing(null)} onSave={save} busy={busy} />}
    </div>
  );
}