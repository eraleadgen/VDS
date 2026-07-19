import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Clock, Car, Sparkles, Loader2, ShieldCheck, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import GoldPromoCard from '../components/vds/GoldPromoCard';
import VehicleSelector from '../components/vds/VehicleSelector';

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

const CONDITION_IMAGES = {
  light: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/8f156a44a_generated_image.png',
  moderate: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/3e0d6c61e_generated_image.png',
  heavy: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/8be897528_generated_image.png',
};

function lookupTier(svc, classification, pricingGroup) {
  return (svc.tiers || []).find(t => t.tier === classification)
    || (svc.tiers || []).find(t => t.tier === pricingGroup)
    || (svc.tiers || [])[0];
}

function formatDuration(mins) {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [condition, setCondition] = useState('light');
  const [selected, setSelected] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [booking, setBooking] = useState(false);

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
  const classification = vehicle?.classification || null;
  const pricingGroup = classification ? (mapping[classification] || 'sedan_coupe') : null;
  const conditions = config?.pricing_rules?.condition_multipliers || [];
  const conditionEntry = conditions.find(c => c.key === condition);
  const conditionMultiplier = conditionEntry?.multiplier ?? 1;
  const conditionDurationAdd = conditionEntry?.duration_add_minutes ?? 0;

  const allServices = config?.services || [];
  const detailServices = allServices.filter(s => s.category === 'detail');
  const addOnServices = allServices.filter(s => s.category === 'addon');
  const coatingServices = allServices.filter(s => s.category === 'coating');
  const correctionServices = allServices.filter(s => s.category === 'correction');

  const quote = useMemo(() => {
    let basePrice = 0;
    let baseMins = 0;
    const lineItems = [];

    for (const key of selected) {
      const svc = allServices.find(s => s.key === key);
      if (!svc) continue;
      const tier = lookupTier(svc, classification, pricingGroup);
      if (svc.requires_consultation) {
        lineItems.push({ key, label: svc.label, consultation: true });
      } else {
        basePrice += tier?.price || 0;
        baseMins += tier?.duration_minutes || 0;
        lineItems.push({ key, label: svc.label, price: tier?.price || 0, duration: tier?.duration_minutes || 0 });
      }
    }

    let addOnTotal = 0;
    let addOnMins = 0;
    for (const key of addOns) {
      const svc = allServices.find(s => s.key === key);
      if (!svc) continue;
      const tier = lookupTier(svc, classification, pricingGroup);
      addOnTotal += tier?.price || 0;
      addOnMins += tier?.duration_minutes || 0;
      lineItems.push({ key, label: svc.label, price: tier?.price || 0, duration: tier?.duration_minutes || 0, isAddOn: true });
    }

    for (const key of consultations) {
      const svc = allServices.find(s => s.key === key);
      if (!svc) continue;
      lineItems.push({ key, label: svc.label, consultation: true });
    }

    const conditionedBase = Math.round(basePrice * conditionMultiplier);
    const total = conditionedBase + addOnTotal;
    const totalMins = baseMins + addOnMins + (basePrice > 0 ? conditionDurationAdd : 0);
    const summary = lineItems.map(i => i.consultation ? `${i.label} — Consultation` : `${i.label} — $${i.price}`).join(' | ');

    return { lineItems, basePrice, conditionedBase, addOnTotal, total, totalMins, summary };
  }, [selected, addOns, consultations, classification, pricingGroup, conditionMultiplier, conditionDurationAdd, allServices]);

  const toggleService = (key) => setSelected(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);
  const toggleAddOn = (key) => setAddOns(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);
  const toggleConsultation = (key) => setConsultations(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);

  const hasItems = quote.lineItems.length > 0 && !!classification;

  const handleBookQuote = async () => {
    if (!hasItems) return;
    setBooking(true);
    try {
      const res = await base44.functions.invoke('saveQuote', {
        vehicle_classification: classification,
        vehicle_year: vehicle?.year,
        vehicle_make: vehicle?.make,
        vehicle_model: vehicle?.model,
        services: [...selected, ...consultations],
        add_ons: addOns,
        condition,
        estimated_price: quote.total,
        estimated_duration_minutes: quote.totalMins,
        quote_summary: quote.summary,
      });
      const data = res?.data || res;
      if (data.error) { alert(data.error); return; }
      navigate('/book', { state: { quote: data.quote, quote_id: data.quote_id } });
    } catch (e) {
      alert('Failed to save quote. Please try again.');
    } finally { setBooking(false); }
  };

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      <section className="pt-40 pb-12 max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">METRO ATLANTA · MOBILE DETAILING</p>
        <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor leading-none mb-6">
          <GoldShimmer>PRICING</GoldShimmer>
        </h1>
        <p className="text-vapor/50 text-lg max-w-xl mx-auto leading-relaxed">
          Build your custom quote in under 60 seconds. Pricing adjusts to your vehicle size, condition, and add-ons.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="text-gold animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-10">
              {/* Step 1: Vehicle */}
              <VehicleSelector onSelect={setVehicle} selected={vehicle} />

              {/* Step 2: Condition */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">2</span>
                  <h2 className="text-sm font-mono-tech tracking-widest text-gold">VEHICLE CONDITION</h2>
                </div>
                <p className="text-xs font-mono-tech text-vapor/40 mb-3">Not sure? Match your vehicle to the reference photos below.</p>
                <div className="grid grid-cols-3 gap-3">
                  {conditions.map(c => (
                    <button key={c.key} onClick={() => setCondition(c.key)}
                      className={`relative rounded-sm border overflow-hidden text-left transition-all vds-card-hover ${condition === c.key ? 'border-gold ring-1 ring-gold' : 'border-vapor/10 bg-asphalt/40 hover:border-vapor/30'}`}>
                      {condition === c.key && (
                        <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                          <Check size={13} className="text-obsidian" />
                        </span>
                      )}
                      {CONDITION_IMAGES[c.key] && (
                        <div className="aspect-square w-full overflow-hidden bg-asphalt">
                          <img src={CONDITION_IMAGES[c.key]} alt={`${c.label} condition reference`} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-3">
                        <span className={`block text-sm font-grotesk ${condition === c.key ? 'text-vapor' : 'text-vapor/80'}`}>{c.label}</span>
                        <span className="text-xs font-mono-tech text-vapor/40 mt-0.5 block">{c.multiplier > 1 ? `+${Math.round((c.multiplier - 1) * 100)}%` : 'Base rate'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Detailing Services */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold text-obsidian text-xs font-bold font-mono-tech">3</span>
                  <h2 className="text-sm font-mono-tech tracking-widest text-gold">CHOOSE YOUR SERVICES</h2>
                </div>
                <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.detail}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {detailServices.map(svc => {
                    const tier = lookupTier(svc, classification, pricingGroup);
                    const price = tier?.price ?? 0;
                    const checked = selected.includes(svc.key);
                    return (
                      <button key={svc.key} onClick={() => toggleService(svc.key)}
                        className={`flex items-center justify-between gap-3 p-4 rounded-sm border text-left transition-all ${checked ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-gold border-gold' : 'border-vapor/30'}`}>
                            {checked && <Check size={13} className="text-obsidian" />}
                          </span>
                          <span className="text-sm text-vapor font-grotesk truncate">{svc.label}</span>
                        </div>
                        <span className="text-gold font-grotesk font-bold text-base shrink-0">${price}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add-Ons */}
                {addOnServices.length > 0 && (
                  <>
                    <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.addon}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {addOnServices.map(svc => {
                        const tier = lookupTier(svc, classification, pricingGroup);
                        const price = tier?.price ?? 0;
                        const checked = addOns.includes(svc.key);
                        return (
                          <button key={svc.key} onClick={() => toggleAddOn(svc.key)}
                            className={`flex items-center justify-between gap-3 p-4 rounded-sm border text-left transition-all ${checked ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${checked ? 'bg-gold border-gold' : 'border-vapor/30'}`}>
                                {checked && <Check size={13} className="text-obsidian" />}
                              </span>
                              <span className="text-sm text-vapor font-grotesk truncate">{svc.label}</span>
                            </div>
                            <span className="text-gold font-grotesk font-bold text-base shrink-0">+${price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Ceramic Coatings — Consultation only */}
                {coatingServices.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.coating}</p>
                    <button onClick={() => toggleConsultation(coatingServices[0].key)}
                      className={`w-full flex items-center justify-between gap-3 p-5 rounded-sm border text-left transition-all ${consultations.includes(coatingServices[0].key) ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
                      <div className="flex items-center gap-3">
                        <MessageCircle size={18} className={consultations.includes(coatingServices[0].key) ? 'text-gold' : 'text-vapor/40'} />
                        <div>
                          <span className="block text-sm text-vapor font-grotesk">Request Ceramic Coating Consultation</span>
                          <span className="text-xs font-mono-tech text-vapor/40">Free 15-min consultation · Custom quote on-site</span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono-tech tracking-widest shrink-0 ${consultations.includes(coatingServices[0].key) ? 'text-gold' : 'text-vapor/50'}`}>
                        {consultations.includes(coatingServices[0].key) ? '✓ ADDED' : 'CONSULTATION'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Paint Correction — Consultation only */}
                {correctionServices.length > 0 && (
                  <div>
                    <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">{CATEGORY_LABEL.correction}</p>
                    <button onClick={() => toggleConsultation(correctionServices[0].key)}
                      className={`w-full flex items-center justify-between gap-3 p-5 rounded-sm border text-left transition-all ${consultations.includes(correctionServices[0].key) ? 'border-gold/50 bg-gold/[0.06]' : 'border-vapor/10 bg-asphalt/30 hover:border-vapor/20'}`}>
                      <div className="flex items-center gap-3">
                        <MessageCircle size={18} className={consultations.includes(correctionServices[0].key) ? 'text-gold' : 'text-vapor/40'} />
                        <div>
                          <span className="block text-sm text-vapor font-grotesk">Request Paint Correction Consultation</span>
                          <span className="text-xs font-mono-tech text-vapor/40">Free 15-min consultation · Custom quote on-site</span>
                        </div>
                      </div>
                      <span className={`text-xs font-mono-tech tracking-widest shrink-0 ${consultations.includes(correctionServices[0].key) ? 'text-gold' : 'text-vapor/50'}`}>
                        {consultations.includes(correctionServices[0].key) ? '✓ ADDED' : 'CONSULTATION'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: live quote (sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-28 glass-panel border border-gold/20 rounded-sm p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-gold" />
                  <h3 className="text-xs font-mono-tech tracking-widest text-gold">YOUR CUSTOM QUOTE</h3>
                </div>
                <p className="text-xs font-mono-tech text-vapor/40 mb-5">{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'No vehicle'} · {conditionEntry?.label || 'Standard condition'}</p>

                {!classification ? (
                  <div className="py-10 text-center">
                    <Car size={28} className="text-vapor/20 mx-auto mb-3" />
                    <p className="text-vapor/40 font-mono-tech text-xs">Add your vehicle above to see pricing.</p>
                  </div>
                ) : !hasItems ? (
                  <div className="py-10 text-center">
                    <Car size={28} className="text-vapor/20 mx-auto mb-3" />
                    <p className="text-vapor/40 font-mono-tech text-xs">Select services to see your custom quote.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-5 max-h-[320px] overflow-y-auto">
                      {quote.lineItems.map(it => (
                        <div key={it.key} className="flex items-start justify-between gap-2 pb-3 border-b border-vapor/5 last:border-0">
                          <span className={`text-sm font-grotesk ${it.consultation ? 'text-vapor/50' : 'text-vapor/80'}`}>{it.label}</span>
                          <span className="text-sm font-grotesk font-bold shrink-0">
                            {it.consultation ? <span className="text-vapor/40 text-xs font-mono-tech">Consultation</span> : <span className="text-gold">${it.price}</span>}
                          </span>
                        </div>
                      ))}
                    </div>

                    {conditionMultiplier > 1 && quote.basePrice > 0 && (
                      <div className="flex items-center justify-between text-xs font-mono-tech text-vapor/40 mb-2">
                        <span>Base services</span>
                        <span>${quote.basePrice}</span>
                      </div>
                    )}
                    {conditionMultiplier > 1 && quote.basePrice > 0 && (
                      <div className="flex items-center justify-between text-xs font-mono-tech text-vapor/40 mb-2">
                        <span>× {conditionEntry?.label} condition</span>
                        <span className="text-gold">${quote.conditionedBase}</span>
                      </div>
                    )}
                    {quote.addOnTotal > 0 && (
                      <div className="flex items-center justify-between text-xs font-mono-tech text-vapor/40 mb-3">
                        <span>Add-ons</span>
                        <span>+${quote.addOnTotal}</span>
                      </div>
                    )}

                    <div className="flex items-end justify-between mb-2 pt-3 border-t border-vapor/10">
                      <span className="text-xs font-mono-tech tracking-widest text-vapor/40">CUSTOM QUOTE</span>
                      <span className="text-3xl font-grotesk font-bold text-gold">${quote.total}</span>
                    </div>
                    {quote.totalMins > 0 && (
                      <p className="flex items-center gap-1.5 text-xs font-mono-tech text-vapor/40 mb-4">
                        <Clock size={12} /> Est. {formatDuration(quote.totalMins)}
                      </p>
                    )}

                    <button onClick={handleBookQuote} disabled={booking}
                      className="flex items-center justify-center gap-2 w-full bg-gold text-obsidian px-6 py-3.5 text-sm font-mono-tech tracking-widest rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50">
                      {booking ? <Loader2 size={14} className="animate-spin" /> : <>BOOK THIS QUOTE <ArrowRight size={14} /></>}
                    </button>
                  </>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-vapor/5">
                  <ShieldCheck size={13} className="text-gold/50 shrink-0" />
                  <p className="text-[10px] font-mono-tech text-vapor/30 leading-relaxed">Custom quote based on size, condition &amp; add-ons · Final amount confirmed before service</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* VDS Gold banner */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <GoldPromoCard />
        </div>
      </section>

      <section className="py-24 text-center max-w-2xl mx-auto px-6">
        <h2 className="text-3xl font-grotesk font-bold text-vapor mb-4">READY TO BOOK?</h2>
        <p className="text-vapor/50 mb-10 font-mono-tech text-sm">Build your custom quote above, or book directly.</p>
        <Link to="/book" className="inline-flex items-center gap-3 border border-gold bg-gold text-obsidian px-10 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-300 rounded-sm">
          BOOK NOW <ArrowRight size={14} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}