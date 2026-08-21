import Reveal from './Reveal';

const STEPS = [
  {
    n: '01',
    title: 'Connect your domain',
    desc: 'Bring your own domain or use a temporary ERA subdomain. DNS, email sending, and business phone are self-serve from your dashboard.',
    capture: (
      <div className="bg-obsidian rounded-md p-3.5">
        <p className="font-mono-tech text-[9px] tracking-widest text-vapor/40 mb-2">CUSTOM DOMAIN</p>
        <div className="flex items-center gap-2 rounded-md border border-vapor/15 bg-[#08090A] px-2.5 py-2">
          <span className="font-mono-tech text-[11px] text-vapor/80">bobsdetail.com</span>
          <span className="ml-auto font-mono-tech text-[8px] tracking-widest text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">VERIFIED</span>
        </div>
        <p className="font-mono-tech text-[9px] text-vapor/40 mt-2">CNAME → eraleadgen.com · auto-provisioned</p>
      </div>
    ),
  },
  {
    n: '02',
    title: 'Configure services & pricing',
    desc: 'The onboarding wizard builds your service catalog, pricing groups, vehicle classifications, specialists, and scheduling rules — your business rules, not ours.',
    capture: (
      <div className="bg-obsidian rounded-md p-3.5 space-y-2">
        <p className="font-mono-tech text-[9px] tracking-widest text-vapor/40">SERVICE CATALOG</p>
        {[['Full Detail', '$185–$284'], ['Ceramic Coating', '$1,200+'], ['Paint Correction', '$450+']].map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border border-vapor/10 px-2.5 py-1.5">
            <span className="font-grotesk text-[11px] text-vapor">{r[0]}</span>
            <span className="font-mono-tech text-[10px] text-gold">{r[1]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    n: '03',
    title: 'Go live',
    desc: 'Your branded site, booking flow, AI concierge, and admin dashboard are live the moment the wizard finishes — typically under five minutes of your time.',
    capture: (
      <div className="bg-obsidian rounded-md p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="font-mono-tech text-[9px] tracking-widest text-green-400">LIVE</span>
        </div>
        <p className="font-grotesk text-vapor text-sm">bobsdetail.com is live</p>
        <p className="font-mono-tech text-[9px] text-vapor/40 mt-1">Booking · Concierge · Admin · Specialist portal</p>
        <div className="mt-2 h-1.5 rounded-full bg-gold/20 overflow-hidden">
          <div className="h-full bg-gold rounded-full" style={{ width: '100%' }} />
        </div>
      </div>
    ),
  },
];

export default function EraHowItWorks() {
  return (
    <section className="bg-white py-24 md:py-32 border-y border-[#DCE1E5]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-14">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#0B7C72] mb-5">HOW IT WORKS — 03</p>
          <h2 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.02em]">
            From checkout to live in under five minutes.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div>
                <div className="mb-4">{s.capture}</div>
                <p className="font-['JetBrains_Mono'] text-[11px] tracking-widest text-[#0B7C72] mb-2">{s.n}</p>
                <h3 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-xl mb-2">{s.title}</h3>
                <p className="font-['Inter'] text-[#5B6770] text-sm leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}