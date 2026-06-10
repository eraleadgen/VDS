import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, ArrowRight, Car } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.address || !form.service_type) {
      setError('Please fill in all required fields.');
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
            <h2 className="text-3xl font-grotesk font-bold text-vapor mb-4">REQUEST RECEIVED</h2>
            <p className="text-vapor/50 font-mono-tech text-sm leading-relaxed mb-8">
              We'll reach out within 1 business hour to confirm your appointment. Check your phone or email for next steps.
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
            We come to your location. Fill out the form and we'll confirm within 1 hour.
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
            {loading ? (
              <><div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> SUBMITTING...</>
            ) : (
              <>REQUEST APPOINTMENT <ArrowRight size={14} /></>
            )}
          </button>

          <p className="text-center text-vapor/25 text-xs font-mono-tech">
            We'll confirm within 1 hour · Metro Atlanta, GA
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}