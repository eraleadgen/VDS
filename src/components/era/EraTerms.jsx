import { Link } from 'react-router-dom';
import Navbar from '@/components/vds/Navbar';
import Footer from '@/components/vds/Footer';
import { useLegalContext } from '@/lib/useLegalContext';

// ERA Systems SaaS Terms of Service. Content sourced from the ERA Systems Legal
// Content template (attorney review pending). Every legal-identity reference is
// templated from useLegalContext so the ERA pages never name a different company
// or jurisdiction than the rest of the site.
const buildSections = (c) => [
  {
    num: '1.',
    title: 'The Service',
    content: `ERA Systems provides a business operating system for local service companies, a website, booking system, CRM, payment processing integration, and AI-assisted tools, offered through subscription plans (Basic, Foundation, and other tiers as made available). The specific features included depend on your selected plan, as described at ${c.domain}/pricing and in your account.`,
  },
  {
    num: '2.',
    title: 'Accounts and Eligibility',
    content: 'You must provide accurate information when creating an account and completing onboarding. You are responsible for maintaining the security of your account credentials and for all activity under your account. You must be authorized to bind the business you are registering on behalf of.',
  },
  {
    num: '3.',
    title: 'Subscriptions, Billing, and Cancellation',
    content: 'Subscription fees are billed in advance on a recurring basis through Stripe, our payment processor. One-time setup fees are due at signup and are non-refundable once onboarding begins. You may upgrade, downgrade, or cancel your subscription at any time through your account portal; changes take effect according to the terms shown at the time of the change, and downgrades do not delete your business data, features simply become inactive and are restored if you upgrade again. Upon cancellation, your subscription enters a grace period (currently 7 days) during which your service remains active; after the grace period, feature access is suspended, though your data is retained and not deleted.',
  },
  {
    num: '4.',
    title: 'Your Data and Content',
    content: 'You retain ownership of your business data, including your service catalog, pricing, and your own customers\' information collected through the Service. You grant ERA Systems the right to process this data solely to provide the Service to you. See our Privacy Policy for how we handle data, including data belonging to your own customers.',
  },
  {
    num: '5.',
    title: 'Acceptable Use',
    content: 'You agree not to use the Service to violate applicable law, including laws governing consumer communications (such as SMS and telemarketing consent requirements), to send unsolicited or unauthorized messages through the Service, or to misrepresent your business or its offerings.',
  },
  {
    num: '6.',
    title: 'AI-Assisted Features',
    content: 'Where included in your plan, ERA Core provides AI-assisted tools (a website chat assistant, and where applicable, SMS or voice agents) that operate based on the business information you provide and configure. You are responsible for reviewing this configuration for accuracy. ERA Systems does not guarantee AI-generated responses will be error-free at all times.',
  },
  {
    num: '7.',
    title: 'Intellectual Property',
    content: 'ERA Systems retains all right, title, and interest in the ERA Core platform and underlying software. No rights are transferred to you beyond the right to use the Service during your subscription term.',
  },
  {
    num: '8.',
    title: 'Third-Party Services',
    content: 'Your use of Stripe, Google Calendar, and any other third-party service connected through the Service is subject to that provider\'s own terms. ERA Systems is not responsible for outages, changes, or fees imposed by third-party providers.',
  },
  {
    num: '9.',
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by law, ERA Systems\' total liability arising out of these Terms will not exceed the fees you paid ERA Systems in the three months preceding the claim. ERA Systems is not liable for indirect, incidental, or consequential damages. The Service is provided "as is" without warranty of uninterrupted or error-free operation.',
  },
  {
    num: '10.',
    title: 'Termination',
    content: 'We may suspend or terminate your access for non-payment or violation of these Terms. You may cancel at any time as described in Section 3.',
  },
  {
    num: '11.',
    title: 'Governing Law',
    content: `These Terms are governed by the laws of the State of ${c.jurisdiction}, without regard to its conflict of laws principles.`,
  },
  {
    num: '12.',
    title: 'Changes to These Terms',
    content: 'We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.',
  },
  {
    num: '13.',
    title: 'Contact',
    content: `Questions about these Terms can be directed to ${c.email}.`,
  },
];

export default function EraTerms() {
  const c = useLegalContext();
  const sections = buildSections(c);
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />
      <section className="pt-36 pb-20 max-w-4xl mx-auto px-6">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">LEGAL</p>
        <h1 className="text-5xl font-grotesk font-bold text-vapor mb-3">TERMS OF SERVICE</h1>
        <p className="text-xs font-mono-tech text-vapor/30 mb-16 tracking-widest">{c.legalName.toUpperCase()} · LAST UPDATED: AUGUST 17, 2026</p>

        <p className="text-vapor/60 leading-relaxed mb-12 border-l border-gold/20 pl-8">
          {`These Terms of Service ("Terms") govern your use of the ERA Core platform, provided by ${c.legalName}, a ${c.jurisdiction} limited liability company ("ERA Systems," "we," "us," or "our"), including the website located at ${c.domain} and any business website, dashboard, or tools provisioned for you through it (collectively, the "Service").`}
        </p>

        <div className="space-y-10">
          {sections.map(sec => (
            <div key={sec.title} className="border-l border-gold/20 pl-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono-tech text-gold/50">{sec.num}</span>
                <h2 className="text-lg font-grotesk font-semibold text-vapor">{sec.title}</h2>
              </div>
              <p className="text-vapor/60 leading-relaxed">{sec.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-vapor/10 flex flex-wrap gap-6">
          <Link to="/privacy" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            PRIVACY POLICY →
          </Link>
          <Link to="/cookies" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            COOKIES POLICY →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}