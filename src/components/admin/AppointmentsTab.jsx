import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Filter, Plus, Trash2 } from 'lucide-react';
import AppointmentFormModal from '@/components/admin/AppointmentFormModal';
import DistanceGauge from '@/components/admin/DistanceGauge';

const Checkbox = ({ checked, onChange, disabled }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    disabled={disabled}
    className="w-4 h-4 accent-gold bg-asphalt border-gold/30 rounded-sm cursor-pointer disabled:opacity-40"
  />
);

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);
const STATUS_BADGE = {
  pending: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
  confirmed: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  completed: 'text-green-300 bg-green-300/5 border-green-300/20',
  cancelled: 'text-red-400 bg-red-400/5 border-red-400/20',
};
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AppointmentsTab() {
  const [appts, setAppts] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [busy, setBusy] = useState({});
  const [adding, setAdding] = useState(false);
  const [addingBusy, setAddingBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const q = {};
      if (statusFilter) q.status = statusFilter;
      if (dateFilter) q.date = dateFilter;
      const [a, c] = await Promise.all([
        invoke({ action: 'admin_appointments', ...q }),
        invoke({ action: 'list_contractors' }),
      ]);
      setAppts(a.appointments || []);
      setContractors(c.contractors || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [statusFilter, dateFilter]);

  const reassign = async (apptId, contractorId) => {
    if (!contractorId) return;
    setBusy(b => ({ ...b, [apptId]: true }));
    try { const r = await invoke({ action: 'reassign', appointment_id: apptId, contractor_id: contractorId }); if (r.error) alert(r.error); else await load(); }
    finally { setBusy(b => ({ ...b, [apptId]: false })); }
  };

  const changeStatus = async (apptId, status) => {
    setBusy(b => ({ ...b, [apptId]: true }));
    try { const r = await invoke({ action: 'admin_change_status', appointment_id: apptId, status }); if (r.error) alert(r.error); else await load(); }
    finally { setBusy(b => ({ ...b, [apptId]: false })); }
  };

  const remove = async (apptId) => {
    setBusy(b => ({ ...b, [apptId]: true }));
    try { const r = await invoke({ action: 'admin_delete_appointment', appointment_id: apptId }); if (r.error) alert(r.error); else { setConfirmId(null); await load(); } }
    finally { setBusy(b => ({ ...b, [apptId]: false })); }
  };

  const createAppt = async (form) => {
    setAddingBusy(true);
    try {
      const r = await invoke({
        action: 'admin_add_appointment', date: form.date, time: form.time, service: form.service,
        customer_name: form.customer_name, customer_phone: form.customer_phone,
        customer_email: form.customer_email, vehicle_info: form.vehicle_info,
        service_address: form.service_address, notes: form.notes,
      });
      if (r.error) { alert(r.error); return; }
      setAdding(false); await load();
    } finally { setAddingBusy(false); }
  };

  const sorted = [...appts].sort((a, b) => new Date((a.preferred_date || '') + 'T' + (a.preferred_time || '00:00')) - new Date((b.preferred_date || '') + 'T' + (b.preferred_time || '00:00')));

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allSelected = sorted.length > 0 && sorted.every(a => selected.includes(a.id));
  const someSelected = selected.length > 0 && !allSelected;
  const toggleAll = () => setSelected(allSelected ? [] : sorted.map(a => a.id));

  const bulkDelete = async () => {
    setBulkBusy(true);
    try {
      const r = await invoke({ action: 'admin_bulk_delete_appointments', appointment_ids: selected });
      if (r.error) { alert(r.error); return; }
      setConfirmBulk(false); setSelected([]); await load();
    } finally { setBulkBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Appointments</h1>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/20">
          <Plus size={14} /> NEW APPOINTMENT
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-gold/60" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-3 py-2 rounded-sm">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-3 py-2 rounded-sm" />
        {(statusFilter || dateFilter) && <button onClick={() => { setStatusFilter(''); setDateFilter(''); }} className="text-xs font-mono-tech text-vapor/50 hover:text-gold">CLEAR</button>}
      </div>

      {selected.length > 0 && (
        <div className="glass-panel border border-gold/20 rounded-sm px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-mono-tech tracking-widest text-gold">{selected.length} SELECTED</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected([])} disabled={bulkBusy} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-2 py-1">CLEAR</button>
            {confirmBulk ? (
              <>
                <span className="text-xs font-mono-tech text-red-400">Delete {selected.length} appointment{selected.length > 1 ? 's' : ''}?</span>
                <button onClick={() => setConfirmBulk(false)} disabled={bulkBusy} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-2 py-1">CANCEL</button>
                <button onClick={bulkDelete} disabled={bulkBusy} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-sm">CONFIRM DELETE</button>
              </>
            ) : (
              <button onClick={() => setConfirmBulk(true)} disabled={bulkBusy} className="flex items-center gap-1.5 text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-sm">
                <Trash2 size={13} /> DELETE SELECTED
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-panel border border-vapor/10 rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[1040px]">
            <thead className="bg-asphalt/60 text-xs font-mono-tech tracking-widest text-vapor/50">
              <tr>
                <th className="text-left p-4 w-10"><Checkbox checked={allSelected} onChange={toggleAll} /></th>
                <th className="text-left p-4">DATE / TIME</th><th className="text-left p-4">CUSTOMER</th>
                <th className="text-left p-4">SERVICE</th><th className="text-left p-4">DISTANCE</th><th className="text-left p-4">STATUS</th>
                <th className="text-left p-4">ASSIGN TO</th><th className="text-left p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <tr key={a.id} className={`border-t border-vapor/10 ${selected.includes(a.id) ? 'bg-gold/5' : ''}`}>
                  <td className="p-4"><Checkbox checked={selected.includes(a.id)} onChange={() => toggle(a.id)} disabled={busy[a.id]} /></td>
                  <td className="p-4 text-vapor/70 font-mono-tech text-xs">{a.preferred_date}<br />{a.preferred_time}</td>
                  <td className="p-4 text-vapor">
                    <div className="text-sm">{a.customer_name}</div>
                    <div className="text-xs text-vapor/50 font-mono-tech">{a.customer_phone}</div>
                  </td>
                  <td className="p-4 text-vapor/70">
                    <div className="text-sm">{a.service_label || a.service_type}</div>
                    <div className="text-xs text-vapor/40 font-mono-tech">{a.vehicle_info || ''}</div>
                  </td>
                  <td className="p-4">
                    <DistanceGauge address={a.service_address} />
                    {a.service_address && (
                      <div className="text-xs text-vapor/30 font-mono-tech mt-1 max-w-[160px] truncate" title={a.service_address}>
                        {a.service_address}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <select
                      value={a.status}
                      disabled={busy[a.id]}
                      onChange={e => changeStatus(a.id, e.target.value)}
                      className={`text-xs font-mono-tech px-2 py-1 rounded-sm border bg-transparent cursor-pointer ${STATUS_BADGE[a.status] || STATUS_BADGE.pending}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s} className="bg-asphalt text-vapor">{s}</option>)}
                    </select>
                    {a.job_status && a.job_status !== a.status && <div className="text-xs text-vapor/40 font-mono-tech mt-1">{a.job_status.replace(/_/g, ' ')}</div>}
                  </td>
                  <td className="p-4">
                    <select
                      value={a.contractor_id || ''}
                      disabled={busy[a.id]}
                      onChange={e => reassign(a.id, e.target.value)}
                      className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-2 py-2 rounded-sm min-w-[160px]"
                    >
                      <option value="">— Unassigned —</option>
                      {contractors.map(c => <option key={c.id} value={c.id}>{c.name}{a.contractor_id === c.id ? ' ✓' : ''}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    {confirmId === a.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setConfirmId(null)} disabled={busy[a.id]} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-1 py-1">CANCEL</button>
                        <button onClick={() => remove(a.id)} disabled={busy[a.id]} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-2 py-1 rounded-sm">CONFIRM</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(a.id)} disabled={busy[a.id]} className="text-vapor/50 hover:text-red-400 disabled:opacity-50"><Trash2 size={15} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No appointments match these filters.</p>}
        </div>
      )}
      {adding && <AppointmentFormModal onClose={() => setAdding(false)} onSaved={createAppt} busy={addingBusy} />}
    </div>
  );
}