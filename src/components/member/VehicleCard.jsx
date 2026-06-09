import { useState } from 'react';
import { Trash2, Car, Pencil } from 'lucide-react';
import AddVehicleForm from './AddVehicleForm';

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
  );
}