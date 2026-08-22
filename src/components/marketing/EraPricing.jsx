import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Reveal from './Reveal';

const PLANS = [
  { key: 'basic', name: 'Basic', tagline: 'Everything you need to launch.', monthly: 199, setup: 750, popular: false, available: true },
  { key: 'foundation', name: 'Foundation', tagline: 'Advanced tools to grow and scale.', monthly: 499, setup: 1200, popular: true, available: true },
  { key: 'growth', name: 'Growth', tagline: 'AI agents that answer calls and texts 24/7.', monthly: 899, setup: 1600, popular: false, available: false },
  { key: 'enterprise', name: 'Enterprise', tagline: 'Full platform, partners, analytics, and ads.', monthly: 1499, setup: 2200, popular: false, available: false },
];

const FEATURES = [
  { label: 'Custom-built website & UI', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'AI chat widget (24/7 quotes & FAQs)', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Core engines: pricing, scheduling & booking', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Payments (Stripe) & admin dashboard', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Self-serve domain, email domain & phone setup', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Email welcome & reminder automations', basic: true, foundation: true, growth: true, enterprise: true },
  { label: 'Customer member portal', basic: false, foundation: true, growth: true, enterprise: true },
  { label: 'Specialist / employee portal', basic: false, foundation: true, growth: true, enterprise: true },
  { label: 'SMS welcome & reminder automations', basic: false, foundation: false, growth: true, enterprise: true },
  { label: 'AI SMS agent (24/7 texts, quotes & booking)', basic: false, foundation: false, growth: true, enterprise: true },
  { label: 'AI voice agent (24/7 phone calls)', basic: false, foundation: false, growth: true, enterprise: true },
  { label: 'Partner & referral network engine', basic: false, foundation: false, growth: false, enterprise: true },
  { label: 'Advanced analytics & reporting', basic: false, foundation: false, growth: false, enterprise: true },
  { label: 'Ad Management (lead-gen campaigns)', basic: 'add-on', foundation: 'add-on', growth: 'add-on', enterprise: 'included' },
];

const TIERS = ['basic', 'foundation', 'growth', 'enterprise'];

function Cell({ v }) {
  if (v === true) return <Check size={15} className="text-[#10B981] mx-auto" />;
  if (v === 'add-on') return <span className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359] tracking-widest">ADD-ON</span>;
  if (v === 'included') return <span className="font-['JetBrains_Mono'] text-[9px] text-[#10B981] tracking-widest">INCLUDED</span>;
  return <span className="text-[#1A2A24]">—</span>;
}

export default function EraPricing() {
  return (
    <section id="pricing" className="bg-[#08110E] py-24 md:py-32 border-t border-[#10B981]/8">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-14">
          <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.25em] text-[#10B981] mb-5">PRICING — 05</p>
          <h2 className="font-['Sora'] font-semibold text-[#DFEDE9] text-[34px] md:text-[48px] leading-[1.05] tracking-[-0.02em] mb-5">
            One-time setup. Flat monthly. No per-seat surprises.
          </h2>
          <p className="font-['Inter'] text-[#7A9A92] text-lg leading-relaxed">
            Start with a one-time setup fee, then a flat monthly rate. Basic and Foundation are live today — Growth and Enterprise are on the roadmap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PLANS.map((p) => (
            <Reveal key={p.key}>
              <div className={`relative rounded-[10px] p-6 flex flex-col h-full transition-all ${p.popular ? 'ring-2 ring-[#10B981] bg-[#10B981]/[0.04] shadow-[0_0_40px_-12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_-8px_rgba(16,185,129,0.5)]' : p.available ? 'ring-1 ring-[#1A2A24] bg-[#0C1614] hover:ring-[#10B981]/40 hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.3)]' : 'ring-1 ring-[#1A2A24] bg-[#0C1614] opacity-50'}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10B981] text-[#060A09] text-[10px] font-['JetBrains_Mono'] tracking-widest px-3 py-1 rounded-full">MOST POPULAR</span>}
                {!p.available && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0C1614] border border-[#1A2A24] text-[#4A6359] text-[10px] font-['JetBrains_Mono'] tracking-widest px-3 py-1 rounded-full">COMING SOON</span>}
                <h3 className="font-['Sora'] font-semibold text-[#DFEDE9] text-xl mb-1.5">{p.name}</h3>
                <p className="font-['Inter'] text-[#7A9A92] text-sm mb-5 min-h-[2.5rem]">{p.tagline}</p>
                <div className="mb-6">
                  <>
                    <span className="font-['Sora'] font-semibold text-[#DFEDE9] text-4xl">${p.monthly}</span>
                    <span className="font-['Inter'] text-[#4A6359] text-sm">/month</span>
                    <p className="font-['JetBrains_Mono'] text-[10px] text-[#4A6359] mt-2">+ ${p.setup?.toLocaleString()} one-time setup</p>
                  </>
                </div>
                {p.available ? (
                  <Link to="/era-register" className={`mt-auto text-center font-['Inter'] text-sm font-medium py-2.5 rounded-[6px] transition-all ${p.popular ? 'bg-[#10B981] text-[#060A09] hover:bg-[#34D399] shadow-[0_0_20px_-6px_rgba(16,185,129,0.5)]' : 'border border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981] hover:text-[#060A09]'}`}>Get started</Link>
                ) : (
                  <div className="mt-auto text-center font-['JetBrains_Mono'] text-[11px] tracking-widest text-[#4A6359] border border-[#1A2A24] py-2.5 rounded-[6px]">COMING SOON</div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="rounded-[10px] ring-1 ring-[#1A2A24] overflow-hidden bg-[#0C1614]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-[#1A2A24] bg-[#060A09]">
                    <th className="text-left p-4 font-['Inter'] font-semibold text-[#DFEDE9] text-sm">Feature</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#DFEDE9] text-sm w-20">Basic</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#10B981] text-sm w-20">Foundation</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#DFEDE9] text-sm w-20">Growth</th>
                    <th className="text-center p-4 font-['Inter'] font-semibold text-[#DFEDE9] text-sm w-20">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((row, i) => (
                    <tr key={i} className="border-b border-[#1A2A24] last:border-0">
                      <td className="p-4 font-['Inter'] text-sm text-[#DFEDE9]">{row.label}</td>
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