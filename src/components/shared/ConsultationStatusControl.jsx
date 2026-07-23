import { Loader2 } from 'lucide-react';

// Whether a job is a ceramic coating / paint correction consultation (the only jobs
// that carry a consultation_status). Matches on service key + label so it works for
// any BusinessConfig catalog naming.
export const isConsultationJob = (job) => {
  const s = ((job?.service_package || '') + ' ' + (job?.service_label || '')).toLowerCase();
  return s.includes('coating') || s.includes('ceramic') || s.includes('paint correction') || s.includes('correction');
};

const OPTIONS = [
  { value: 'pending', label: 'Pending', cls: 'text-amber-300 border-amber-300/40 bg-amber-300/5' },
  { value: 'sold', label: 'Sold', cls: 'text-green-300 border-green-300/40 bg-green-300/5' },
  { value: 'not_interested', label: 'Not Interested', cls: 'text-vapor/50 border-vapor/20 bg-vapor/5' },
];

const STATUS_CLS = {
  pending: 'text-amber-300 border-amber-300/40 bg-amber-300/5',
  sold: 'text-green-300 border-green-300/40 bg-green-300/5',
  not_interested: 'text-vapor/50 border-vapor/20 bg-vapor/5',
};

// Shared consultation-status selector used by the admin Jobs tab and the specialist JobCard.
// Both write through the scheduler `update_consultation_status` action; the partner portal
// reads the same Job field in real time.
export default function ConsultationStatusControl({ job, value, onChange, busy, compact }) {
  const current = value || job?.consultation_status || 'pending';
  const cls = STATUS_CLS[current] || 'text-vapor/50 border-vapor/20 bg-vapor/5';

  if (compact) {
    return (
      <span className={`inline-block text-xs font-mono-tech tracking-widest px-2 py-1 rounded-sm border whitespace-nowrap ${cls}`}>
        {(current || 'pending').toUpperCase().replace(/_/g, ' ')}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-mono-tech tracking-widest text-gold/60">CONSULTATION</span>
      <select
        value={current}
        disabled={busy}
        onChange={e => onChange(e.target.value)}
        className={`text-xs font-mono-tech tracking-widest px-2 py-1.5 rounded-sm border cursor-pointer bg-asphalt disabled:opacity-50 ${cls}`}
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value} className="bg-asphalt text-vapor">{o.label}</option>
        ))}
      </select>
      {busy && <Loader2 size={12} className="animate-spin text-gold/60" />}
    </div>
  );
}