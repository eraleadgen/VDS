import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import VehicleSelector from '../components/vds/VehicleSelector';
import SmsConsent from '../components/vds/SmsConsent';
import ConditionSelector from '../components/booking/ConditionSelector';
import ServicePicker from '../components/booking/ServicePicker';
import QuoteSummary from '../components/booking/QuoteSummary';
import BookingCalendar from '../components/booking/BookingCalendar';
import SavedVehiclePicker from '../components/booking/SavedVehiclePicker';
import { computeQuote, deriveClassification, classificationToPricingGroup, CLASSIFICATION_LABEL } from '@/lib/quoteCalc';

const DEFAULT_FORM = {
  firstName: '', lastName: '', phone: '', email: '', address: '', notes: '',
  preferred_date: '', preferred_time: '',
};
const DEFAULT_GUEST_VEHICLE = { year: '', make: '', model: '', color: '', classification: null };

export default function BookAppointment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [config, setConfig] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [goldVehicles, setGoldVehicles] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [guestVehicle, setGuestVehicle] = useState(() => {
    const q = location.state?.quote;
    if (q && q.vehicle_classification) {
      return {
        year: q.vehicle_year || '', make: q.vehicle_make || '', model: q.vehicle_model || '',
        color: '', classification: q.vehicle_classification,
      };
    }
    return DEFAULT_GUEST_VEHICLE;
  });

  const [condition, setCondition] = useState(() => location.state?.quote?.condition || 'light');
  const [selected, setSelected] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [consultations, setConsultations] = useState([]);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [guestConfirmed, setGuestConfirmed] = useState(false);
  const [existingQuoteId, setExistingQuoteId] = useState(null);

  const today = new Date();
  const mapping = config?.classification_to_pricing_group || {};

  // Resolve the active vehicle + classification
  const activeVehicle = useMemo(() => {
    if (user) {
      const v = vehicles.find(veh => veh.id === selectedVehicleId);
      return v || null;
    }
    if (guestVehicle.year && guestVehicle.make && guestVehicle.model && guestVehicle.classification) {
      return { ...guestVehicle, vehicle_classification: guestVehicle.classification };
    }
    return null;
  }, [user, vehicles, selectedVehicleId, guestVehicle]);

  const classification = activeVehicle ? deriveClassification(activeVehicle) : null;
  const pricingGroup = classification ? classificationToPricingGroup(mapping, classification) : null;

  const vehicleLabel = activeVehicle
    ? `${activeVehicle.year || ''} ${activeVehicle.make || ''} ${activeVehicle.model || ''}${activeVehicle.color ? ', ' + activeVehicle.color : ''}`.trim()
    : null;

  // Init: auth, config, member data, quote prefill
  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.BusinessConfig.filter({ is_active: true });
        if (list && list[0]) setConfig(list[0]);
      } catch (e) { console.error('Config load error:', e); }

      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        let acc = {};
        try {
          const res = await base44.functions.invoke('account', { action: 'get' });
          acc = res?.data?.account || {};
        } catch {}
        setForm(f => ({
          ...f,
          email: acc.email || me?.email || '',
          firstName: acc.first_name || '',
          lastName: acc.last_name || '',
          phone: acc.phone || '',
        }));
        if (acc.saved_addresses?.length) setSavedAddresses(acc.saved_addresses);
        try {
          const v = await base44.entities.MemberVehicle.list();
          setVehicles(v);
          const subsRes = await base44.functions.invoke('getMySubscriptions', {});
          const goldMap = {};
          (subsRes?.data?.subscriptions || []).forEach(sub => { goldMap[sub.vehicle_id] = true; });
          setGoldVehicles(goldMap);
        } catch (e) { console.error('Vehicle load error:', e); }
      }
      setAuthChecked(true);
      if (!isAuth && location.state?.quote) setGuestConfirmed(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from a saved quote (Pricing page flow)
  useEffect(() => {
    const q = location.state?.quote;
    if (!q) return;
    setExistingQuoteId(location.state?.quote_id || q.id || null);
    if (q.condition) setCondition(q.condition);
    const addOnIds = q.add_ons || [];
    const requested = q.requested_services || [];
    const allServices = config?.services || [];
    const detailKeys = new Set(allServices.filter(s => s.category === 'detail').map(s => s.key));
    const addOnKeys = new Set(allServices.filter(s => s.category === 'addon').map(s => s.key));
    const consultKeys = new Set(allServices.filter(s => s.requires_consultation).map(s => s.key));
    setSelected(requested.filter(k => detailKeys.has(k)));
    setAddOns(addOnIds.filter(k => addOnKeys.has(k)));
    setConsultations(requested.filter(k => consultKeys.has(k)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, config]);

  const handleAddVehicleSave = async (vehicleForm) => {
    const saved = await base44.entities.MemberVehicle.create(vehicleForm);
    setVehicles(v => [...v, saved]);
    setShowAddVehicle(false);
    setSelectedVehicleId(saved.id);
  };

  const handleDeleteVehicle = async (vehicle) => {
    await base44.entities.MemberVehicle.delete(vehicle.id);
    setVehicles(v => v.filter(veh => veh.id !== vehicle.id));
    if (selectedVehicleId === vehicle.id) setSelectedVehicleId(null);
  };

  const handleGuestVehicleSelect = useCallback((sel) => {
    if (!sel) { setGuestVehicle(DEFAULT_GUEST_VEHICLE); return; }
    setGuestVehicle(v => ({ ...v, year: sel.year, make: sel.make, model: sel.model, classification: sel.classification }));
  }, []);

  const guestVehicleSelected = guestVehicle.year
    ? { year: guestVehicle.year, make: guestVehicle.make, model: guestVehicle.model, classification: guestVehicle.classification }
    : null;

  const toggleService = (key) => setSelected(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);
  const toggleAddOn = (key) => setAddOns(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);
  const toggleConsultation = (key) => setConsultations(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);

  const quote = useMemo(() => computeQuote({
    config, classification, condition, selected, addOns, consultations,
  }), [config, classification, condition, selected, addOns, consultations]);

  const hasItems = quote.lineItems.length > 0 && !!classification;
  const conditionEntry = config?.pricing_rules?.condition_multipliers?.find(c => c.key === condition);

  const primaryService = useMemo(() => {
    const all = config?.services || [];
    const firstDetail = selected.find(k => all.find(s => s.key === k && s.category === 'detail'));
    if (firstDetail) return firstDetail;
    return consultations[0] || selected[0] || null;
  }, [selected, consultations, config]);

  const isConsultation = useMemo(() => {
    if (!primaryService) return false;
    const svc = config?.services?.find(s => s.key === primaryService);
    return !!svc?.requires_consultation;
  }, [primaryService, config]);

  const canShowCalendar = !!classification && (selected.length > 0 || consultations.length > 0);
  const canSubmit = !loading && !!classification && (selected.length > 0 || consultations.length > 0)
    && !!form.preferred_date && !!form.preferred_time && !!form.firstName && !!form.phone && !!form.address && smsConsent;

  const handleDayClick = async (day) => {
    setSelectedDay(day);
    setForm(f => ({ ...f, preferred_date: format(day, 'yyyy-MM-dd'), preferred_time: '' }));
    setBookedSlots([]);
    if (primaryService) {
      const vt = isConsultation ? 'standard' : pricingGroup;
      if (vt) {
        setLoadingSlots(true);
        try {
          const res = await base44.functions.invoke('getCalendarAvailability', {
            service_type: primaryService, vehicle_type: vt, date: format(day, 'yyyy-MM-dd'), vehicle_count: 1,
          });
          setBookedSlots(res.data?.bookedSlots || []);
        } catch (err) { console.error('Availability fetch error:', err); }
        finally { setLoadingSlots(false); }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) return;
    setLoading(true);
    try {
      // Persist the quote server-side (source of truth) if not already saved
      let quoteId = existingQuoteId;
      if (!quoteId) {
        const saveRes = await base44.functions.invoke('saveQuote', {
          vehicle_classification: classification,
          vehicle_year: activeVehicle.year || '',
          vehicle_make: activeVehicle.make || '',
          vehicle_model: activeVehicle.model || '',
          services: [...selected, ...consultations],
          add_ons: addOns,
          condition,
          estimated_price: quote.total,
          estimated_duration_minutes: quote.totalMins,
          quote_summary: quote.summary,
        });
        const sd = saveRes?.data || saveRes;
        quoteId = sd?.quote_id || sd?.quote?.id || null;
      }

      const vt = isConsultation ? 'standard' : pricingGroup;
      const addonsArr = addOns.map(k => config.services.find(s => s.key === k)?.label).filter(Boolean);
      const serviceLabel = config.services.find(s => s.key === primaryService)?.label || primaryService;
      const vehicleDetails = `${vehicleLabel} (${CLASSIFICATION_LABEL[classification] || classification}) — ${serviceLabel}${addonsArr.length ? ` + ${addonsArr.join(', ')}` : ''}`;
      const quoteNote = `Estimated Total: $${quote.total}`;

      await base44.functions.invoke('submitBooking', {
        ...form,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        service_type: primaryService,
        vehicle_type: vt,
        vehicle_info: vehicleLabel,
        vehicle_details: vehicleDetails,
        notes: [quoteNote, form.notes].filter(Boolean).join(' | '),
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        sms_consent: smsConsent,
        quote_id: quoteId,
      });

      if (location.state?.reschedule_from) {
        try { await base44.functions.invoke('cancelAppointmentInGHL', { appointment_id: location.state.reschedule_from }); }
        catch (e) { console.error('Reschedule cancel failed:', e); }
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Booking submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor placeholder:text-vapor/20 px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors";

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // Guest gate
  if (!user && !guestConfirmed) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6 py-24 md:py-32">
          <div className="max-w-md w-full text-center">
            <div className="w-8 h-px bg-gold mx-auto mb-6" />
            <p className="text-xs font-mono-tech tracking-[0.4em] text-gold mb-4">BOOK YOUR DETAIL</p>
            <h1 className="text-4xl font-grotesk font-bold text-vapor mb-3">GET AN INSTANT QUOTE</h1>
            <p className="text-vapor/40 font-mono-tech text-sm mb-10">Build a custom quote & schedule in one flow. Metro Atlanta, GA · We come to you.</p>
            <div className="space-y-4">
              <div className="border border-gold/20 bg-gold/5 rounded-sm p-6">
                <p className="text-xs font-mono-tech tracking-widest text-gold mb-2">MEMBER ACCOUNT</p>
                <p className="text-vapor/50 font-mono-tech text-xs mb-5">Sign in to use saved vehicles, auto-fill details, and track service history.</p>
                <div className="flex gap-3">
                  <a href="/member-login" className="flex-1 text-center border border-gold bg-gold text-obsidian px-4 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors">SIGN IN</a>
                  <a href="/gold-signup" className="flex-1 text-center border border-gold/40 text-gold px-4 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/10 transition-colors">CREATE ACCOUNT</a>
                </div>
              </div>
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-vapor/10" />
                <span className="text-vapor/30 font-mono-tech text-xs">OR</span>
                <div className="flex-1 h-px bg-vapor/10" />
              </div>
              <button onClick={() => setGuestConfirmed(true)} className="w-full border border-vapor/20 text-vapor/60 px-6 py-4 text-sm font-mono-tech tracking-widest rounded-sm hover:border-vapor/40 hover:text-vapor transition-colors">
                CONTINUE AS GUEST →
              </button>
              <p className="text-vapor/25 font-mono-tech text-xs">Build a quote & book · No account required</p>
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
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6 py-24 md:py-32">
          <div className="text-center max-w-md">
            <CheckCircle size={48} className="text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-grotesk font-bold text-vapor mb-3">Appointment Requested!</h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              Your appointment for {format(new Date(form.preferred_date + 'T12:00:00'), 'MMMM d, yyyy')} at {form.preferred_time} has been submitted. We'll confirm shortly.
            </p>
            <div className="flex flex-col gap-3">
              {user ? (
                <a href="/member-dashboard" className="border border-gold bg-gold text-obsidian px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors text-center">VIEW APPOINTMENT →</a>
              ) : (
                <a href="/member-login" className="border border-gold/40 text-gold px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/10 transition-colors text-center">CREATE ACCOUNT TO TRACK →</a>
              )}
              <button onClick={() => { setSubmitted(false); setForm(DEFAULT_FORM); setSelectedDay(null); setGuestVehicle(DEFAULT_GUEST_VEHICLE); setSelected([]); setAddOns([]); setConsultations([]); setCondition('light'); setSmsConsent(false); setExistingQuoteId(null); navigate('/book', { replace: true }); }}
                className="border border-vapor/20 text-vapor/60 px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:border-vapor/50 hover:text-vapor transition-colors">BOOK ANOTHER</button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      <section className="pt-40 pb-12 max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">METRO ATLANTA · MOBILE DETAILING</p>
        <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor leading-none mb-6">
          <GoldShimmer>QUOTE & BOOK</GoldShimmer>
        </h1>
        <p className="text-vapor/50 text-lg max-w-xl mx-auto leading-relaxed">
          Build your custom quote and schedule in one place. Pricing adjusts to your vehicle size, condition, and add-ons.
        </p>
      </section>

      {!config ? (
        <div className="flex justify-center py-24"><Loader2 size={28} className="text-gold animate-spin" /></div>
      ) : (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-10">
              {/* Step 1: Vehicle */}
              <div>
                {user && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">1</span>
                    <h2 className="text-sm font-mono-tech tracking-widest text-gold">YOUR VEHICLE</h2>
                  </div>
                )}
                {user ? (
                  <SavedVehiclePicker
                    vehicles={vehicles} goldVehicles={goldVehicles}
                    selectedId={selectedVehicleId} onSelect={setSelectedVehicleId}
                    showAddForm={showAddVehicle} onAddNew={() => setShowAddVehicle(true)}
                    onAddSave={handleAddVehicleSave} onCancelAdd={() => setShowAddVehicle(false)}
                    onDelete={handleDeleteVehicle}
                  />
                ) : (
                  <div>
                    <VehicleSelector onSelect={handleGuestVehicleSelect} selected={guestVehicleSelected} />
                    <div className="mt-4">
                      <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">COLOR (OPTIONAL)</label>
                      <input value={guestVehicle.color} onChange={e => setGuestVehicle(v => ({ ...v, color: e.target.value }))} placeholder="Color (e.g. Guards Red)" className={inputClass} />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Condition */}
              {classification && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">2</span>
                    <h2 className="text-sm font-mono-tech tracking-widest text-gold">VEHICLE CONDITION</h2>
                  </div>
                  <ConditionSelector conditions={config.pricing_rules?.condition_multipliers || []} value={condition} onChange={setCondition} />
                </div>
              )}

              {/* Step 3: Services */}
              {classification && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">3</span>
                    <h2 className="text-sm font-mono-tech tracking-widest text-gold">CHOOSE YOUR SERVICES</h2>
                  </div>
                  <ServicePicker
                    config={config} classification={classification} pricingGroup={pricingGroup}
                    selected={selected} addOns={addOns} consultations={consultations}
                    onToggleService={toggleService} onToggleAddOn={toggleAddOn} onToggleConsultation={toggleConsultation}
                  />
                </div>
              )}

              {/* Step 4: Schedule */}
              {canShowCalendar && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">4</span>
                    <h2 className="text-sm font-mono-tech tracking-widest text-gold">SCHEDULE</h2>
                  </div>
                  <BookingCalendar
                    calendarDate={calendarDate} setCalendarDate={setCalendarDate}
                    selectedDay={selectedDay} onDayClick={handleDayClick}
                    bookedSlots={bookedSlots} loadingSlots={loadingSlots}
                    selectedTime={form.preferred_time} onSelectTime={(t) => setForm(f => ({ ...f, preferred_time: t }))}
                    today={today} isConsultation={isConsultation}
                  />
                </div>
              )}

              {/* Step 5: Contact */}
              {canShowCalendar && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">5</span>
                    <h2 className="text-sm font-mono-tech tracking-widest text-gold">YOUR DETAILS</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">FIRST NAME <span className="text-gold">*</span></label>
                      <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" required className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">LAST NAME</label>
                      <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Smith" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">PHONE / TEXT <span className="text-gold">*</span></label>
                      <input name="phone" value={form.phone} onChange={handleChange} placeholder="(404) 555-0000" required className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">EMAIL</label>
                      <input name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">SERVICE ADDRESS <span className="text-gold">*</span></label>
                      {user && savedAddresses.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {savedAddresses.map((addr, i) => (
                            <button key={i} type="button" onClick={() => setForm(f => ({ ...f, address: addr }))}
                              className={`text-xs font-mono-tech px-3 py-1.5 rounded-sm border transition-colors ${form.address === addr ? 'border-gold bg-gold/10 text-gold' : 'border-vapor/20 text-vapor/50 hover:border-vapor/40 hover:text-vapor'}`}>
                              {addr}
                            </button>
                          ))}
                        </div>
                      )}
                      <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, Atlanta GA" required className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">NOTES</label>
                      <input name="notes" value={form.notes} onChange={handleChange} placeholder="Any special requests..." className={inputClass} />
                    </div>
                  </div>
                  <div className="border border-vapor/10 bg-asphalt/50 rounded-sm px-5 py-4 mt-4">
                    <SmsConsent checked={smsConsent} onChange={setSmsConsent} />
                  </div>
                </div>
              )}
            </div>

            {/* Right: sticky quote */}
            <div className="lg:col-span-1">
              <QuoteSummary
                vehicleLabel={vehicleLabel}
                conditionLabel={conditionEntry?.label}
                quote={quote}
                hasItems={hasItems}
                classification={classification}
                canSubmit={canSubmit}
                submitting={loading}
              />
            </div>
          </form>

        </section>
      )}

      <Footer />
    </div>
  );
}