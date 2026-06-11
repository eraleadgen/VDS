import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Clock, MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';
import GoldShimmer from '../components/vds/GoldShimmer';
import GoldParticles from '../components/vds/GoldParticles';

const STATS = [
  { value: '500+', label: 'VEHICLES DETAILED' },
  { value: '5.0', label: 'GOOGLE RATING' },
  { value: '4+', label: 'YEARS IN ATLANTA' },
  { value: '100%', label: 'SATISFACTION GUARANTEED' },
];

const SERVICES = [
  {
    title: 'FULL DETAIL',
    subtitle: 'Interior & Exterior Restoration',
    specs: ['Interior & Exterior Restoration', 'Odor & Stain Removal', 'Professional Products', 'Ceramic Sealant'],
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/c7357965d_FullDetail-CeramicSealant2.jpg',
    path: '/services',
  },
  {
    title: 'CERAMIC COATINGS',
    subtitle: 'Long-Term Paint Protection',
    specs: ['2–7 Year Coatings', 'Professional-Grade Coatings', 'Hydrophobic Surface Protection', 'UV & Chemical Resistance'],
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/3a80c18b3_ceramic-coating-being-professionally-applied-to-car-paint-for-long-term-protection.webp',
    path: '/services',
    notInGold: true,
  },
  {
    title: 'PAINT CORRECTION',
    subtitle: 'Swirl & Scratch Removal',
    specs: ['Swirl Mark Elimination', 'Scratch & Buffer Trail Removal', 'Flawless Paint Quality', 'Coating Recommended'],
    img: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/2e390daf5_ChatGPTImageFeb17202611_00_33PM.png',
    path: '/services',
    notInGold: true,
  },
];

