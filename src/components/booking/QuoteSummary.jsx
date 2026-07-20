import { Sparkles, Car, Clock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { formatDuration } from '@/lib/quoteCalc';

export default function QuoteSummary({ vehicleLabel, conditionLabel, quote, hasItems, classification, canSubmit, submitting }) {
  return (
    <div className="lg:sticky lg:top-28 glass-panel border border-gold/20 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} className="text-gold" />
        <h3 className="text-xs font-mono-tech tracking-widest text-gold">YOUR CUSTOM QUOTE</h3>
      </div>
      <p className="text-xs font-mono-tech text-vapor/40 mb-5">{vehicleLabel || 'No vehicle'} · {conditionLabel || 'Standard condition'}</p>

      {!classification ? (
        <div className="py-10 text-center">
          <Car size={28} className="text-vapor/20 mx-auto mb-3" />
          <p className="text-vapor/40 font-mono-tech text-xs">Add your vehicle above to see pricing.</p>
        </div>
      ) : !hasItems ? (
        <div className="py-10 text-center">
          <Car size={28} className="text-vapor/20 mx-auto mb-3" />
          <p className="text-vapor/40 font-mono-tech text-xs">Select services to see your custom quote.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5 max-h-[280px] overflow-y-auto">
            {quote.lineItems.map(it => (
              <div key={it.key} className="flex items-start justify-between gap-2 pb-3 border-b border-vapor/5 last:border-0">
                <span className={`text-sm font-grotesk ${it.consultation ? 'text-vapor/50' : 'text-vapor/80'}`}>{it.label}</span>
                <span className="text-sm font-grotesk font-bold shrink-0">
                  {it.consultation ? <span className="text-vapor/40 text-xs font-mono-tech">Consultation</span> : <span className="text-gold">${it.price}</span>}
                </span>
              </div>
            ))}
          </div>

          {quote.conditionMultiplier > 1 && quote.basePrice > 0 && (
            <>
              <div className="flex items-center justify-between text-xs font-mono-tech text-vapor/40 mb-2">
                <span>Base services</span><span>${quote.basePrice}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-tech text-vapor/40 mb-2">
                <span>× {conditionLabel} condition</span><span className="text-gold">${quote.conditionedBase}</span>
              </div>
            </>
          )}
          {quote.addOnTotal > 0 && (
            <div className="flex items-center justify-between text-xs font-mono-tech text-vapor/40 mb-3">
              <span>Add-ons</span><span>+${quote.addOnTotal}</span>
            </div>
          )}
          {quote.paintProtectionDiscount > 0 && (
            <div className="flex items-center justify-between text-xs font-mono-tech text-gold mb-3">
              <span>Paint protection discount (20%)</span><span>−${quote.paintProtectionDiscount}</span>
            </div>
          )}

          <div className="flex items-end justify-between mb-2 pt-3 border-t border-vapor/10">
            <span className="text-xs font-mono-tech tracking-widest text-vapor/40">CUSTOM QUOTE</span>
            <span className="text-3xl font-grotesk font-bold text-gold">${quote.total}</span>
          </div>
          {quote.totalMins > 0 && (
            <p className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/40 mb-4">
              <Clock size={12} /> Est. {formatDuration(quote.totalMins)}
            </p>
          )}

          <button type="submit" disabled={!canSubmit}
            className="flex items-center justify-center gap-2 w-full bg-gold text-obsidian px-6 py-3.5 text-sm font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <>CONFIRM BOOKING <ArrowRight size={14} /></>}
          </button>
        </>
      )}

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-vapor/5">
        <ShieldCheck size={13} className="text-gold/50 shrink-0" />
        <p className="text-[10px] font-mono-tech text-vapor/30 leading-relaxed">Custom quote based on size, condition &amp; add-ons · Final amount confirmed before service</p>
      </div>
    </div>
  );
}