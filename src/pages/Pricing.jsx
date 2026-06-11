import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

const PRICING_SECTIONS = [
  {
    title: 'FULL DETAIL',
    subtitle: 'Interior & Exterior Restoration',
    rows: [
      { label: 'Sedan / Coupe', price: '$175+' },
      { label: 'SUV', price: '$225+' },
      { label: 'Truck / 3-Row SUV', price: '$250+' },
    ],
  },
  {
    title: 'EXTERIOR ONLY',
    subtitle: 'Hand Wash, Rims, Sealant',
    rows: [
      { label: 'Sedan / Coupe', price: '$100+' },
      { label: 'SUV', price: '$100+' },
      { label: 'Truck / 3-Row SUV', price: '$115+' },
    ],
  },
  {
    title: 'INTERIOR ONLY',
    subtitle: 'Steam Clean, Deep Vacuum & More',
    rows: [
      { label: 'Sedan / Coupe', price: '$120+' },
      { label: 'SUV', price: '$130+' },
      { label: 'Truck / 3-Row SUV', price: '$150+' },
    ],
  },
  {
    title: 'CERAMIC COATINGS',
    subtitle: 'Long-Term Paint Protection',
    rows: [
      { label: '3 Month Ceramic Sealant', price: '$50' },
      { label: '5 Year Ceramic Coating', price: '$1,300+' },
      { label: '7 Year Ceramic Coating', price: '$1,500+' },
    ],
  },
  {
    title: 'PAINT CORRECTION',
    subtitle: 'Swirl & Scratch Removal',
    rows: [
      { label: 'Stage 1 Paint Correction', price: '$600+' },
      { label: 'Stage 2 Paint Correction', price: '$900+' },
      { label: 'Stage 3 Paint Correction', price: '$1,100+' },
    ],
  },
  {
    title: 'ADD-ON SERVICES',
    subtitle: 'Optional Enhancements',
    rows: [
      { label: 'Engine Bay Detail', price: '$50' },
      { label: 'Headlight Restoration', price: '$100' },
    ],
  },
];

export default function Pricing() {
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="pt-40 pb-20 max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">METRO ATLANTA · MOBILE DETAILING</p>
        <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor leading-none mb-6">
          <GoldShimmer>PRICING</GoldShimmer>
        </h1>
        <p className="text-vapor/50 text-lg max-w-xl mx-auto leading-relaxed">
          All services are performed on-site at your location. Final pricing may vary based on vehicle condition and size.
        </p>
      </section>

      {/* ── PRICING GRID ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 bg-gold/10">
          {PRICING_SECTIONS.map((section) => (
            <div key={section.title} className="bg-obsidian p-8 border border-vapor/5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-6 h-px bg-gold" />
                <p className="text-xs font-mono-tech tracking-[0.3em] text-gold">{section.title}</p>
              </div>
              <p className="text-vapor/40 text-xs font-mono-tech tracking-widest mb-8">{section.subtitle}</p>

              <ul className="space-y-0">
                {section.rows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between py-4 border-b border-vapor/5 last:border-0">
                    <span className="text-sm text-vapor/70 font-mono-tech">{row.label}</span>
                    <span className="text-gold font-grotesk font-bold text-lg">{row.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-vapor/30 text-xs font-mono-tech tracking-widest mt-8">
          ALL PRICES ARE STARTING PRICES · FINAL QUOTE PROVIDED BEFORE SERVICE · NO HIDDEN FEES
        </p>
      </section>

      {/* ── VDS GOLD BANNER ──────────────────────────── */}
      <section className="border-y border-gold/20 py-16 bg-gradient-to-r from-obsidian via-[#0D0B06] to-obsidian">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">BEST VALUE</p>
            <h2 className="text-4xl font-grotesk font-bold text-vapor mb-2">
              <GoldShimmer>VDS GOLD</GoldShimmer> MEMBERSHIP
            </h2>
            <p className="text-vapor/50 font-mono-tech text-sm max-w-lg">
              Unlimited exterior details + 1 interior deep clean per month. Ceramic sealant included every visit.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
            <div className="text-right">
              <p className="text-3xl font-grotesk font-bold text-gold">$250 <span className="text-base text-vapor/50">sedan/coupe</span></p>
              <p className="text-3xl font-grotesk font-bold text-gold">$300 <span className="text-base text-vapor/50">truck/3-row</span></p>
              <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mt-1">PER VEHICLE / MONTH</p>
            </div>
            <Link to="/vds-gold"
              className="vds-gold-btn px-8 py-4 text-sm font-mono-tech tracking-widest rounded-sm flex items-center gap-2">
              VIEW MEMBERSHIP <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 text-center max-w-2xl mx-auto px-6">
        <h2 className="text-3xl font-grotesk font-bold text-vapor mb-4">READY TO BOOK?</h2>
        <p className="text-vapor/50 mb-10 font-mono-tech text-sm">Text or call us for a custom quote. We'll confirm pricing before any service begins.</p>
        <a href="sms:+14704128986"
          className="inline-flex items-center gap-3 bg-vapor text-obsidian px-10 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-300 rounded-sm">
          TEXT FOR A QUOTE <ArrowRight size={14} />
        </a>
      </section>

      <Footer />
    </div>
  );
}