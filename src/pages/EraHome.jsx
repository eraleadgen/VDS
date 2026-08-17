import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  MessageSquare,
  Workflow,
  Users,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Globe,
  UserCheck,
  Wrench,
  Zap,
  Bot,
  Phone,
  Network,
  BarChart3,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/vds/Navbar';
import Footer from '@/components/vds/Footer';
import GoldShimmer from '@/components/vds/GoldShimmer';
import GoldParticles from '@/components/vds/GoldParticles';
import { useBusinessConfig } from '@/lib/BusinessConfigContext';

const PILLARS = [
  {
    icon: MessageSquare,
    title: 'Communication Rules Engine',
    desc: 'Centralized, configurable rules for every customer interaction across SMS, email, and chat. No message goes out without passing through your rules.',
  },
  {
    icon: Workflow,
    title: 'Job-Centric Workflows',
    desc: 'Every service flows through a single Job entity — scheduling, specialists, photos, invoices, and customer journey all linked to one record.',
  },
  {
    icon: Users,
    title: 'CRM-Centric Architecture',
    desc: 'A single customer record drives every interaction, with lifetime value, consent, and journey history built in from day one.',
  },
];

const ALL_FEATURES = [
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

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    tagline: 'Everything you need to launch.',
    monthly: 150,
    setup: 500,
    popular: false,
    available: true,
  },
  {
    key: 'foundation',
    name: 'Foundation',
    tagline: 'Advanced tools to grow and scale.',
    monthly: 400,
    setup: 900,
    popular: true,
    available: true,
  },
  {
    key: 'growth',
    name: 'Growth',
    tagline: 'AI-powered customer engagement.',
    monthly: null,
    setup: null,
    popular: false,
    available: false,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full platform, unlimited scale.',
    monthly: null,
    setup: null,
    popular: false,
    available: false,
  },
];

const FAQS = [
  {
    q: 'How long does setup take?',
    a: 'After you complete checkout, our guided onboarding wizard walks you through your business info, branding, service catalog, pricing, team, and integrations. Once you finish, your website and booking system are live — typically under five minutes of your time.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Yes. Every plan includes self-serve domain, email, and phone configuration. You can connect your own domain, set up custom email sending, and configure your business phone number — all from your admin dashboard.',
  },
  {
    q: 'Do I need to sign a contract?',
    a: 'No long-term contracts. Subscription fees are billed monthly through Stripe. You can upgrade, downgrade, or cancel at any time from your account portal. One-time setup fees are due at signup.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Your subscription enters a 7-day grace period during which your service stays active. After that, feature access is suspended, but your data is retained — not deleted. You can re-subscribe anytime and everything picks up right where you left off.',
  },
];

