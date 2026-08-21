import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import EraLogo from './EraLogo';
import Reveal from './Reveal';

export default function EraCta() {
  return (
    <section className="bg-[#F6F8F8] py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <Reveal>
          <div className="relative rounded-[16px] bg-[#06231F] overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 0%, rgba(20,184,166,0.18) 0%, transparent 60%)' }} />
            <div className="relative">
              <div className="flex justify-center mb-6"><EraLogo size={40} /></div>
              <h2 className="font-['Fraunces'] font-semibold text-white text-[34px] md:text-[52px] leading-[1.05] tracking-[-0.02em] mb-5">
                Start your business on ERA Core.
              </h2>
              <p className="font-['Inter'] text-[#A6B8B4] text-lg max-w-[560px] mx-auto mb-9 leading-relaxed">
                A fully live, working website and booking system in minutes — no developer required. The same platform that runs VDS Mobile Detailing today.
              </p>
              <Link to="/era-register" className="inline-flex items-center gap-2 bg-white text-[#06231F] font-['Inter'] text-sm font-semibold px-6 py-3.5 rounded-[6px] hover:bg-[#14B8A6] hover:text-white transition-colors">
                Get started <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}