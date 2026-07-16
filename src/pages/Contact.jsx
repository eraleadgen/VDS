import { useState } from 'react';
import { Phone, Mail, MapPin, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

const SERVICE_TYPES = [
  'Full Detail',
  'Exterior Detail',
  'Interior Detail',
  'Ceramic Coating',
  'Paint Correction',
  'VDS Gold Membership',
  'Other / Not Sure',
];

const VEHICLE_TYPES = [
  'Sedan',
  'Coupe',
  'SUV / Crossover',
  'Truck',
  'Sports Car / Exotic',
  'Convertible',
  'Van',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    vehicleType: '',
    serviceType: '',
    notes: '',
    consentMarketing: false,
    consentService: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HEADER ───────────────────────────────────── */}
      <section className="relative pt-36 pb-20">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">REACH OUT</p>
          <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor mb-6">CONTACT US</h1>
          <p className="text-vapor/50 text-lg max-w-xl">Ready for an instant quote? Text us or send a request below and we'll get back to you promptly.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-0.5 bg-vapor/5">
          {/* Contact Info */}
          <div className="bg-asphalt p-6 sm:p-10 lg:p-12 flex flex-col justify-between border border-vapor/5 rounded-sm md:rounded-none">
            <div>
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold mb-8">// GET IN TOUCH</p>
              <div className="space-y-8">
                <div>
                  <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-3">PHONE</p>
                  <a href="sms:+14704128986"
                    className="flex items-center gap-3 text-vapor hover:text-gold transition-colors font-grotesk font-semibold text-lg">
                    <Phone size={16} className="text-gold" />
                    (470) 412-8986
                  </a>
                </div>
                <div>
                  <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-3">TEXT / SMS</p>
                  <a href="sms:+14704128986"
                    className="flex items-center gap-3 text-vapor hover:text-gold transition-colors font-grotesk font-semibold text-lg">
                    <span className="text-gold text-sm">✉</span>
                    (470) 412-8986
                  </a>
                </div>
                <div>
                  <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-3">EMAIL</p>
                  <a href="mailto:Valetdetailingservice@gmail.com"
                    className="flex items-center gap-3 text-vapor/70 hover:text-vapor transition-colors font-mono-tech text-sm break-all">
                    <Mail size={14} className="text-gold shrink-0" />
                    Valetdetailingservice@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-3">SERVICE AREA</p>
                  <div className="flex items-center gap-3 text-vapor/60 font-mono-tech text-sm">
                    <MapPin size={14} className="text-gold shrink-0" />
                    Metro Atlanta, GA
                  </div>
                </div>
              </div>

              <div className="mt-12 border-t border-vapor/10 pt-10">
                <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-6">OR JOIN VDS GOLD</p>
                <Link to="/vds-gold"
                  className="vds-gold-btn flex items-center justify-between px-5 py-4 text-sm font-mono-tech tracking-widest rounded-sm">
                  <span>◆ VDS GOLD — FROM $250/MO</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-vapor/10">
              <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-4">FOLLOW US</p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/vdsmobile/" target="_blank" rel="noopener noreferrer"
                  className="border border-vapor/20 hover:border-gold text-vapor/40 hover:text-gold px-4 py-2 text-xs font-mono-tech transition-colors rounded-sm">
                  INSTAGRAM
                </a>
                <a href="https://www.tiktok.com/@vdsmobile" target="_blank" rel="noopener noreferrer"
                  className="border border-vapor/20 hover:border-gold text-vapor/40 hover:text-gold px-4 py-2 text-xs font-mono-tech transition-colors rounded-sm">
                  TIKTOK
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-obsidian p-6 sm:p-10 lg:p-12 border border-vapor/5 rounded-sm md:rounded-none">
            {submitted ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 border border-gold/30 flex items-center justify-center mx-auto mb-8 rounded-sm">
                    <Check size={24} className="text-gold" />
                  </div>
                  <h2 className="text-3xl font-grotesk font-bold text-vapor mb-4">REQUEST SENT</h2>
                  <p className="text-vapor/50 mb-8 font-mono-tech text-sm leading-relaxed">
                    We've received your request and will reach out shortly. For immediate assistance, call or text us directly.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a href="sms:+14704128986"
                      className="bg-vapor text-obsidian py-3 text-sm font-mono-tech tracking-widest text-center hover:bg-gold transition-colors rounded-sm">
                      TEXT (470) 412-8986
                    </a>
                    <button onClick={() => setSubmitted(false)}
                      className="border border-vapor/20 text-vapor/50 py-3 text-sm font-mono-tech tracking-widest hover:border-vapor transition-colors rounded-sm">
                      SUBMIT ANOTHER REQUEST
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-xs font-mono-tech tracking-[0.3em] text-gold mb-8">// REQUEST FORM</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono-tech text-vapor/40 tracking-widest mb-2">FIRST NAME *</label>
                    <input
                      name="firstName" value={form.firstName} onChange={handleChange} required
                      className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 text-vapor px-4 py-3 text-sm font-mono-tech outline-none transition-colors rounded-sm"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tech text-vapor/40 tracking-widest mb-2">LAST NAME *</label>
                    <input
                      name="lastName" value={form.lastName} onChange={handleChange} required
                      className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 text-vapor px-4 py-3 text-sm font-mono-tech outline-none transition-colors rounded-sm"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-tech text-vapor/40 tracking-widest mb-2">PHONE NUMBER *</label>
                  <input
                    name="phone" value={form.phone} onChange={handleChange} required type="tel"
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 text-vapor px-4 py-3 text-sm font-mono-tech outline-none transition-colors rounded-sm"
                    placeholder="(404) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-tech text-vapor/40 tracking-widest mb-2">SERVICE ADDRESS *</label>
                  <input
                    name="address" value={form.address} onChange={handleChange} required
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 text-vapor px-4 py-3 text-sm font-mono-tech outline-none transition-colors rounded-sm"
                    placeholder="123 Main St, Atlanta, GA 30301"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono-tech text-vapor/40 tracking-widest mb-2">VEHICLE TYPE *</label>
                    <select
                      name="vehicleType" value={form.vehicleType} onChange={handleChange} required
                      className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 text-vapor px-4 py-3 text-sm font-mono-tech outline-none transition-colors rounded-sm"
                    >
                      <option value="">Select...</option>
                      {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono-tech text-vapor/40 tracking-widest mb-2">SERVICE TYPE *</label>
                    <select
                      name="serviceType" value={form.serviceType} onChange={handleChange} required
                      className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 text-vapor px-4 py-3 text-sm font-mono-tech outline-none transition-colors rounded-sm"
                    >
                      <option value="">Select...</option>
                      {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-tech text-vapor/40 tracking-widest mb-2">ADDITIONAL NOTES</label>
                  <textarea
                    name="notes" value={form.notes} onChange={handleChange} rows={4}
                    className="w-full bg-asphalt border border-vapor/10 focus:border-gold/50 text-vapor px-4 py-3 text-sm font-mono-tech outline-none transition-colors rounded-sm resize-none"
                    placeholder="Vehicle make/model/year, specific concerns, preferred schedule..."
                  />
                </div>

                <div className="space-y-4 border-t border-vapor/10 pt-6">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox" name="consentMarketing" checked={form.consentMarketing} onChange={handleChange}
                      className="mt-0.5 accent-gold w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-vapor/40 font-mono-tech leading-relaxed group-hover:text-vapor/60 transition-colors">
                      I consent to receive marketing text messages from Valet Detailing Service LLC at the phone number provided. Reply STOP to opt out. Message & data rates may apply.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox" name="consentService" checked={form.consentService} onChange={handleChange}
                      className="mt-0.5 accent-gold w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-vapor/40 font-mono-tech leading-relaxed group-hover:text-vapor/60 transition-colors">
                      I consent to receive non-marketing text messages regarding appointment reminders, service updates, and account notifications.
                    </span>
                  </label>
                  <p className="text-xs text-vapor/30 font-mono-tech">
                    By submitting you agree to our{' '}
                    <Link to="/privacy" className="text-gold/60 hover:text-gold underline">Privacy Policy</Link>
                    {' '}and{' '}
                    <Link to="/terms" className="text-gold/60 hover:text-gold underline">Terms of Service</Link>.
                  </p>
                </div>

                <button type="submit"
                  className="w-full bg-vapor text-obsidian py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 font-bold rounded-sm">
                  BOOK APPOINTMENT →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}