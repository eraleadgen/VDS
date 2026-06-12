import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import AddVehicleForm from './AddVehicleForm';

const LOGO = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png";

export default function VehicleCard({ vehicle, onDelete, onEdit }) {
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

  return (
    <div className="glass-panel border border-vapor/10 hover:border-gold/30 transition-colors duration-200 rounded-sm overflow-hidden">
      {/* Golden banner for GHL-registered vehicles */}
      <div className="h-1.5 bg-gradient-to-r from-gold via-gold-light to-gold w-full" />
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Gold logo icon box */}
          <div className="w-10 h-10 bg-gold/10 border border-gold/30 flex items-center justify-center rounded-sm shrink-0 mt-0.5 overflow-hidden">
            <img src={LOGO} alt="VDS Logo" className="w-7 h-7 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(76%) sepia(26%) saturate(693%) hue-rotate(1deg) brightness(91%) contrast(86%)' }} />
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
        <div className="flex items-center gap-3 shrink-0 mt-1">
          <button
            onClick={() => setEditing(true)}
            className="text-vapor/20 hover:text-gold transition-colors duration-200"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(vehicle.id)}
            className="text-vapor/20 hover:text-red-400 transition-colors duration-200"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}