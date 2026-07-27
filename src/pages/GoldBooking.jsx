import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import SmsConsent from '../components/vds/SmsConsent';
import { useMembershipPlan, useBusinessConfig } from '@/lib/BusinessConfigContext';
import { getGoldMonthlyPrice, getPricingGroupLabel } from '@/lib/goldPricing';

const GOLD_SERVICES = [
  { id: 'vds_gold_exterior', label: 'Exterior Detail', sub: 'Unlimited / Month · Ceramic sealant included', duration: '~1 hr' },
  { id: 'vds_gold_full', label: 'Full Interior + Exterior Detail', sub: '1× Per Month · Ceramic sealant included', duration: '2–3 hrs' },
];

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

const DEFAULT_FORM = {
  name: '', phone: '', email: '', address: '',
  service_type: '', vehicle_type: '', vehicle_info: '', notes: '',
  preferred_date: '', preferred_time: '',
};

export default function GoldBooking() {
  const plan = useMembershipPlan();
  const config = useBusinessConfig();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [goldVehicles, setGoldVehicles] = useState([]); // Vehicles with active subscriptions
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        if (me?.email) setForm(f => ({ ...f, email: me.email }));
        if (me?.full_name) setForm(f => ({ ...f, name: me.full_name }));
        const v = await base44.entities.MemberVehicle.list();
        setVehicles(v);
        
        // Load active Gold subscriptions via backend (bypasses RLS)
        const subsRes = await base44.functions.invoke('getMySubscriptions', {});
        const goldVehicleIds = (subsRes?.data?.subscriptions || []).map(s => s.vehicle_id);
        setGoldVehicles(v.filter(veh => goldVehicleIds.includes(veh.id)));
      }
      setAuthChecked(true);
    };
    init();
  }, []);

  const toggleVehicle = (label) => {
    setSelectedVehicles(prev =>
      prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setForm(f => ({ ...f, preferred_date: format(day, 'yyyy-MM-dd'), preferred_time: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_type || !form.name || !form.phone || !form.address) return;
    if (!form.preferred_date || !form.preferred_time) return;
    if (selectedVehicles.length === 0) return;
    setLoading(true);
    const vehicleSummary = selectedVehicles.join(', ');
    const goldServiceLabel = GOLD_SERVICES.find(s => s.id === form.service_type)?.label || 'VDS Gold Service';
    // Get vehicle type from first selected vehicle for calendar routing
    const firstVehicle = vehicles.find(v =>
      `${v.year} ${v.make} ${v.model}${v.color ? ', ' + v.color : ''}` === selectedVehicles[0]
    );
    await base44.functions.invoke('submitBooking', {
      ...form,
      vehicle_type: firstVehicle?.vehicle_type || 'sedan_coupe',
      vehicle_classification: firstVehicle?.vehicle_classification || null,
      vehicle_info: vehicleSummary,
      vehicle_details: selectedVehicles.map(label => `${label} — ${goldServiceLabel}`).join(' | '),
      preferred_date: form.preferred_date,
      preferred_time: form.preferred_time,
      sms_consent: smsConsent,
    });
    setLoading(false);
    setSubmitted(true);
  };

  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const today = new Date();

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || goldVehicles.length === 0) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">◆</p>
            <h2 className="text-2xl font-grotesk font-bold text-vapor mb-3">{plan.short_label} Members Only</h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              This booking calendar is exclusive to {plan.short_label} members. Enroll at least one vehicle to access priority scheduling.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/vds-gold-signup" className="vds-gold-btn px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm text-center">
                ◆ ENROLL VEHICLE
              </Link>
              <Link to="/member-dashboard" className="border border-vapor/20 text-vapor/60 px-6 py-3 text-xs font-mono-tech tracking-widest rounded-sm text-center hover:border-vapor/40 hover:text-vapor transition-colors">
                MEMBER DASHBOARD
              </Link>
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
              Your Gold appointment for {format(new Date(form.preferred_date), 'MMMM d, yyyy')} at {form.preferred_time} has been submitted. We'll confirm shortly.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm(f => ({ ...DEFAULT_FORM, email: f.email, name: f.name })); setSelectedDay(null); setSelectedVehicles([]); }}
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
            <p className="text-xs font-mono-tech tracking-[0.4em] text-gold">{plan.short_label.toUpperCase()} — PRIORITY SCHEDULING</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor text-center md:text-left">
            BOOK YOUR <GoldShimmer>GOLD SERVICE</GoldShimmer>
          </h1>
          <p className="text-vapor/40 font-mono-tech text-sm mt-3 text-center md:text-left">
            Metro Atlanta, GA · We come to you · Priority scheduling for members
          </p>
        </div>

        {/* Gold member banner */}
        <div className="border border-gold/20 bg-gold/5 rounded-sm px-5 py-4 mb-8 flex items-center gap-3">
          <span className="text-gold text-lg">◆</span>
          <div>
            <p className="text-gold font-mono-tech text-xs tracking-widest">GOLD MEMBER PORTAL</p>
            <p className="text-vapor/60 font-mono-tech text-xs mt-0.5">Welcome back, {user?.full_name?.split(' ')[0] || 'Member'} — your member rates and benefits apply automatically.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Service Selection */}
          <div>
            <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT SERVICE <span className="text-gold">*</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOLD_SERVICES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, service_type: s.id }))}
                  className={`text-left px-5 py-4 border rounded-sm transition-colors ${
                    form.service_type === s.id ? 'border-gold bg-gold/10' : 'border-gold/20 hover:border-gold/40'
                  }`}
                >
                  <p className="font-mono-tech text-xs tracking-widest text-gold mb-1">◆ {s.label}</p>
                  <p className="text-vapor/50 font-mono-tech text-xs">{s.sub}</p>
                  <p className="text-vapor/30 font-mono-tech text-xs mt-1">{s.duration}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Multi-Select with Pricing - Gold subscribed only */}
          {goldVehicles.length > 0 && (
            <div>
              <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT GOLD VEHICLE(S) <span className="text-gold">*</span></label>
              <p className="text-vapor/30 font-mono-tech text-xs mb-3">Only vehicles with active VDS Gold subscriptions can access Gold services.</p>
              <div className="space-y-2">
                {goldVehicles.map(v => {
                  const label = `${v.year} ${v.make} ${v.model}${v.color ? ', ' + v.color : ''}`;
                  const checked = selectedVehicles.includes(label);
                  const vehicleType = v.vehicle_type || 'sedan_coupe';
                  const monthlyRate = getGoldMonthlyPrice(plan, vehicleType);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVehicle(label)}
                      className={`w-full flex items-center justify-between px-5 py-4 border rounded-sm transition-colors text-left ${
                        checked ? 'border-gold bg-gold/10' : 'border-vapor/10 hover:border-vapor/30'
                      }`}
                    >
                      <div>
                        <span className="font-mono-tech text-sm text-vapor block">{label}</span>
                        <span className="text-xs font-mono-tech text-vapor/40 mt-0.5 block">
                          {getPricingGroupLabel(config, vehicleType)} · ${monthlyRate}/mo
                        </span>
                      </div>
                      {checked && <X size={13} className="text-gold shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {selectedVehicles.length > 0 && (
                <div className="mt-4 border border-gold/20 bg-gold/5 rounded-sm px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono-tech tracking-widest text-gold mb-1">MONTHLY RATE</p>
                      <p className="text-vapor/50 font-mono-tech text-xs">
                        {selectedVehicles.length} vehicle{selectedVehicles.length > 1 ? 's' : ''} · Billed via Stripe
                      </p>
                    </div>
                    <p className="text-2xl font-grotesk font-bold text-gold shrink-0 ml-4">
                      ${selectedVehicles.reduce((sum, label) => {
                        const v = vehicles.find(veh => `${veh.year} ${veh.make} ${veh.model}${veh.color ? ', ' + veh.color : ''}` === label);
                        const vt = v?.vehicle_type || 'sedan_coupe';
                        return sum + getGoldMonthlyPrice(plan, vt);
                      }, 0)}+
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calendar */}
          {form.service_type && (
            <div>
              <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT DATE <span className="text-gold">*</span></p>
              <div className="glass-panel border border-gold/15 rounded-sm p-5">
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
                <div className="grid grid-cols-7 mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <p key={d} className="text-center text-vapor/25 font-mono-tech text-xs py-1">{d}</p>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map(day => {
                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                    const isPast = (isBefore(day, today) && !isToday(day)) || isWeekend;
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
                SELECT TIME — {format(selectedDay, 'EEEE, MMMM d').toUpperCase()} <span className="text-gold">*</span>
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, preferred_time: slot }))}
                    className={`py-3 border rounded-sm font-mono-tech text-xs tracking-widest transition-colors ${
                      form.preferred_time === slot
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-vapor/10 text-vapor/50 hover:border-vapor/30 hover:text-vapor'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
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

          {/* Additional vehicle + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-tech text-vapor/40 mb-2 tracking-widest">
                {vehicles.length > 0 ? 'ADDITIONAL VEHICLE' : 'VEHICLE'}
              </label>
              <input
                name="vehicle_info"
                value={form.vehicle_info}
                onChange={handleChange}
                placeholder="2022 BMW M3, White"
                className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor placeholder:text-vapor/20 px-4 py-3 text-sm font-mono-tech rounded-sm outline-none transition-colors"
              />
            </div>
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
          </div>

          {/* SMS Opt-In (A2P 10DLC consent) */}
          <div className="border border-vapor/10 bg-asphalt/50 rounded-sm px-5 py-4">
            <SmsConsent checked={smsConsent} onChange={setSmsConsent} />
          </div>

          {/* Submit */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              disabled={loading || !smsConsent || !form.service_type || !form.name || !form.phone || !form.address || !form.preferred_date || !form.preferred_time || selectedVehicles.length === 0}
              className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-obsidian font-mono-tech text-sm tracking-widest py-4 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /><span>SUBMITTING...</span></>
                : <><span>CONFIRM GOLD APPOINTMENT</span><ArrowRight size={14} /></>
              }
            </button>
            <p className="text-center text-vapor/25 text-xs font-mono-tech">
              Priority scheduling · We'll confirm within a few hours · Metro Atlanta, GA
            </p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}