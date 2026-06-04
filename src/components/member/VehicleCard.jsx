import { Trash2, Car } from 'lucide-react';

export default function VehicleCard({ vehicle, onDelete }) {
  return (
    <div className="glass-panel border border-vapor/10 hover:border-gold/30 transition-colors duration-200 p-5 rounded-sm flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 border border-vapor/10 flex items-center justify-center rounded-sm shrink-0 mt-0.5">
          <Car size={16} className="text-gold" />
        </div>
        <div>
          <p className="text-vapor font-grotesk font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          {vehicle.color && (
            <p className="text-vapor/40 text-xs font-mono-tech mt-0.5">{vehicle.color}</p>
          )}
          {vehicle.license_plate && (
            <p className="text-xs font-mono-tech text-gold/60 mt-1 tracking-widest">{vehicle.license_plate}</p>
          )}
          {vehicle.notes && (
            <p className="text-vapor/40 text-xs mt-1">{vehicle.notes}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(vehicle.id)}
        className="text-vapor/20 hover:text-red-400 transition-colors duration-200 shrink-0 mt-1"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}