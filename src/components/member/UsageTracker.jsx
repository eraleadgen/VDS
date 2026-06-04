import { CheckCircle, Circle } from 'lucide-react';

export default function UsageTracker({ fullDetailsUsed, exteriorDetailsUsed }) {
  const fullDetailLimit = 1;
  const exteriorUsed = exteriorDetailsUsed || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Full Detail — 1/month */}
      <div className="glass-panel border border-gold/15 p-6 rounded-sm">
        <p className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">FULL INTERIOR DETAIL</p>
        <div className="flex items-center gap-4 mb-4">
          {fullDetailsUsed >= fullDetailLimit ? (
            <CheckCircle size={28} className="text-gold fill-gold/20" />
          ) : (
            <Circle size={28} className="text-vapor/30" />
          )}
          <div>
            <p className="text-3xl font-grotesk font-bold text-vapor">
              {fullDetailsUsed}/{fullDetailLimit}
            </p>
            <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mt-0.5">USED THIS MONTH</p>
          </div>
        </div>
        <div className="w-full bg-vapor/10 rounded-full h-1.5 mt-2">
          <div
            className="h-1.5 rounded-full bg-gold transition-all duration-500"
            style={{ width: `${Math.min((fullDetailsUsed / fullDetailLimit) * 100, 100)}%` }}
          />
        </div>
        <p className="text-vapor/40 text-xs font-mono-tech mt-3">
          {fullDetailsUsed >= fullDetailLimit ? 'Used for this month' : 'Available to schedule'}
        </p>
      </div>

      {/* Exterior Details — unlimited */}
      <div className="glass-panel border border-gold/15 p-6 rounded-sm">
        <p className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">EXTERIOR DETAIL</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-7 h-7 border border-gold/40 rounded-full flex items-center justify-center">
            <span className="text-gold text-xs font-bold">∞</span>
          </div>
          <div>
            <p className="text-3xl font-grotesk font-bold text-vapor">
              {exteriorUsed} <span className="text-lg text-vapor/40">used</span>
            </p>
            <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mt-0.5">THIS MONTH</p>
          </div>
        </div>
        <div className="w-full bg-vapor/10 rounded-full h-1.5 mt-2">
          <div className="h-1.5 rounded-full bg-gold/40" style={{ width: '100%' }} />
        </div>
        <p className="text-vapor/40 text-xs font-mono-tech mt-3">Unlimited — always available</p>
      </div>
    </div>
  );
}