const FAQS = [
  {
    q: 'Do I need to be home during the service?',
    a: 'No. As long as we have access to the vehicle and the keys are arranged ahead of time, you don\'t need to be present. Many of our clients are at work or away while we service their vehicle.',
  },
  {
    q: 'How long does a detail usually take?',
    a: 'Service time depends on the package and vehicle condition. Most appointments range from 2–5 hours. We\'ll give you an accurate time estimate before your service begins.',
  },
  {
    q: 'Is mobile detailing safe for high-end vehicles?',
    a: 'Absolutely. We specialize in luxury and performance vehicles and use professional-grade products, tools, and paint-safe techniques to ensure the highest level of care.',
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        <img
          src="https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f695b9a84_PhotoFeb23202651724PM.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/70 via-transparent to-transparent" />
        <GoldParticles count={55} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16 md:pb-24 w-full">
          <div className="max-w-3xl text-center md:text-left">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold mb-6 opacity-80">
              METRO ATLANTA · MOBILE DETAILING
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-grotesk font-700 leading-none text-vapor mb-6 tracking-tight">
              THE RITUAL<br />OF
              <GoldShimmer className="ml-4">REFLECTION.</GoldShimmer>
            </h1>
            <p className="text-lg text-vapor/60 font-grotesk max-w-xl leading-relaxed mb-10 mx-auto md:mx-0">
              Premium mobile detailing for luxury and performance vehicles across Metro Atlanta. We come to you — no shop visit required.
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/pricing"
                className="flex items-center gap-3 border border-vapor/40 text-vapor px-7 py-4 text-sm font-mono-tech tracking-widest hover:border-vapor transition-colors duration-300 rounded-sm">
                PRICING <ArrowRight size={14} />
              </Link>
              <Link to="/book"
                className="flex items-center gap-3 border border-vapor/40 text-vapor px-7 py-4 text-sm font-mono-tech tracking-widest hover:border-vapor transition-colors duration-300 rounded-sm">
                BOOK NOW <ArrowRight size={14} />
              </Link>
              <Link to="/vds-gold"
                className="vds-gold-btn flex items-center gap-3 px-7 py-4 text-sm font-mono-tech tracking-widest rounded-sm">
                ◆ EXPLORE VDS GOLD
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-vapor/10">
              {STATS.map(s => (
                <div key={s.value}>
                  <p className="text-3xl font-grotesk font-bold text-vapor">{s.value}</p>
                  <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <ChevronDown size={18} className="text-gold" />
        </div>
      </section>

      {/* ── VDS GOLD BANNER ──────────────────────────── */}
      <section className="relative py-20 overflow-hidden border-y border-gold/20" style={{
        background: 'linear-gradient(180deg, #0A0B0D 0%, #0D0B06 50%, #0A0B0D 100%)',
      }}>
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-[#0D0B06] to-obsidian" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 gold-rotating-glow rounded-sm px-8 py-6 border border-gold/20">
            <div className="text-center md:text-left">
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">NEW — MONTHLY MEMBERSHIP</p>
              <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor">
                <GoldShimmer>VDS GOLD</GoldShimmer>
              </h2>
              <p className="text-vapor/50 font-mono-tech text-sm mt-3 max-w-lg">
                Unlimited exterior details + 1 deep interior clean per month. Your vehicle, perpetually immaculate.
              </p>
            </div>
            <Link to="/vds-gold"
              className="vds-gold-btn px-8 py-4 text-sm font-mono-tech tracking-widest rounded-sm whitespace-nowrap">
              VIEW MEMBERSHIP →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center md:text-left">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">WHAT WE OFFER</p>
          <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor">OUR SERVICES</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-vapor/5">
          {SERVICES.map((svc) => (
            <div key={svc.title} className="bg-obsidian group relative overflow-hidden">
              <div className="relative h-64 overflow-hidden">
                <img src={svc.img} alt={svc.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian to-transparent" />

                {/* Gold upsell on hover */}
                <div className="absolute inset-0 bg-obsidian/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
                  <div className="text-center">
                    {svc.notInGold ? (
                      <>
                        <p className="text-lg font-grotesk font-bold text-vapor">PAINT CORRECTION</p>
                        <p className="text-vapor/40 text-xs font-mono-tech mt-2">Not included in VDS Gold</p>
                        <a href="sms:+14704128986" className="inline-block mt-4 text-xs font-mono-tech tracking-widest text-gold border border-gold/40 px-4 py-2 hover:bg-gold hover:text-obsidian transition-colors duration-200">TEXT FOR A QUOTE</a>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-mono-tech text-gold/70 tracking-widest mb-2">◆ INCLUDED IN</p>
                        <Link to="/vds-gold" className="text-lg font-grotesk font-bold text-gold">VDS GOLD MEMBERSHIP</Link>
                        <p className="text-vapor/50 text-xs font-mono-tech mt-2">From $250/mo per vehicle</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border border-vapor/5 border-t-0">
                <h3 className="text-xl font-grotesk font-bold text-vapor mb-1">{svc.title}</h3>
                <p className="text-xs font-mono-tech text-vapor/40 tracking-widest mb-6">{svc.subtitle}</p>
                <ul className="space-y-2 mb-8">
                  {svc.specs.map(spec => (
                    <li key={spec} className="flex items-center gap-3 text-sm text-vapor/60 font-mono-tech">
                      <span className="text-gold text-xs">◆</span> {spec}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <a href="sms:+14704128986"
                    className="flex-1 text-center py-3 text-xs font-mono-tech tracking-widest bg-vapor text-obsidian hover:bg-gold transition-colors duration-200 rounded-sm">
                    TEXT FOR QUOTE
                  </a>
                  <Link to={svc.path}
                    className="px-4 py-3 border border-vapor/20 text-vapor/50 hover:border-vapor hover:text-vapor transition-colors duration-200 rounded-sm">
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────── */}
      <section className="py-24 border-y border-vapor/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">WHO WE ARE</p>
              <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor leading-tight mb-8">
                ABOUT VALET<br />DETAILING SERVICE
              </h2>
              <p className="text-vapor/60 text-lg leading-relaxed mb-12">
                Premium mobile detailing for luxury and performance vehicles across Metro Atlanta. We come to you — delivering concierge-level care at your home, office, or wherever your vehicle rests.
              </p>

              <div className="grid grid-cols-1 gap-8">
                {[
                  { icon: '◆', title: 'Luxury & Performance Specialists', desc: "We're not a high-volume car wash. Our tools, techniques, and professional-grade products are specifically chosen for Porsche, Rolls Royce, and Mercedes-Benz." },
                  { icon: '✎', title: 'Meticulous, Unrushed Craftsmanship', desc: 'Quality over speed. Every vehicle receives our full attention, ensuring a flawless result without cutting corners.' },
                  { icon: '⚗', title: 'Professional, Insured & Reliable', desc: 'Registered LLC with comprehensive business insurance. Clear communication, on-time arrivals, and complete peace of mind.' },
                  { icon: '❖', title: 'Long-Term Client Relationships', desc: "Our goal is to be your trusted partner for car care — delivering consistent, exceptional results every single time." },
                ].map(item => (
                  <div key={item.title} className="flex gap-5 group">
                    <span className="text-gold text-sm mt-1 shrink-0">{item.icon}</span>
                    <div>
                      <h4 className="text-vapor font-grotesk font-semibold mb-2">{item.title}</h4>
                      <p className="text-vapor/50 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="https://media.base44.com/images/public/6a191df337222815cd0b1f5e/36815783a_PorscheGoogleReview.webp"
                alt="Premium detailing"
                className="w-full aspect-[3/4] object-cover rounded-sm"
              />
              <div className="absolute -bottom-6 -left-6 glass-panel p-6 border border-gold/20">
                <div className="flex items-center gap-2 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-gold fill-gold" />)}
                </div>
                <p className="text-vapor/80 text-sm font-grotesk italic max-w-xs">
                  "VDS Mobile does an amazing job, I highly recommend. They will exceed your expectations every time."
                </p>
                <p className="text-vapor/40 text-xs font-mono-tech mt-3 tracking-widest">VERIFIED GOOGLE REVIEW</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ PREVIEW ──────────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4 text-center">STILL NOT SURE?</p>
          <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor text-center mb-16">
            FREQUENTLY ASKED<br />QUESTIONS
          </h2>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i}
                className="border border-vapor/10 hover:border-vapor/20 transition-colors duration-200 rounded-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-vapor font-grotesk font-medium pr-8">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gold shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-vapor/60 text-sm leading-relaxed border-t border-vapor/5 pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/faq"
              className="text-sm font-mono-tech tracking-widest text-gold/70 hover:text-gold transition-colors border-b border-gold/30 pb-1">
              VIEW ALL FAQS →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <img
          src="https://media.base44.com/images/public/6a191df337222815cd0b1f5e/7b9bc552e_Lamborginidetailing.jpg"
          alt="Luxury car"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-obsidian/85" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-6">METRO ATLANTA · ON-SITE SERVICE</p>
          <h2 className="text-5xl md:text-6xl font-grotesk font-bold text-vapor mb-8">
            YOUR VEHICLE<br />DESERVES THE BEST.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/contact"
              className="bg-vapor text-obsidian px-10 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-300 rounded-sm">
              BOOK YOUR DETAIL
            </Link>
            <Link to="/vds-gold"
              className="vds-gold-btn px-10 py-4 text-sm font-mono-tech tracking-widest rounded-sm">
              ◆ JOIN VDS GOLD
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}