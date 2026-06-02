import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

const FAQS = [
  {
    category: 'BOOKING & SCHEDULING',
    items: [
      {
        q: 'Do I need to be home during the service?',
        a: "No. As long as we have access to the vehicle and the keys are arranged ahead of time, you don't need to be present. Many of our clients are at work or away while we service their vehicle.",
      },
      {
        q: 'What do you need from me to get started?',
        a: 'We only need access to the vehicle and adequate space to work around the car. We bring all professional equipment and supplies — no hookups or power needed in most cases.',
      },
      {
        q: 'How long does a detail usually take?',
        a: 'Service time depends on the package and vehicle condition. Most appointments range from 2–5 hours. We\'ll give you an accurate time estimate before your service begins.',
      },
      {
        q: 'What is your cancellation or rescheduling policy?',
        a: 'We ask for at least 24 hours\' notice for cancellations or reschedules. This allows us to provide availability to other clients. Failure to provide sufficient notice may result in a cancellation fee.',
      },
    ],
  },
  {
    category: 'OUR SERVICES',
    items: [
      {
        q: 'Is mobile detailing safe for high-end vehicles?',
        a: 'Absolutely. We specialize in luxury and performance vehicles and use professional-grade products, tools, and paint-safe techniques to ensure the highest level of care. We work on Porsche, Rolls Royce, Mercedes-Benz, and other exotics regularly.',
      },
      {
        q: 'What products do you use?',
        a: 'We exclusively use GTechniq professional detailing and protection products — the same brand trusted by luxury OEM manufacturers and professional detailers worldwide.',
      },
      {
        q: 'Do you offer paint protection film (PPF)?',
        a: "Currently our protection offerings focus on ceramic coatings using GTechniq's professional range, from 3-month maintenance coatings to 7-year permanent protection. Contact us for specific recommendations.",
      },
      {
        q: 'What\'s the difference between a full detail and VDS Gold?',
        a: 'A full detail is a one-time comprehensive service. VDS Gold is our monthly membership — $250/mo for sedans/coupes, $300/mo for trucks & 3-row vehicles. It gives you unlimited exterior details and 1 interior deep clean every month, so your car stays perpetually perfect.',
      },
    ],
  },
  {
    category: 'VDS GOLD MEMBERSHIP',
    items: [
      {
        q: 'What is VDS Gold?',
        a: 'VDS Gold is our monthly membership program — $250/mo for sedans/coupes and $300/mo for trucks & 3-row vehicles. Members receive unlimited exterior details (hand wash on rims, all panels, door jambs, and 1-month ceramic sealant) plus 1 full interior detail per month (steam clean, deep vacuum, glass, every surface and crevice).',
      },
      {
        q: 'Can I cancel VDS Gold anytime?',
        a: 'Yes. VDS Gold is a month-to-month membership with no long-term contracts. You can cancel anytime.',
      },
      {
        q: 'Can I add multiple vehicles to VDS Gold?',
        a: 'Yes. The membership is priced at $250/mo (sedans/coupes) or $300/mo (trucks/3-row vehicles) per vehicle, so you can enroll as many vehicles as you need.',
      },
      {
        q: 'How do I schedule my VDS Gold appointments?',
        a: 'Simply call or text us to schedule. As a Gold member, you receive priority scheduling and we\'ll work around your schedule.',
      },
    ],
  },
  {
    category: 'PAYMENT & POLICY',
    items: [
      {
        q: 'What forms of payment do you accept?',
        a: 'We accept Cash, Zelle, Venmo, Cash App, and Debit/Credit Card via Invoice. Payment is collected after the service is completed unless otherwise arranged.',
      },
      {
        q: 'Are you insured?',
        a: 'Yes. Valet Detailing Service LLC is fully insured and a registered LLC in Georgia. You can have complete peace of mind when we service your vehicle.',
      },
      {
        q: 'What if I\'m not satisfied with the service?',
        a: 'Your satisfaction is our priority. Upon completion, we encourage you to inspect our work. If you\'re not satisfied, notify our on-site detailer immediately and we\'ll address and rectify any issue before we leave.',
      },
      {
        q: 'Can you take photos of my vehicle?',
        a: 'We reserve the right to capture before/during/after photos for quality control and marketing. Images may appear on our website or social media. No personally identifiable information will be associated without your explicit consent.',
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HEADER ───────────────────────────────────── */}
      <section className="relative pt-36 pb-20">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">STILL NOT SURE?</p>
          <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor mb-6">
            FREQUENTLY<br />ASKED
          </h1>
          <p className="text-vapor/50 text-lg leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about our services, booking process, and VDS Gold membership.
          </p>
        </div>
      </section>

      {/* ── FAQ SECTIONS ─────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16">
        {FAQS.map((cat, catIdx) => (
          <div key={catIdx}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-px bg-gold" />
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold">{cat.category}</p>
            </div>

            <div className="space-y-2">
              {cat.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isOpen = openItems[key];
                return (
                  <div key={itemIdx}
                    className="border border-vapor/10 hover:border-vapor/20 transition-colors duration-200 rounded-sm overflow-hidden">
                    <button
                      onClick={() => toggle(catIdx, itemIdx)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className="text-vapor font-grotesk font-medium pr-8 text-lg">{item.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-gold shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6">
                        <p className="text-vapor/60 leading-relaxed border-t border-vapor/5 pt-4">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="border-t border-vapor/5 py-24 text-center max-w-3xl mx-auto px-6 mb-8">
        <h2 className="text-3xl font-grotesk font-bold text-vapor mb-4">STILL HAVE QUESTIONS?</h2>
        <p className="text-vapor/50 mb-10">We're happy to walk you through everything. Reach out by call or text.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:+14043836915"
            className="bg-vapor text-obsidian px-8 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold transition-colors duration-200 rounded-sm">
            CALL (404) 383-6915
          </a>
          <a href="sms:+14704128986"
            className="border border-vapor/20 text-vapor px-8 py-4 text-sm font-mono-tech tracking-widest hover:border-vapor transition-colors duration-200 rounded-sm">
            TEXT (470) 412-8986
          </a>
          <Link to="/contact"
            className="border border-gold/30 text-gold px-8 py-4 text-sm font-mono-tech tracking-widest hover:border-gold transition-colors duration-200 rounded-sm">
            ◆ BOOK A SERVICE
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}