import Reveal from './Reveal';

const STEPS = [
  {
    n: '01',
    title: 'Select a plan & pay',
    desc: 'Choose Basic or Foundation and complete checkout. No waiting — your onboarding wizard unlocks immediately after payment.',
    capture: (
      <div className="bg-[#0C1614] border border-[#1A2A24] rounded-md p-3.5 space-y-2">
        <p className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#6B8A82] mb-1">SELECT YOUR PLAN</p>
        {[['Basic', '$199/mo', false], ['Foundation', '$499/mo', true]].map(([name, price, active]) => (
          <div key={name} className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${active ? 'border-[#10B981]/60 bg-[#10B981]/10' : 'border-[#1A2A24]'}`}>
            <span className={`font-['Inter'] text-[11px] ${active ? 'text-[#DFEDE9]' : 'text-[#6B8A82]'}`}>{name}</span>
            <span className={`font-['JetBrains_Mono'] text-[10px] ${active ? 'text-[#10B981]' : 'text-[#4A6359]'}`}>{price}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    n: '02',
    title: 'Fill out the onboarding wizard',
    desc: 'A guided questionnaire collects your business identity, branding, service catalog, pricing, hours, and team. Progress is saved — pause and resume any time.',
    capture: (
      <div className="bg-[#0C1614] border border-[#1A2A24] rounded-md p-3.5 space-y-2">
        <p className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#6B8A82]">SERVICE CATALOG</p>
        {[['Full Detail', '$185–$284'], ['Ceramic Coating', '$1,200+'], ['Paint Correction', '$450+']].map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border border-[#1A2A24] px-2.5 py-1.5">
            <span className="font-['Inter'] text-[11px] text-[#DFEDE9]">{r[0]}</span>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#10B981]">{r[1]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    n: '03',
    title: 'ERA provisions and you go live',
    desc: 'Your branded site, booking flow, AI concierge, and admin dashboard go live automatically once the wizard finishes. ERA Systems handles domain, email, and phone provisioning — you never wait on a developer.',
    capture: (
      <div className="bg-[#0C1614] border border-[#1A2A24] rounded-md p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#10B981]">LIVE</span>
        </div>
        <p className="font-['Inter'] text-[#DFEDE9] text-sm">bobsdetail.com is live</p>
        <p className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359] mt-1">Booking · Concierge · Admin · Specialist portal</p>
        <div className="mt-2 h-1.5 rounded-full bg-[#10B981]/20 overflow-hidden">
          <div className="h-full bg-[#10B981] rounded-full" style={{ width: '100%' }} />
        </div>
      </div>
    ),
  },
];

export default function EraHowItWorks() {
  return (
    <section className="bg-[#08110E] py-24 md:py-32 border-y border-[#10B981]/8">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-14">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981] mb-5">HOW IT WORKS — 03</p>
          <h2 className="font-['Fraunces'] font-semibold text-[#DFEDE9] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.02em]">
            From checkout to live in under five minutes.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div>
                <div className="mb-4 transition-transform duration-300 hover:scale-[1.03]">{s.capture}</div>
                <p className="font-['JetBrains_Mono'] text-[11px] tracking-widest text-[#10B981] mb-2">{s.n}</p>
                <h3 className="font-['Fraunces'] font-semibold text-[#DFEDE9] text-xl mb-2">{s.title}</h3>
                <p className="font-['Inter'] text-[#7A9A92] text-sm leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}