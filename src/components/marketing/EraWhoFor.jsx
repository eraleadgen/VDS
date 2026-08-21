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
    <section id="customers" className="bg-[#F6F8F8] py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-12">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#0B7C72] mb-5">CUSTOMERS — 04</p>
          <h2 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.02em] mb-5">
            Built for mobile detailing today. Engineered for every service business tomorrow.
          </h2>
          <p className="font-['Inter'] text-[#5B6770] text-lg leading-relaxed max-w-[640px]">
            ERA Core's dictionary, pricing groups, and workflows are configurable — not hardcoded to one industry. Detailing is live and proven; the same engine is built to scale across service businesses.
          </p>
        </div>
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {INDUSTRIES.map((ind) => (
              <div key={ind.name} className="bg-white rounded-[10px] ring-1 ring-[#DCE1E5] p-4 text-center">
                <p className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-base">{ind.name}</p>
                <p className={`font-['JetBrains_Mono'] text-[9px] tracking-widest mt-2 ${ind.live ? 'text-[#0B7C72]' : 'text-[#8A9499]'}`}>{ind.status.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}