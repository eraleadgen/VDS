import { useState } from 'react';
import { AlertTriangle, Check, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VehicleSubscriptionManager({ vehicle, onSubscriptionChange }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null); // 'subscribe' or 'cancel'

  const isGoldRegistered = vehicle.is_gold_registered;

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      if (actionType === 'subscribe') {
        // Call upgrade function for this vehicle
        await base44.functions.invoke('upgradeVehicleToGold', { vehicle_id: vehicle.id });
      } else {
        // Cancel subscription for this vehicle
        await base44.entities.MemberVehicle.update(vehicle.id, { is_gold_registered: false });
      }
      await onSubscriptionChange();
      setShowConfirm(false);
    } catch (error) {
      console.error('Subscription update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateAction = (type) => {
    setActionType(type);
    setShowConfirm(true);
  };

  const monthlyRate = vehicle.vehicle_type === 'truck_suv' ? 300 : 250;

  return (
    <>
      <div className={`border-t px-5 py-4 ${
        isGoldRegistered 
          ? 'border-gold/15 bg-gold/5' 
          : 'border-vapor/10 bg-asphalt/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isGoldRegistered ? (
              <>
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <div>
                  <p className="text-gold font-mono-tech text-xs tracking-widest">VDS GOLD ACTIVE</p>
                  <p className="text-vapor/50 text-xs font-mono-tech">${monthlyRate}/mo · {vehicle.vehicle_type === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe'}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-vapor/20" />
                <div>
                  <p className="text-vapor/60 font-mono-tech text-xs tracking-widest">NOT ENROLLED</p>
                  <p className="text-vapor/40 text-xs font-mono-tech">${monthlyRate}/mo to activate</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => initiateAction(isGoldRegistered ? 'cancel' : 'subscribe')}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm transition-colors disabled:opacity-50 ${
              isGoldRegistered
                ? 'border border-gold/30 text-gold/70 hover:border-gold/50 hover:text-gold'
                : 'bg-gold text-obsidian hover:bg-gold-light'
            }`}
          >
            {isProcessing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isGoldRegistered ? (
              'CANCEL'
            ) : (
              'ENROLL'
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center px-6">
          <div className="bg-obsidian border-2 border-gold/40 rounded-sm p-6 max-w-md w-full shadow-[0_0_60px_rgba(212,175,55,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={18} className="text-gold" />
              <p className="text-vapor font-grotesk font-semibold text-lg">
                {actionType === 'subscribe' ? 'ENROLL IN VDS GOLD' : 'CANCEL VDS GOLD'}
              </p>
            </div>

            {actionType === 'subscribe' ? (
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
                <div className="bg-asphalt border border-vapor/20 rounded-sm p-4">
                  <p className="text-vapor/70 text-xs font-mono-tech leading-relaxed">
                    You will lose access to Gold benefits including unlimited exterior details and priority scheduling for this vehicle.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAction}
                disabled={isProcessing}
                className={`flex-1 px-4 py-3 text-xs font-mono-tech tracking-widest rounded-sm font-bold transition-colors disabled:opacity-50 ${
                  actionType === 'subscribe'
                    ? 'bg-gold text-obsidian hover:bg-gold-light'
                    : 'bg-vapor text-obsidian hover:bg-vapor/80'
                }`}
              >
                {isProcessing ? 'PROCESSING...' : actionType === 'subscribe' ? 'CONFIRM ENROLLMENT' : 'CONFIRM CANCELLATION'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
                className="px-4 py-3 border-2 border-gold/40 text-gold text-xs font-mono-tech tracking-widest hover:bg-gold/10 transition-colors rounded-sm disabled:opacity-50 font-bold"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}