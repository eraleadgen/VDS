import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

const invoke = (payload) => base44.functions.invoke('scheduler', payload).then(r => r.data ?? r);

const CONSULT_CLS = {
  pending: 'text-amber-300 border-amber-300/40 bg-amber-300/5',
  sold: 'text-green-300 border-green-300/40 bg-green-300/5',
  not_interested: 'text-vapor/50 border-vapor/20 bg-vapor/5',
};
const CONSULT_LABEL = { pending: 'Pending', sold: 'Sold', not_interested: 'Not Interested' };

const INCENTIVE_LABEL = {
  initial_detail: 'Initial Detail',
  ceramic_coating: 'Ceramic Coating',
  paint_correction: 'Paint Correction',
  none: '—',
};

export default function PartnerReferrals({ partner }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const load = async () => {
    try {
      const r = await invoke({ action: 'partner_my_referrals' });
      if (r.error) { console.error(r.error); return; }
      setReferrals(r.referrals || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    // Poll every 30s for near-realtime updates of consultation outcomes (partners can't
    // subscribe to Job/PartnerReferral directly under admin-only RLS, so we poll instead).
    timer.current = setInterval(load, 30000);
    return () => clearInterval(timer.current);
  }, []);

  const totalEarned = referrals.reduce((s, r) => s + (r.incentive_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="glass-panel border border-gold/20 bg-gold/[0.03] rounded-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles size={20} className="text-gold" />
          <div>
            <p className="text-2xl font-grotesk font-bold text-gold leading-none">${(partner.incentives_earned || 0).toLocaleString()}</p>
            <p className="text-xs font-mono-tech tracking-widest text-vapor/50 mt-1.5">INCENTIVES EARNED (LIFETIME)</p>
          </div>
        </div>
        <p className="text-xs font-mono-tech text-vapor/40 leading-relaxed">
          $30 for a client's first completed job booked through your link (one-time per client) · $30 one-time when that client registers for VDS Gold · $100 for each ceramic coating or paint correction job that converts.
        </p>
      </div>

      <div>
        <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-3">YOUR REFERRALS</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gold/60" /></div>
        ) : referrals.length === 0 ? (
          <div className="glass-panel border border-vapor/10 rounded-sm p-8 text-center text-sm text-vapor/40 font-mono-tech">
            No referrals tracked yet. Share your referral link to start earning.
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map(r => {
              const consult = r.consultation_status;
              const isConsult = !!consult;
              return (
                <div key={r.id} className="glass-panel border border-vapor/10 rounded-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-grotesk font-semibold text-vapor truncate">{r.customer_name || 'Referred client'}</p>
                      <p className="text-xs font-mono-tech text-vapor/40 truncate">
                        {r.job_service_label || r.service_package || 'Service'}{r.appointment_date ? ` · ${r.appointment_date}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {r.status === 'converted' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono-tech tracking-widest text-green-300 bg-green-300/5 border border-green-300/20 px-2 py-1 rounded-sm">
                          <CheckCircle2 size={11} /> CONVERTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-mono-tech tracking-widest text-blue-300 bg-blue-300/5 border border-blue-300/20 px-2 py-1 rounded-sm">
                          <Clock size={11} /> PENDING
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-vapor/10">
                    {isConsult ? (
                      <span className={`inline-block text-xs font-mono-tech tracking-widest px-2 py-1 rounded-sm border ${CONSULT_CLS[consult]}`}>
                        CONSULT: {CONSULT_LABEL[consult].toUpperCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-mono-tech text-vapor/30">
                        {r.status === 'converted' && <XCircle size={11} />} {INCENTIVE_LABEL[r.incentive_type] || 'Detail'}
                      </span>
                    )}
                    {r.incentive_amount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono-tech text-gold">
                        <Sparkles size={11} /> +${r.incentive_amount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}