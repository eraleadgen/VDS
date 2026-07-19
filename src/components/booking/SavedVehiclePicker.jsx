import { Plus, Trash2, Check } from 'lucide-react';
import AddVehicleForm from '@/components/member/AddVehicleForm';
import { CLASSIFICATION_LABEL } from '@/lib/quoteCalc';

export default function SavedVehiclePicker({ vehicles, goldVehicles, selectedId, onSelect, showAddForm, onAddNew, onAddSave, onCancelAdd, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-mono-tech tracking-widest text-vapor/40">YOUR VEHICLE <span className="text-gold">*</span></label>
        {!showAddForm && (
          <button type="button" onClick={onAddNew} className="flex items-center gap-1 text-xs font-mono-tech tracking-widest text-gold hover:text-gold-light transition-colors">
            <Plus size={12} /> ADD VEHICLE
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-4">
          <AddVehicleForm onAdd={onAddSave} onCancel={onCancelAdd} />
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="space-y-3">
          {vehicles.map(v => {
            const checked = selectedId === v.id;
            const cls = v.vehicle_classification || (v.vehicle_type === 'truck_suv' || v.pricing_group === 'truck_suv' ? 'truck_3_row_suv' : 'sedan');
            const isGold = goldVehicles[v.id];
            return (
              <div key={v.id} className={`border rounded-sm transition-colors ${checked ? 'border-gold bg-gold/5' : 'border-vapor/10 hover:border-vapor/30'}`}>
                <div className="flex items-center gap-3 p-4">
                  <button type="button" onClick={() => onSelect(v.id)}
                    className={`w-5 h-5 border rounded-sm flex items-center justify-center transition-colors shrink-0 ${checked ? 'border-gold bg-gold text-obsidian' : 'border-vapor/30 hover:border-vapor/50'}`}>
                    {checked && <Check size={12} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono-tech text-sm text-vapor truncate">{v.year} {v.make} {v.model}{v.color ? `, ${v.color}` : ''}</p>
                    <p className="text-xs font-mono-tech text-vapor/30 mt-0.5">
                      {CLASSIFICATION_LABEL[cls] || cls}{isGold ? ' · ◆ Gold' : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => onDelete(v)} className="p-2 text-vapor/20 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vehicles.length === 0 && !showAddForm && (
        <p className="text-vapor/30 font-mono-tech text-xs">No saved vehicles — add one above to continue.</p>
      )}
    </div>
  );
}