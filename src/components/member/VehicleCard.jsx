import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import AddVehicleForm from './AddVehicleForm';

const GOLD_BADGE = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/34ae4d998_generated_image.png";
const SILVER_BADGE = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/9da0c2348_generated_image.png";

export default function VehicleCard({ vehicle, onDelete, onEdit, onEnrollClick, onCancelClick }) {
  const [editing, setEditing] = useState(false);

  const handleEdit = async (formData) => {
    await onEdit(vehicle.id, formData);
    setEditing(false);
  };

  if (editing) {
    return (
      <AddVehicleForm
        initialData={vehicle}
        onAdd={handleEdit}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const isGold = vehicle.is_gold_registered;

  return (
    <div className={`glass-panel rounded-sm overflow-hidden transition-all duration-300 ${
      isGold ? 'border border-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.15)]' : 'border border-vapor/10 hover:border-gold/30'
    }`}>
      {/* Animated HD banner for Gold-registered vehicles */}
      {isGold && (
        <div className="relative h-2 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gold via-gold-light to-gold animate-shimmer" 
            style={{ 
              background: 'linear-gradient(90deg, #A08020 0%, #D4AF37 25%, #F5E17A 50%, #D4AF37 75%, #A08020 100%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 3s linear infinite'
            }} 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-mono-tech tracking-[0.3em] text-obsidian/60 font-bold">◆ VDS GOLD MEMBERSHIP ◆</span>
          </div>
        </div>
      )}
      
      {/* Simple silver accent for non-Gold vehicles */}
      {!isGold && (
        <div className="h-1 w-full bg-gradient-to-r from-vapor/10 via-vapor/20 to-vapor/10" />
      )}

      <div className="p-5 flex items-start justify-between gap-4">
        <div>
            <div className="flex items-center gap-2">
              <p className={`font-grotesk font-semibold ${
                isGold ? 'text-vapor' : 'text-vapor/80'
              }`}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              {isGold && (
                <span className="px-2 py-0.5 bg-gold/20 border border-gold/30 rounded-sm">
                  <span className="text-[8px] font-mono-tech tracking-widest text-gold font-bold">GOLD</span>
                </span>
              )}
            </div>
            {vehicle.color && (
              <p className={`text-xs font-mono-tech mt-0.5 ${
                isGold ? 'text-vapor/60' : 'text-vapor/40'
              }`}>{vehicle.color}</p>
            )}
            {vehicle.license_plate && (
              <p className={`text-xs font-mono-tech mt-1 tracking-widest ${
                isGold ? 'text-gold/80' : 'text-gold/60'
              }`}>{vehicle.license_plate}</p>
            )}
            {vehicle.notes && (
              <p className={`text-xs mt-1 ${
                isGold ? 'text-vapor/70' : 'text-vapor/40'
              }`}>{vehicle.notes}</p>
            )}
            {isGold && vehicle.vehicle_type && (
              <p className="text-xs font-mono-tech text-gold/50 mt-1 tracking-widest">
                {vehicle.vehicle_type === 'sedan_coupe' ? '$250/MO' : '$300/MO'} · {vehicle.vehicle_type === 'sedan_coupe' ? 'Sedan/Coupe' : 'Truck/SUV'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-1">
          <button
            onClick={() => setEditing(true)}
            className={`transition-colors duration-200 ${
              isGold ? 'text-gold/40 hover:text-gold' : 'text-vapor/20 hover:text-gold'
            }`}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(vehicle.id)}
            className={`transition-colors duration-200 ${
              isGold ? 'text-gold/30 hover:text-red-400' : 'text-vapor/20 hover:text-red-400'
            }`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      
      {/* Subscription action buttons - modal rendered at dashboard level */}
      <div className={`border-t px-5 py-4 ${
        vehicle.is_gold_registered 
          ? 'border-gold/15 bg-gold/5' 
          : 'border-vapor/10 bg-asphalt/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {vehicle.is_gold_registered ? (
              <>
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <div>
                  <p className="text-gold font-mono-tech text-xs tracking-widest">VDS GOLD ACTIVE</p>
                  <p className="text-vapor/50 text-xs font-mono-tech">${vehicle.vehicle_type === 'truck_suv' ? 300 : 250}/mo · {vehicle.vehicle_type === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe'}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-vapor/20" />
                <div>
                  <p className="text-vapor/60 font-mono-tech text-xs tracking-widest">NOT ENROLLED</p>
                  <p className="text-vapor/40 text-xs font-mono-tech">${vehicle.vehicle_type === 'truck_suv' ? 300 : 250}/mo to activate</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => vehicle.is_gold_registered ? onCancelClick(vehicle) : onEnrollClick(vehicle)}
            className={`px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm transition-colors ${
              vehicle.is_gold_registered
                ? 'border border-gold/30 text-gold/70 hover:border-gold/50 hover:text-gold'
                : 'bg-gold text-obsidian hover:bg-gold-light'
            }`}
          >
            {vehicle.is_gold_registered ? 'CANCEL' : 'ENROLL'}
          </button>
        </div>
      </div>
    </div>
  );
}