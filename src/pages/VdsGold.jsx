import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import GoldParticles from '../components/vds/GoldParticles';
import { useMembershipPlan, useBusinessConfig } from '@/lib/BusinessConfigContext';

const EXTERIOR_SPECS = [
  'HAND WASH — Rims & Wheel Barrels',
  'HAND WASH — All Exterior Panels',
  'DOOR JAMBS — Full Clean & Dress',
  '1-MONTH CERAMIC SEALANT — Applied',
  'WINDOWS — Exterior Glass Clean',
  'TIRES — Dress & Shine',
  'UNLIMITED frequency per month',
];

const INTERIOR_SPECS = [
  'STEAM CLEAN — All Surfaces & Crevices',
  'DEEP VACUUM — Every Inch of Interior',
  'GLASS — Interior Windows Cleaned',
  'DASHBOARD — All Surfaces Wiped',
  'DOOR PANELS — Full Wipe-Down',
  'SEATS — Every Surface & Stitch',
  'FLOORS & MATS — Deep Cleaned',
  '1× PER MONTH — Included in Membership',
];

export default function VdsGold() {
  const plan = useMembershipPlan();
  const config = useBusinessConfig();

  // Membership prices and pricing-group labels come from BusinessConfig — never hardcoded.
  const priceFor = (key) => plan.pricing_by_group.find(g => g.pricing_group === key)?.price_monthly;
  const sedanPrice = priceFor('sedan_coupe') || 250;
  const truckPrice = priceFor('truck_suv') || 300;
  const groupLabel = (key) => {
    const found = (config?.pricing_groups || []).find(g => g.key === key);
    return found?.label || (key === 'truck_suv' ? 'Truck/SUV' : 'Sedan/Coupe');
  };
  const sedanLabel = groupLabel('sedan_coupe');
  const truckLabel = groupLabel('truck_suv');
  const planShort = plan.short_label;

  // Value breakdown — retail-value rows are marketing copy; the two membership rows are
  // config-driven. Row indices are fixed (retail total at 3, membership at 4–5) for styling.
  const MEMBERSHIP_VALUE = [
    { service: 'Exterior Detail (×4/mo)', value: '$400+' },
    { service: 'Interior Deep Clean (×1/mo)', value: '$125+' },
    { service: 'Ceramic Sealant (×4/mo)', value: '$200+' },
    { service: 'Total Retail Value', value: '$700+' },
    { service: `${planShort.toUpperCase()} — ${sedanLabel.toUpperCase()}`, value: `$${sedanPrice}` },
    { service: `${planShort.toUpperCase()} — ${truckLabel.toUpperCase()}`, value: `$${truckPrice}` },
  ];

  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-obsidian">
        {/* Deep layered gradient background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 50%, rgba(180,140,20,0.06) 0%, transparent 55%), linear-gradient(180deg, #08090a 0%, #0a0b0d 40%, #0d0a05 100%)'
        }} />
        {/* Animated slow-pulse glow orb */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(212,175,55,0.07) 0%, transparent 70%)',
          animation: 'goldPulse 6s ease-in-out infinite'
        }} />

        {/* Gold particles */}
        <GoldParticles count={60} />
        {/* Bottom fade to page */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-obsidian to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">
            <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
              <div className="hidden md:block w-12 h-px bg-gold" />
              <p className="text-xs font-mono-tech tracking-[0.4em] text-gold">INTRODUCING</p>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-grotesk font-bold leading-none mb-8 flex items-center gap-4 justify-center md:justify-start">
              <span className="text-vapor">VDS</span>
              <GoldShimmer>GOLD</GoldShimmer>
            </h1>
            <p className="text-lg sm:text-xl text-vapor/60 leading-relaxed mb-4 font-grotesk">
              The premium monthly membership that keeps your vehicle in a permanent state of perfection.
            </p>
            <p className="text-sm font-mono-tech text-vapor/40 tracking-widest mb-12">
              UNLIMITED EXTERIOR DETAILS + 1 INTERIOR DETAIL / MONTH + CERAMIC SEALANT EVERY DETAIL
            </p>

            <div className="flex flex-wrap items-end gap-6 sm:gap-8 mb-12 justify-center md:justify-start">
              <div>
                <p className="text-xs font-mono-tech text-gold/60 tracking-widest mb-1">MEMBERSHIP PRICE</p>
                <p className="text-4xl sm:text-5xl font-grotesk font-bold text-gold leading-none">${sedanPrice}<span className="text-xl sm:text-2xl font-mono-tech text-vapor/50"> {sedanLabel.toUpperCase()}</span></p>
                <p className="text-4xl sm:text-5xl font-grotesk font-bold text-gold leading-none mt-2">${truckPrice}<span className="text-xl sm:text-2xl font-mono-tech text-vapor/50"> {truckLabel.toUpperCase()}</span></p>
                <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mt-2">PER VEHICLE / MONTH</p>
              </div>
              <div className="pb-2 text-vapor/30 font-mono-tech text-xs">
                vs. $700+ retail value
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/vds-gold-signup"
                className="flex items-center gap-3 bg-gold text-obsidian px-8 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-300 rounded-sm font-bold">
                JOIN THE CIRCLE <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPEC SPLIT ───────────────────────────────── */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">THE TECHNICAL STACK</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-grotesk font-bold text-vapor">WHAT'S INCLUDED</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-0.5 bg-vapor/5">
          {/* Exterior */}
          <div className="bg-asphalt p-6 sm:p-10 lg:p-14 border border-vapor/5 rounded-sm md:rounded-none">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-8 h-px bg-gold" />
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold">EXTERIOR</p>
            </div>
            <h3 className="text-3xl font-grotesk font-bold text-vapor mb-2">EXTERIOR DETAIL</h3>
            <p className="text-vapor/40 font-mono-tech text-xs tracking-widest mb-10">UNLIMITED / MONTH</p>
            <ul className="space-y-4">
              {EXTERIOR_SPECS.map((spec, i) => (
                <li key={i} className="flex items-start gap-4 border-b border-vapor/5 pb-4 last:border-0 last:pb-0">
                  <Check size={14} className="text-gold mt-0.5 shrink-0" />
                  <span className="font-mono-tech text-sm text-vapor/70">{spec}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12 p-5 border border-gold/20 rounded-sm bg-gold/5">
              <p className="text-gold font-mono-tech text-xs tracking-widest mb-1">◆ UNLIMITED ACCESS</p>
              <p className="text-vapor/60 text-sm">Schedule as many exterior details as you need each month. No caps, no limits.</p>
            </div>
          </div>

          {/* Interior */}
          <div className="bg-asphalt p-6 sm:p-10 lg:p-14 border border-vapor/5 rounded-sm md:rounded-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top right, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
            <div className="flex items-center gap-4 mb-2">
              <div className="w-8 h-px bg-gold" />
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold">INTERIOR</p>
            </div>
            <h3 className="text-3xl font-grotesk font-bold text-vapor mb-2">INTERIOR DETAIL</h3>
            <p className="text-vapor/40 font-mono-tech text-xs tracking-widest mb-10">1× PER MONTH</p>
            <ul className="space-y-4">
              {INTERIOR_SPECS.map((spec, i) => (
                <li key={i} className="flex items-start gap-4 border-b border-vapor/5 pb-4 last:border-0 last:pb-0">
                  <Check size={14} className="text-gold mt-0.5 shrink-0" />
                  <span className="font-mono-tech text-sm text-vapor/70">{spec}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12 p-5 border border-gold/20 rounded-sm bg-gold/5">
              <p className="text-gold font-mono-tech text-xs tracking-widest mb-1">◆ STEAM TECHNOLOGY</p>
              <p className="text-vapor/60 text-sm">High-temperature steam penetrates every crevice for a truly sanitized, showroom-quality interior.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE CALCULATOR ─────────────────────────── */}
      <section className="py-16 md:py-24 border-y border-vapor/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">THE MATH</p>
            <h2 className="text-4xl font-grotesk font-bold text-vapor">VALUE BREAKDOWN</h2>
          </div>
          <div className="glass-panel rounded-sm overflow-hidden">
            {MEMBERSHIP_VALUE.map((row, i) => {
              const isRetail = i === 3;
              const isGold = i >= 4;
              return (
                <div key={i} className={`flex items-center justify-between px-8 py-5 ${
                  isGold ? 'bg-gold/10 border-t border-gold/30' :
                  isRetail ? 'border-b border-gold/30' : 'border-b border-vapor/5'
                }`}>
                  <span className={`font-mono-tech text-sm ${isGold ? 'text-gold font-bold tracking-widest' : 'text-vapor/60'}`}>
                    {row.service}
                  </span>
                  <span className={`font-mono-tech ${
                    isGold ? 'text-gold text-2xl font-bold' :
                    isRetail ? 'text-vapor/40 line-through text-sm' : 'text-vapor/40 text-sm'
                  }`}>
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <p className="text-vapor/40 font-mono-tech text-xs tracking-widest mb-6">
              SAVE $400+ EVERY MONTH · PRIORITY SCHEDULING · CANCEL ANYTIME
            </p>
            <Link to="/vds-gold-signup"
              className="inline-flex items-center gap-3 bg-gold text-obsidian px-10 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-300 rounded-sm font-bold">
              JOIN THE CIRCLE TODAY <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">THE PROCESS</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-grotesk font-bold text-vapor">HOW VDS GOLD WORKS</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-0.5 bg-vapor/5">
          {[
            { step: '01', title: 'CREATE ACCOUNT', desc: 'Sign up online in minutes. Add your vehicle(s), set your preferences, and get instant access to your member portal.' },
            { step: '02', title: 'SCHEDULE', desc: 'Book your exterior details any time — as many as you need throughout the month.' },
            { step: '03', title: 'WE COME TO YOU', desc: 'Our team arrives at your location with professional equipment and premium detailing products.' },
            { step: '04', title: 'STAY PERFECT', desc: 'Your vehicle remains in a permanent state of immaculate perfection, month after month.' },
          ].map((item) => (
            <div key={item.step} className="bg-asphalt p-6 sm:p-8 border border-vapor/5 rounded-sm md:rounded-none vds-card-hover">
              <p className="text-4xl font-grotesk font-bold text-gold/20 mb-4 font-mono-tech">{item.step}</p>
              <h4 className="text-vapor font-grotesk font-bold text-lg mb-3">{item.title}</h4>
              <p className="text-vapor/50 text-sm leading-relaxed font-mono-tech">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SIGN UP CARD ─────────────────────────────── */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-[#0D0B06] to-obsidian" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <div className="vds-gold-btn inline-block px-4 py-2 text-xs font-mono-tech tracking-widest mb-8 rounded-sm">
            ◆ {planShort.toUpperCase()} MEMBERSHIP
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-grotesk font-bold text-vapor mb-6">
            JOIN<br /><GoldShimmer>THE CIRCLE.</GoldShimmer>
          </h2>
          <p className="text-vapor/50 leading-relaxed mb-12">
            Stop thinking about your car's condition. With {planShort}, your vehicle is always appointment-ready, always immaculate. Starting at ${sedanPrice}/mo — unlimited exterior details, 1 interior detail monthly, ceramic sealant included every detail.
          </p>

          <div className="glass-panel p-10 rounded-sm border border-gold/20 text-left">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-vapor/10">
              <div>
                <p className="text-xs font-mono-tech text-gold/70 tracking-widest mb-2">MONTHLY MEMBERSHIP</p>
                <p className="text-3xl font-grotesk font-bold text-vapor">{planShort}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-grotesk font-bold text-gold">${sedanPrice} <span className="text-sm font-mono-tech text-vapor/50">{sedanLabel.toLowerCase()}</span></p>
                <p className="text-2xl font-grotesk font-bold text-gold">${truckPrice} <span className="text-sm font-mono-tech text-vapor/50">{truckLabel.toLowerCase()}</span></p>
                <p className="text-xs font-mono-tech text-vapor/40">/mo per vehicle</p>
              </div>
            </div>

            <ul className="space-y-3 mb-10">
              {['Unlimited Exterior Details', '1× Monthly Interior Detail', 'Ceramic Sealant with Every Detail', 'Steam Clean & Deep Vacuum', 'Interior Glass & All Surfaces', 'Hand Wash Rims & All Panels', 'Door Jambs Cleaned', 'Priority Scheduling', 'Cancel Anytime'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm font-mono-tech text-vapor/70">
                  <Check size={13} className="text-gold shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/vds-gold-signup"
                className="flex-1 text-center py-4 bg-gold text-obsidian font-mono-tech text-sm tracking-widest font-bold hover:bg-gold-light transition-colors duration-200 rounded-sm">
                ENROLL NOW
              </Link>
            </div>
            <p className="text-center text-vapor/30 text-xs font-mono-tech mt-4">
              NO CONTRACTS · CANCEL ANYTIME · METRO ATLANTA
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}