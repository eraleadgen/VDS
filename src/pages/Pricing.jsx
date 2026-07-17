import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, Car, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';

const CLASSIFICATION_LABEL = {
  coupe: 'Coupe',
  sedan: 'Sedan',
  mid_size_suv: 'Mid Size SUV',
  truck_3_row_suv: 'Truck / 3-Row SUV',
};

const CATEGORY_LABEL = {
  detail: 'Detailing Services',
  coating: 'Ceramic Coatings',
  correction: 'Paint Correction',
  addon: 'Add-On Services',
};
const CATEGORY_ORDER = ['detail', 'correction', 'coating', 'addon'];

function formatDuration(mins) {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function Pricing() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classification, setClassification] = useState('sedan');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.BusinessConfig.filter({ is_active: true });
        if (list && list[0]) setConfig(list[0]);
      } catch (e) { console.error('Config load error:', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const mapping = config?.classification_to_pricing_group || {};
  const pricingGroup = mapping[classification] || 'sedan_coupe';

  const services = useMemo(
    () => (config?.services || []).filter(s => s.category !== 'membership' && s.category !== 'consultation'),
    [config]
  );

  const grouped = useMemo(() => {
    const g = {};
    for (const svc of services) {
      if (!g[svc.category]) g[svc.category] = [];
      g[svc.category].push(svc);
    }
    return g;
  }, [services]);

  const quote = useMemo(() => {
    const items = [];
    let total = 0;
    let totalMins = 0;
    let hasConsultation = false;
    for (const key of selected) {
      const svc = services.find(s => s.key === key);
      if (!svc) continue;
      const tier = (svc.tiers || []).find(t => t.tier === pricingGroup) || (svc.tiers || [])[0];
      if (svc.requires_consultation) {
        hasConsultation = true;
        items.push({ key, label: svc.label, price: tier?.price ?? null, duration: tier?.duration_minutes, consultation: true });
      } else {
        const price = tier?.price ?? 0;
        total += price;
        totalMins += tier?.duration_minutes || 0;
        items.push({ key, label: svc.label, price, duration: tier?.duration_minutes });
      }
    }
    return { items, total, totalMins, hasConsultation };
  }, [selected, services, pricingGroup]);

  const toggle = (key) => setSelected(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);

  const classOptions = (config?.vehicle_classifications || []).filter(c => c.key in CLASSIFICATION_LABEL);

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="pt-40 pb-12 max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">METRO ATLANTA · MOBILE DETAILING</p>
        <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor leading-none mb-6">
          <GoldShimmer>PRICING</GoldShimmer>
        </h1>
        <p className="text-vapor/50 text-lg max-w-xl mx-auto leading-relaxed">
          Get an accurate quote in under 60 seconds. All services are performed on-site at your location.
        </p>
      </section>

      {/* ── DYNAMIC QUOTE CALCULATOR ────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="text-gold animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ── Left: selectors ── */}
            <div className="lg:col-span-2 space-y-10">
              {/* Step 1: Vehicle */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">1</span>
                  <h2 className="text-sm font-mono-tech tracking-widest text-gold">SELECT YOUR VEHICLE</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {classOptions.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setClassification(c.key)}
                      className={`relative p-5 rounded-sm border text-center transition-all vds-card-hover ${classification === c.key ? 'border-gold bg-gold/10' : 'border-vapor/10 bg-asphalt/40 hover:border-vapor/20'}`}
                    >
                      {classification === c.key && <Check size={14} className="absolute top-2 right-2 text-gold" />}
                      <Car size={22} className={classification === c.key ? 'text-gold mx-auto mb-2' : 'text-vapor/40 mx-auto mb-2'} />
                      <span className={`text-xs font-mono-tech tracking-wide ${classification === c.key ? 'text-vapor' : 'text-vapor/60'}`}>{CLASSIFICATION_LABEL[c.key] || c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Services */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">2</span>
                  <h2 className="text-sm font-mono-tech tracking-widest text-gold">CHOOSE YOUR SERVICES</h2>
                </div>
                <div className="space-y-8">
                  {CATEGORY_ORDER.map(cat => grouped[cat] ? (
                    <div key={cat}>
                      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL[cat]}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {grouped[cat].map(svc => {
                          const tier = (svc.tiers || []).find(t => t.tier === pricingGroup) || (svc.tiers || [])[0];
                          const price = tier?.price ?? 0;
                          const checked = selected.includes(svc.key);
                          return (
                            <button
                              key={svc.key}
                              onClick={() => toggle(svc.key)}
                              className={`flex items-center justify-between gap-3 p-4 rounded-sm border text-left transition-all ${checked ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-gold border-gold' : 'border-vapor/30'}`}>
                                  {checked && <Check size={13} className="text-obsidian" />}
                                </span>
                                <div className="min-w-0">
                                  <span className="block text-sm text-vapor font-grotesk truncate">{svc.label}</span>
                                  {svc.requires_consultation && <span className="text-[10px] font-mono-tech tracking-widest text-amber-300/70">CONSULTATION</span>}
                                </div>
                              </div>
                              <span className="text-gold font-grotesk font-bold text-base shrink-0">
                                {svc.requires_consultation ? `$${price}+` : `$${price}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>

            {/* ── Right: live quote (sticky) ── */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-28 glass-panel border border-gold/20 rounded-sm p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-gold" />
                  <h3 className="text-xs font-mono-tech tracking-widest text-gold">YOUR QUOTE</h3>
                </div>
                <p className="text-xs font-mono-tech text-vapor/40 mb-5">{CLASSIFICATION_LABEL[classification]} · {pricingGroup === 'sedan_coupe' ? 'Sedan/Coupe' : 'Truck/SUV'} pricing</p>

                {quote.items.length === 0 ? (
                  <div className="py-10 text-center">
                    <Car size={28} className="text-vapor/20 mx-auto mb-3" />
                    <p className="text-vapor/40 font-mono-tech text-xs">Select services to see your instant quote.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-5 max-h-[280px] overflow-y-auto">
                      {quote.items.map(it => (
                        <div key={it.key} className="flex items-start justify-between gap-2 pb-3 border-b border-vapor/5 last:border-0">
                          <span className="text-sm text-vapor/80 font-grotesk">{it.label}</span>
                          <span className="text-sm text-gold font-grotesk font-bold shrink-0">
                            {it.consultation ? 'Consult' : `$${it.price}`}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-end justify-between mb-2">
                      <span className="text-xs font-mono-tech tracking-widest text-vapor/40">STARTING AT</span>
                      <span className="text-3xl font-grotesk font-bold text-gold">${quote.total}</span>
                    </div>
                    {quote.totalMins > 0 && (
                      <p className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/40 mb-4">
                        <Clock size={12} /> Est. {formatDuration(quote.totalMins)}
                      </p>
                    )}
                    {quote.hasConsultation && (
                      <p className="text-[11px] font-mono-tech text-amber-300/60 mb-4 leading-relaxed">
                        Some selected services require a free consultation. Final pricing confirmed before service.
                      </p>
                    )}

                    <Link
                      to="/book"
                      className="flex items-center justify-center gap-2 w-full bg-gold text-obsidian px-6 py-3.5 text-sm font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors"
                    >
                      BOOK THIS QUOTE <ArrowRight size={14} />
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-vapor/5">
                  <ShieldCheck size={13} className="text-gold/50 shrink-0" />
                  <p className="text-[10px] font-mono-tech text-vapor/30 leading-relaxed">No hidden fees · Final quote confirmed before service begins</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <p className="text-3xl font-grotesk font-bold text-gold">$300 <span className="text-base text-vapor/50">truck/suv</span></p>
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
        <p className="text-vapor/50 mb-10 font-mono-tech text-sm">Book your appointment online. Final quote confirmed before service begins.</p>
        <Link to="/book"
          className="inline-flex items-center gap-3 border border-gold bg-gold text-obsidian px-10 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-300 rounded-sm">
          BOOK NOW <ArrowRight size={14} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}