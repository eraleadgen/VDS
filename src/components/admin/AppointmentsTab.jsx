import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Filter } from 'lucide-react';
import JobsCalendar from '@/components/admin/JobsCalendar';
import JobDetailPanel from '@/components/admin/JobDetailPanel';
import AppointmentFormModal from '@/components/admin/AppointmentFormModal';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

const STATUS_LABEL = (s) => s ? s.replace(/_/g, ' ') : '';
const FILTER_STATUSES = ['appointment_scheduled', 'rescheduled', 'in_progress', 'completed', 'cancelled'];

export default function AppointmentsTab({ initialStatusFilter, initialDateFilter }) {
  const [events, setEvents] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState(() => {
    if (initialDateFilter) return new Date(initialDateFilter + 'T00:00:00');
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDateFilter) return new Date(initialDateFilter + 'T00:00:00');
    return new Date();
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || '');
  const [adding, setAdding] = useState(false);
  const [addingBusy, setAddingBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [consultBusy, setConsultBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const timeMin = new Date(year, month, 1).toISOString();
      const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const [ev, c] = await Promise.all([
        invoke({ action: 'admin_gcal_events', timeMin, timeMax }),
        invoke({ action: 'list_contractors' }),
      ]);
      setEvents(ev.events || []);
      setContractors(c.contractors || []);
    } finally { setLoading(false); }
  }, [monthDate]);

  useEffect(() => { load(); }, [load]);

  // Realtime: any Job change refreshes the calendar
  useEffect(() => {
    const unsub = base44.entities.Job.subscribe(() => { load(); });
    return unsub;
  }, [load]);

  const cName = (id) => (contractors.find(c => c.id === id) || {}).name || '';

  const reassign = async (jobId, specialistId) => {
    if (!specialistId) return;
    setBusy(true);
    try { const r = await invoke({ action: 'admin_reassign_job', job_id: jobId, specialist_id: specialistId }); if (r.error) alert(r.error); else { await load(); setSelectedEvent(e => e ? { ...e, job: { ...e.job, specialist_id: specialistId, specialist_name: cName(specialistId) } } : e); } }
    finally { setBusy(false); }
  };

  const changeStatus = async (jobId, status) => {
    setBusy(true);
    try { const r = await invoke({ action: 'admin_change_job_status', job_id: jobId, status }); if (r.error) alert(r.error); else { await load(); setSelectedEvent(e => e ? { ...e, job: { ...e.job, status } } : e); } }
    finally { setBusy(false); }
  };

  const setConsultation = async (jobId, consultation_status) => {
    setConsultBusy(true);
    try { const r = await invoke({ action: 'update_consultation_status', job_id: jobId, consultation_status }); if (r.error) alert(r.error); else await load(); }
    finally { setConsultBusy(false); }
  };

  const remove = async (jobId) => {
    setBusy(true);
    try { const r = await invoke({ action: 'admin_delete_job', job_id: jobId }); if (r.error) alert(r.error); else { setConfirmId(null); setSelectedEvent(null); await load(); } }
    finally { setBusy(false); }
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

  // Filter events by status if a filter is active
  const filteredEvents = statusFilter
    ? events.filter(ev => ev.job && ev.job.status === statusFilter)
    : events;

  // Events for the selected day (shown in side panel area)
  const selectedKey = selectedDate ? selectedDate.toLocaleDateString('en-CA') : null;
  const dayEvents = filteredEvents.filter(ev => new Date(ev.start).toLocaleDateString('en-CA') === selectedKey);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Jobs</h1>
        <div className="flex items-center gap-3">
          <Filter size={14} className="text-gold/60" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-3 py-2 rounded-sm">
            <option value="">All events</option>
            {FILTER_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL(s)}</option>)}
          </select>
          {statusFilter && <button onClick={() => setStatusFilter('')} className="text-xs font-mono-tech text-vapor/50 hover:text-gold">CLEAR</button>}
        </div>
      </div>

      {/* Calendar + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="glass-panel border border-vapor/10 rounded-sm p-20 flex justify-center">
              <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <JobsCalendar
              events={filteredEvents}
              selectedDate={selectedDate}
              onSelectDate={(d) => { setSelectedDate(d); setSelectedEvent(null); }}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              monthDate={monthDate}
              onPrevMonth={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
              onNextMonth={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
              onToday={() => { setMonthDate(new Date()); setSelectedDate(new Date()); }}
              onNewJob={() => setAdding(true)}
              loading={loading}
            />
          )}
        </div>

        {/* Side panel: selected event detail or day's event list */}
        <div>
          {selectedEvent ? (
            <JobDetailPanel
              event={selectedEvent}
              contractors={contractors}
              busy={busy}
              consultBusy={consultBusy}
              onClose={() => setSelectedEvent(null)}
              onReassign={reassign}
              onStatusChange={changeStatus}
              onDelete={remove}
              onConsultation={(v) => setConsultation(selectedEvent.job.id, v)}
              confirmId={confirmId}
              setConfirmId={setConfirmId}
            />
          ) : dayEvents.length > 0 ? (
            <div className="glass-panel border border-vapor/10 rounded-sm">
              <div className="px-5 py-4 border-b border-vapor/10">
                <p className="text-xs font-mono-tech tracking-widest text-gold/70">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-sm font-grotesk font-bold text-vapor mt-1">{dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 space-y-2">
                {dayEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="block w-full text-left p-3 rounded-sm border border-vapor/10 hover:border-gold/30 hover:bg-gold/[0.03] transition-colors"
                  >
                    <p className="text-xs font-mono-tech text-gold/70">
                      {new Date(ev.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                    <p className="text-sm font-grotesk font-bold text-vapor mt-0.5 truncate">
                      {ev.job ? ev.job.customer_name : ev.summary.replace(/^VDS\s*—\s*/, '').split('—')[0]?.trim()}
                    </p>
                    {ev.job && <p className="text-xs text-vapor/40 font-mono-tech truncate">{ev.job.service_label}</p>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel border border-vapor/10 rounded-sm p-8 text-center">
              <p className="text-xs font-mono-tech text-vapor/40">
                {selectedDate ? `No events on ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.` : 'Select a day to view events.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {adding && <AppointmentFormModal onClose={() => setAdding(false)} onSaved={createAppt} busy={addingBusy} />}
    </div>
  );
}