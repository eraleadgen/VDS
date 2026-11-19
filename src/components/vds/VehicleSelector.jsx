import { useState, useEffect, useRef } from 'react';
import { Check, Loader2, Car, RefreshCw } from 'lucide-react';
import VehicleYearMakeModel from './VehicleYearMakeModel';
import { classifyVehicle4, CLASSIFICATION_LABEL } from '@/lib/vehicleClassification';

// Shown only when auto-classification can't place the vehicle. 'other' is deliberately
// absent — the classifier returns it directly, so it never needs a manual escape hatch.
const MANUAL_OPTIONS = ['coupe', 'hatchback', 'sedan', 'mid_size_suv', 'truck_3_row_suv'];

export default function VehicleSelector({ onSelect, selected = null }) {
  const [ymm, setYmm] = useState({
    year: selected?.year || '',
    make: selected?.make || '',
    model: selected?.model || '',
  });
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState(selected?.classification || null);
  const [manual, setManual] = useState(false);
  const [pickedManually, setPickedManually] = useState(false);
  const initialised = useRef(false);

  // Debounced auto-classification
  useEffect(() => {
    if (!ymm.year || !ymm.make || !ymm.model || ymm.model.trim().length < 2) return;
    // Skip re-classification on mount if a pre-selected vehicle already has a classification
    if (!initialised.current && classification && selected?.model && selected.model.trim() === ymm.model.trim()) {
      initialised.current = true;
      return;
    }
    initialised.current = true;
    setClassifying(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const cls = await classifyVehicle4(ymm.year, ymm.make, ymm.model.trim());
      if (cancelled) return;
      setClassification(cls);
      setClassifying(false);
      // The classifier is a convenience, never a gate: if it errors, is rate limited or
      // can't place the vehicle, the customer picks the class and keeps booking.
      setManual(!cls);
      setPickedManually(false);
      if (cls) {
        onSelect({ year: ymm.year, make: ymm.make, model: ymm.model.trim(), classification: cls });
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ymm.model, ymm.year, ymm.make]);

  const handleYmmChange = (next) => {
    setYmm(next);
    if (classification) { setClassification(null); onSelect(null); }
  };

  const handleManualSelect = (key) => {
    setClassification(key);
    setManual(false);
    setPickedManually(true);
    onSelect({ year: ymm.year, make: ymm.make, model: ymm.model.trim(), classification: key });
  };

  const handleReset = () => {
    setYmm({ year: '', make: '', model: '' });
    setClassification(null);
    setManual(false);
    setPickedManually(false);
    onSelect(null);
  };

  return (
    <div>
      {/* Step header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">1</span>
        <h2 className="text-sm font-mono-tech tracking-widest text-gold">ADD YOUR VEHICLE</h2>
        {classification && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1.5 text-xs font-mono-tech tracking-widest text-vapor/40 hover:text-gold transition-colors"
          >
            <RefreshCw size={11} /> CHANGE
          </button>
        )}
      </div>

      {classification && !classifying ? (
        /* Vehicle summary card */
        <div className="flex items-center gap-4 p-5 rounded-sm border border-gold/40 bg-gold/[0.06] vds-card-hover">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
            <Car size={22} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-grotesk font-bold text-vapor truncate">{ymm.year} {ymm.make} {ymm.model}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Check size={11} className="text-gold" />
              <span className="text-xs font-mono-tech tracking-widest text-gold">{pickedManually ? 'SELECTED' : 'AUTO-CLASSIFIED'}: {CLASSIFICATION_LABEL[classification]?.toUpperCase()}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Dropdowns */
        <>
          <p className="text-xs font-mono-tech text-vapor/40 mb-3">Add your vehicle to get started — select year, make, and model.</p>
          <VehicleYearMakeModel value={ymm} onChange={handleYmmChange} />

          {/* Classifying indicator */}
          <div className="flex items-center gap-2 h-6 mt-3">
            {classifying ? (
              <>
                <Loader2 size={12} className="text-gold animate-spin" />
                <span className="text-xs font-mono-tech text-vapor/40">Classifying vehicle...</span>
              </>
            ) : null}
          </div>

          {/* Manual fallback — the classifier never blocks a booking */}
          {manual && !classifying && (
            <div className="mt-2 pt-4 border-t border-vapor/10">
              <p className="text-xs font-mono-tech tracking-widest text-gold mb-1">PICK YOUR VEHICLE TYPE</p>
              <p className="text-xs text-vapor/40 mb-3">We couldn't identify your vehicle automatically. Pick the closest match.</p>
              <div className="grid grid-cols-2 gap-2">
                {MANUAL_OPTIONS.map(key => (
                  <button
                    key={key}
                    onClick={() => handleManualSelect(key)}
                    className="text-left px-3 py-2.5 rounded-sm border border-vapor/15 bg-asphalt hover:border-gold/50 hover:bg-gold/[0.06] text-xs font-mono-tech text-vapor/70 hover:text-gold transition-colors"
                  >
                    {CLASSIFICATION_LABEL[key]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}