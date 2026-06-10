import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, ArrowRight, Car, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay, addDays } from 'date-fns';

// These services require a manual quote — no calendar shown
const QUOTE_ONLY_SERVICES = ['ceramic_coating', 'paint_correction'];

const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const STANDARD_SERVICES = [
  { value: 'exterior_detail', label: 'Exterior Detail' },
  { value: 'full_detail', label: 'Full Detail (Exterior + Interior)' },
  { value: 'ceramic_coating', label: 'Ceramic Coating' },
  { value: 'paint_correction', label: 'Paint Correction' },
];

const GOLD_SERVICES = [
  { value: 'vds_gold_exterior', label: 'VDS Gold — Exterior Detail' },
  { value: 'vds_gold_full', label: 'VDS Gold — Full Detail' },
];

const defaultForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  service_type: '',
  vehicle_id: '',
  vehicle_manual: '',
  notes: '',
  preferred_date: '',
  preferred_time: '',
};

export default function BookAppointment() {
  const location = useLocation();
  const preselect = location.state?.preselect_service || '';

  const [form, setForm] = useState({ ...defaultForm, service_type: preselect });
  const [vehicles, setVehicles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const isQuoteOnly = QUOTE_ONLY_SERVICES.includes(form.service_type);
  const needsSchedule = form.service_type && !isQuoteOnly;

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        setForm(f => ({ ...f, name: me.full_name || '', email: me.email || '' }));
        const v = await base44.entities.MemberVehicle.list();
        setVehicles(v);
      }
    };
    init();
  }, []);

  const selectedVehicleLabel = () => {
    if (!form.vehicle_id) return '';
    const v = vehicles.find(v => v.id === form.vehicle_id);
    return v ? `${v.year} ${v.make} ${v.model}${v.color ? ` (${v.color})` : ''}` : '';
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day);
    setForm(f => ({ ...f, preferred_date: format(day, 'yyyy-MM-dd'), preferred_time: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.address || !form.service_type) {
      setError('Please fill in all required fields.');
      return;
    }
    if (needsSchedule && (!form.preferred_date || !form.preferred_time)) {
      setError('Please select a date and time for your appointment.');
      return;
    }
    setLoading(true);
    const vehicleInfo = form.vehicle_id ? selectedVehicleLabel() : form.vehicle_manual;
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      service_type: form.service_type,
      vehicle_info: vehicleInfo,
      notes: form.notes,
      preferred_date: form.preferred_date || '',
      preferred_time: form.preferred_time || '',
    };
    const res = await base44.functions.invoke('submitBookingToGHL', payload);
    setLoading(false);
    if (res.data?.success) {
      setSuccess(true);
    } else {
      setError(res.data?.error || 'Something went wrong. Please try again or call/text us.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="text-center max-w-md">
            <CheckCircle size={48} className="text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-grotesk font-bold text-vapor mb-4">
              {isQuoteOnly ? 'REQUEST RECEIVED' : 'APPOINTMENT BOOKED'}
            </h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              {isQuoteOnly
                ? "We'll reach out within 1 business hour with a custom quote. Check your phone or email for next steps."
                : `Your appointment is set for ${form.preferred_date ? format(new Date(form.preferred_date + 'T12:00:00'), 'MMMM d, yyyy') : ''} at ${form.preferred_time}. We'll send a confirmation to your phone or email shortly.`}
            </p>
            <Link to="/" className="vds-gold-btn inline-flex items-center gap-2 px-8 py-4 text-sm font-mono-tech tracking-widest rounded-sm">
              BACK TO HOME <ArrowRight size={14} />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
            <div className="w-8 h-px bg-gold" />
            <p className="text-xs font-mono-tech tracking-[0.4em] text-gold">SCHEDULE SERVICE</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor mb-3">
            BOOK AN <GoldShimmer>APPOINTMENT</GoldShimmer>
          </h1>
          <p className="text-vapor/40 font-mono-tech text-sm">
            We come to your location. Select your service, pick a time, and you're set.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-2 block">FULL NAME *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm placeholder:text-vapor/25"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-2 block">PHONE NUMBER *</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(470) 000-0000"
              type="tel"
              className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm placeholder:text-vapor/25"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-2 block">EMAIL ADDRESS</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              type="email"
              className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm placeholder:text-vapor/25"
            />
          </div>

          {/* Service Address */}
          <div>
            <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-2 block">SERVICE LOCATION ADDRESS *</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main St, Atlanta, GA 30301"
              className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm placeholder:text-vapor/25"
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-2 block">SERVICE TYPE *</label>
            <select
              name="service_type"
              value={form.service_type}
              onChange={handleChange}
              className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm appearance-none"
            >
              <option value="" disabled className="text-vapor/30">Select a service...</option>
              {STANDARD_SERVICES.map(s => (
                <option key={s.value} value={s.value} className="bg-asphalt">{s.label}</option>
              ))}
              {user?.is_gold_member && GOLD_SERVICES.map(s => (
                <option key={s.value} value={s.value} className="bg-asphalt">◆ {s.label}</option>
              ))}
            </select>
            {!user?.is_gold_member && (
              <p className="text-vapor/30 text-xs font-mono-tech mt-2">
                ◆ VDS Gold services are available exclusively to members.{' '}
                <Link to="/vds-gold" className="text-gold/60 hover:text-gold underline transition-colors">Learn more →</Link>
              </p>
            )}
          </div>

          {/* Quote-only notice */}
          {isQuoteOnly && (
            <div className="border border-gold/20 bg-gold/5 px-5 py-4 rounded-sm">
              <p className="text-gold font-mono-tech text-xs tracking-widest mb-1">CUSTOM QUOTE REQUIRED</p>
              <p className="text-vapor/50 text-xs font-mono-tech leading-relaxed">
                {form.service_type === 'ceramic_coating' ? 'Ceramic coatings' : 'Paint correction'} pricing varies by vehicle condition and size. Submit your request and we'll reach out within 1 business hour with a custom quote and available times.
              </p>
            </div>
          )}

          {/* Date & Time Picker — shown for all schedulable services */}
          {needsSchedule && (
            <div>
              <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-3 block">SELECT DATE & TIME *</label>

              {/* Calendar */}
              <div className="bg-asphalt border border-vapor/10 rounded-sm p-4 mb-3">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(m => subMonths(m, 1))}
                    disabled={isBefore(endOfMonth(subMonths(calendarMonth, 1)), startOfDay(new Date()))}
                    className="w-8 h-8 flex items-center justify-center text-vapor/40 hover:text-vapor disabled:opacity-20 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <p className="text-vapor font-mono-tech text-xs tracking-widest">{format(calendarMonth, 'MMMM yyyy').toUpperCase()}</p>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth(m => addMonths(m, 1))}
                    className="w-8 h-8 flex items-center justify-center text-vapor/40 hover:text-vapor transition-colors"
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-vapor/25 font-mono-tech text-xs py-1">{d}</div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                  {/* Leading blanks */}
                  {Array.from({ length: getDay(startOfMonth(calendarMonth)) }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}
                  {eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) }).map(day => {
                    const isPast = isBefore(day, startOfDay(new Date()));
                    const isSunday = getDay(day) === 0;
                    const isDisabled = isPast || isSunday;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    return (
                      <button
                        key={day.toString()}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleDateSelect(day)}
                        className={`aspect-square flex items-center justify-center text-xs font-mono-tech rounded-sm m-0.5 transition-colors
                          ${isSelected ? 'bg-gold text-obsidian font-bold' : ''}
                          ${!isSelected && !isDisabled ? 'text-vapor hover:bg-vapor/10' : ''}
                          ${isDisabled ? 'text-vapor/15 cursor-not-allowed' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
                <p className="text-vapor/25 font-mono-tech text-xs mt-3 text-center">Sundays unavailable</p>
              </div>

              {/* Time slots — shown after date selected */}
              {selectedDate && (
                <div>
                  <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-2">
                    AVAILABLE TIMES — {format(selectedDate, 'EEE, MMM d').toUpperCase()}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, preferred_time: slot }))}
                        className={`py-2.5 text-xs font-mono-tech tracking-wide rounded-sm border transition-colors
                          ${form.preferred_time === slot
                            ? 'bg-gold text-obsidian border-gold font-bold'
                            : 'border-vapor/10 text-vapor/60 hover:border-gold/40 hover:text-vapor bg-asphalt'
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vehicle */}
          <div>
            <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-2 block">
              VEHICLE {vehicles.length > 0 ? '(SELECT FROM YOUR PROFILE)' : ''}
            </label>
            {vehicles.length > 0 ? (
              <select
                name="vehicle_id"
                value={form.vehicle_id}
                onChange={handleChange}
                className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm appearance-none"
              >
                <option value="" className="bg-asphalt text-vapor/30">Select a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-asphalt">
                    {v.year} {v.make} {v.model}{v.color ? ` — ${v.color}` : ''}
                  </option>
                ))}
                <option value="other" className="bg-asphalt">Other / Enter manually</option>
              </select>
            ) : null}

            {(vehicles.length === 0 || form.vehicle_id === 'other') && (
              <input
                name="vehicle_manual"
                value={form.vehicle_manual}
                onChange={handleChange}
                placeholder="Year, Make, Model, Color (e.g. 2022 BMW M4, White)"
                className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm placeholder:text-vapor/25 mt-2"
              />
            )}

            {vehicles.length === 0 && (
              <p className="text-vapor/30 text-xs font-mono-tech mt-2 flex items-center gap-1.5">
                <Car size={11} />
                <Link to="/member-dashboard" className="underline hover:text-gold transition-colors">Add vehicles to your profile</Link> for faster booking next time.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-mono-tech tracking-widest text-vapor/50 mb-2 block">ADDITIONAL NOTES</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any special requests, gate codes, preferred times, etc."
              className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 text-vapor px-4 py-3 text-sm font-grotesk outline-none transition-colors rounded-sm placeholder:text-vapor/25 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 font-mono-tech text-xs tracking-wide border border-red-400/20 bg-red-400/5 px-4 py-3 rounded-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-obsidian py-4 text-sm font-mono-tech tracking-widest font-bold hover:bg-gold-light transition-colors duration-200 rounded-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /><span>SUBMITTING...</span></>
              : isQuoteOnly
                ? <><span>REQUEST QUOTE</span><ArrowRight size={14} /></>
                : <><span>CONFIRM APPOINTMENT</span><ArrowRight size={14} /></>
            }
          </button>

          <p className="text-center text-vapor/25 text-xs font-mono-tech">
            {isQuoteOnly ? "We'll reply within 1 business hour · Metro Atlanta, GA" : "We'll send a confirmation shortly · Metro Atlanta, GA"}
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}