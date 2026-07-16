import { MapPin, Clock, Phone, Mail, FileText, ChevronRight, Camera } from 'lucide-react';

const STATUS_COLORS = {
  assigned: 'text-vapor/60 bg-vapor/5 border-vapor/20',
  accepted: 'text-blue-300 bg-blue-300/5 border-blue-300/20',
  driving: 'text-amber-300 bg-amber-300/5 border-amber-300/20',
  arrived: 'text-amber-200 bg-amber-200/5 border-amber-200/20',
  in_progress: 'text-gold bg-gold/10 border-gold/30',
  quality_check: 'text-gold bg-gold/10 border-gold/30',
  completed: 'text-green-300 bg-green-300/5 border-green-300/20',
  photos_uploaded: 'text-green-300 bg-green-300/5 border-green-300/20',
  invoice_complete: 'text-green-200 bg-green-200/5 border-green-200/20',
};

export default function JobCard({ job, onAdvance, onComplete, disabled }) {
  const status = job.job_status || 'assigned';
  const canComplete = ['in_progress', 'quality_check'].includes(status);

  return (
    <div className="glass-panel border border-gold/10 rounded-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-xs font-mono-tech tracking-widest text-gold/70 mb-1">{job.preferred_date} · {job.preferred_time}</p>
          <h3 className="text-base font-grotesk font-bold text-vapor">{job.service_label || job.service_type}</h3>
          <p className="text-sm text-vapor/60 mt-1 truncate">{job.customer_name} · {job.vehicle_info || 'Vehicle N/A'}</p>
        </div>
        <span className={`text-xs font-mono-tech tracking-widest px-3 py-1 rounded-sm border whitespace-nowrap ${STATUS_COLORS[status] || STATUS_COLORS.assigned}`}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>
      <div className="space-y-1 text-xs font-mono-tech text-vapor/50 mb-4">
        <p className="flex items-center gap-2"><MapPin size={12} /> {job.service_address || 'Address N/A'}</p>
        <p className="flex items-center gap-2"><Phone size={12} /> {job.customer_phone || 'N/A'}</p>
        {job.customer_email ? <p className="flex items-center gap-2"><Mail size={12} /> {job.customer_email}</p> : null}
        {job.estimated_duration_minutes ? <p className="flex items-center gap-2"><Clock size={12} /> {job.estimated_duration_minutes} min est.</p> : null}
        {job.notes ? (
          <div className="mt-2 pt-2 border-t border-vapor/10">
            <p className="flex items-center gap-2 text-gold/60 mb-1"><FileText size={12} /> JOB DETAILS</p>
            <p className="whitespace-pre-line text-vapor/60 pl-5">{job.notes}</p>
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        {status !== 'completed' && status !== 'photos_uploaded' && status !== 'invoice_complete' && (
          <button onClick={() => onAdvance(job)} disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 bg-vapor/5 hover:bg-gold/10 border border-vapor/15 hover:border-gold/40 text-vapor/70 hover:text-gold text-xs font-mono-tech tracking-widest py-3 rounded-sm transition-colors disabled:opacity-50">
            ADVANCE <ChevronRight size={14} />
          </button>
        )}
        {canComplete && (
          <button onClick={() => onComplete(job)} disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold border border-gold/40 text-gold hover:text-obsidian text-xs font-mono-tech tracking-widest py-3 rounded-sm transition-colors disabled:opacity-50">
            <Camera size={14} /> COMPLETE JOB
          </button>
        )}
      </div>
    </div>
  );
}