import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import BrowserFrame from './BrowserFrame';
import Reveal from './Reveal';

const CUSTOMER_SITE_IMG =
  'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/b2f42e978_image.png';

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
      <div className="relative max-w-[1200px] mx-auto px-6">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-[820px]">
          <motion.p variants={item} className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981] mb-5">BRINGING SERVICE BUSINESSES TO A NEW ERA OF EFFICIENCY</motion.p>
          <motion.h1 variants={item} className="font-['Sora'] font-bold text-[#DFEDE9] text-[40px] sm:text-[52px] md:text-[68px] leading-[1.02] tracking-[-0.03em] mb-6">
            More bookings. Less overhead. A business that runs itself.
          </motion.h1>
          <motion.p variants={item} className="font-['Inter'] text-[#7A9A92] text-lg md:text-xl leading-relaxed max-w-[640px] mb-9">
            ERA Systems gives your service business a complete platform — website, booking, customer management, automated communication, and payments — working from day one. No developers. No spreadsheets. No missed calls.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap items-center gap-3">
            <Link to="/era-results" className="inline-flex items-center gap-2 bg-[#10B981] text-[#060A09] font-['Inter'] text-sm font-semibold px-5 py-3 rounded-[6px] hover:bg-[#34D399] transition-all duration-200 shadow-[0_0_24px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_0_32px_-6px_rgba(52,211,153,0.7)]">See the results <ArrowRight size={15} /></Link>
            <Link to="/era-pricing" className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium text-[#DFEDE9] px-5 py-3 rounded-[6px] border border-[#1A2A24] hover:border-[#10B981]/40 hover:text-[#34D399] transition-colors">View pricing</Link>
          </motion.div>
        </motion.div>

        <Reveal delay={0.3} className="mt-14 md:mt-20">
          <BrowserFrame url="vdsmobile.com">
            <img
              src={CUSTOMER_SITE_IMG}
              alt="VDS Mobile Detailing customer-facing website — homepage hero with booking"
              className="block w-full aspect-[16/10] object-cover"
              loading="lazy"
            />
          </BrowserFrame>
          <p className="font-['JetBrains_Mono'] text-[11px] text-[#4A6359] mt-4 text-center">VDS Mobile Detailing · Customer-facing website · ERA Systems client #1</p>
        </Reveal>
      </div>
    </section>
  );
}