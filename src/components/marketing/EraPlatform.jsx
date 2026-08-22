import { motion } from 'framer-motion';
import Reveal from './Reveal';

const card = 'bg-[#0C1614] border border-[#1A2A24] rounded-md';

function ValerieFragment() {
  return (
    <div className={`${card} p-3 space-y-2`}>
      <div className="max-w-[80%]">
        <div className="bg-[#060A09] border border-[#1A2A24] rounded-md rounded-tl-sm px-2.5 py-1.5 text-[11px] text-[#7A9A92] font-['Inter']">Can I get my car detailed Saturday?</div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="bg-[#10B981] text-[#060A09] rounded-md rounded-tr-sm px-2.5 py-1.5 text-[11px] font-['Inter'] font-medium">Saturday 10am works — Marcus is available. Want me to book it?</div>
        </div>
      </div>
      <div className="max-w-[55%]">
        <div className="bg-[#060A09] border border-[#1A2A24] rounded-md rounded-tl-sm px-2.5 py-1.5 text-[11px] text-[#7A9A92] font-['Inter']">Yes please</div>
      </div>
      <p className="font-['JetBrains_Mono'] text-[9px] text-[#10B981]/60 pt-1">BOOKED · JOB VDS-2026-0143</p>
    </div>
  );
}

