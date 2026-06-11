import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle, ChevronDown, X, Plus, Loader2, Trash2 } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, isSameDay } from 'date-fns';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import AddVehicleForm from '../components/member/AddVehicleForm';

const SERVICES = [
  { id: 'exterior_detail', label: 'Exterior Detail', duration: '1–2 hrs' },
  { id: 'interior_detail', label: 'Interior Detail', duration: '2–3 hrs' },
  { id: 'full_detail', label: 'Full Interior + Exterior Detail', duration: '3–5 hrs' },
  { id: 'vds_gold_exterior', label: '◆ VDS Gold — Exterior Detail', duration: '1 hr', gold: true },
  { id: 'vds_gold_full', label: '◆ VDS Gold — Full Detail', duration: '2–3 hrs', gold: true },
  { id: 'ceramic_coating', label: 'Ceramic Coating', duration: 'Custom', quoteOnly: true },
  { id: 'paint_correction', label: 'Paint Correction', duration: 'Custom', quoteOnly: true },
];

const ADD_ONS = [
  { id: 'ceramic_sealant', label: 'Ceramic Sealant (3 Month)', price: '$50' },
  { id: 'engine_bay', label: 'Engine Bay Detail', price: '$50' },
  { id: 'headlight_restoration', label: 'Headlight Restoration', price: '$100' },
];

// Pricing map: service_id → { sedan_coupe, truck_suv }
const PRICE_MAP = {
  exterior_detail:  { sedan_coupe: '$100+', truck_suv: '$115+' },
  interior_detail:  { sedan_coupe: '$120+', truck_suv: '$150+' },
  full_detail:      { sedan_coupe: '$175+', truck_suv: '$250+' },
};

function getAutoQuote(serviceId, vehicleType) {
  if (!serviceId || !vehicleType || !PRICE_MAP[serviceId]) return null;
  return PRICE_MAP[serviceId][vehicleType] || null;
}

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const CONSULTATION_IDS = ['ceramic_coating', 'paint_correction'];

const DEFAULT_FORM = {
  name: '', phone: '', email: '', address: '',
  service_type: '', vehicle_type: '', vehicle_info: '', notes: '',
  preferred_date: '', preferred_time: '',
};

