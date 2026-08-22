import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import EraMarketingLayout from '@/components/marketing/EraMarketingLayout';
import EraHero from '@/components/marketing/EraHero';
import EraCta from '@/components/marketing/EraCta';
import Reveal from '@/components/marketing/Reveal';

const FACTS = [
  { k: '1st', v: 'ERA Systems client' },
  { k: 'Atlanta, GA', v: 'Service area' },
  { k: 'Live', v: 'Full operations' },
  { k: '2025', v: 'Running since' },
];

const PAGES = [
  { to: '/era-platform', label: 'What we do', desc: 'Six automated systems that run your business, from first call to final payment.', tag: 'PLATFORM' },
  { to: '/era-results', label: 'Results', desc: 'See the actual website and admin dashboard ERA produces, running live today.', tag: 'PROOF' },
  { to: '/era-pricing', label: 'Pricing', desc: 'One-time setup, flat monthly. No per-seat surprises. Basic and Foundation live now.', tag: 'PRICING' },
  { to: '/era-who-for', label: "Who it's for", desc: 'Any service business that books jobs and gets paid. Detailing today, more tomorrow.', tag: 'CUSTOMERS' },
];

export default function EraHome() {
  return (
    <EraMarketingLayout>
      <EraHero />

      {/* Quick proof strip */}
      <section className="bg-[#08110E] border-y border-[#10B981]/8 py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FACTS.map((f, i) => (
              <motion.div
                key={f.v}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              >
                <p className="font-['Sora'] font-bold text-[#10B981] text-2xl md:text-3xl">{f.k}</p>
                <p className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#4A6359] mt-1">{f.v.toUpperCase()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore cards — easy access to sub-pages */}
      <section className="bg-[#060A09] py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[640px] mb-12">
            <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981] mb-4">EXPLORE THE PLATFORM</p>
            <h2 className="font-['Sora'] font-bold text-[#DFEDE9] text-[30px] md:text-[42px] leading-[1.05] tracking-[-0.03em]">
              Everything your business needs — one system.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PAGES.map((p, i) => (
              <Reveal key={p.to} delay={(i % 2) * 0.08}>
                <Link to={p.to} className="group block bg-[#0C1614] rounded-[10px] ring-1 ring-[#1A2A24] p-6 transition-all duration-300 hover:ring-[#10B981]/50 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.35)]">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-[#10B981]">{p.tag}</p>
                    <ArrowRight size={16} className="text-[#4A6359] group-hover:text-[#10B981] transition-colors" />
                  </div>
                  <h3 className="font-['Sora'] font-bold text-[#DFEDE9] text-xl mb-2">{p.label}</h3>
                  <p className="font-['Inter'] text-[#7A9A92] text-sm leading-relaxed">{p.desc}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <EraCta />
    </EraMarketingLayout>
  );
}