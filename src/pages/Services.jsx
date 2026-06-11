import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

const SERVICES = [
  {
    id: 'full-detail',
    title: 'FULL DETAIL',
    subtitle: 'Complete Interior & Exterior Restoration',
    description: 'Our most comprehensive single-service offering. A full restoration bringing your vehicle back to showroom condition from bumper to bumper.',
    specs: [
      'Complete Interior Deep Clean',
      'Steam Clean — All Surfaces',
      'Deep Vacuum — Every Crevice',
      'Exterior Hand Wash',
      'Rim & Wheel Detail',
      'Door Jambs Cleaned',
      'Odor & Stain Treatment',
      'Professional Products Applied',
      'Ceramic Sealant',
    ],
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/c7357965d_FullDetail-CeramicSealant2.jpg',
    gold: true,
  },
  {
    id: 'ceramic',
    title: 'CERAMIC COATINGS',
    subtitle: 'Long-Term Paint Protection',
    description: 'Professional-grade ceramic coatings from 3-month maintenance coatings to 7-year permanent protection — engineered for luxury vehicles.',
    specs: [
      'Professional-Grade Products',
      '3-Month to 7-Year Options',
      'Hydrophobic Surface Technology',
      'UV & Chemical Resistance',
      'High-Gloss Finish Enhancement',
      'Paint Decontamination Prep',
      'Clay Bar Treatment',
      'IPA Wipe-Down Before Application',
      'Curing & Inspection',
    ],
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/2a0221ade_ceramic-coating-being-professionally-applied-to-car-paint-for-long-term-protection.webp',
    gold: false,
  },
  {
    id: 'paint-correction',
    title: 'PAINT CORRECTION',
    subtitle: 'Swirl & Scratch Elimination',
    description: 'Multi-stage machine polishing to eliminate swirl marks, light scratches, buffer trails, and oxidation. Restoring your paint to a flawless, mirror-like finish.',
    specs: [
      'Swirl Mark Elimination',
      'Scratch & Buffer Trail Removal',
      'Paint Oxidation Treatment',
      'Multi-Stage Machine Polish',
      'Paint Thickness Measurement',
      'Pre-Correction Wash',
      'Decontamination Process',
      'Coating Recommended After',
      'Inspection Under Lights',
    ],
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/da5a21bfa_ChatGPTImageFeb17202611_00_33PM.png',
    gold: false,
  },
];

export default function Services() {
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── PAGE HEADER ──────────────────────────────── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto px-6 text-center md:text-left">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">WHAT WE OFFER</p>
          <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor mb-6">
            OUR SERVICES
          </h1>
          <p className="text-vapor/50 text-lg max-w-2xl leading-relaxed mx-auto md:mx-0">
            Professional-grade detailing for luxury and performance vehicles. Every service uses professional products and paint-safe techniques perfected over 4+ years.
          </p>
        </div>
      </section>

      {/* ── VDS GOLD CALLOUT ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="relative border border-gold/20 rounded-sm overflow-hidden p-8 md:p-12"
          style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(10,11,13,0) 100%)' }}>
          <div className="absolute top-0 right-0 w-64 h-64"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">NEW MONTHLY MEMBERSHIP</p>
              <h2 className="text-3xl font-grotesk font-bold text-vapor mb-2">
                <GoldShimmer>VDS GOLD</GoldShimmer> — All of this, every month.
              </h2>
              <p className="text-vapor/50 text-sm max-w-lg">
                Unlimited exterior details + 1 interior deep clean per month. Ceramic sealant, steam clean, door jambs — everything. From $250/mo per vehicle.
              </p>
            </div>
            <Link to="/vds-gold"
              className="shrink-0 vds-gold-btn px-7 py-4 text-sm font-mono-tech tracking-widest rounded-sm flex items-center gap-2">
              LEARN MORE <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── SERVICE MODULES ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 space-y-0.5 mb-24">
        {SERVICES.map((svc, i) => (
          <div key={svc.id} className={`grid grid-cols-1 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''} bg-vapor/5`}>
            {/* Image */}
            <div className={`relative overflow-hidden h-80 lg:h-auto ${i % 2 === 1 ? 'lg:col-start-2' : ''}`}>
              <img src={svc.img} alt={svc.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-asphalt/80 to-transparent lg:hidden" />
              {svc.gold && (
                <div className="absolute top-6 left-6 vds-gold-btn px-3 py-1.5 text-xs font-mono-tech tracking-widest rounded-sm bg-obsidian">
                  ◆ INCLUDED IN VDS GOLD
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`bg-asphalt p-10 lg:p-14 flex flex-col justify-center ${i % 2 === 1 ? 'lg:col-start-1' : ''}`}>
              {svc.gold && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-mono-tech text-gold tracking-widest">◆ INCLUDED IN VDS GOLD</span>
                </div>
              )}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-8 h-px bg-gold" />
                <p className="text-xs font-mono-tech tracking-[0.3em] text-gold">{svc.id.toUpperCase()}</p>
              </div>
              <h2 className="text-3xl font-grotesk font-bold text-vapor mb-2">{svc.title}</h2>
              <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mb-6">{svc.subtitle}</p>
              <p className="text-vapor/60 text-sm leading-relaxed mb-10">{svc.description}</p>

              {/* Monospaced spec list */}
              <div className="border border-vapor/10 rounded-sm p-6 mb-8 bg-obsidian/50">
                <p className="text-xs font-mono-tech text-vapor/30 tracking-widest mb-4">// TECHNICAL STACK</p>
                <ul className="space-y-2">
                  {svc.specs.map((spec, j) => (
                    <li key={j} className="flex items-center gap-3 font-mono-tech text-xs text-vapor/60">
                      <Check size={11} className="text-gold shrink-0" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Link
                  to="/book"
                  state={{ preselect_service: svc.id === 'full-detail' ? 'full_detail' : svc.id === 'ceramic' ? 'ceramic_coating' : 'paint_correction' }}
                  className="flex-1 text-center py-3.5 bg-vapor text-obsidian font-mono-tech text-xs tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm">
                  BOOK NOW
                </Link>
                <Link
                  to="/book"
                  state={{ preselect_service: svc.id === 'full-detail' ? 'full_detail' : svc.id === 'ceramic' ? 'ceramic_coating' : 'paint_correction' }}
                  className="px-6 py-3.5 border border-vapor/20 text-vapor/50 font-mono-tech text-xs tracking-widest hover:border-vapor hover:text-vapor transition-colors duration-200 rounded-sm">
                  GET QUOTE
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 border-t border-vapor/5 text-center max-w-3xl mx-auto px-6 mb-8">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-6">GET STARTED TODAY</p>
        <h2 className="text-4xl font-grotesk font-bold text-vapor mb-6">
          NOT SURE WHICH SERVICE?<br />WE'LL HELP.
        </h2>
        <p className="text-vapor/50 mb-10">Call or text us. We'll assess your vehicle's needs and recommend the right service — no pressure, no upsells you don't need.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:+14704128986"
            className="bg-vapor text-obsidian px-8 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm">
            CALL (470) 412-8986
          </a>
          <Link to="/contact"
            className="border border-vapor/20 text-vapor px-8 py-4 text-sm font-mono-tech tracking-widest hover:border-vapor transition-colors duration-200 rounded-sm">
            SEND A REQUEST
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}