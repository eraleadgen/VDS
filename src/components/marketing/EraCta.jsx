import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import EraLogo from './EraLogo';
import Reveal from './Reveal';

export default function EraCta() {
  return (
    <section className="bg-[#060A09] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="max-w-[1200px] mx-auto px-6 relative">
        <Reveal>
          <div className="relative rounded-[16px] bg-[#08110E] overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center ring-1 ring-[#10B981]/15">
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(16,185,129,0.18) 0%, transparent 60%)' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative">
              <div className="flex justify-center mb-6"><EraLogo size={40} /></div>
              <h2 className="font-['Fraunces'] font-semibold text-[#DFEDE9] text-[34px] md:text-[52px] leading-[1.05] tracking-[-0.02em] mb-5">
                Start your business on ERA Core.
              </h2>
              <p className="font-['Inter'] text-[#7A9A92] text-lg max-w-[560px] mx-auto mb-9 leading-relaxed">
                A fully live, working website and booking system in minutes — no developer required. The same platform that runs VDS Mobile Detailing today.
              </p>
              <Link to="/era-register" className="inline-flex items-center gap-2 bg-[#10B981] text-[#060A09] font-['Inter'] text-sm font-semibold px-6 py-3.5 rounded-[6px] hover:bg-[#34D399] transition-all duration-200 shadow-[0_0_28px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_0_36px_-6px_rgba(52,211,153,0.7)]">
                Get started <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}