export default function BookAppointment() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isGold, setIsGold] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  // addOns: { [vehicleLabel]: [addonId, ...] } — keyed by vehicle label, or '__global' for no-vehicle / single-vehicle
  const [addOns, setAddOns] = useState({});
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        setIsGold(!!me?.is_gold_member);
        if (me?.email) setForm(f => ({ ...f, email: me.email }));
        if (me?.full_name) setForm(f => ({ ...f, name: me.full_name }));
        const v = await base44.entities.MemberVehicle.list();
        setVehicles(v);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (location.state?.preselect_service) {
      setForm(f => ({ ...f, service_type: location.state.preselect_service }));
    }
  }, [location.state]);

  const isConsultation = CONSULTATION_IDS.includes(form.service_type);

  const handleAddVehicleSave = async (vehicleForm) => {
    const saved = await base44.entities.MemberVehicle.create(vehicleForm);
    setVehicles(v => [...v, saved]);
    setShowAddVehicle(false);
  };

  const handleDeleteVehicle = async (vehicle) => {
    const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.color ? ', ' + vehicle.color : ''}`;
    await base44.entities.MemberVehicle.delete(vehicle.id);
    setVehicles(v => v.filter(veh => veh.id !== vehicle.id));
    setSelectedVehicles(prev => prev.filter(l => l !== label));
    setAddOns(prev => { const next = { ...prev }; delete next[label]; return next; });
  };

  const getVehicleAddOns = (label) => addOns[label] || [];
  const toggleAddOn = (vehicleLabel, id) => {
    setAddOns(prev => {
      const current = prev[vehicleLabel] || [];
      const updated = current.includes(id) ? current.filter(a => a !== id) : [...current, id];
      return { ...prev, [vehicleLabel]: updated };
    });
  };
  const addOnCostForVehicle = (label) =>
    getVehicleAddOns(label).reduce((sum, id) => {
      const ao = ADD_ONS.find(a => a.id === id);
      return sum + (ao ? parseInt(ao.price.replace(/\D/g, '')) : 0);
    }, 0);

  // Auto-derive vehicle_type from the first selected saved vehicle (for single-vehicle quote)
  const derivedVehicleType = (() => {
    if (selectedVehicles.length > 0) {
      const v = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === selectedVehicles[0]);
      return v?.vehicle_type || null;
    }
    return form.vehicle_type || null;
  })();

  const autoQuote = getAutoQuote(form.service_type, derivedVehicleType);

  // Determine active vehicle keys for add-ons and totals
  // If user has selected saved vehicles, use those; otherwise use '__global'
  const activeVehicleKeys = selectedVehicles.length > 0 ? selectedVehicles : ['__global'];

  // Total add-ons across all active vehicles
  const addOnTotal = activeVehicleKeys.reduce((sum, key) => sum + addOnCostForVehicle(key), 0);

  // Total estimate: sum base price per vehicle + their add-ons
  const estimatedTotal = (() => {
    if (!form.service_type || isConsultation) return null;
    if (selectedVehicles.length === 0) {
      // No saved vehicles selected — use derived vehicle type
      if (!derivedVehicleType) return null;
      const base = PRICE_MAP[form.service_type]?.[derivedVehicleType];
      if (!base) return null;
      return parseInt(base.replace(/\D/g, '')) + addOnCostForVehicle('__global');
    }
    const prices = selectedVehicles.map(label => {
      const v = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === label);
      const base = PRICE_MAP[form.service_type]?.[v?.vehicle_type];
      if (!base) return null;
      return parseInt(base.replace(/\D/g, '')) + addOnCostForVehicle(label);
    });
    if (prices.some(p => p === null)) return null;
    return prices.reduce((a, b) => a + b, 0);
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'service_type') {
      setSelectedDay(null);
      setForm(f => ({ ...f, service_type: value, preferred_date: '', preferred_time: '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleDayClick = async (day) => {
    setSelectedDay(day);
    setForm(f => ({ ...f, preferred_date: format(day, 'yyyy-MM-dd'), preferred_time: '' }));
    setBookedSlots([]);
    if (form.service_type) {
      setLoadingSlots(true);
      const vtForAvailability = CONSULTATION_IDS.includes(form.service_type)
        ? (isGold ? 'gold' : 'standard')
        : derivedVehicleType;
      try {
        const res = await base44.functions.invoke('getCalendarAvailability', {
          service_type: form.service_type,
          vehicle_type: vtForAvailability,
          date: format(day, 'yyyy-MM-dd'),
        });
        setBookedSlots(res.data?.bookedSlots || []);
      } catch (err) {
        console.error('Availability fetch error:', err);
      } finally {
        setLoadingSlots(false);
      }
    }
  };

  const toggleVehicle = (label) => {
    setSelectedVehicles(prev =>
      prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_type || !form.name || !form.phone || !form.address) return;
    if (!form.preferred_date || !form.preferred_time) return;
    setLoading(true);
    try {
      const vehicleSummary = selectedVehicles.length > 0 ? selectedVehicles.join(', ') : form.vehicle_info;
      // Build per-vehicle add-on summary
      const addOnSummaryParts = activeVehicleKeys.map(key => {
        const labels = getVehicleAddOns(key).map(id => ADD_ONS.find(a => a.id === id)?.label).filter(Boolean);
        if (!labels.length) return null;
        const prefix = selectedVehicles.length > 1 ? `${key}: ` : '';
        return `${prefix}${labels.join(', ')}`;
      }).filter(Boolean);
      const addOnNote = addOnSummaryParts.length ? `Add-ons: ${addOnSummaryParts.join(' | ')}` : '';
      const quoteNote = estimatedTotal != null ? `Estimated Total: $${estimatedTotal}+` : '';
      const submitVehicleType = isConsultation
        ? (isGold ? 'gold' : 'standard')
        : (derivedVehicleType || form.vehicle_type);
      await base44.functions.invoke('submitBookingToGHL', {
        ...form,
        vehicle_type: submitVehicleType,
        vehicle_info: vehicleSummary,
        notes: [quoteNote, form.notes, addOnNote].filter(Boolean).join(' | '),
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Booking submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const today = new Date();

  const visibleServices = SERVICES.filter(s => !s.gold || isGold);

  const selectClass = "w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors appearance-none cursor-pointer";

  if (submitted) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="text-center max-w-md">
            <CheckCircle size={48} className="text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-grotesk font-bold text-vapor mb-3">
              {isConsultation ? 'Consultation Booked!' : 'Appointment Requested!'}
            </h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              {isConsultation
                ? `Your 15-min consultation is set for ${format(new Date(form.preferred_date), 'MMMM d, yyyy')} at ${form.preferred_time}. We'll confirm shortly and provide a custom quote.`
                : `Your appointment for ${format(new Date(form.preferred_date), 'MMMM d, yyyy')} at ${form.preferred_time} has been submitted. We'll confirm shortly.`}
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm(DEFAULT_FORM); setSelectedDay(null); }}
              className="border border-gold/40 text-gold px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold hover:text-obsidian transition-colors"
            >
              BOOK ANOTHER
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
            <div className="w-8 h-px bg-gold" />
            <p className="text-xs font-mono-tech tracking-[0.4em] text-gold">SCHEDULE SERVICE</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor text-center md:text-left">
            BOOK AN <GoldShimmer>APPOINTMENT</GoldShimmer>
          </h1>
          <p className="text-vapor/40 font-mono-tech text-sm mt-3 text-center md:text-left">
            Metro Atlanta, GA · We come to you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Service Dropdown */}
          <div>
            <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT SERVICE <span className="text-gold">*</span></label>
            <div className="relative">
              <select
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
                required
                className={selectClass}
              >
                <option value="" disabled>Choose a service...</option>
                {visibleServices.map(s => {
                  const suffix = s.quoteOnly ? ' — Quote Only' : s.gold ? ' — Member Only' : '';
                  return (
                    <option key={s.id} value={s.id}>
                      {s.label}{suffix}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/40 pointer-events-none" />
            </div>
          </div>

          {/* Consultation notice */}
          {isConsultation && (
            <div className="border border-gold/20 bg-gold/5 rounded-sm px-5 py-4">
              <p className="text-gold font-mono-tech text-xs tracking-widest mb-1">FREE 15-MIN CONSULTATION</p>
              <p className="text-vapor/50 font-mono-tech text-xs leading-relaxed">
                Ceramic coatings and paint correction are priced based on your vehicle's condition and size. Book a free 15-minute consultation — we'll assess your vehicle and provide a custom quote on the spot.
              </p>
            </div>
          )}

          {/* Vehicle Section */}
          {user && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono-tech tracking-widest text-vapor/40">SELECT VEHICLE(S)</label>
                {!showAddVehicle && (
                  <button
                    type="button"
                    onClick={() => setShowAddVehicle(true)}
                    className="flex items-center gap-1 text-xs font-mono-tech tracking-widest text-gold hover:text-gold-light transition-colors"
                  >
                    <Plus size={12} /> ADD VEHICLE
                  </button>
                )}
              </div>
              {showAddVehicle && (
                <div className="mb-4">
                  <AddVehicleForm
                    onAdd={handleAddVehicleSave}
                    onCancel={() => setShowAddVehicle(false)}
                  />
                </div>
              )}
              {vehicles.length > 0 && (
                <div className="space-y-2">
                  {vehicles.map(v => {
                    const label = `${v.year} ${v.make} ${v.model}${v.color ? ', ' + v.color : ''}`;
                    const checked = selectedVehicles.includes(label);
                    return (
                      <div key={v.id} className={`flex items-center border rounded-sm transition-colors ${checked ? 'border-gold bg-gold/10' : 'border-vapor/10'}`}>
                        <button
                          type="button"
                          onClick={() => toggleVehicle(label)}
                          className="flex-1 flex items-center justify-between px-5 py-3 text-left"
                        >
                          <span className="font-mono-tech text-sm text-vapor">{label}</span>
                          <div className="flex items-center gap-3">
                            {v.vehicle_type && (
                              <span className="text-xs font-mono-tech text-vapor/30">
                                {v.vehicle_type === 'sedan_coupe' ? 'Sedan/Coupe' : 'Truck/SUV'}
                              </span>
                            )}
                            {checked && <X size={13} className="text-gold shrink-0" />}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVehicle(v)}
                          className="px-4 py-3 text-vapor/20 hover:text-red-400 transition-colors border-l border-vapor/10"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {vehicles.length === 0 && !showAddVehicle && (
                <p className="text-vapor/30 font-mono-tech text-xs">No saved vehicles — add one above or enter details below.</p>
              )}
            </div>
          )}



          {/* Estimated total display */}
          {estimatedTotal != null && (
            <div className="flex items-center justify-between border border-gold/20 bg-gold/5 rounded-sm px-5 py-4">
              <div>
                <p className="text-xs font-mono-tech tracking-widest text-gold mb-1">ESTIMATED TOTAL</p>
                <p className="text-vapor/50 font-mono-tech text-xs">
                  {selectedVehicles.length > 1
                    ? `${selectedVehicles.length} vehicles${addOnTotal > 0 ? ` + $${addOnTotal} add-ons` : ''}. Final quote confirmed before service.`
                    : `Based on service + vehicle type${addOnTotal > 0 ? ` + $${addOnTotal} add-ons` : ''}. Final quote confirmed before service.`}
                </p>
              </div>
              <p className="text-2xl font-grotesk font-bold text-gold shrink-0 ml-4">${estimatedTotal}+</p>
            </div>
          )}

          {/* Add-Ons */}
          {form.service_type && !isConsultation && (
            <div>
              <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">ADD-ON SERVICES <span className="text-vapor/25">(OPTIONAL)</span></label>
              {activeVehicleKeys.map(vehicleKey => (
                <div key={vehicleKey} className="mb-4">
                  {selectedVehicles.length > 1 && (
                    <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-2">{vehicleKey}</p>
                  )}
                  <div className="space-y-2">
                    {ADD_ONS.map(ao => {
                      const active = getVehicleAddOns(vehicleKey).includes(ao.id);
                      const isDisabled = ao.id === 'ceramic_sealant' && form.service_type === 'interior_detail';
                      return (
                        <button
                          key={ao.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => !isDisabled && toggleAddOn(vehicleKey, ao.id)}
                          className={`w-full flex items-center justify-between px-5 py-3 border rounded-sm transition-colors text-left ${
                            isDisabled
                              ? 'border-vapor/5 text-vapor/20 cursor-not-allowed opacity-40'
                              : active ? 'border-gold bg-gold/10' : 'border-vapor/10 hover:border-vapor/30'
                          }`}
                        >
                          <div>
                            <span className={`font-mono-tech text-sm ${isDisabled ? 'text-vapor/30' : 'text-vapor'}`}>{ao.label}</span>
                            {isDisabled && <span className="block text-xs font-mono-tech text-vapor/25 mt-0.5">Exterior services only</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-mono-tech text-sm font-bold ${active && !isDisabled ? 'text-gold' : 'text-vapor/40'}`}>{ao.price}</span>
                            {active && !isDisabled && <X size={13} className="text-gold shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {addOnCostForVehicle(vehicleKey) > 0 && selectedVehicles.length > 1 && (
                    <p className="text-right text-xs font-mono-tech text-gold/60 mt-1 tracking-widest">
                      +${addOnCostForVehicle(vehicleKey)}
                    </p>
                  )}
                </div>
              ))}
              {addOnTotal > 0 && (
                <p className="text-right text-xs font-mono-tech text-gold/60 mt-1 tracking-widest border-t border-gold/10 pt-2">
                  TOTAL ADD-ONS: +${addOnTotal}
                </p>
              )}
            </div>
          )}

          {/* Calendar */}
          {form.service_type && (
            <div>
              <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT DATE <span className="text-gold">*</span></p>
              <div className="glass-panel border border-vapor/10 rounded-sm p-5">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setCalendarDate(d => subMonths(d, 1))}
                    className="text-vapor/40 hover:text-vapor transition-colors p-1">
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-vapor font-mono-tech text-sm tracking-widest">
                    {format(calendarDate, 'MMMM yyyy').toUpperCase()}
                  </p>
                  <button type="button" onClick={() => setCalendarDate(d => addMonths(d, 1))}
                    className="text-vapor/40 hover:text-vapor transition-colors p-1">
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <p key={d} className="text-center text-vapor/25 font-mono-tech text-xs py-1">{d}</p>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map(day => {
                    const isPast = isBefore(day, today) && !isToday(day);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    return (
                      <button
                        key={day.toString()}
                        type="button"
                        disabled={isPast}
                        onClick={() => handleDayClick(day)}
                        className={`mx-auto w-8 h-8 flex items-center justify-center rounded-sm font-mono-tech text-xs transition-colors ${
                          isSelected ? 'bg-gold text-obsidian font-bold'
                          : isPast ? 'text-vapor/15 cursor-not-allowed'
                          : isToday(day) ? 'border border-gold/40 text-gold hover:bg-gold/10'
                          : 'text-vapor/60 hover:text-vapor hover:bg-vapor/5'
                        }`}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Time Slots */}
          {selectedDay && (
            <div>
              <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">
                {isConsultation ? 'SELECT CONSULTATION TIME' : 'SELECT TIME'} — {format(selectedDay, 'EEEE, MMMM d').toUpperCase()} <span className="text-gold">*</span>
              </p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-vapor/40 font-mono-tech text-xs py-4">
                  <Loader2 size={13} className="animate-spin" /> CHECKING AVAILABILITY...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const isBooked = bookedSlots.some(b => b.toLowerCase().replace(/\s/g, '') === slot.toLowerCase().replace(/\s/g, ''));
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && setForm(f => ({ ...f, preferred_time: slot }))}
                        className={`py-3 border rounded-sm font-mono-tech text-xs tracking-widest transition-colors ${
                          isBooked
                            ? 'border-vapor/5 text-vapor/20 cursor-not-allowed line-through'
                            : form.preferred_time === slot
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-vapor/10 text-vapor/50 hover:border-vapor/30 hover:text-vapor'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div>
            <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">YOUR DETAILS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'name', label: 'Full Name', placeholder: 'John Smith', required: true },
                { name: 'phone', label: 'Phone / Text', placeholder: '(404) 555-0000', required: true },
                { name: 'email', label: 'Email', placeholder: 'you@email.com', required: false },
                { name: 'address', label: 'Service Address', placeholder: '123 Main St, Atlanta GA', required: true },
              ].map(field => (
                <div key={field.name} className={field.name === 'address' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">
                    {field.label}{field.required && <span className="text-gold ml-1">*</span>}
                  </label>
                  <input
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor placeholder:text-vapor/20 px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">NOTES</label>
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any special requests..."
              className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor placeholder:text-vapor/20 px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              disabled={loading || !form.service_type || !form.name || !form.phone || !form.address || !form.preferred_date || !form.preferred_time}
              className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-obsidian font-mono-tech text-sm tracking-widest py-4 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /><span>SUBMITTING...</span></>
                : isConsultation
                  ? <><span>BOOK CONSULTATION</span><ArrowRight size={14} /></>
                  : <><span>CONFIRM APPOINTMENT</span><ArrowRight size={14} /></>
              }
            </button>
            <p className="text-center text-vapor/25 text-xs font-mono-tech">
              {isConsultation ? "Free 15-min consultation · We'll confirm shortly · Metro Atlanta, GA" : "We'll send a confirmation shortly · Metro Atlanta, GA"}
            </p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}