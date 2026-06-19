import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

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

const MEMBERSHIP_VALUE = [
  { service: 'Exterior Detail (×4/mo)', value: '$400+' },
  { service: 'Interior Deep Clean (×1/mo)', value: '$125+' },
  { service: 'Ceramic Sealant (×4/mo)', value: '$200+' },
  { service: 'Total Retail Value', value: '$700+' },
  { service: 'VDS GOLD — SEDAN/COUPE', value: '$250' },
  { service: 'VDS GOLD — TRUCK/SUV', value: '$300' },
];

const HERO_IMG = 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/46ffcb03f_Copilot_20260618_223641.png';

export default function VdsGold() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goldTint = Math.min(scrollY / 2000, 0.06);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: `rgb(${Math.round(10 + goldTint * 40)}, ${Math.round(11 + goldTint * 30)}, 13)` }}
    >
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <img src={HERO_IMG} alt="VDS Gold" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/80 to-obsidian/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/50" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">
            <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
              <div className="w-12 h-px bg-gold" />
              <p className="text-xs font-mono-tech tracking-[0.4em] text-gold">INTRODUCING</p>
            </div>
            <h1 className="text-7xl md:text-9xl font-grotesk font-bold leading-none mb-8 flex items-center gap-4 justify-center md:justify-start">
              <GoldShimmer>VDS</GoldShimmer>
              <span className="text-vapor">GOLD</span>
            </h1>
            <p className="text-xl text-vapor/60 leading-relaxed mb-4 font-grotesk">
              The premium monthly membership that keeps your vehicle in a permanent state of perfection.
            </p>
            <p className="text-sm font-mono-tech text-vapor/40 tracking-widest mb-12">
              UNLIMITED EXTERIOR DETAILS + 1 INTERIOR DETAIL / MONTH + CERAMIC SEALANT EVERY DETAIL
            </p>

            <div className="flex flex-wrap items-end gap-8 mb-12 justify-center md:justify-start">
              <div>
                <p className="text-xs font-mono-tech text-gold/60 tracking-widest mb-1">MEMBERSHIP PRICE</p>
                <p className="text-5xl font-grotesk font-bold text-gold leading-none">$250<span className="text-2xl font-mono-tech text-vapor/50"> SEDAN/COUPE</span></p>
                <p className="text-5xl font-grotesk font-bold text-gold leading-none mt-2">$300<span className="text-2xl font-mono-tech text-vapor/50"> TRUCK/SUV</span></p>
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
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">THE TECHNICAL STACK</p>
          <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor">WHAT'S INCLUDED</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0.5 bg-vapor/5">
          {/* Exterior */}
          <div className="bg-asphalt p-10 lg:p-14">
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
          <div className="bg-asphalt p-10 lg:p-14 relative overflow-hidden">
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
      <section className="py-24 border-y border-vapor/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
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
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">THE PROCESS</p>
          <h2 className="text-4xl font-grotesk font-bold text-vapor">HOW VDS GOLD WORKS</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0.5 bg-vapor/5">
          {[
            { step: '01', title: 'CREATE ACCOUNT', desc: 'Sign up online in minutes. Add your vehicle(s), set your preferences, and get instant access to your member portal.' },
            { step: '02', title: 'SCHEDULE', desc: 'Book your exterior details any time — as many as you need throughout the month.' },
            { step: '03', title: 'WE COME TO YOU', desc: 'Our team arrives at your location with professional equipment and premium detailing products.' },
            { step: '04', title: 'STAY PERFECT', desc: 'Your vehicle remains in a permanent state of immaculate perfection, month after month.' },
          ].map((item) => (
            <div key={item.step} className="bg-asphalt p-8">
              <p className="text-4xl font-grotesk font-bold text-gold/20 mb-4 font-mono-tech">{item.step}</p>
              <h4 className="text-vapor font-grotesk font-bold text-lg mb-3">{item.title}</h4>
              <p className="text-vapor/50 text-sm leading-relaxed font-mono-tech">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SIGN UP CARD ─────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-[#0D0B06] to-obsidian" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <div className="vds-gold-btn inline-block px-4 py-2 text-xs font-mono-tech tracking-widest mb-8 rounded-sm">
            ◆ VDS GOLD MEMBERSHIP
          </div>
          <h2 className="text-5xl md:text-6xl font-grotesk font-bold text-vapor mb-6">
            JOIN<br /><GoldShimmer>THE CIRCLE.</GoldShimmer>
          </h2>
          <p className="text-vapor/50 leading-relaxed mb-12">
            Stop thinking about your car's condition. With VDS Gold, your vehicle is always appointment-ready, always immaculate. Starting at $250/mo — unlimited exterior details, 1 interior detail monthly, ceramic sealant included every detail.
          </p>

          <div className="glass-panel p-10 rounded-sm border border-gold/20 text-left">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-vapor/10">
              <div>
                <p className="text-xs font-mono-tech text-gold/70 tracking-widest mb-2">MONTHLY MEMBERSHIP</p>
                <p className="text-3xl font-grotesk font-bold text-vapor">VDS Gold</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-grotesk font-bold text-gold">$250 <span className="text-sm font-mono-tech text-vapor/50">sedan/coupe</span></p>
                <p className="text-2xl font-grotesk font-bold text-gold">$300 <span className="text-sm font-mono-tech text-vapor/50">truck/suv</span></p>
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