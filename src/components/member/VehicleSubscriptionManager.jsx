import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import VehicleSubscriptionModal from './VehicleSubscriptionModal';

export default function VehicleSubscriptionManager({ vehicle, onSubscriptionChange }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);

  const isGoldRegistered = vehicle.is_gold_registered;
  const monthlyRate = vehicle.vehicle_type === 'truck_suv' ? 300 : 250;

  const handleAction = async (vehicleId) => {
    setIsProcessing(true);
    try {
      if (actionType === 'enroll') {
        await base44.functions.invoke('upgradeVehicleToGold', { vehicle_id: vehicleId });
      } else {
        // Cancel the Stripe subscription + VehicleSubscription record (per-vehicle),
        // not just the vehicle flag — otherwise the customer keeps getting billed.
        await base44.functions.invoke('cancelGoldSubscription', { vehicle_id: vehicleId });
      }
      await onSubscriptionChange();
      setShowModal(false);
    } catch (error) {
      console.error('Subscription update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateAction = (type) => {
    setActionType(type);
    setShowModal(true);
  };

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
            onClick={() => initiateAction(isGoldRegistered ? 'cancel' : 'enroll')}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm transition-colors disabled:opacity-50 font-bold ${
              isGoldRegistered
                ? 'border-2 border-gold/40 text-gold hover:bg-gold/10'
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

      {showModal && (
        <VehicleSubscriptionModal
          vehicle={vehicle}
          actionType={actionType}
          onClose={() => setShowModal(false)}
          onConfirm={handleAction}
        />
      )}
    </>
  );
}