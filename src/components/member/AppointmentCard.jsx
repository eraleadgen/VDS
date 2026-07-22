import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, X, CheckCircle, AlertCircle, RotateCw, Loader2 } from 'lucide-react';
import BookingCalendar from '@/components/booking/BookingCalendar';

const CONSULTATION_SERVICES = ['ceramic_coating', 'paint_correction'];

// Convert a 12h time string ("9:00 AM") or 24h ("09:00") into 24h "HH:MM" for date parsing.
function to24h(t) {
  if (!t) return '23:59';
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return t.includes(':') && t.length === 5 ? t : '23:59';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

// Derive the client-facing live status from the synced Appointment mirror. The specialist
// portal writes `job_status` (in_progress / completed / …) and the admin portal writes the
// lifecycle `status`; this unifies both so the member always sees the current job state.
function deriveLiveStatus(appointment) {
  const st = appointment.status;
  const js = appointment.job_status;
  if (st === 'cancelled') return 'cancelled';
  if (['completed', 'photos_uploaded', 'invoice_complete', 'quality_check'].includes(js) || st === 'completed') return 'completed';
  if (['in_progress', 'driving', 'arrived'].includes(js) || st === 'in_progress') return 'in_progress';
  if (st === 'pending') return 'pending';
  return 'scheduled';
}

const STATUS_META = {
  pending: { label: 'Pending', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5', icon: AlertCircle },
  scheduled: { label: 'Scheduled', color: 'text-gold border-gold/30 bg-gold/5', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'text-cyan-300 border-cyan-300/30 bg-cyan-300/5', icon: Loader2 },
  completed: { label: 'Completed', color: 'text-vapor/40 border-vapor/20 bg-vapor/5', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-400 border-red-400/30 bg-red-400/5', icon: X },
};

export default function AppointmentCard({ appointment, onRefresh }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Reschedule state
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  const vehicleCount = Math.min(Math.max(Math.round((appointment.estimated_duration_minutes || 120) / 120), 1), 4);
  const isConsultation = CONSULTATION_SERVICES.includes(appointment.service_type);

  const liveStatus = deriveLiveStatus(appointment);
  const meta = STATUS_META[liveStatus] || STATUS_META.scheduled;
  const StatusIcon = meta.icon;
  const inProgress = liveStatus === 'in_progress';

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await base44.functions.invoke('cancelAppointment', { appointment_id: appointment.id });
      await onRefresh();
    } catch (err) {
      console.error('Cancel error:', err);
      setCancelError(err?.message || 'Unable to cancel. Please try again or contact us.');
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  // Fetch availability whenever a new day is picked in reschedule mode
  useEffect(() => {
    if (!rescheduleMode || !selectedDay) return;
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    setLoadingSlots(true);
    base44.functions.invoke('getCalendarAvailability', {
      service_type: appointment.service_type,
      date: dateStr,
      vehicle_count: vehicleCount,
    })
      .then(r => setBookedSlots(r?.data?.bookedSlots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [rescheduleMode, selectedDay]);

  const handleConfirmReschedule = async () => {
    if (!selectedDay || !selectedTime) return;
    setSubmitting(true);
    setRescheduleError('');
    try {
      const new_date = format(selectedDay, 'yyyy-MM-dd');
      await base44.functions.invoke('rescheduleAppointment', {
        appointment_id: appointment.id,
        new_date,
        new_time: selectedTime,
      });
      setRescheduleMode(false);
      setSelectedDay(null);
      setSelectedTime('');
      await onRefresh();
    } catch (err) {
      console.error('Reschedule error:', err);
      setRescheduleError(err?.message || 'Unable to reschedule. Please try again or contact us.');
    } finally {
      setSubmitting(false);
    }
  };

  const apptDateTime = new Date(`${appointment.preferred_date}T${to24h(appointment.preferred_time)}`);
  const isPast = !isNaN(apptDateTime.getTime()) && apptDateTime < new Date();

  // Members may only cancel/reschedule scheduled (not yet started) appointments.
  const canModify = (liveStatus === 'pending' || liveStatus === 'scheduled') && !isPast;

  return (
    <div className={`glass-panel border rounded-sm p-5 ${meta.color}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-current rounded-sm flex items-center justify-center shrink-0">
            <StatusIcon size={14} className={inProgress ? 'animate-spin' : ''} />
          </div>
          <div>
            <p className="text-vapor font-grotesk font-semibold text-sm">
              {appointment.service_label || appointment.service_type.replace(/_/g, ' ').toUpperCase()}
            </p>
            <p className="text-xs font-mono-tech mt-0.5 opacity-60">
              {appointment.vehicle_info || 'Vehicle TBD'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono-tech tracking-widest opacity-60">STATUS</p>
          <p className="text-sm font-grotesk font-semibold uppercase">{meta.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs font-mono-tech">
          <Calendar size={12} className="opacity-60" />
          <span>{format(new Date(appointment.preferred_date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-tech">
          <Clock size={12} className="opacity-60" />
          <span>{appointment.preferred_time}</span>
        </div>
        {appointment.service_address && (
          <div className="sm:col-span-2 flex items-center gap-2 text-xs font-mono-tech">
            <MapPin size={12} className="opacity-60" />
            <span>{appointment.service_address}</span>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="border-t border-current border-opacity-20 pt-3 mb-4">
          <p className="text-xs font-mono-tech opacity-60 mb-2">SERVICES:</p>
          <div className="space-y-1">
            {appointment.notes.split('\n').map((line, idx) => (
              <p key={idx} className="text-xs font-mono-tech opacity-80">{line}</p>
            ))}
          </div>
        </div>
      )}

      {canModify && (
        rescheduleMode ? (
          <div className="pt-4 border-t border-current border-opacity-20">
            <div className="flex items-center gap-2 mb-4">
              <RotateCw size={13} className="opacity-70" />
              <p className="text-xs font-mono-tech tracking-widest opacity-80">SELECT A NEW DATE &amp; TIME</p>
            </div>
            <BookingCalendar
              calendarDate={calendarDate}
              setCalendarDate={setCalendarDate}
              selectedDay={selectedDay}
              onDayClick={(day) => { setSelectedDay(day); setSelectedTime(''); }}
              bookedSlots={bookedSlots}
              loadingSlots={loadingSlots}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              today={new Date()}
              isConsultation={isConsultation}
            />
            {rescheduleError && (
              <p className="text-xs font-mono-tech text-red-400 mt-3">{rescheduleError}</p>
            )}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleConfirmReschedule}
                disabled={!selectedDay || !selectedTime || submitting}
                className="vds-gold-btn px-5 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'SAVING...' : 'CONFIRM NEW TIME →'}
              </button>
              <button
                onClick={() => { setRescheduleMode(false); setSelectedDay(null); setSelectedTime(''); setRescheduleError(''); }}
                disabled={submitting}
                className="text-xs font-mono-tech tracking-widest opacity-60 hover:opacity-100 transition-colors disabled:opacity-30"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-3 border-t border-current border-opacity-20">
            {!cancelConfirm ? (
              <button
                onClick={() => { setCancelConfirm(true); setCancelError(''); }}
                disabled={cancelling}
                className="text-xs font-mono-tech tracking-widest opacity-60 hover:opacity-100 transition-colors disabled:opacity-30"
              >
                {cancelling ? 'CANCELLING...' : 'CANCEL APPOINTMENT'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-tech">Confirm cancel?</span>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-xs font-mono-tech tracking-widest text-red-400 hover:text-red-300 transition-colors disabled:opacity-30"
                >
                  YES, CANCEL
                </button>
                <button
                  onClick={() => { setCancelConfirm(false); setCancelError(''); }}
                  disabled={cancelling}
                  className="text-xs font-mono-tech tracking-widest opacity-60 hover:opacity-100 transition-colors disabled:opacity-30"
                >
                  NO
                </button>
              </div>
            )}
            <button
              onClick={() => { setRescheduleMode(true); setCancelConfirm(false); setCancelError(''); }}
              className="ml-auto text-xs font-mono-tech tracking-widest opacity-60 hover:opacity-100 transition-colors"
            >
              RESCHEDULE →
            </button>
          </div>
        )
      )}

      {cancelError && canModify && !rescheduleMode && (
        <p className="text-xs font-mono-tech text-red-400 mt-3">{cancelError}</p>
      )}

      {liveStatus === 'cancelled' && (
        <div className="pt-3 border-t border-current border-opacity-20">
          <Link
            to="/book"
            state={{ preselect_service: appointment.service_type }}
            className="text-xs font-mono-tech tracking-widest opacity-60 hover:opacity-100 transition-colors"
          >
            BOOK NEW APPOINTMENT →
          </Link>
        </div>
      )}
    </div>
  );
}