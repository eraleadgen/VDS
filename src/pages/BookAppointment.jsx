import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

const SERVICE_LABELS = {
  exterior_detail: 'Exterior Detail',
  interior_detail: 'Interior Detail',
  full_detail: 'Full Interior + Exterior Detail',
  vds_gold_exterior: 'VDS Gold — Exterior Detail',
  vds_gold_full: 'VDS Gold — Full Detail',
  ceramic_coating: 'Ceramic Coating',
  paint_correction: 'Paint Correction',
};

const DEFAULT_FORM = {
  name: '', phone: '', email: '', address: '',
  service_type: '', vehicle_type: '', vehicle_info: '', notes: '',
  preferred_date: '', preferred_time: '',
};

// Guest vehicle entry (for non-members)
const DEFAULT_GUEST_VEHICLE = { year: '', make: '', model: '', color: '', vehicle_type: '' };

export default function BookAppointment() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [goldVehicles, setGoldVehicles] = useState({});
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [vehicleServices, setVehicleServices] = useState({});
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [addOns, setAddOns] = useState({});
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Guest vehicle state
  const [guestVehicle, setGuestVehicle] = useState(DEFAULT_GUEST_VEHICLE);
  const [guestService, setGuestService] = useState('');
  const [guestAddOns, setGuestAddOns] = useState([]);
  const [guestConfirmed, setGuestConfirmed] = useState(false);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.email) setForm(f => ({ ...f, email: me.email }));
        if (me?.full_name) setForm(f => ({ ...f, name: me.full_name }));
        if (me?.phone) setForm(f => ({ ...f, phone: me.phone || '' }));
        const v = await base44.entities.MemberVehicle.list();
        setVehicles(v);
        const subsRes = await base44.functions.invoke('getMySubscriptions', {});
        const goldMap = {};
        (subsRes?.data?.subscriptions || []).forEach(sub => { goldMap[sub.vehicle_id] = true; });
        setGoldVehicles(goldMap);
      }
      setAuthChecked(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (location.state?.preselect_service) {
      setForm(f => ({ ...f, service_type: location.state.preselect_service }));
      setGuestService(location.state.preselect_service);
    }
  }, [location.state]);

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
    setVehicleServices(prev => { const next = { ...prev }; delete next[label]; return next; });
  };

  const getVehicleAddOns = (label) => addOns[label] || [];
  const toggleAddOn = (vehicleLabel, id) => {
    setAddOns(prev => {
      const current = prev[vehicleLabel] || [];
      const updated = current.includes(id) ? current.filter(a => a !== id) : [...current, id];
      return { ...prev, [vehicleLabel]: updated };
    });
  };
  const setVehicleService = (vehicleLabel, serviceId) => {
    setVehicleServices(prev => ({ ...prev, [vehicleLabel]: serviceId }));
  };
  const getVehicleService = (label) => vehicleServices[label] || form.service_type;
  const addOnCostForVehicle = (label) =>
    getVehicleAddOns(label).reduce((sum, id) => {
      const ao = ADD_ONS.find(a => a.id === id);
      return sum + (ao ? parseInt(ao.price.replace(/\D/g, '')) : 0);
    }, 0);

  const derivedVehicleType = (() => {
    if (user && selectedVehicles.length > 0) {
      const v = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === selectedVehicles[0]);
      return v?.vehicle_type || null;
    }
    if (!user) return guestVehicle.vehicle_type || null;
    return form.vehicle_type || null;
  })();

  const hasGoldSubscription = selectedVehicles.some(label => {
    const v = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === label);
    return v && goldVehicles[v.id];
  });

  const activeVehicleKeys = user ? (selectedVehicles.length > 0 ? selectedVehicles : ['__global']) : ['__guest'];
  const addOnTotal = user
    ? activeVehicleKeys.reduce((sum, key) => sum + addOnCostForVehicle(key), 0)
    : guestAddOns.reduce((sum, id) => { const ao = ADD_ONS.find(a => a.id === id); return sum + (ao ? parseInt(ao.price.replace(/\D/g, '')) : 0); }, 0);

  const estimatedTotal = (() => {
    if (user) {
      if (selectedVehicles.length === 0) return null;
      const prices = selectedVehicles.map(label => {
        const v = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === label);
        const serviceId = getVehicleService(label);
        if (!serviceId || !v?.vehicle_type) return null;
        const base = PRICE_MAP[serviceId]?.[v.vehicle_type];
        if (!base) return null;
        return parseInt(base.replace(/\D/g, '')) + addOnCostForVehicle(label);
      });
      if (prices.some(p => p === null)) return null;
      return prices.reduce((a, b) => a + b, 0);
    } else {
      if (!guestService || !guestVehicle.vehicle_type) return null;
      const base = PRICE_MAP[guestService]?.[guestVehicle.vehicle_type];
      if (!base) return null;
      return parseInt(base.replace(/\D/g, '')) + addOnTotal;
    }
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

  const currentServiceForCalendar = user
    ? (selectedVehicles.length > 0 ? getVehicleService(selectedVehicles[0]) : null)
    : guestService;

  const handleDayClick = async (day) => {
    setSelectedDay(day);
    setForm(f => ({ ...f, preferred_date: format(day, 'yyyy-MM-dd'), preferred_time: '' }));
    setBookedSlots([]);
    if (currentServiceForCalendar) {
      const isConsultation = CONSULTATION_IDS.includes(currentServiceForCalendar);
      const vtForAvailability = isConsultation
        ? (hasGoldSubscription ? 'gold' : 'standard')
        : derivedVehicleType;
      if (vtForAvailability) {
        setLoadingSlots(true);
        try {
          const res = await base44.functions.invoke('getCalendarAvailability', {
            service_type: currentServiceForCalendar,
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
    }
  };

  const toggleVehicle = (label) => {
    setSelectedVehicles(prev =>
      prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]
    );
  };

  // Validation for showing calendar
  const canShowCalendar = user
    ? selectedVehicles.length > 0 && selectedVehicles.some(label => getVehicleService(label))
    : guestVehicle.year && guestVehicle.make && guestVehicle.model && guestVehicle.vehicle_type && guestService;

  const isConsultation = user
    ? (selectedVehicles.length > 0 && CONSULTATION_IDS.includes(getVehicleService(selectedVehicles[0])))
    : CONSULTATION_IDS.includes(guestService);

  const canSubmit = user
    ? !loading && form.name && form.phone && form.address && form.preferred_date && form.preferred_time && selectedVehicles.length > 0 && selectedVehicles.every(v => getVehicleService(v))
    : !loading && form.name && form.phone && form.address && form.preferred_date && form.preferred_time && guestVehicle.year && guestVehicle.make && guestVehicle.model && guestVehicle.vehicle_type && guestService;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) return;
    setLoading(true);
    try {
      let vehicleSummary, vehicleDetails, firstService, submitVehicleType, quoteNote;
      if (user) {
        vehicleSummary = selectedVehicles.join(', ');
        const vehicleDetailsArr = selectedVehicles.map(label => {
          const v = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === label);
          const service = getVehicleService(label);
          const addonsArr = getVehicleAddOns(label).map(id => ADD_ONS.find(a => a.id === id)?.label).filter(Boolean);
          const vehicleTypeLabel = v?.vehicle_type === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe';
          return `${label} (${vehicleTypeLabel}) — ${SERVICE_LABELS[service] || service}${addonsArr.length ? ` + ${addonsArr.join(', ')}` : ''}`;
        });
        vehicleDetails = vehicleDetailsArr.join(' | ');
        quoteNote = estimatedTotal != null ? `Estimated Total: $${estimatedTotal}+` : '';
        firstService = getVehicleService(selectedVehicles[0]);
        const isConsult = CONSULTATION_IDS.includes(firstService);
        submitVehicleType = isConsult ? (hasGoldSubscription ? 'gold' : 'standard') : (derivedVehicleType || form.vehicle_type);
      } else {
        const guestLabel = `${guestVehicle.year} ${guestVehicle.make} ${guestVehicle.model}${guestVehicle.color ? ', ' + guestVehicle.color : ''}`;
        const vehicleTypeLabel = guestVehicle.vehicle_type === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe';
        const addonsArr = guestAddOns.map(id => ADD_ONS.find(a => a.id === id)?.label).filter(Boolean);
        vehicleSummary = guestLabel;
        vehicleDetails = `${guestLabel} (${vehicleTypeLabel}) — ${SERVICE_LABELS[guestService] || guestService}${addonsArr.length ? ` + ${addonsArr.join(', ')}` : ''}`;
        quoteNote = estimatedTotal != null ? `Estimated Total: $${estimatedTotal}+` : '';
        firstService = guestService;
        const isConsult = CONSULTATION_IDS.includes(firstService);
        submitVehicleType = isConsult ? 'standard' : guestVehicle.vehicle_type;
      }

      await base44.functions.invoke('submitBookingToGHL', {
        ...form,
        service_type: firstService,
        vehicle_type: submitVehicleType,
        vehicle_info: vehicleSummary,
        vehicle_details: vehicleDetails,
        notes: [quoteNote, form.notes].filter(Boolean).join(' | '),
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

  const selectClass = "w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors appearance-none cursor-pointer";
  const inputClass = "w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor placeholder:text-vapor/20 px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors";

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // Gate: unauthenticated users must choose sign in or continue as guest
  if (!user && !guestConfirmed) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="max-w-md w-full text-center">
            <div className="w-8 h-px bg-gold mx-auto mb-6" />
            <p className="text-xs font-mono-tech tracking-[0.4em] text-gold mb-4">SCHEDULE SERVICE</p>
            <h1 className="text-4xl font-grotesk font-bold text-vapor mb-3">BOOK AN APPOINTMENT</h1>
            <p className="text-vapor/40 font-mono-tech text-sm mb-10">Metro Atlanta, GA · We come to you</p>

            <div className="space-y-4">
              <div className="border border-gold/20 bg-gold/5 rounded-sm p-6">
                <p className="text-xs font-mono-tech tracking-widest text-gold mb-2">MEMBER ACCOUNT</p>
                <p className="text-vapor/50 font-mono-tech text-xs mb-5">Sign in to auto-fill your details, manage vehicles, and track service history.</p>
                <div className="flex gap-3">
                  <a href="/member-login" className="flex-1 text-center border border-gold bg-gold text-obsidian px-4 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors">
                    SIGN IN
                  </a>
                  <a href="/gold-signup" className="flex-1 text-center border border-gold/40 text-gold px-4 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/10 transition-colors">
                    CREATE ACCOUNT
                  </a>
                </div>
              </div>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-vapor/10" />
                <span className="text-vapor/30 font-mono-tech text-xs">OR</span>
                <div className="flex-1 h-px bg-vapor/10" />
              </div>

              <button
                onClick={() => setGuestConfirmed(true)}
                className="w-full border border-vapor/20 text-vapor/60 px-6 py-4 text-sm font-mono-tech tracking-widest rounded-sm hover:border-vapor/40 hover:text-vapor transition-colors"
              >
                CONTINUE AS GUEST →
              </button>
              <p className="text-vapor/25 font-mono-tech text-xs">One-time booking · No account required</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="text-center max-w-md">
            <CheckCircle size={48} className="text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-grotesk font-bold text-vapor mb-3">Appointment Requested!</h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              Your appointment for {format(new Date(form.preferred_date + 'T12:00:00'), 'MMMM d, yyyy')} at {form.preferred_time} has been submitted. We'll confirm shortly.
            </p>
            <div className="flex flex-col gap-3">
              {user ? (
                <Link to="/member-dashboard" className="border border-gold bg-gold text-obsidian px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors">
                  VIEW APPOINTMENT →
                </Link>
              ) : (
                <a href="/member-login" className="border border-gold/40 text-gold px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/10 transition-colors text-center">
                  CREATE ACCOUNT TO TRACK →
                </a>
              )}
              <button
                onClick={() => { setSubmitted(false); setForm(DEFAULT_FORM); setSelectedDay(null); setGuestVehicle(DEFAULT_GUEST_VEHICLE); setGuestService(''); setGuestAddOns([]); }}
                className="border border-vapor/20 text-vapor/60 px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:border-vapor/50 hover:text-vapor transition-colors"
              >
                BOOK ANOTHER
              </button>
            </div>
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

          {/* MEMBER: Vehicle + service selection */}
          {user && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono-tech tracking-widest text-vapor/40">SELECT VEHICLE(S) <span className="text-gold">*</span></label>
                {!showAddVehicle && (
                  <button type="button" onClick={() => setShowAddVehicle(true)} className="flex items-center gap-1 text-xs font-mono-tech tracking-widest text-gold hover:text-gold-light transition-colors">
                    <Plus size={12} /> ADD VEHICLE
                  </button>
                )}
              </div>
              {showAddVehicle && (
                <div className="mb-4">
                  <AddVehicleForm onAdd={handleAddVehicleSave} onCancel={() => setShowAddVehicle(false)} />
                </div>
              )}
              {vehicles.length > 0 && (
                <div className="space-y-3">
                  {vehicles.map(v => {
                    const label = `${v.year} ${v.make} ${v.model}${v.color ? ', ' + v.color : ''}`;
                    const checked = selectedVehicles.includes(label);
                    const vehicleService = getVehicleService(label);
                    const isVehicleConsultation = CONSULTATION_IDS.includes(vehicleService);
                    return (
                      <div key={v.id} className={`border rounded-sm transition-colors ${checked ? 'border-gold bg-gold/5' : 'border-vapor/10'}`}>
                        <div className="flex items-center gap-3 p-4">
                          <button type="button" onClick={() => toggleVehicle(label)}
                            className={`w-5 h-5 border rounded-sm flex items-center justify-center transition-colors ${checked ? 'border-gold bg-gold text-obsidian' : 'border-vapor/30 hover:border-vapor/50'}`}>
                            {checked && <X size={12} />}
                          </button>
                          <div className="flex-1">
                            <p className="font-mono-tech text-sm text-vapor">{label}</p>
                            {v.vehicle_type && (
                              <p className="text-xs font-mono-tech text-vapor/30 mt-0.5">
                                {v.vehicle_type === 'sedan_coupe' ? 'Sedan/Coupe' : 'Truck/SUV'}
                              </p>
                            )}
                          </div>
                          <button type="button" onClick={() => handleDeleteVehicle(v)} className="p-2 text-vapor/20 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {checked && (
                          <div className="px-4 pb-4">
                            <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">SERVICE FOR THIS VEHICLE</label>
                            <div className="relative">
                              <select value={vehicleService} onChange={(e) => setVehicleService(label, e.target.value)} className={selectClass}>
                                <option value="" disabled>Choose a service...</option>
                                {SERVICES.filter(s => {
                                  if (s.gold) {
                                    const vehicleObj = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === label);
                                    return vehicleObj && goldVehicles[vehicleObj.id];
                                  }
                                  return true;
                                }).map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}{s.quoteOnly ? ' — Quote Only' : s.gold ? ' — Gold Member' : ''}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/40 pointer-events-none" />
                            </div>
                            {isVehicleConsultation && (
                              <p className="text-xs font-mono-tech text-gold/60 mt-2">Free 15-min consultation · Custom quote provided on-site</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {vehicles.length === 0 && !showAddVehicle && (
                <p className="text-vapor/30 font-mono-tech text-xs">No saved vehicles — add one above to continue.</p>
              )}
              {vehicles.length > 0 && selectedVehicles.length === 0 && (
                <p className="text-gold/60 font-mono-tech text-xs mt-2">Please select at least one vehicle to continue.</p>
              )}
            </div>
          )}

          {/* GUEST: Vehicle entry */}
          {!user && (
            <div>
              <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">YOUR VEHICLE <span className="text-gold">*</span></p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { key: 'year', placeholder: 'Year (e.g. 2020)' },
                  { key: 'make', placeholder: 'Make (e.g. Toyota)' },
                  { key: 'model', placeholder: 'Model (e.g. Camry)' },
                  { key: 'color', placeholder: 'Color (optional)' },
                ].map(f => (
                  <input
                    key={f.key}
                    value={guestVehicle[f.key]}
                    onChange={e => setGuestVehicle(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={inputClass}
                  />
                ))}
              </div>
              <div className="relative mb-3">
                <select value={guestVehicle.vehicle_type} onChange={e => setGuestVehicle(v => ({ ...v, vehicle_type: e.target.value }))} className={selectClass}>
                  <option value="" disabled>Vehicle type...</option>
                  <option value="sedan_coupe">Sedan / Coupe</option>
                  <option value="truck_suv">Truck / SUV</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/40 pointer-events-none" />
              </div>
              <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest mt-4">SELECT SERVICE <span className="text-gold">*</span></label>
              <div className="relative">
                <select value={guestService} onChange={e => { setGuestService(e.target.value); setSelectedDay(null); setForm(f => ({ ...f, preferred_date: '', preferred_time: '' })); }} className={selectClass}>
                  <option value="" disabled>Choose a service...</option>
                  {SERVICES.filter(s => !s.gold).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}{s.quoteOnly ? ' — Quote Only' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/40 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Estimated total */}
          {estimatedTotal != null && (
            <div className="flex items-center justify-between border border-gold/20 bg-gold/5 rounded-sm px-5 py-4">
              <div>
                <p className="text-xs font-mono-tech tracking-widest text-gold mb-1">ESTIMATED TOTAL</p>
                <p className="text-vapor/50 font-mono-tech text-xs">
                  {user && selectedVehicles.length > 1
                    ? `${selectedVehicles.length} vehicles${addOnTotal > 0 ? ` + $${addOnTotal} add-ons` : ''}. Final quote confirmed before service.`
                    : `Based on service + vehicle type${addOnTotal > 0 ? ` + $${addOnTotal} add-ons` : ''}. Final quote confirmed before service.`}
                </p>
              </div>
              <p className="text-2xl font-grotesk font-bold text-gold shrink-0 ml-4">${estimatedTotal}+</p>
            </div>
          )}

          {/* Add-Ons — Member */}
          {user && selectedVehicles.length > 0 && selectedVehicles.some(label => getVehicleService(label)) && (
            <div>
              <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">ADD-ON SERVICES <span className="text-vapor/25">(OPTIONAL)</span></label>
              {selectedVehicles.map(vehicleKey => {
                const vehicleService = getVehicleService(vehicleKey);
                const isInteriorOnly = vehicleService === 'interior_detail';
                if (!vehicleService || CONSULTATION_IDS.includes(vehicleService)) return null;
                return (
                  <div key={vehicleKey} className="mb-4">
                    {selectedVehicles.length > 1 && <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-2">{vehicleKey}</p>}
                    <div className="space-y-2">
                      {ADD_ONS.map(ao => {
                        const active = getVehicleAddOns(vehicleKey).includes(ao.id);
                        const isDisabled = ao.id === 'ceramic_sealant' && isInteriorOnly;
                        return (
                          <button key={ao.id} type="button" disabled={isDisabled} onClick={() => !isDisabled && toggleAddOn(vehicleKey, ao.id)}
                            className={`w-full flex items-center justify-between px-5 py-3 border rounded-sm transition-colors text-left ${isDisabled ? 'border-vapor/5 text-vapor/20 cursor-not-allowed opacity-40' : active ? 'border-gold bg-gold/10' : 'border-vapor/10 hover:border-vapor/30'}`}>
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
                  </div>
                );
              })}
              {addOnTotal > 0 && <p className="text-right text-xs font-mono-tech text-gold/60 mt-1 tracking-widest border-t border-gold/10 pt-2">TOTAL ADD-ONS: +${addOnTotal}</p>}
            </div>
          )}

          {/* Add-Ons — Guest */}
          {!user && guestService && !CONSULTATION_IDS.includes(guestService) && (
            <div>
              <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">ADD-ON SERVICES <span className="text-vapor/25">(OPTIONAL)</span></label>
              <div className="space-y-2">
                {ADD_ONS.map(ao => {
                  const active = guestAddOns.includes(ao.id);
                  const isDisabled = ao.id === 'ceramic_sealant' && guestService === 'interior_detail';
                  return (
                    <button key={ao.id} type="button" disabled={isDisabled} onClick={() => !isDisabled && setGuestAddOns(prev => prev.includes(ao.id) ? prev.filter(a => a !== ao.id) : [...prev, ao.id])}
                      className={`w-full flex items-center justify-between px-5 py-3 border rounded-sm transition-colors text-left ${isDisabled ? 'border-vapor/5 text-vapor/20 cursor-not-allowed opacity-40' : active ? 'border-gold bg-gold/10' : 'border-vapor/10 hover:border-vapor/30'}`}>
                      <span className={`font-mono-tech text-sm ${isDisabled ? 'text-vapor/30' : 'text-vapor'}`}>{ao.label}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono-tech text-sm font-bold ${active ? 'text-gold' : 'text-vapor/40'}`}>{ao.price}</span>
                        {active && <X size={13} className="text-gold shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendar */}
          {canShowCalendar && (
            <div>
              <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT DATE <span className="text-gold">*</span></p>
              <div className="glass-panel border border-vapor/10 rounded-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <button type="button"
                    onClick={() => setCalendarDate(d => subMonths(d, 1))}
                    disabled={calendarDate.getFullYear() === today.getFullYear() && calendarDate.getMonth() === today.getMonth()}
                    className="text-vapor/40 hover:text-vapor transition-colors p-1 disabled:opacity-20 disabled:cursor-not-allowed">
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-vapor font-mono-tech text-sm tracking-widest">{format(calendarDate, 'MMMM yyyy').toUpperCase()}</p>
                  <button type="button" onClick={() => setCalendarDate(d => addMonths(d, 1))} className="text-vapor/40 hover:text-vapor transition-colors p-1">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <p key={d} className="text-center text-vapor/25 font-mono-tech text-xs py-1">{d}</p>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map(day => {
                    const isPast = isBefore(day, todayStart) || isToday(day);
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    return (
                      <button key={day.toString()} type="button" disabled={isPast} onClick={() => handleDayClick(day)}
                        className={`mx-auto w-8 h-8 flex items-center justify-center rounded-sm font-mono-tech text-xs transition-colors ${
                          isSelected ? 'bg-gold text-obsidian font-bold'
                          : isPast ? 'text-vapor/15 cursor-not-allowed'
                          : 'text-vapor/60 hover:text-vapor hover:bg-vapor/5'
                        }`}>
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
                      <button key={slot} type="button" disabled={isBooked}
                        onClick={() => !isBooked && setForm(f => ({ ...f, preferred_time: slot }))}
                        className={`py-3 border rounded-sm font-mono-tech text-xs tracking-widest transition-colors ${
                          isBooked ? 'border-vapor/5 text-vapor/20 cursor-not-allowed line-through'
                          : form.preferred_time === slot ? 'border-gold bg-gold/10 text-gold'
                          : 'border-vapor/10 text-vapor/50 hover:border-vapor/30 hover:text-vapor'
                        }`}>
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
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">NOTES</label>
            <input name="notes" value={form.notes} onChange={handleChange} placeholder="Any special requests..." className={inputClass} />
          </div>

          {/* Submit */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-obsidian font-mono-tech text-sm tracking-widest py-4 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /><span>SUBMITTING...</span></>
                : <><span>CONFIRM BOOKING</span><ArrowRight size={14} /></>
              }
            </button>
            <p className="text-center text-vapor/25 text-xs font-mono-tech">We'll confirm shortly · Metro Atlanta, GA</p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}