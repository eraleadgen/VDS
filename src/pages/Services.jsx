import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldPromoCard from '../components/vds/GoldPromoCard';
import { useBusinessConfig } from '@/lib/BusinessConfigContext';
import { resolveFeaturedCards } from '@/lib/featuredServices';

export default function Services() {
  const config = useBusinessConfig();
  const featured = resolveFeaturedCards(config?.featured_services, config?.services);
  const phone = config?.business_phone || '';
  const smsHref = `sms:${phone.replace(/[^0-9+]/g, '')}`;

  const descriptionFor = (card) => {
    const svc = (config?.services || []).find(s => s.key === card.service_key);
    return svc?.description || card.subtitle;
  };

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
        <GoldPromoCard />
      </div>

      {/* ── SERVICE MODULES ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 space-y-4 md:space-y-0.5 mb-16 md:mb-24">
        {featured.map((svc, i) => {
          const preselectState = svc._stale ? {} : { state: { preselect_service: svc._preselect } };
          return (
          <div key={svc.service_key} className={`grid grid-cols-1 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''} bg-vapor/5 rounded-sm md:rounded-none overflow-hidden border border-vapor/5`}>
            {/* Image */}
            <div className={`relative overflow-hidden h-56 sm:h-64 md:h-80 lg:h-auto ${i % 2 === 1 ? 'lg:col-start-2' : ''}`}>
              <img src={svc.image_url} alt={svc.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-asphalt/80 to-transparent lg:hidden" />
              {!svc.not_in_membership && (
                <div className="absolute top-6 left-6 vds-gold-btn px-3 py-1.5 text-xs font-mono-tech tracking-widest rounded-sm bg-obsidian">
                  ◆ INCLUDED IN VDS GOLD
                </div>
              )}
              {svc._stale && (
                <div className="absolute top-6 right-6 z-10 text-[10px] font-mono-tech tracking-widest text-red-400 border border-red-400/40 bg-obsidian/80 px-2 py-1 rounded-sm">
                  ⚠ SERVICE UNAVAILABLE
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`bg-asphalt p-6 sm:p-10 lg:p-14 flex flex-col justify-center ${i % 2 === 1 ? 'lg:col-start-1' : ''}`}>
              {!svc.not_in_membership && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-mono-tech text-gold tracking-widest">◆ INCLUDED IN VDS GOLD</span>
                </div>
              )}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-8 h-px bg-gold" />
                <p className="text-xs font-mono-tech tracking-[0.3em] text-gold">{svc.service_key.toUpperCase()}</p>
              </div>
              <h2 className="text-3xl font-grotesk font-bold text-vapor mb-2">{svc.title}</h2>
              <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mb-6">{svc.subtitle}</p>
              <p className="text-vapor/60 text-sm leading-relaxed mb-10">{descriptionFor(svc)}</p>

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
                  {...preselectState}
                  className="flex-1 text-center py-3.5 bg-vapor text-obsidian font-mono-tech text-xs tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm">
                  BOOK NOW
                </Link>
                <Link
                  to="/book"
                  {...preselectState}
                  className="px-6 py-3.5 border border-vapor/20 text-vapor/50 font-mono-tech text-xs tracking-widest hover:border-vapor hover:text-vapor transition-colors duration-200 rounded-sm">
                  GET QUOTE
                </Link>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-vapor/5 text-center max-w-3xl mx-auto px-6 mb-8">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-6">GET STARTED TODAY</p>
        <h2 className="text-4xl font-grotesk font-bold text-vapor mb-6">
          NOT SURE WHICH SERVICE?<br />WE'LL HELP.
        </h2>
        <p className="text-vapor/50 mb-10">Call or text us. We'll assess your vehicle's needs and recommend the right service — no pressure, no upsells you don't need.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/book"
            className="bg-vapor text-obsidian px-8 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm">
            BOOK NOW
          </Link>
          {phone && (
            <a href={smsHref}
              className="border border-vapor/20 text-vapor px-8 py-4 text-sm font-mono-tech tracking-widest hover:border-vapor transition-colors duration-200 rounded-sm">
              TEXT US
            </a>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}