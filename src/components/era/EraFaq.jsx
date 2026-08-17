import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/vds/Navbar';
import Footer from '@/components/vds/Footer';

const ERA_FAQS = [
  {
    category: 'GETTING STARTED',
    items: [
      {
        q: 'How long does setup take?',
        a: 'After you complete checkout, our guided onboarding wizard walks you through your business info, branding, service catalog, pricing, team, and integrations. Once you finish, your website and booking system are live — typically under five minutes of your time.',
      },
      {
        q: 'What do I need to get started?',
        a: 'Just your business information. The onboarding wizard collects your business name, service area, branding (logo, colors), service catalog, pricing, team members, and integrations. You can change any of this later from your admin dashboard.',
      },
      {
        q: 'Do I need to know how to code?',
        a: 'No. ERA Core is fully self-serve. The onboarding wizard handles everything — your website, booking system, CRM, and admin dashboard are all configured automatically based on your inputs.',
      },
    ],
  },
  {
    category: 'PLANS & PRICING',
    items: [
      {
        q: 'What\'s the difference between Basic and Foundation?',
        a: 'Basic includes your branded website, AI chat widget, core engines (communication, workflow, CRM), booking, payments, admin dashboard, and self-serve domain/email/phone. Foundation adds the customer member portal, specialist/employee portal, and simple automations like reminders and welcome messages.',
      },
      {
        q: 'What are the setup fees?',
        a: 'Basic has a $500 one-time setup fee, and Foundation has a $900 one-time setup fee. These cover the automated provisioning of your website, booking system, and business configuration. After that, it\'s a flat monthly rate — $150/mo for Basic, $400/mo for Foundation.',
      },
      {
        q: 'Are Growth and Enterprise available?',
        a: 'Growth and Enterprise tiers are coming soon. Growth will add AI SMS and voice agents. Enterprise will add the partner/referral engine, advanced analytics, and include Ad Management. Sign up now on Basic or Foundation and upgrade when these tiers launch.',
      },
      {
        q: 'Is Ad Management included?',
        a: 'Ad Management is available as a paid add-on ($500/mo) on any plan. At the Enterprise tier, Ad Management is included at no additional cost.',
      },
    ],
  },
  {
    category: 'BILLING & CANCELLATION',
    items: [
      {
        q: 'Do I need to sign a contract?',
        a: 'No long-term contracts. Subscription fees are billed monthly through Stripe. You can upgrade, downgrade, or cancel at any time from your account portal.',
      },
      {
        q: 'What happens if I cancel?',
        a: 'Your subscription enters a 7-day grace period during which your service stays active. After that, feature access is suspended, but your data is retained — not deleted. You can re-subscribe anytime and everything picks up right where you left off.',
      },
      {
        q: 'Can I switch plans later?',
        a: 'Yes. You can upgrade or downgrade at any time from your account portal. Upgrades take effect immediately; downgrades take effect at the end of your current billing cycle. Your data is never deleted when you downgrade — features simply become inactive and are restored if you upgrade again.',
      },
    ],
  },
  {
    category: 'DOMAIN & INTEGRATIONS',
    items: [
      {
        q: 'Can I use my own domain?',
        a: 'Yes. Every plan includes self-serve domain, email, and phone configuration. You can connect your own domain, set up custom email sending, and configure your business phone number — all from your admin dashboard.',
      },
      {
        q: 'What integrations are included?',
        a: 'ERA Core integrates with Stripe for payments, Google Calendar for scheduling, and email/SMS delivery providers. The onboarding wizard helps you connect these during setup, or you can add them later from your admin dashboard.',
      },
    ],
  },
];

export default function EraFaq() {
  const [openItems, setOpenItems] = useState({});

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />

      {/* ── HEADER ───────────────────────────────────── */}
      <section className="relative pt-36 pb-20">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">STILL NOT SURE?</p>
          <h1 className="text-5xl md:text-7xl font-grotesk font-bold text-vapor mb-6">
            FREQUENTLY<br />ASKED
          </h1>
          <p className="text-vapor/50 text-lg leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about ERA Core, our plans, and how to get started.
          </p>
        </div>
      </section>

      {/* ── FAQ SECTIONS ─────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pb-16 md:pb-24 space-y-12 md:space-y-16">
        {ERA_FAQS.map((cat, catIdx) => (
          <div key={catIdx}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-px bg-gold" />
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold">{cat.category}</p>
            </div>

            <div className="space-y-2">
              {cat.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isOpen = openItems[key];
                return (
                  <div key={itemIdx}
                    className="border border-vapor/10 hover:border-vapor/20 transition-colors duration-200 rounded-sm overflow-hidden">
                    <button
                      onClick={() => toggle(catIdx, itemIdx)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className="text-vapor font-grotesk font-medium pr-8 text-lg">{item.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-gold shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6">
                        <p className="text-vapor/60 leading-relaxed border-t border-vapor/5 pt-4">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="border-t border-vapor/5 py-16 md:py-24 text-center max-w-3xl mx-auto px-6 mb-8">
        <h2 className="text-3xl font-grotesk font-bold text-vapor mb-4">READY TO LAUNCH?</h2>
        <p className="text-vapor/50 mb-10">Create your ERA account and get a fully live, working website in minutes.</p>
        <Link to="/era-register"
          className="inline-block bg-gold text-obsidian px-8 py-4 text-sm font-mono-tech tracking-widest hover:bg-gold-light transition-colors duration-200 rounded-sm">
          GET STARTED
        </Link>
      </section>

      <Footer />
    </div>
  );
}