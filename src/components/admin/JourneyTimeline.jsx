import { Clock, Calendar, Car, Sparkles, CreditCard, Star, MessageSquare, UserPlus, CheckCircle2, XCircle } from 'lucide-react';

const ENTRY_ICON = {
  account_created: UserPlus,
  vehicle_added: Car,
  quote_requested: MessageSquare,
  quote_approved: CheckCircle2,
  appointment_scheduled: Calendar,
  appointment_rescheduled: Clock,
  appointment_cancelled: XCircle,
  specialist_assigned: UserPlus,
  service_started: Clock,
  service_completed: CheckCircle2,
  invoice_paid: CreditCard,
  review_requested: Star,
  review_submitted: Star,
  membership_started: Sparkles,
  membership_renewed: Sparkles,
  membership_cancelled: XCircle,
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function JourneyTimeline({ entries }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-vapor/10" />
      <div className="space-y-4">
        {entries.map(e => {
          const Icon = ENTRY_ICON[e.entry_type] || Clock;
          const milestone = e.is_milestone;
          return (
            <div key={e.id} className="relative">
              <div className={`absolute -left-[17px] top-1 w-4 h-4 rounded-full flex items-center justify-center border ${milestone ? 'bg-gold/20 border-gold' : 'bg-asphalt border-vapor/20'}`}>
                <Icon size={9} className={milestone ? 'text-gold' : 'text-vapor/50'} />
              </div>
              <div className="ml-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-vapor font-grotesk font-medium">{e.title}</span>
                  {milestone && <span className="text-[9px] font-mono-tech tracking-widest text-gold border border-gold/30 px-1 py-0.5 rounded-sm">MILESTONE</span>}
                </div>
                {e.description && <p className="text-[11px] text-vapor/50 mt-0.5 leading-relaxed">{e.description}</p>}
                <p className="text-[10px] font-mono-tech text-vapor/30 mt-0.5">{fmtDate(e.created_date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}