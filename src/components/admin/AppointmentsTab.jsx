import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Filter } from 'lucide-react';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);
const STATUS_BADGE = {
  pending: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
  confirmed: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  completed: 'text-green-300 bg-green-300/5 border-green-300/20',
  cancelled: 'text-red-400 bg-red-400/5 border-red-400/20',
};

export default function AppointmentsTab() {
  const [appts, setAppts] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [busy, setBusy] = useState({});

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

  const sorted = [...appts].sort((a, b) => new Date((a.preferred_date || '') + 'T' + (a.preferred_time || '00:00')) - new Date((b.preferred_date || '') + 'T' + (b.preferred_time || '00:00')));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-grotesk font-bold text-vapor">Appointments</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-gold/60" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-3 py-2 rounded-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option><option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-3 py-2 rounded-sm" />
        {(statusFilter || dateFilter) && <button onClick={() => { setStatusFilter(''); setDateFilter(''); }} className="text-xs font-mono-tech text-vapor/50 hover:text-gold">CLEAR</button>}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-panel border border-vapor/10 rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-asphalt/60 text-xs font-mono-tech tracking-widest text-vapor/50">
              <tr>
                <th className="text-left p-4">DATE / TIME</th><th className="text-left p-4">CUSTOMER</th>
                <th className="text-left p-4">SERVICE</th><th className="text-left p-4">STATUS</th>
                <th className="text-left p-4">ASSIGN TO</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <tr key={a.id} className="border-t border-vapor/10">
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
                    <span className={`text-xs font-mono-tech px-2 py-1 rounded-sm border ${STATUS_BADGE[a.status] || STATUS_BADGE.pending}`}>{a.status}</span>
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
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && <p className="p-8 text-center text-vapor/40 font-mono-tech text-sm">No appointments match these filters.</p>}
        </div>
      )}
    </div>
  );
}