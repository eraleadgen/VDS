import { motion } from 'framer-motion';
import Reveal from './Reveal';

const INDUSTRIES = [
  { name: 'Mobile Detailing', status: 'Live', live: true },
  { name: 'Ceramic Coating', status: 'Live', live: true },
  { name: 'Paint Correction', status: 'Live', live: true },
  { name: 'Roofing', status: 'Roadmap', live: false },
  { name: 'HVAC', status: 'Roadmap', live: false },
  { name: 'Plumbing', status: 'Roadmap', live: false },
];

export default function EraWhoFor() {
  return (
    <section id="customers" className="bg-[#060A09] py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-10" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
            <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981]">WHO ERA SERVES</p>
          </div>
          <h2 className="font-['Sora'] font-bold text-[#DFEDE9] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.03em] mb-5">
            Any service business that books jobs and gets paid.
          </h2>
          <p className="font-['Inter'] text-[#7A9A92] text-lg leading-relaxed max-w-[640px]">
            Today ERA is running mobile detailing operations end-to-end. The same engine is built to scale across any service business: roofing, HVAC, plumbing, and beyond.
          </p>
        </div>
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {INDUSTRIES.map((ind, i) => (
              <motion.div
                key={ind.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                whileHover={{ y: -3 }}
                className={`bg-[#0C1614] rounded-[10px] ring-1 p-4 text-center transition-all duration-300 ${ind.live ? 'ring-[#10B981]/20 hover:ring-[#D4AF37]/40 hover:shadow-[0_0_24px_-6px_rgba(212,175,55,0.2)]' : 'ring-[#1A2A24]'}`}
              >
                <p className="font-['Sora'] font-bold text-[#DFEDE9] text-base">{ind.name}</p>
                <p className={`font-['JetBrains_Mono'] text-[9px] tracking-widest mt-2 ${ind.live ? 'text-[#10B981]' : 'text-[#4A6359]'}`}>{ind.status.toUpperCase()}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}