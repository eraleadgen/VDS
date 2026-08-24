import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import EraLogo from './EraLogo';
import Reveal from './Reveal';

export default function EraCta() {
  return (
    <section className="bg-[#060A09] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />
      <div className="max-w-[1200px] mx-auto px-6 relative">
        <Reveal>
          <div className="relative rounded-[16px] bg-[#08110E] overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center ring-1 ring-[#D4AF37]/20 shadow-[0_0_50px_-12px_rgba(212,175,55,0.15)]">
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(16,185,129,0.18) 0%, transparent 60%)' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative">
              <div className="flex justify-center mb-6"><EraLogo size={40} /></div>
              <h2 className="font-['Sora'] font-bold text-[#DFEDE9] text-[34px] md:text-[52px] leading-[1.05] tracking-[-0.03em] mb-5">
                Bringing service businesses to a new ERA of efficiency.
              </h2>
              <p className="font-['Inter'] text-[#7A9A92] text-lg max-w-[560px] mx-auto mb-9 leading-relaxed">
                A complete, working business platform, live in minutes. No developer, no spreadsheets, no missed calls.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link to="/era-register" className="inline-flex items-center gap-2 bg-[#10B981] text-[#060A09] font-['Inter'] text-sm font-semibold px-6 py-3.5 rounded-[6px] hover:bg-[#34D399] transition-all duration-200 shadow-[0_0_28px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_0_36px_-6px_rgba(52,211,153,0.7)]">
                  Get started <ArrowRight size={15} />
                </Link>
                <Link to="/era-demo" className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium text-[#DFEDE9] px-6 py-3.5 rounded-[6px] border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors">
                  <Play size={14} className="text-[#10B981]" fill="currentColor" /> See it in action
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}