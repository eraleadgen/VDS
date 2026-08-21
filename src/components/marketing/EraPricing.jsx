import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Reveal from './Reveal';

const PLANS = [
  { key: 'basic', name: 'Basic', tagline: 'Everything you need to launch.', monthly: 199, setup: 750, popular: false, available: true },
  { key: 'foundation', name: 'Foundation', tagline: 'Advanced tools to grow and scale.', monthly: 499, setup: 1200, popular: true, available: true },
  { key: 'growth', name: 'Growth', tagline: 'AI-powered customer engagement.', monthly: null, setup: null, popular: false, available: false },
  { key: 'enterprise', name: 'Enterprise', tagline: 'Full platform, unlimited scale.', monthly: null, setup: null, popular: false, available: false },
];

const FEATURES = [
  { label: 'Branded website & AI chat widget', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Core engines (communication, workflow, CRM)', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Booking & scheduling', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Payments', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Admin dashboard', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Self-serve domain, email & phone', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Customer member portal', basic: false, foundation: true, growth: true, enterprise: true },
  { label: 'Specialist / employee portal', basic: false, foundation: true, growth: true, enterprise: true },
  { label: 'Simple automations (reminders, welcome)', basic: false, foundation: true, growth: true, enterprise: true },
  { label: 'AI SMS agent', basic: false, foundation: false, growth: true, enterprise: true },
  { label: 'AI voice agent', basic: false, foundation: false, growth: true, enterprise: true },
  { label: 'Partner / referral engine', basic: false, foundation: false, growth: false, enterprise: true },
  { label: 'Advanced analytics & reporting', basic: false, foundation: false, growth: false, enterprise: true },
  { label: 'Ad Management', basic: 'add-on', foundation: 'add-on', growth: 'add-on', enterprise: 'included' },
];

const TIERS = ['basic', 'foundation', 'growth', 'enterprise'];

function Cell({ v }) {
  if (v === true) return <Check size={15} className="text-[#0B7C72] mx-auto" />;
  if (v === 'add-on') return <span className="font-['JetBrains_Mono'] text-[9px] text-[#8A9499] tracking-widest">ADD-ON</span>;
  if (v === 'included') return <span className="font-['JetBrains_Mono'] text-[9px] text-[#0B7C72] tracking-widest">INCLUDED</span>;
  return <span className="text-[#C9CFD3]">—</span>;
}

export default function EraPricing() {
  return (
    <section id="pricing" className="bg-white py-24 md:py-32 border-t border-[#DCE1E5]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-14">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#0B7C72] mb-5">PRICING — 05</p>
          <h2 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.02em] mb-5">
            One-time setup. Flat monthly. No per-seat surprises.
          </h2>
          <p className="font-['Inter'] text-[#5B6770] text-lg leading-relaxed">
            Start with a setup fee, then a flat monthly rate. Growth and Enterprise are coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PLANS.map((p) => (
            <Reveal key={p.key}>
              <div className={`relative rounded-[10px] p-6 flex flex-col h-full transition-all ${p.popular ? 'ring-2 ring-[#0B7C72] bg-[#0B7C72]/[0.03]' : p.available ? 'ring-1 ring-[#DCE1E5]' : 'ring-1 ring-[#DCE1E5] opacity-55'}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0B7C72] text-white text-[10px] font-['JetBrains_Mono'] tracking-widest px-3 py-1 rounded-full">MOST POPULAR</span>}
                {!p.available && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-[#DCE1E5] text-[#8A9499] text-[10px] font-['JetBrains_Mono'] tracking-widest px-3 py-1 rounded-full">COMING SOON</span>}
                <h3 className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-xl mb-1.5">{p.name}</h3>
                <p className="font-['Inter'] text-[#5B6770] text-sm mb-5 min-h-[2.5rem]">{p.tagline}</p>
                <div className="mb-6">
                  {p.monthly !== null ? (
                    <>
                      <span className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-4xl">${p.monthly}</span>
                      <span className="font-['Inter'] text-[#8A9499] text-sm">/month</span>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#8A9499] mt-2">+ ${p.setup} one-time setup</p>
                    </>
                  ) : (
                    <span className="font-['Fraunces'] font-semibold text-[#8A9499] text-3xl">TBD</span>
                  )}
                </div>
                {p.available ? (
                  <Link to="/era-register" className={`mt-auto text-center font-['Inter'] text-sm font-medium py-2.5 rounded-[6px] transition-colors ${p.popular ? 'bg-[#0B7C72] text-white hover:bg-[#0A6B62]' : 'border border-[#0B7C72] text-[#0B7C72] hover:bg-[#0B7C72] hover:text-white'}`}>Get started</Link>
                ) : (
                  <div className="mt-auto text-center font-['JetBrains_Mono'] text-[11px] tracking-widest text-[#8A9499] border border-[#DCE1E5] py-2.5 rounded-[6px]">COMING SOON</div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="rounded-[10px] ring-1 ring-[#DCE1E5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-[#DCE1E5] bg-[#F6F8F8]">
                    <th className="text-left p-4 font-['Inter'] font-semibold text-[#0C1B1A] text-sm">Feature</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#0C1B1A] text-sm w-20">Basic</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#0B7C72] text-sm w-20">Foundation</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#0C1B1A] text-sm w-20">Growth</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#0C1B1A] text-sm w-20">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((row, i) => (
                    <tr key={i} className="border-b border-[#EDF0F1] last:border-0">
                      <td className="p-4 font-['Inter'] text-sm text-[#0C1B1A]">{row.label}</td>
                      {TIERS.map((t) => (
                        <td key={t} className="p-4 text-center"><Cell v={row[t]} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}