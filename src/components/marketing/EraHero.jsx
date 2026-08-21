import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import BrowserFrame from './BrowserFrame';
import OverviewCapture from './OverviewCapture';
import Reveal from './Reveal';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function EraHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* The living background (EraLivingBackground in EraHome) shows through the
          transparent section background. */}

      <div className="relative max-w-[1200px] mx-auto px-6">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-[820px]">
          <motion.p variants={item} className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981] mb-5">THE OPERATING SYSTEM FOR SERVICE BUSINESSES</motion.p>
          <motion.h1 variants={item} className="font-['Fraunces'] font-semibold text-[#DFEDE9] text-[40px] sm:text-[52px] md:text-[68px] leading-[1.02] tracking-[-0.02em] mb-6">
            Run your service business on software that already runs one.
          </motion.h1>
          <motion.p variants={item} className="font-['Inter'] text-[#7A9A92] text-lg md:text-xl leading-relaxed max-w-[640px] mb-9">
            ERA Core is a modular, event-driven platform — booking, AI concierge, CRM, scheduling, specialists, invoicing, and analytics — running a real mobile detailing business in Atlanta today. Not a mockup. A working product.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <a href="#proof" className="inline-flex items-center gap-2 bg-[#10B981] text-[#060A09] font-['Inter'] text-sm font-semibold px-5 py-3 rounded-[6px] hover:bg-[#34D399] transition-all duration-200 shadow-[0_0_24px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_0_32px_-6px_rgba(52,211,153,0.7)]">See it running <ArrowRight size={15} /></a>
            <a href="#platform" className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium text-[#DFEDE9] px-5 py-3 rounded-[6px] border border-[#1A2A24] hover:border-[#10B981]/40 hover:text-[#34D399] transition-colors">How it works</a>
          </motion.div>
        </motion.div>

        <Reveal delay={0.3} className="mt-14 md:mt-20">
          <BrowserFrame url="app.eracore.com/admin">
            <OverviewCapture />
          </BrowserFrame>
          <p className="font-['JetBrains_Mono'] text-[11px] text-[#4A6359] mt-4 text-center">Representative view — VDS Mobile Detailing dashboard · ERA Core tenant #1</p>
        </Reveal>
      </div>
    </section>
  );
}