import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function AppointmentCard({ appointment, onRefresh }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await base44.entities.Appointment.update(appointment.id, { status: 'cancelled' });
      await onRefresh();
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  const statusColors = {
    pending: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    confirmed: 'text-gold border-gold/30 bg-gold/5',
    completed: 'text-vapor/40 border-vapor/20 bg-vapor/5',
    cancelled: 'text-red-400 border-red-400/30 bg-red-400/5',
  };

  const statusIcons = {
    pending: <AlertCircle size={14} />,
    confirmed: <CheckCircle size={14} />,
    completed: <CheckCircle size={14} />,
    cancelled: <X size={14} />,
  };

  const isPast = new Date(appointment.preferred_date) < new Date();

  return (
    <div className={`glass-panel border rounded-sm p-5 ${statusColors[appointment.status] || statusColors.pending}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-current rounded-sm flex items-center justify-center shrink-0">
            {statusIcons[appointment.status]}
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
          <p className="text-sm font-grotesk font-semibold uppercase">{appointment.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs font-mono-tech">
          <Calendar size={12} className="opacity-60" />
          <span>{format(new Date(appointment.preferred_date), 'EEEE, MMMM d, yyyy')}</span>
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
          <p className="text-xs font-mono-tech opacity-60 line-clamp-2">{appointment.notes}</p>
        </div>
      )}

      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && !isPast && (
        <div className="flex items-center gap-3 pt-3 border-t border-current border-opacity-20">
          {!cancelConfirm ? (
            <button
              onClick={() => setCancelConfirm(true)}
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
                onClick={() => setCancelConfirm(false)}
                disabled={cancelling}
                className="text-xs font-mono-tech tracking-widest opacity-60 hover:opacity-100 transition-colors disabled:opacity-30"
              >
                NO
              </button>
            </div>
          )}
          <Link
            to="/book"
            state={{ preselect_service: appointment.service_type }}
            className="ml-auto text-xs font-mono-tech tracking-widest opacity-60 hover:opacity-100 transition-colors"
          >
            RESCHEDULE →
          </Link>
        </div>
      )}

      {appointment.status === 'cancelled' && (
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