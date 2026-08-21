import Reveal from './Reveal';

// Each module is shown as a REAL UI fragment — not a lucide icon in a rounded
// square. The fragments use the actual dark product theme so the "real product"
// thread continues into the platform section.
function ValerieFragment() {
  return (
    <div className="bg-obsidian rounded-md p-3 space-y-2">
      <div className="max-w-[80%]">
        <div className="bg-vapor/10 border border-vapor/15 rounded-md rounded-tl-sm px-2.5 py-1.5 text-[11px] text-vapor/80 font-grotesk">Can I get my car detailed Saturday?</div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="bg-gold/90 text-obsidian rounded-md rounded-tr-sm px-2.5 py-1.5 text-[11px] font-grotesk font-medium">Saturday 10am works — Marcus is available. Want me to book it?</div>
        </div>
      </div>
      <div className="max-w-[55%]">
        <div className="bg-vapor/10 border border-vapor/15 rounded-md rounded-tl-sm px-2.5 py-1.5 text-[11px] text-vapor/80 font-grotesk">Yes please</div>
      </div>
      <p className="font-mono-tech text-[9px] text-gold/50 pt-1">VALERIE · BOOKED · JOB VDS-2026-0143</p>
    </div>
  );
}

function CrmFragment() {
  const steps = [['Quote requested', 'Mar 02'], ['Appointment booked', 'Mar 03'], ['Detail completed', 'Mar 05'], ['Review submitted', 'Mar 06'], ['Membership started', 'Apr 01']];
  return (
    <div className="bg-obsidian rounded-md p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center font-mono-tech text-[10px] text-gold">DR</div>
        <div>
          <p className="font-grotesk text-vapor text-xs">Daniel R.</p>
          <p className="font-mono-tech text-[9px] text-vapor/40">LTV $3,260 · 4 jobs</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {steps.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="font-mono-tech text-[9px] text-vapor/60">{e[0]}</span>
            <span className="font-mono-tech text-[9px] text-vapor/30 ml-auto">{e[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedFragment() {
  return (
    <div className="bg-obsidian rounded-md p-3">
      <p className="font-mono-tech text-[9px] tracking-widest text-vapor/40 mb-2">SAT · AUG 23</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-vapor/10 px-2 py-1.5">
          <span className="font-mono-tech text-[10px] text-vapor/50 w-10">09:00</span>
          <span className="font-mono-tech text-[10px] text-vapor/30">— open —</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-2 py-1.5">
          <span className="font-mono-tech text-[10px] text-gold w-10">10:00</span>
          <span className="font-grotesk text-[10px] text-vapor">Marcus · Ceramic Coating</span>
          <span className="ml-auto font-mono-tech text-[8px] text-gold tracking-widest">AUTO</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-vapor/10 px-2 py-1.5">
          <span className="font-mono-tech text-[10px] text-vapor/50 w-10">13:30</span>
          <span className="font-grotesk text-[10px] text-vapor/70">Diana · Full Detail</span>
        </div>
      </div>
    </div>
  );
}

function InvFragment() {
  return (
    <div className="bg-obsidian rounded-md p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono-tech text-[10px] text-vapor/50">INV-2026-0141</span>
        <span className="font-mono-tech text-[8px] tracking-widest text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">PAID · STRIPE</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-grotesk text-vapor text-xs">Full Detail · Tesla Model S</span>
        <span className="font-grotesk font-bold text-gold text-sm">$284</span>
      </div>
      <div className="h-px bg-vapor/10" />
      <div className="flex items-center justify-between">
        <span className="font-mono-tech text-[10px] text-vapor/50">VDS Gold · Monthly</span>
        <span className="font-mono-tech text-[10px] text-green-400">$250 · recurring</span>
      </div>
    </div>
  );
}

function PartnerFragment() {
  return (
    <div className="bg-obsidian rounded-md p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-md bg-gold/15 border border-gold/30 flex items-center justify-center font-mono-tech text-[10px] text-gold">JR</div>
        <div>
          <p className="font-grotesk text-vapor text-xs">Jeremy R.</p>
          <p className="font-mono-tech text-[9px] text-vapor/40">Porsche Alpharetta</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><p className="font-grotesk font-bold text-gold text-base">12</p><p className="font-mono-tech text-[8px] text-vapor/40 tracking-widest">REFERRALS</p></div>
        <div><p className="font-grotesk font-bold text-gold text-base">9</p><p className="font-mono-tech text-[8px] text-vapor/40 tracking-widest">CONVERTED</p></div>
        <div><p className="font-grotesk font-bold text-gold text-base">$1.4k</p><p className="font-mono-tech text-[8px] text-vapor/40 tracking-widest">EARNED</p></div>
      </div>
    </div>
  );
}

function RulesFragment() {
  const rows = [
    ['Booking confirmation', 'SMS + Email', true],
    ['24h reminder', 'Email', true],
    ['1h reminder', 'SMS → Email', true],
    ['Review request', 'SMS → Email', true],
    ['Promotions', 'SMS', false],
  ];
  return (
    <div className="bg-obsidian rounded-md p-3 space-y-2">
      <p className="font-mono-tech text-[9px] tracking-widest text-gold/70">COMMUNICATIONS RULES</p>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`w-7 h-3.5 rounded-full relative ${r[2] ? 'bg-gold/80' : 'bg-vapor/20'}`}>
            <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-obsidian ${r[2] ? 'left-3.5' : 'left-0.5'}`} />
          </span>
          <span className="font-grotesk text-[10px] text-vapor/80 flex-1">{r[0]}</span>
          <span className="font-mono-tech text-[8px] text-vapor/40">{r[1]}</span>
        </div>
      ))}
    </div>
  );
}

const MODULES = [
  { label: 'AI CONCIERGE — VALERIE', title: 'A 24/7 concierge that books real jobs', desc: 'SMS, web chat, and voice. Valerie quotes, schedules, and captures consent — by the rules you configure.', Fragment: ValerieFragment },
  { label: 'CRM + CUSTOMER JOURNEY', title: 'One customer record. The whole story.', desc: 'Lifetime value, consent, and an auto-generated journey timeline — from first quote to the latest review.', Fragment: CrmFragment },
  { label: 'SCHEDULING + AUTO-ASSIGN', title: 'The right specialist, automatically', desc: 'Specialist availability, service areas, and skills — matched to each job without the dispatch phone calls.', Fragment: SchedFragment },
  { label: 'INVOICING + STRIPE', title: 'Get paid without the chase', desc: 'Per-job invoicing, recurring memberships, and Stripe-native payments with automated follow-up.', Fragment: InvFragment },
  { label: 'PARTNER / REFERRAL ENGINE', title: 'Turn dealerships into a growth channel', desc: 'Referral codes, attribution, and incentive payouts — every partner credited automatically, every time.', Fragment: PartnerFragment },
  { label: 'COMMUNICATIONS RULES ENGINE', title: 'No message goes out without your rules', desc: 'Centralized control over SMS, email, and chat — consent, cadence, and channel fallback, all configurable.', Fragment: RulesFragment },
];

export default function EraPlatform() {
  return (
    <section id="platform" className="bg-[#F6F8F8] py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-14">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#0B7C72] mb-5">PLATFORM — 02</p>
          <h2 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.02em] mb-5">
            One system. Every moving part of a service business.
          </h2>
          <p className="font-['Inter'] text-[#5B6770] text-lg leading-relaxed">
            ERA Core is modular by design — each module is independent, but they share one job, one customer, and one source of truth. That's what makes the whole thing actually work end-to-end.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m, i) => {
            const F = m.Fragment;
            return (
              <Reveal key={m.label} delay={(i % 3) * 0.08}>
                <div className="bg-white rounded-[10px] ring-1 ring-[#DCE1E5] overflow-hidden h-full hover:ring-[#0B7C72]/40 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(11,124,114,0.4)]">
                  <div className="p-4"><F /></div>
                  <div className="px-5 pb-5">
                    <p className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-[#0B7C72] mb-2">{m.label}</p>
                    <h3 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-lg leading-snug mb-1.5">{m.title}</h3>
                    <p className="font-['Inter'] text-[#5B6770] text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}