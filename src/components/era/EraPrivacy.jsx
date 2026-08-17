import { Link } from 'react-router-dom';
import Navbar from '@/components/vds/Navbar';
import Footer from '@/components/vds/Footer';
import { useLegalContext } from '@/lib/useLegalContext';

// ERA Systems SaaS Privacy Policy. Content sourced from the ERA Systems Legal
// Content template (attorney review pending). Addresses ERA's dual role as both a
// business collecting prospect/account data and a data processor for tenant
// businesses' own customer data.
const buildSections = (c) => [
  {
    num: '1.',
    title: 'Information We Collect Directly',
    content: `When you visit ${c.domain}, create an account, or subscribe, we collect: your name, email address, and password; your business's information provided during onboarding (business name, address, service catalog, pricing); and payment information, processed directly by Stripe, we do not store your full payment card details ourselves.`,
  },
  {
    num: '2.',
    title: 'Information We Process on Your Behalf',
    content: 'If you subscribe to ERA Core, the platform stores information about your own business\'s customers as you use it, names, contact information, appointment and service history, and communications, solely to provide the Service to you. This data belongs to you, not to ERA Systems. We do not sell it, use it for our own marketing, or share it with anyone outside of providing the Service, except as described below or as required by law.',
  },
  {
    num: '3.',
    title: 'How We Use Information',
    content: 'We use the information described above to provide, maintain, and improve the Service; process payments; communicate with you about your account; and comply with legal obligations.',
  },
  {
    num: '4.',
    title: 'Information Sharing',
    content: 'We do not sell your information or your customers\' information. We share information with the third-party services that power the platform, including Stripe (payments), Google Calendar (scheduling integration), and email/SMS delivery providers, solely as needed to provide the Service, and only in accordance with their own privacy commitments.',
  },
  {
    num: '5.',
    title: 'Mobile Opt-In Data',
    content: 'If your plan includes SMS features, mobile opt-in information collected through the Service is not shared or sold to third parties for marketing purposes.',
  },
  {
    num: '6.',
    title: 'Data Security',
    content: 'We implement reasonable security measures to protect information processed through the Service. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    num: '7.',
    title: 'Data Retention',
    content: 'We retain your account and business data for as long as your account is active. If you cancel, data is retained during the grace period described in our Terms and may be deleted thereafter; you may request an export of your data before deletion.',
  },
  {
    num: '8.',
    title: 'Your Rights',
    content: `You may access, correct, or request deletion of your personal information by contacting ${c.email}. If you are a customer of a business using ERA Core, requests regarding your own data should generally be directed to that business, as they control your information; we assist them in fulfilling such requests as needed.`,
  },
  {
    num: '9.',
    title: "Children's Privacy",
    content: 'The Service is not directed to individuals under 18, and we do not knowingly collect personal information from children.',
  },
  {
    num: '10.',
    title: 'Changes to This Policy',
    content: 'We may update this Policy from time to time. Material changes will be reflected by updating the "Last updated" date above.',
  },
  {
    num: '11.',
    title: 'Contact',
    content: `Questions about this Policy can be directed to ${c.email}.`,
  },
];

export default function EraPrivacy() {
  const c = useLegalContext();
  const sections = buildSections(c);
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />
      <section className="pt-36 pb-20 max-w-4xl mx-auto px-6">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">LEGAL</p>
        <h1 className="text-5xl font-grotesk font-bold text-vapor mb-3">PRIVACY POLICY</h1>
        <p className="text-xs font-mono-tech text-vapor/30 mb-16 tracking-widest">{c.legalName.toUpperCase()} · LAST UPDATED: AUGUST 17, 2026</p>

        <p className="text-vapor/60 leading-relaxed mb-8 border-l border-gold/20 pl-8">
          {`${c.legalName} ("ERA Systems," "we," "us," or "our") respects your privacy. This Policy explains what information we collect and how we use it.`}
        </p>
        <p className="text-vapor/60 leading-relaxed mb-12 border-l border-gold/20 pl-8">
          <strong className="text-vapor/80">ERA Systems acts in two distinct roles, and this Policy addresses both:</strong>
        </p>
        <ul className="text-vapor/60 leading-relaxed mb-12 space-y-3 border-l border-gold/20 pl-8 list-none">
          <li>• As a <span className="text-vapor/80">business</span> operating {c.domain} and selling subscriptions to the ERA Core platform, we collect information directly from you, our prospects, account holders, and subscribing businesses.</li>
          <li>• As a <span className="text-vapor/80">service provider</span>, when you subscribe to ERA Core, we process data on your behalf, including information about your own business's customers, exactly as you configure and use the platform. We do not own, sell, or independently use this end-customer data; we process it under your instructions, to provide the Service to you.</li>
        </ul>

        <div className="space-y-10">
          {sections.map(sec => (
            <div key={sec.num} className="border-l border-gold/20 pl-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono-tech text-gold/50">{sec.num}</span>
                <h2 className="text-lg font-grotesk font-semibold text-vapor">{sec.title}</h2>
              </div>
              <p className="text-vapor/60 leading-relaxed">{sec.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-vapor/10 flex flex-wrap gap-6">
          <Link to="/terms" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            TERMS OF SERVICE →
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