export default function EraHome() {
  const [openFaq, setOpenFaq] = useState(null);
  const config = useBusinessConfig();

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 60%), linear-gradient(180deg, #08090a 0%, #0a0b0d 50%, #0d0a05 100%)'
        }} />
        <GoldParticles count={45} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-obsidian to-transparent pointer-events-none" style={{ zIndex: 3 }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-40 w-full">
          <div className="max-w-4xl mx-auto text-center">
            {config?.logo_url && (
              <img
                src={config.logo_url}
                alt="ERA Systems"
                className="h-16 md:h-20 w-auto mx-auto mb-10 opacity-90"
              />
            )}
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">
              ERA CORE · BUSINESS OPERATING SYSTEM
            </p>
            <h1 className="text-5xl md:text-7xl font-grotesk font-bold leading-none text-vapor mb-6 tracking-tight">
              THE OPERATING SYSTEM<br />
              FOR <GoldShimmer>SERVICE BUSINESSES.</GoldShimmer>
            </h1>
            <p className="text-base sm:text-lg text-vapor/60 font-grotesk max-w-2xl mx-auto leading-relaxed mb-10">
              A modular, event-driven platform that runs your entire service business —
              centralized communication rules, job-centric workflows, and a CRM-centric
              architecture. From first contact to job completion, billing, and beyond.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
              <Link
                to="/era-register"
                className="flex items-center gap-3 bg-vapor text-obsidian px-7 py-4 text-xs sm:text-sm font-mono-tech tracking-widest hover:bg-gold transition-all duration-300 rounded-sm"
              >
                GET STARTED <ArrowRight size={14} />
              </Link>
              <a
                href="#pricing"
                className="flex items-center gap-3 border border-vapor/40 text-vapor px-7 py-4 text-xs sm:text-sm font-mono-tech tracking-widest hover:border-vapor hover:bg-vapor/5 transition-all duration-300 rounded-sm"
              >
                VIEW PLANS
              </a>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-20 pt-10 sm:pt-12 border-t border-vapor/10 max-w-3xl mx-auto">
              {[
                { value: '4', label: 'PLAN TIERS' },
                { value: '∞', label: 'BUSINESSES SUPPORTED' },
                { value: '<5min', label: 'TO GO LIVE' },
                { value: '100%', label: 'MULTI-TENANT ISOLATED' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl sm:text-3xl font-grotesk font-bold text-gold">{s.value}</p>
                  <p className="text-[10px] sm:text-xs font-mono-tech text-vapor/40 tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 animate-bounce opacity-40">
          <ChevronDown size={18} className="text-gold" />
        </div>
      </section>

      {/* ── CORE PILLARS ─────────────────────────────── */}
      <section className="py-16 md:py-24 border-y border-vapor/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 md:mb-16 text-center">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">WHAT YOU'RE GETTING</p>
            <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor">ONE PLATFORM. EVERYTHING CONNECTED.</h2>
            <p className="text-vapor/50 max-w-2xl mx-auto mt-6 leading-relaxed">
              One platform that connects every part of your service business — from first
              customer contact to job completion, billing, and beyond.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {PILLARS.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="glass-panel p-8 vds-card-hover rounded-sm">
                  <div className="w-12 h-12 rounded-sm border border-gold/30 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-grotesk font-bold text-vapor mb-3">{p.title}</h3>
                  <p className="text-vapor/50 text-sm leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ──────────────────────────────── */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
        <div className="mb-12 md:mb-16 text-center">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">BUILT IN, NOT BOLTED ON</p>
          <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor">EVERYTHING YOUR BUSINESS NEEDS</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: Globe, label: 'Branded Website' },
            { icon: MessageSquare, label: 'AI Chat Widget' },
            { icon: Calendar, label: 'Booking & Scheduling' },
            { icon: CreditCard, label: 'Payments' },
            { icon: LayoutDashboard, label: 'Admin Dashboard' },
            { icon: UserCheck, label: 'Member Portal' },
            { icon: Wrench, label: 'Specialist Portal' },
            { icon: Zap, label: 'Automations' },
            { icon: Bot, label: 'AI Agents' },
            { icon: Phone, label: 'SMS & Voice' },
            { icon: Network, label: 'Partner Engine' },
            { icon: BarChart3, label: 'Advanced Analytics' },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="border border-vapor/10 hover:border-gold/30 transition-colors duration-300 p-6 rounded-sm text-center group">
                <Icon className="w-6 h-6 text-vapor/40 group-hover:text-gold transition-colors duration-300 mx-auto mb-4" />
                <p className="text-xs font-mono-tech tracking-widest text-vapor/60 group-hover:text-vapor transition-colors">{f.label.toUpperCase()}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 border-t border-vapor/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 md:mb-16 text-center">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">SIMPLE, TRANSPARENT PRICING</p>
            <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor mb-4">CHOOSE YOUR PLAN</h2>
            <p className="text-vapor/50 max-w-2xl mx-auto">
              Start with a one-time setup fee, then a flat monthly rate. No per-seat charges, no surprises.
              Growth and Enterprise tiers are coming soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
            {PLANS.map(plan => (
              <div
                key={plan.key}
                className={`relative rounded-sm p-8 flex flex-col transition-all duration-300 ${
                  plan.popular
                    ? 'border border-gold bg-gold/5 vds-card-hover'
                    : plan.available
                      ? 'border border-vapor/10 hover:border-vapor/30 vds-card-hover'
                      : 'border border-vapor/5 opacity-50'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-obsidian text-[10px] font-mono-tech tracking-widest px-3 py-1 rounded-sm">
                    MOST POPULAR
                  </span>
                )}
                {!plan.available && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 border border-vapor/30 text-vapor/50 text-[10px] font-mono-tech tracking-widest px-3 py-1 rounded-sm bg-obsidian">
                    COMING SOON
                  </span>
                )}

                <h3 className="text-xl font-grotesk font-bold text-vapor mb-2">{plan.name}</h3>
                <p className="text-vapor/40 text-xs font-mono-tech mb-6 min-h-[2.5rem]">{plan.tagline}</p>

                <div className="mb-6">
                  {plan.monthly !== null ? (
                    <>
                      <span className="text-4xl font-grotesk font-bold text-vapor">${plan.monthly}</span>
                      <span className="text-vapor/40 text-sm">/month</span>
                      <p className="text-xs font-mono-tech text-vapor/40 mt-2">+ ${plan.setup} setup fee</p>
                    </>
                  ) : (
                    <span className="text-2xl font-grotesk font-bold text-vapor/40">TBD</span>
                  )}
                </div>

                {plan.available ? (
                  <Link
                    to="/era-register"
                    className={`mt-auto text-center py-3 text-xs font-mono-tech tracking-widest rounded-sm transition-colors duration-300 ${
                      plan.popular
                        ? 'bg-gold text-obsidian hover:bg-gold-light'
                        : 'border border-vapor/30 text-vapor hover:border-gold hover:text-gold'
                    }`}
                  >
                    GET STARTED
                  </Link>
                ) : (
                  <div className="mt-auto text-center py-3 text-xs font-mono-tech tracking-widest text-vapor/30 border border-vapor/10 rounded-sm">
                    NOTIFY ME
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE COMPARISON ───────────────────────── */}
      <section className="py-16 md:py-24 border-t border-vapor/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-12 md:mb-16 text-center">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">COMPARE PLANS</p>
            <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor">FULL FEATURE MATRIX</h2>
          </div>

          <div className="border border-vapor/10 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-vapor/10 bg-vapor/5">
                    <th className="text-left p-4 font-grotesk font-semibold text-vapor text-sm">Feature</th>
                    <th className="text-center p-4 font-grotesk font-semibold text-vapor text-sm w-20">Basic</th>
                    <th className="text-center p-4 font-grotesk font-semibold text-gold text-sm w-20">Foundation</th>
                    <th className="text-center p-4 font-grotesk font-semibold text-vapor/40 text-sm w-20">Growth</th>
                    <th className="text-center p-4 font-grotesk font-semibold text-vapor/40 text-sm w-20">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_FEATURES.map((row, i) => (
                    <tr key={i} className="border-b border-vapor/5 last:border-0 hover:bg-vapor/5 transition-colors">
                      <td className="p-4 text-sm text-vapor/70 font-mono-tech">{row.label}</td>
                      {['basic', 'foundation', 'growth', 'enterprise'].map(tier => (
                        <td key={tier} className="p-4 text-center">
                          {row[tier] === true ? (
                            <Check className="w-4 h-4 text-gold mx-auto" />
                          ) : row[tier] === 'add-on' ? (
                            <span className="text-[10px] font-mono-tech text-vapor/40 tracking-widest">ADD-ON</span>
                          ) : row[tier] === 'included' ? (
                            <span className="text-[10px] font-mono-tech text-gold tracking-widest">INCLUDED</span>
                          ) : (
                            <span className="text-vapor/20">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="py-16 md:py-24 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">STILL NOT SURE?</p>
          <h2 className="text-4xl md:text-5xl font-grotesk font-bold text-vapor">FREQUENTLY ASKED</h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-vapor/10 hover:border-vapor/20 transition-colors duration-200 rounded-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-vapor font-grotesk font-medium pr-8">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-gold shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6">
                  <p className="text-vapor/60 text-sm leading-relaxed border-t border-vapor/5 pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-obsidian">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 50%, rgba(180,140,20,0.06) 0%, transparent 55%), linear-gradient(180deg, #08090a 0%, #0a0b0d 40%, #0d0a05 100%)'
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(212,175,55,0.07) 0%, transparent 70%)',
          animation: 'goldPulse 6s ease-in-out infinite'
        }} />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <Sparkles className="w-8 h-8 text-gold mx-auto mb-6 opacity-70" />
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-6">READY TO LAUNCH</p>
          <h2 className="text-5xl md:text-6xl font-grotesk font-bold text-vapor mb-8">
            YOUR BUSINESS,<br />
            <GoldShimmer>FULLY OPERATIONAL.</GoldShimmer>
          </h2>
          <p className="text-vapor/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Create your ERA account and get a fully live, working website and booking system
            in minutes — no developer required.
          </p>
          <Link
            to="/era-register"
            className="inline-flex items-center gap-3 bg-gold text-obsidian px-10 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-300 rounded-sm"
          >
            GET STARTED <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}