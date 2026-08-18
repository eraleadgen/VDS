import { useState } from 'react';
import { X, ExternalLink, Trash2 } from 'lucide-react';
import DistanceGauge from '@/components/admin/DistanceGauge';
import ConsultationStatusControl, { isConsultationJob } from '@/components/shared/ConsultationStatusControl';

const STATUS_BADGE = {
  quote_requested: 'text-slate-300 bg-slate-300/5 border-slate-300/20',
  quote_generated: 'text-slate-300 bg-slate-300/5 border-slate-300/20',
  awaiting_approval: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
  appointment_scheduled: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  specialist_assigned: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  appointment_confirmed: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  technician_en_route: 'text-cyan-300 bg-cyan-300/5 border-cyan-300/20',
  in_progress: 'text-cyan-300 bg-cyan-300/5 border-cyan-300/20',
  awaiting_payment: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
  completed: 'text-green-300 bg-green-300/5 border-green-300/20',
  review_requested: 'text-purple-300 bg-purple-300/5 border-purple-300/20',
  membership_recommended: 'text-gold bg-gold/5 border-gold/20',
  rescheduled: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
  cancelled: 'text-red-400 bg-red-400/5 border-red-400/20',
};

const JOB_STATUSES = ['appointment_scheduled', 'rescheduled', 'in_progress', 'completed', 'cancelled'];
const STATUS_LABEL = (s) => s ? s.replace(/_/g, ' ') : '';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function JobDetailPanel({ event, contractors, busy, consultBusy, onClose, onReassign, onStatusChange, onDelete, onConsultation, confirmId, setConfirmId }) {
  if (!event) return null;
  const job = event.job;

  return (
    <div className="glass-panel border border-gold/20 rounded-sm sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-vapor/10">
        <h3 className="text-sm font-grotesk font-bold text-vapor">Event Details</h3>
        <button onClick={onClose} className="text-vapor/40 hover:text-vapor transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Time + summary */}
        <div>
          <p className="text-xs font-mono-tech tracking-widest text-gold/70 mb-1">
            {new Date(event.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-sm font-grotesk font-bold text-vapor">{formatTime(event.start)} — {formatTime(event.end)}</p>
          <p className="text-xs text-vapor/50 font-mono-tech mt-1">{event.summary}</p>
          {event.html_link && (
            <a href={event.html_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-mono-tech text-gold/60 hover:text-gold mt-2 transition-colors">
              <ExternalLink size={10} /> OPEN IN GOOGLE CALENDAR
            </a>
          )}
        </div>

        {job ? (
          <>
            {/* Customer info */}
            <div className="space-y-2 border-t border-vapor/10 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-grotesk font-bold text-vapor">{job.customer_name}</p>
                <span className={`inline-block text-[10px] font-mono-tech tracking-widest px-2 py-1 rounded-sm border ${STATUS_BADGE[job.status] || 'text-vapor/50 border-vapor/10'}`}>
                  {STATUS_LABEL(job.status)}
                </span>
              </div>
              <p className="text-xs text-vapor/50 font-mono-tech">{job.customer_phone}</p>
              {job.customer_email && <p className="text-xs text-vapor/50 font-mono-tech">{job.customer_email}</p>}
            </div>

            {/* Service + vehicle */}
            <div className="space-y-1 border-t border-vapor/10 pt-4">
              <p className="text-sm text-vapor/80">{job.service_label || job.service_package}</p>
              {job.vehicle_info && <p className="text-xs text-vapor/40 font-mono-tech">{job.vehicle_info}</p>}
              {job.address && <p className="text-xs text-vapor/40 font-mono-tech mt-1">{job.address}</p>}
              <DistanceGauge address={job.address} />
            </div>

            {/* Price */}
            {(job.estimated_price != null || job.final_price != null) && (
              <div className="border-t border-vapor/10 pt-4">
                <p className="text-xs font-mono-tech text-gold">
                  {(job.final_price != null ? job.final_price : job.estimated_price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  <span className="text-vapor/40 ml-1">{job.final_price != null ? 'final' : 'quoted'}</span>
                </p>
              </div>
            )}

            {/* Consultation status */}
            {isConsultationJob(job) && (
              <div className="border-t border-vapor/10 pt-4">
                <ConsultationStatusControl job={job} busy={consultBusy} onChange={onConsultation} />
              </div>
            )}

            {/* Management controls */}
            <div className="space-y-3 border-t border-vapor/10 pt-4">
              <div>
                <label className="text-[10px] font-mono-tech tracking-widest text-vapor/40 block mb-1.5">STATUS</label>
                <select
                  value={job.status}
                  disabled={busy}
                  onChange={e => onStatusChange(job.id, e.target.value)}
                  className={`w-full text-xs font-mono-tech px-2 py-2 rounded-sm border bg-asphalt cursor-pointer ${STATUS_BADGE[job.status] || 'text-vapor/50 border-vapor/10'}`}
                >
                  {JOB_STATUSES.map(s => <option key={s} value={s} className="bg-asphalt text-vapor">{STATUS_LABEL(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono-tech tracking-widest text-vapor/40 block mb-1.5">SPECIALIST</label>
                <select
                  value={job.specialist_id || ''}
                  disabled={busy}
                  onChange={e => onReassign(job.id, e.target.value)}
                  className="w-full bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-3 py-2 rounded-sm"
                >
                  <option value="">— Unassigned —</option>
                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}{job.specialist_id === c.id ? ' ✓' : ''}</option>)}
                </select>
              </div>
            </div>

            {/* Delete */}
            <div className="border-t border-vapor/10 pt-4">
              {confirmId === job.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-tech text-red-400">Delete this job?</span>
                  <button onClick={() => setConfirmId(null)} disabled={busy} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-2 py-1">CANCEL</button>
                  <button onClick={() => onDelete(job.id)} disabled={busy} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-sm">CONFIRM</button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(job.id)} disabled={busy} className="flex items-center gap-1.5 text-xs font-mono-tech text-red-400/70 hover:text-red-400 transition-colors">
                  <Trash2 size={13} /> DELETE JOB
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="border-t border-vapor/10 pt-4">
            <p className="text-xs text-vapor/40 font-mono-tech">
              This calendar event is not linked to a VDS job record. It may have been created directly in Google Calendar or the job was deleted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}