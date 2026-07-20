import { MapPin, Clock, Phone, Mail, FileText, Play, CheckCircle2, Camera, Star } from 'lucide-react';

const IN_PROGRESS_LIKE = ['accepted', 'driving', 'arrived', 'in_progress', 'quality_check'];
const DONE_LIKE = ['completed', 'photos_uploaded', 'invoice_complete'];

export default function JobCard({ job, onStart, onComplete, onPhotos, onReview, disabled }) {
  const status = job.job_status || 'assigned';
  const isStarted = IN_PROGRESS_LIKE.includes(status);
  const isDone = DONE_LIKE.includes(status);
  const reviewSent = job.review_requested || job.review_submitted;
  const reviewLabel = job.review_submitted ? 'REVIEW SUBMITTED' : 'REVIEW SENT';

  return (
    <div className="glass-panel border border-gold/10 rounded-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-xs font-mono-tech tracking-widest text-gold/70 mb-1">{job.appointment_date} · {job.appointment_time}</p>
          <h3 className="text-base font-grotesk font-bold text-vapor">{job.service_label || job.service_package}</h3>
          <p className="text-sm text-vapor/60 mt-1 truncate">{job.customer_name} · {job.vehicle_info || 'Vehicle N/A'}</p>
        </div>
        <span className={`text-xs font-mono-tech tracking-widest px-3 py-1 rounded-sm border whitespace-nowrap ${isDone ? 'text-green-300 bg-green-300/5 border-green-300/20' : isStarted ? 'text-gold bg-gold/10 border-gold/30' : 'text-blue-300 bg-blue-300/5 border-blue-300/20'}`}>
          {isDone ? 'COMPLETED' : isStarted ? 'IN PROGRESS' : 'APPOINTMENT SCHEDULED'}
        </span>
      </div>
      <div className="space-y-1 text-xs font-mono-tech text-vapor/50 mb-4">
        <p className="flex items-center gap-2"><MapPin size={12} /> {job.address || 'Address N/A'}</p>
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
      <div className="flex flex-wrap gap-2">
        {!isStarted && !isDone && (
          <button onClick={() => onStart(job)} disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold border border-gold/40 text-gold hover:text-obsidian text-xs font-mono-tech tracking-widest py-3 rounded-sm transition-colors disabled:opacity-50">
            <Play size={14} /> START
          </button>
        )}
        {isStarted && !isDone && (
          <button onClick={() => onComplete(job)} disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold border border-gold/40 text-gold hover:text-obsidian text-xs font-mono-tech tracking-widest py-3 rounded-sm transition-colors disabled:opacity-50">
            <CheckCircle2 size={14} /> JOB COMPLETED
          </button>
        )}
        {isDone && (
          <>
            <button onClick={() => onPhotos(job)} disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 bg-vapor/5 hover:bg-gold/10 border border-vapor/15 hover:border-gold/40 text-vapor/70 hover:text-gold text-xs font-mono-tech tracking-widest py-3 rounded-sm transition-colors disabled:opacity-50">
              <Camera size={14} /> {(job.before_photos?.length || job.after_photos?.length) ? 'EDIT PHOTOS' : 'UPLOAD PHOTOS'}
            </button>
            <button onClick={() => onReview(job)} disabled={disabled || reviewSent}
              className={`flex-1 flex items-center justify-center gap-2 border text-xs font-mono-tech tracking-widest py-3 rounded-sm transition-colors ${reviewSent ? 'border-vapor/10 text-vapor/30 cursor-not-allowed' : 'border-gold/40 text-gold bg-gold/5 hover:bg-gold/10 disabled:opacity-50'}`}>
              <Star size={14} /> {reviewSent ? reviewLabel : 'REQUEST REVIEW'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}