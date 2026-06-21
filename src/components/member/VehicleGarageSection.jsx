import { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, CheckCircle, Circle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import AddVehicleForm from './AddVehicleForm';
import { Link } from 'react-router-dom';

function VehicleUsage({ records, currentMonth }) {
  const monthRecords = records.filter(r => r.month_year === currentMonth);
  const fullUsed = monthRecords.filter(r => r.service_type === 'full_detail').length;
  const exteriorUsed = monthRecords.filter(r => r.service_type === 'exterior_detail').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pb-4">
      {/* Full Detail */}
      <div className="bg-obsidian/60 border border-gold/10 rounded-sm p-4">
        <p className="text-xs font-mono-tech tracking-widest text-gold/60 mb-3">FULL INTERIOR DETAIL</p>
        <div className="flex items-center gap-3 mb-2">
          {fullUsed >= 1 ? (
            <CheckCircle size={20} className="text-gold fill-gold/20 shrink-0" />
          ) : (
            <Circle size={20} className="text-vapor/30 shrink-0" />
          )}
          <p className="text-2xl font-grotesk font-bold text-vapor">{fullUsed}<span className="text-base text-vapor/40">/1</span></p>
        </div>
        <div className="w-full bg-vapor/10 rounded-full h-1 mb-2">
          <div className="h-1 rounded-full bg-gold transition-all" style={{ width: `${Math.min(fullUsed * 100, 100)}%` }} />
        </div>
        <p className="text-vapor/35 text-xs font-mono-tech">{fullUsed >= 1 ? 'Used this month' : 'Available to schedule'}</p>
      </div>

      {/* Exterior Detail */}
      <div className="bg-obsidian/60 border border-gold/10 rounded-sm p-4">
        <p className="text-xs font-mono-tech tracking-widest text-gold/60 mb-3">EXTERIOR DETAIL</p>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-5 h-5 border border-gold/40 rounded-full flex items-center justify-center shrink-0">
            <span className="text-gold text-xs font-bold">∞</span>
          </div>
          <p className="text-2xl font-grotesk font-bold text-vapor">{exteriorUsed} <span className="text-base text-vapor/40">used</span></p>
        </div>
        <div className="w-full bg-gold/20 rounded-full h-1 mb-2" />
        <p className="text-vapor/35 text-xs font-mono-tech">Unlimited — always available</p>
      </div>
    </div>
  );
}

