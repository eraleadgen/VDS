import { useState } from 'react';
import { Edit, Power, Trash2, Mail, ChevronDown, Phone, Mail as MailIcon } from 'lucide-react';

const SKILL_LABELS = {
  interior_detail: 'Interior', exterior_detail: 'Exterior', full_detail: 'Full Detail',
  paint_correction: 'Paint Correction', ceramic_coating: 'Ceramic Coating', engine_bay: 'Engine Bay', headlight_restoration: 'Headlight',
};
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export default function ContractorCard({ c, busy, inviteBusy, confirmingId, onInvite, onEdit, onToggle, onDelete, onConfirmDelete, onCancelDelete }) {
  const [open, setOpen] = useState(false);
  const availMap = {};
  (c.weekly_availability || []).forEach(a => { availMap[a.day] = a; });
  const jobs = c.metrics?.jobs_completed || 0;

  return (
    <div className={`glass-panel border rounded-sm transition-colors ${open ? 'border-gold/30' : 'border-vapor/10'}`}>
      {/* Collapsed header — name + jobs status only */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'active' && c.is_enabled !== false ? 'bg-green-400' : 'bg-amber-400'}`} />
          <div className="min-w-0">
            <p className="text-vapor font-grotesk font-semibold truncate">{c.name}</p>
            <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mt-0.5">
              {c.status === 'active' && c.is_enabled !== false ? 'ACTIVE' : c.is_enabled === false ? 'DISABLED' : c.status.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-gold font-grotesk font-bold text-lg leading-none">{jobs}</p>
            <p className="text-[10px] font-mono-tech text-vapor/40 tracking-widest mt-1">JOBS</p>
          </div>
          <ChevronDown size={18} className={`text-vapor/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-vapor/10 px-5 pb-5 pt-4 space-y-5">
          {/* Availability */}
          <div>
            <p className="text-[10px] font-mono-tech tracking-[0.25em] text-gold/70 mb-3">AVAILABILITY</p>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map(d => {
                const a = availMap[d];
                const on = !!(a && a.available);
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <div className={`w-full h-9 rounded-sm border flex items-center justify-center text-[10px] font-mono-tech ${on ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-asphalt/40 border-vapor/10 text-vapor/30'}`}>
                      {DAY_LABELS[d][0]}
                    </div>
                    {on && a.start && a.end ? (
                      <p className="text-[9px] font-mono-tech text-vapor/40 leading-tight text-center">{a.start}<br/>{a.end}</p>
                    ) : on ? (
                      <p className="text-[9px] font-mono-tech text-vapor/30">ALL DAY</p>
                    ) : (
                      <p className="text-[9px] font-mono-tech text-vapor/20">OFF</p>
                    )}
                  </div>
                );
              })}
            </div>
            {(c.blocked_dates || []).length > 0 && (
              <p className="text-[10px] font-mono-tech text-amber-300/70 mt-3">
                Blocked: {(c.blocked_dates).map(b => b.date).join(', ')}
              </p>
            )}
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs font-mono-tech text-vapor/60 hover:text-gold transition-colors">
              <Phone size={12} className="text-gold/60" /> {c.phone || '—'}
            </a>
            <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs font-mono-tech text-vapor/60 hover:text-gold transition-colors truncate">
              <MailIcon size={12} className="text-gold/60" /> {c.email || '—'}
            </a>
          </div>

          {/* Skills */}
          {(c.skills || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(c.skills).map(s => <span key={s} className="text-xs font-mono-tech bg-gold/10 text-gold px-2 py-0.5 rounded-sm">{SKILL_LABELS[s] || s}</span>)}
            </div>
          )}

          {/* Invite status + Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {c.account_created ? (
              <span className="text-xs font-mono-tech text-green-300 mr-auto">ACCOUNT ACTIVE</span>
            ) : c.invite_sent ? (
              <span className="text-xs font-mono-tech text-amber-300 mr-auto">INVITE SENT</span>
            ) : (
              <button onClick={() => onInvite(c)} disabled={inviteBusy} className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/60 hover:text-gold border border-vapor/15 hover:border-gold/40 px-3 py-1.5 rounded-sm transition-colors mr-auto">
                <Mail size={13} /> SEND INVITE
              </button>
            )}
            <button onClick={() => onEdit(c)} title="Edit" className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/60 hover:text-gold border border-vapor/15 hover:border-gold/40 px-3 py-1.5 rounded-sm transition-colors">
              <Edit size={13} /> EDIT
            </button>
            <button onClick={() => onToggle(c)} disabled={busy} title={c.is_enabled === false ? 'Enable' : 'Disable'} className={`flex items-center gap-1.5 text-xs font-mono-tech border px-3 py-1.5 rounded-sm transition-colors ${c.is_enabled === false ? 'text-red-400 border-red-400/30 hover:bg-red-400/10' : 'text-green-400 border-green-400/30 hover:bg-green-400/10'}`}>
              <Power size={13} /> {c.is_enabled === false ? 'ENABLE' : 'DISABLE'}
            </button>
            {confirmingId === c.id ? (
              <div className="flex items-center gap-2">
                <button onClick={onCancelDelete} disabled={busy} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-2 py-1.5">CANCEL</button>
                <button onClick={() => onDelete(c)} disabled={busy} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-sm">CONFIRM DELETE</button>
              </div>
            ) : (
              <button onClick={() => onConfirmDelete(c)} title="Delete" className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/60 hover:text-red-400 border border-vapor/15 hover:border-red-400/40 px-3 py-1.5 rounded-sm transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}