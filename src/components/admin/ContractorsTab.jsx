import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import ContractorModal from '@/components/admin/ContractorModal';
import ContractorCard from '@/components/admin/ContractorCard';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map(c => (
              <ContractorCard
                key={c.id}
                c={c}
                busy={busy}
                inviteBusy={inviteBusy}
                confirmingId={confirmingId}
                onInvite={sendInvite}
                onEdit={setEditing}
                onToggle={toggleEnable}
                onDelete={remove}
                onConfirmDelete={(cc) => setConfirmingId(cc.id)}
                onCancelDelete={() => setConfirmingId(null)}
              />
            ))}
          </div>
          {list.length === 0 && <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No specialists yet. Click "New Specialist" to add one.</p>}
        </>
      )}
      {editing && <ContractorModal contractor={editing} onClose={() => setEditing(null)} onSave={save} busy={busy} />}
    </div>
  );
}