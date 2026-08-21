import { motion } from 'framer-motion';
import BrowserFrame from './BrowserFrame';
import AnalyticsCapture from './AnalyticsCapture';
import JobsCapture from './JobsCapture';
import Reveal from './Reveal';

const FACTS = [
  { k: '1st', v: 'ERA Core tenant' },
  { k: 'Atlanta, GA', v: 'Service area' },
  { k: 'Live', v: 'Full-stack operations' },
  { k: '2025', v: 'Running since' },
];

export default function EraProof() {
  return (
    <section id="proof" className="bg-[#08110E] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="relative max-w-[1200px] mx-auto px-6">
        <div className="max-w-[780px] mb-16">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981] mb-5">PROOF — 01</p>
          <h2 className="font-['Fraunces'] font-semibold text-[#DFEDE9] text-[34px] md:text-[52px] leading-[1.05] tracking-[-0.02em] mb-6">
            This isn't a mockup. It's a Tuesday morning for a real detailing business.
          </h2>
          <p className="font-['Inter'] text-[#7A9A92] text-lg leading-relaxed max-w-[640px]">
            VDS Mobile Detailing is ERA Core's first tenant — a real, operating mobile detailing business in Metro Atlanta. Every screen below is the actual admin dashboard our platform produces, shown with representative data for privacy.
          </p>
        </div>

        <div className="space-y-10">
          <Reveal>
            <BrowserFrame url="app.eracore.com/admin/analytics">
              <AnalyticsCapture />
            </BrowserFrame>
            <p className="font-['JetBrains_Mono'] text-[11px] text-[#4A6359] mt-4">Representative view — Analytics · 12-month revenue trend, customer LTV, new vs. repeat</p>
          </Reveal>
          <Reveal delay={0.1}>
            <BrowserFrame url="app.eracore.com/admin?view=jobs">
              <JobsCapture />
            </BrowserFrame>
            <p className="font-['JetBrains_Mono'] text-[11px] text-[#4A6359] mt-4">Representative view — Jobs board · live scheduling, specialist assignment, status workflow</p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-16 md:mt-20">
          <div className="border-t border-[#10B981]/15 pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {FACTS.map((f, i) => (
                <motion.div
                  key={f.v}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <p className="font-['Fraunces'] font-semibold text-[#10B981] text-2xl md:text-3xl">{f.k}</p>
                  <p className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#4A6359] mt-1">{f.v.toUpperCase()}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}