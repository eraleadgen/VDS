import { ArrowRight } from 'lucide-react';
import BrowserFrame from './BrowserFrame';
import OverviewCapture from './OverviewCapture';
import Reveal from './Reveal';

export default function EraHero() {
  return (
    <section className="relative pt-32 pb-20 bg-[#F6F8F8] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(11,124,114,0.10) 0%, transparent 60%)' }} />
      <div className="relative max-w-[1200px] mx-auto px-6">
        <div className="max-w-[820px]">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#0B7C72] mb-5">THE OPERATING SYSTEM FOR SERVICE BUSINESSES</p>
          <h1 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-[40px] sm:text-[52px] md:text-[68px] leading-[1.02] tracking-[-0.02em] mb-6">
            Run your service business on software that already runs one.
          </h1>
          <p className="font-['Inter'] text-[#5B6770] text-lg md:text-xl leading-relaxed max-w-[640px] mb-9">
            ERA Core is a modular, event-driven platform — booking, AI concierge, CRM, scheduling, specialists, invoicing, and analytics — running a real mobile detailing business in Atlanta today. Not a mockup. A working product.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#proof" className="inline-flex items-center gap-2 bg-[#0B7C72] text-white font-['Inter'] text-sm font-medium px-5 py-3 rounded-[6px] hover:bg-[#0A6B62] transition-colors">See it running <ArrowRight size={15} /></a>
            <a href="#platform" className="inline-flex items-center gap-2 font-['Inter'] text-sm font-medium text-[#0C1B1A] px-5 py-3 rounded-[6px] border border-[#DCE1E5] hover:border-[#0B7C72] hover:text-[#0B7C72] transition-colors">How it works</a>
          </div>
        </div>

        <Reveal delay={0.15} className="mt-14 md:mt-20">
          <BrowserFrame url="app.eracore.com/admin">
            <OverviewCapture />
          </BrowserFrame>
          <p className="font-['JetBrains_Mono'] text-[11px] text-[#8A9499] mt-4 text-center">Representative view — VDS Mobile Detailing dashboard · ERA Core tenant #1</p>
        </Reveal>
      </div>
    </section>
  );
}