function CrmFragment() {
  const steps = [['Quote requested', 'Mar 02'], ['Appointment booked', 'Mar 03'], ['Detail completed', 'Mar 05'], ['Review submitted', 'Mar 06'], ['Membership started', 'Apr 01']];
  return (
    <div className={`${card} p-3`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center font-['JetBrains_Mono'] text-[10px] text-[#10B981]">DR</div>
        <div>
          <p className="font-['Inter'] text-[#DFEDE9] text-xs">Daniel R.</p>
          <p className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359]">LTV $3,260 · 4 jobs</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {steps.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#7A9A92]">{e[0]}</span>
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359] ml-auto">{e[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedFragment() {
  return (
    <div className={`${card} p-3`}>
      <p className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#6B8A82] mb-2">SAT · AUG 23</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-[#1A2A24] px-2 py-1.5">
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#6B8A82] w-10">09:00</span>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#4A6359]">— open —</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[#10B981]/40 bg-[#10B981]/10 px-2 py-1.5">
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#10B981] w-10">10:00</span>
          <span className="font-['Inter'] text-[10px] text-[#DFEDE9]">Marcus · Ceramic Coating</span>
          <span className="ml-auto font-['JetBrains_Mono'] text-[8px] text-[#10B981] tracking-widest">AUTO</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[#1A2A24] px-2 py-1.5">
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#6B8A82] w-10">13:30</span>
          <span className="font-['Inter'] text-[10px] text-[#7A9A92]">Diana · Full Detail</span>
        </div>
      </div>
    </div>
  );
}

function InvFragment() {
  return (
    <div className={`${card} p-3 space-y-2.5`}>
      <div className="flex items-center justify-between">
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#6B8A82]">INV-2026-0141</span>
        <span className="font-['JetBrains_Mono'] text-[8px] tracking-widest text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded">PAID · STRIPE</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-['Inter'] text-[#DFEDE9] text-xs">Full Detail · Tesla Model S</span>
        <span className="font-['Inter'] font-bold text-[#10B981] text-sm">$284</span>
      </div>
      <div className="h-px bg-[#1A2A24]" />
      <div className="flex items-center justify-between">
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#6B8A82]">Gold Membership · Monthly</span>
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#10B981]">$250 · recurring</span>
      </div>
    </div>
  );
}

function PartnerFragment() {
  return (
    <div className={`${card} p-3`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center font-['JetBrains_Mono'] text-[10px] text-[#10B981]">JR</div>
        <div>
          <p className="font-['Inter'] text-[#DFEDE9] text-xs">Jeremy R.</p>
          <p className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359]">Porsche Alpharetta</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><p className="font-['Inter'] font-bold text-[#10B981] text-base">12</p><p className="font-['JetBrains_Mono'] text-[8px] text-[#4A6359] tracking-widest">REFERRALS</p></div>
        <div><p className="font-['Inter'] font-bold text-[#10B981] text-base">9</p><p className="font-['JetBrains_Mono'] text-[8px] text-[#4A6359] tracking-widest">CONVERTED</p></div>
        <div><p className="font-['Inter'] font-bold text-[#10B981] text-base">$1.4k</p><p className="font-['JetBrains_Mono'] text-[8px] text-[#4A6359] tracking-widest">EARNED</p></div>
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
    <div className={`${card} p-3 space-y-2`}>
      <p className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#10B981]/70">AUTOMATED COMMUNICATIONS</p>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`w-7 h-3.5 rounded-full relative ${r[2] ? 'bg-[#10B981]/80' : 'bg-[#1A2A24]'}`}>
            <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-[#060A09] ${r[2] ? 'left-3.5' : 'left-0.5'}`} />
          </span>
          <span className="font-['Inter'] text-[10px] text-[#7A9A92] flex-1">{r[0]}</span>
          <span className="font-['JetBrains_Mono'] text-[8px] text-[#4A6359]">{r[1]}</span>
        </div>
      ))}
    </div>
  );
}

const MODULES = [
  { label: 'YOUR 24/7 FRONT DESK', title: 'Never miss a booking', desc: 'An AI concierge answers calls, texts, and chats around the clock — quoting, scheduling, and capturing every lead while you sleep.', Fragment: ValerieFragment },
  { label: 'EVERY CUSTOMER, REMEMBERED', title: 'One customer. The whole story.', desc: 'Lifetime value, preferences, and history — automatically tracked from first quote to latest review. Your customers feel known every time.', Fragment: CrmFragment },
  { label: 'THE RIGHT PERSON, EVERY TIME', title: 'Dispatch without the phone calls', desc: 'Specialist availability, service areas, and skills — matched to each job automatically. No dispatch desk, no double-booking.', Fragment: SchedFragment },
  { label: 'GET PAID WITHOUT THE CHASE', title: 'Money in your account faster', desc: 'Per-job invoicing, recurring memberships, and Stripe-native payments with automated follow-up. Stop chasing, start collecting.', Fragment: InvFragment },
  { label: 'TURN RELATIONSHIPS INTO REVENUE', title: 'Partners send you customers', desc: 'Referral codes, automatic attribution, and incentive payouts — every partner credited, every customer tracked, every time.', Fragment: PartnerFragment },
  { label: 'YOUR RULES, AUTOMATICALLY', title: 'Every message, on your terms', desc: 'SMS, email, and chat — consent, cadence, and channel fallback, all set once and handled automatically. No more manual follow-up.', Fragment: RulesFragment },
];

export default function EraPlatform() {
  return (
    <section id="platform" className="bg-[#060A09] py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
      <div className="relative max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-14">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981] mb-5">WHAT ERA DOES</p>
          <h2 className="font-['Sora'] font-bold text-[#DFEDE9] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.03em] mb-5">
            Six things your business used to need people for — now running themselves.
          </h2>
          <p className="font-['Inter'] text-[#7A9A92] text-lg leading-relaxed">
            Every part of your operation — from the first call to the final payment — handled automatically. Not a collection of tools. One system that works together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m, i) => {
            const F = m.Fragment;
            return (
              <Reveal key={m.label} delay={(i % 3) * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#0C1614] rounded-[10px] ring-1 ring-[#1A2A24] overflow-hidden h-full transition-all duration-300 hover:ring-[#10B981]/50 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.35),0_18px_50px_-20px_rgba(16,185,129,0.3)]"
                >
                  <div className="p-4"><F /></div>
                  <div className="px-5 pb-5">
                    <p className="font-['JetBrains_Mono'] text-[10px] tracking-[0.2em] text-[#10B981] mb-2">{m.label}</p>
                    <h3 className="font-['Sora'] font-bold text-[#DFEDE9] text-lg leading-snug mb-1.5">{m.title}</h3>
                    <p className="font-['Inter'] text-[#7A9A92] text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}