function VehicleHistory({ records }) {
  const sorted = [...records].sort((a, b) => new Date(b.service_date) - new Date(a.service_date));
  return (
    <div className="px-5 pb-4">
      <p className="text-xs font-mono-tech tracking-widest text-vapor/30 mb-3">SERVICE HISTORY</p>
      {sorted.length === 0 ? (
        <p className="text-vapor/25 text-xs font-mono-tech py-3">No services recorded yet.</p>
      ) : (
        <div className="divide-y divide-vapor/5 border border-vapor/8 rounded-sm overflow-hidden">
          {sorted.map(record => (
            <div key={record.id} className="px-4 py-3 flex items-center justify-between bg-asphalt/30">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${record.service_type === 'full_detail' ? 'bg-gold' : 'bg-vapor/40'}`} />
                <p className="text-vapor/70 text-sm font-grotesk">
                  {record.service_type === 'full_detail' ? 'Full Interior Detail' : 'Exterior Detail'}
                </p>
              </div>
              <p className="text-vapor/40 text-xs font-mono-tech">
                {record.service_date ? format(new Date(record.service_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleRow({ vehicle, records, subscriptions, currentMonth, onEdit, onDelete, onEnrollClick, onCancelClick }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const isGold = vehicle.is_gold_registered || subscriptions.some(s => s.vehicle_id === vehicle.id);

  const handleEdit = async (formData) => {
    await onEdit(vehicle.id, formData);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="glass-panel border border-vapor/15 rounded-sm overflow-hidden">
        <AddVehicleForm initialData={vehicle} onAdd={handleEdit} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`glass-panel rounded-sm overflow-hidden transition-all duration-200 ${isGold ? 'border border-gold/40 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'border border-vapor/10'}`}>
      {/* Top accent */}
      <div className={`h-0.5 w-full ${isGold ? 'bg-gold/40' : 'bg-vapor/10'}`} />

      {/* Header row — clickable to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-vapor/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              {isGold && <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shrink-0" />}
              <p className="font-grotesk font-semibold text-vapor">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {vehicle.color && <span className="text-xs font-mono-tech text-vapor/40">{vehicle.color}</span>}
              {vehicle.license_plate && <span className="text-xs font-mono-tech text-gold/60 tracking-widest">{vehicle.license_plate}</span>}
              {isGold
                ? <span className="text-xs font-mono-tech text-gold/70 tracking-widest">◆ VDS GOLD · ${vehicle.vehicle_type === 'truck_suv' ? 300 : 250}/MO</span>
                : <span className="text-xs font-mono-tech text-vapor/30">NOT ENROLLED</span>
              }
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-vapor/30 text-xs font-mono-tech hidden sm:block">{open ? 'COLLAPSE' : 'EXPAND'}</span>
          {open ? <ChevronUp size={16} className="text-vapor/40" /> : <ChevronDown size={16} className="text-vapor/40" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-vapor/8">
          {/* Actions row */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-vapor/5 bg-asphalt/30">
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/40 hover:text-vapor transition-colors">
                <Pencil size={12} /> EDIT
              </button>
              <span className="text-vapor/20">|</span>
              <button onClick={() => onDelete(vehicle.id)} className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/40 hover:text-red-400 transition-colors">
                <Trash2 size={12} /> DELETE
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isGold ? (
                <>
                  <Link
                    to="/gold-booking"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-tech tracking-widest border border-gold/30 text-gold/70 hover:border-gold/50 hover:text-gold rounded-sm transition-colors"
                  >
                    <Calendar size={11} /> BOOK
                  </Link>
                  <button
                    onClick={() => onCancelClick(vehicle)}
                    className="px-3 py-1.5 text-xs font-mono-tech tracking-widest border border-red-400/20 text-red-400/50 hover:border-red-400/40 hover:text-red-400 rounded-sm transition-colors"
                  >
                    CANCEL GOLD
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onEnrollClick(vehicle)}
                  className="px-3 py-1.5 text-xs font-mono-tech tracking-widest bg-gold text-obsidian hover:bg-gold-light rounded-sm transition-colors"
                >
                  ENROLL IN GOLD
                </button>
              )}
            </div>
          </div>

          {/* Usage — Gold only */}
          {isGold && (
            <>
              <div className="px-5 pt-4 pb-1">
                <p className="text-xs font-mono-tech tracking-widest text-gold/50 mb-3">THIS MONTH'S USAGE</p>
              </div>
              <VehicleUsage records={records} currentMonth={currentMonth} />
            </>
          )}

          {/* History */}
          <VehicleHistory records={records} />
        </div>
      )}
    </div>
  );
}

export default function VehicleGarageSection({
  vehicles, records, subscriptions, currentMonth,
  onEdit, onDelete, onEnrollClick, onCancelClick,
  showAddVehicle, setShowAddVehicle, onAddVehicle,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-vapor/40">MY GARAGE</p>
        {!showAddVehicle && (
          <button
            onClick={() => setShowAddVehicle(true)}
            className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-gold/60 hover:text-gold transition-colors border border-gold/20 hover:border-gold/40 px-4 py-2 rounded-sm"
          >
            <Plus size={12} /> ADD VEHICLE
          </button>
        )}
      </div>

      {showAddVehicle && (
        <div className="mb-4">
          <AddVehicleForm onAdd={onAddVehicle} onCancel={() => setShowAddVehicle(false)} />
        </div>
      )}

      {vehicles.length === 0 && !showAddVehicle ? (
        <div className="border border-dashed border-vapor/10 rounded-sm p-12 text-center">
          <p className="text-vapor/30 font-mono-tech text-sm">No vehicles added yet.</p>
          <button
            onClick={() => setShowAddVehicle(true)}
            className="mt-4 text-xs font-mono-tech tracking-widest text-gold/60 hover:text-gold transition-colors"
          >
            + ADD YOUR FIRST VEHICLE
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <VehicleRow
              key={v.id}
              vehicle={v}
              records={records.filter(r => r.vehicle_id === v.id)}
              subscriptions={subscriptions}
              currentMonth={currentMonth}
              onEdit={onEdit}
              onDelete={onDelete}
              onEnrollClick={onEnrollClick}
              onCancelClick={onCancelClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}