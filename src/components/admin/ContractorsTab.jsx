import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Power } from 'lucide-react';
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
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Contractors</h1>
        <button onClick={() => setEditing({})} className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/20">
          <Plus size={14} /> NEW CONTRACTOR
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-panel border border-vapor/10 rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-asphalt/60 text-xs font-mono-tech tracking-widest text-vapor/50">
              <tr>
                <th className="text-left p-4">NAME</th><th className="text-left p-4">CONTACT</th>
                <th className="text-left p-4">SKILLS</th><th className="text-left p-4">STATUS</th>
                <th className="text-left p-4">JOBS</th><th className="text-left p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.id} className="border-t border-vapor/10">
                  <td className="p-4 text-vapor font-grotesk">{c.name}</td>
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
                    <div className="flex gap-3">
                      <button onClick={() => setEditing(c)} className="text-vapor/50 hover:text-gold"><Edit size={15} /></button>
                      <button onClick={() => toggleEnable(c)} disabled={busy} className="text-vapor/50 hover:text-gold">
                        <Power size={15} className={c.is_enabled === false ? 'text-red-400' : 'text-green-400'} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No contractors yet. Click "New Contractor" to add one.</p>}
        </div>
      )}
      {editing && <ContractorModal contractor={editing} onClose={() => setEditing(null)} onSave={save} busy={busy} />}
    </div>
  );
}