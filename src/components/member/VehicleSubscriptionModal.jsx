import { useState } from 'react';
import { AlertTriangle, Check, X, RotateCcw } from 'lucide-react';

export default function VehicleSubscriptionModal({ vehicle, actionType, subscription, onClose, onConfirm }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const isEnroll = actionType === 'enroll';
  const monthlyRate = vehicle.vehicle_type === 'truck_suv' ? 300 : 250;

  // Determine refund eligibility — use created_date (exact timestamp) not started_date (date-only field)
  const startedAt = subscription?.created_date ? new Date(subscription.created_date) : null;
  const hoursSinceStart = startedAt ? (Date.now() - startedAt.getTime()) / (1000 * 60 * 60) : 999;
  const refundEligible = !isEnroll && hoursSinceStart <= 48;
  const hoursRemaining = refundEligible ? Math.max(0, 48 - hoursSinceStart).toFixed(1) : null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center px-6">
      <div className="bg-obsidian border-2 border-gold/40 rounded-sm p-6 max-w-md w-full shadow-[0_0_60px_rgba(212,175,55,0.3)]">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-gold" />
          <p className="text-vapor font-grotesk font-semibold text-lg">
            {isEnroll ? 'ENROLL IN VDS GOLD' : 'CANCEL VDS GOLD'}
          </p>
        </div>

        {isEnroll ? (
          <div className="space-y-3 mb-6">
            <p className="text-vapor text-sm font-grotesk">
              Enroll this vehicle in VDS Gold membership?
            </p>
            <div className="bg-gold/10 border border-gold/30 rounded-sm p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-gold" />
                <p className="text-vapor text-xs font-mono-tech">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Check size={12} className="text-gold" />
                <p className="text-vapor text-xs font-mono-tech">
                  Monthly rate: ${monthlyRate}/mo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Check size={12} className="text-gold" />
                <p className="text-vapor text-xs font-mono-tech">
                  Unlimited exterior + 1 interior detail/month
                </p>
              </div>
            </div>
            <p className="text-vapor/50 text-xs font-mono-tech">
              Payment processing will be configured upon enrollment.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <p className="text-vapor text-sm font-grotesk">
              Cancel VDS Gold membership for this vehicle?
            </p>
            <div className="bg-asphalt border border-vapor/20 rounded-sm p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-gold" />
                <p className="text-vapor text-xs font-mono-tech">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Check size={12} className="text-gold" />
                <p className="text-vapor text-xs font-mono-tech">
                  Current rate: ${monthlyRate}/mo
                </p>
              </div>
            </div>

            {refundEligible ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-sm p-3 flex items-start gap-2">
                <RotateCcw size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-emerald-400 text-xs font-mono-tech font-bold mb-0.5">REFUND ELIGIBLE</p>
                  <p className="text-emerald-300/70 text-xs font-mono-tech leading-relaxed">
                    You're within the 48-hour refund window and haven't used any Gold perks. Your ${monthlyRate} payment will be fully refunded upon cancellation.
                  </p>
                  <p className="text-emerald-400/50 text-xs font-mono-tech mt-1">{hoursRemaining}h remaining in refund window</p>
                </div>
              </div>
            ) : (
              <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-3">
                <p className="text-destructive text-xs font-mono-tech leading-relaxed">
                  ⚠ This will cancel your Stripe subscription and remove Gold benefits immediately for this vehicle.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 text-xs font-mono-tech tracking-widest rounded-sm font-bold transition-colors disabled:opacity-50 ${
              isEnroll
                ? 'bg-gold text-obsidian hover:bg-gold-light'
                : 'bg-vapor text-obsidian hover:bg-vapor/80'
            }`}
          >
            {isProcessing ? 'PROCESSING...' : isEnroll ? 'CONFIRM ENROLLMENT' : refundEligible ? 'CANCEL & GET REFUND' : 'CONFIRM CANCELLATION'}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-3 border-2 border-gold/40 text-gold text-xs font-mono-tech tracking-widest hover:bg-gold/10 transition-colors rounded-sm disabled:opacity-50 font-bold"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}