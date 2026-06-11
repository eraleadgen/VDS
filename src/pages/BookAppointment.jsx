import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle, ChevronDown, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, isSameDay } from 'date-fns';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

const SERVICES = [
  { id: 'exterior_detail', label: 'Exterior Detail', duration: '1–2 hrs', price: 'From $100' },
  { id: 'interior_detail', label: 'Interior Detail', duration: '2–3 hrs', price: 'From $125' },
  { id: 'full_detail', label: 'Full Interior + Exterior Detail', duration: '3–5 hrs', price: 'From $175' },
  { id: 'vds_gold_exterior', label: '◆ VDS Gold — Exterior Detail', duration: '1 hr', price: 'Member Only', gold: true },
  { id: 'vds_gold_full', label: '◆ VDS Gold — Full Detail', duration: '2–3 hrs', price: 'Member Only', gold: true },
  { id: 'ceramic_coating', label: 'Ceramic Coating', duration: 'Custom', price: 'Quote Only', quoteOnly: true },
  { id: 'paint_correction', label: 'Paint Correction', duration: 'Custom', price: 'Quote Only', quoteOnly: true },
];

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const QUOTE_ONLY_IDS = ['ceramic_coating', 'paint_correction'];

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
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const isQuoteOnly = QUOTE_ONLY_IDS.includes(form.service_type);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'service_type') {
      setSelectedDay(null);
      setForm(f => ({ ...f, service_type: value, preferred_date: '', preferred_time: '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setForm(f => ({ ...f, preferred_date: format(day, 'yyyy-MM-dd'), preferred_time: '' }));
  };

  const toggleVehicle = (label) => {
    setSelectedVehicles(prev =>
      prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_type || !form.name || !form.phone || !form.address) return;
    if (!isQuoteOnly && (!form.preferred_date || !form.preferred_time || !form.vehicle_type)) return;
    setLoading(true);
    try {
      const vehicleSummary = selectedVehicles.length > 0 ? selectedVehicles.join(', ') : form.vehicle_info;
      await base44.functions.invoke('submitBookingToGHL', {
        ...form,
        vehicle_info: vehicleSummary,
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
              {isQuoteOnly ? 'Quote Request Sent!' : 'Appointment Requested!'}
            </h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              {isQuoteOnly
                ? "We'll review your request and reach out within 1 business day with a custom quote."
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
                {visibleServices.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label} — {s.price}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-vapor/40 pointer-events-none" />
            </div>
          </div>

          {/* Quote-only notice */}
          {isQuoteOnly && (
            <div className="border border-gold/20 bg-gold/5 rounded-sm px-5 py-4">
              <p className="text-gold font-mono-tech text-xs tracking-widest mb-1">CUSTOM QUOTE REQUIRED</p>
              <p className="text-vapor/50 font-mono-tech text-xs leading-relaxed">
                Ceramic coatings and paint correction are priced based on your vehicle's condition and size. Fill in your details below and we'll reach out within 1 business day.
              </p>
            </div>
          )}

          {/* Vehicle Multi-Select — only for logged-in users with saved vehicles */}
          {vehicles.length > 0 && (
            <div>
              <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT VEHICLE(S)</label>
              <div className="space-y-2">
                {vehicles.map(v => {
                  const label = `${v.year} ${v.make} ${v.model}${v.color ? ', ' + v.color : ''}`;
                  const checked = selectedVehicles.includes(label);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVehicle(label)}
                      className={`w-full flex items-center justify-between px-5 py-3 border rounded-sm transition-colors text-left ${
                        checked ? 'border-gold bg-gold/10' : 'border-vapor/10 hover:border-vapor/30'
                      }`}
                    >
                      <span className="font-mono-tech text-sm text-vapor">{label}</span>
                      {checked && <X size={13} className="text-gold shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vehicle Type */}
          {form.service_type && !isQuoteOnly && (
            <div>
              <label className="block text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">VEHICLE TYPE <span className="text-gold">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {[{ id: 'sedan_coupe', label: 'Sedan / Coupe' }, { id: 'truck_suv', label: 'Truck / SUV' }].map(vt => (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, vehicle_type: vt.id }))}
                    className={`py-3 border rounded-sm font-mono-tech text-xs tracking-widest transition-colors ${
                      form.vehicle_type === vt.id ? 'border-gold bg-gold/10 text-gold' : 'border-vapor/10 text-vapor/50 hover:border-vapor/30 hover:text-vapor'
                    }`}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar — only for schedulable services */}
          {form.service_type && !isQuoteOnly && (
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
          {selectedDay && !isQuoteOnly && (
            <div>
              <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">
                SELECT TIME — {format(selectedDay, 'EEEE, MMMM d').toUpperCase()} <span className="text-gold">*</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
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

          {/* Vehicle (manual) + Notes */}
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

          {/* Submit */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              disabled={loading || !form.service_type || !form.name || !form.phone || !form.address || (!isQuoteOnly && (!form.preferred_date || !form.preferred_time || !form.vehicle_type))}
              className="w-full flex items-center justify-center gap-3 bg-gold hover:bg-gold-light text-obsidian font-mono-tech text-sm tracking-widest py-4 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /><span>SUBMITTING...</span></>
                : isQuoteOnly
                  ? <><span>REQUEST QUOTE</span><ArrowRight size={14} /></>
                  : <><span>CONFIRM APPOINTMENT</span><ArrowRight size={14} /></>
              }
            </button>
            <p className="text-center text-vapor/25 text-xs font-mono-tech">
              {isQuoteOnly ? "We'll reply within 1 business day · Metro Atlanta, GA" : "We'll send a confirmation shortly · Metro Atlanta, GA"}
            </p>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}