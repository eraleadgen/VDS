import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VehicleSubscriptionModal({ vehicle, actionType, onClose, onConfirm }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const isEnroll = actionType === 'enroll';
  const monthlyRate = vehicle.vehicle_type === 'truck_suv' ? 300 : 250;

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
            <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-3">
              <p className="text-destructive text-xs font-mono-tech leading-relaxed">
                ⚠ This will cancel your Stripe subscription and remove Gold benefits immediately for this vehicle.
              </p>
            </div>
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
            {isProcessing ? 'PROCESSING...' : isEnroll ? 'CONFIRM ENROLLMENT' : 'CONFIRM CANCELLATION'}
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