import { Link } from 'react-router-dom';
import Navbar from '@/components/vds/Navbar';
import Footer from '@/components/vds/Footer';
import { useLegalContext } from '@/lib/useLegalContext';

// ERA Systems SaaS Cookie Policy. Content sourced from the ERA Systems Legal
// Content template (attorney review pending).
const buildSections = (c) => [
  {
    num: '1.',
    title: 'What Cookies We Use',
    content: 'Essential cookies: required for account login, session management, and core functionality of the Service. These cannot be disabled without affecting your ability to use the Service. Analytics cookies (if applicable): help us understand how visitors use the website, so we can improve it.',
  },
  {
    num: '2.',
    title: 'What We Don\'t Do',
    content: 'We do not use cookies to sell your information or to serve third-party advertising on the Service.',
  },
  {
    num: '3.',
    title: 'Managing Cookies',
    content: 'Most browsers let you control or delete cookies through their settings. Disabling essential cookies may prevent you from logging in or using core features of the Service.',
  },
  {
    num: '4.',
    title: 'Changes to This Policy',
    content: `We may update this Policy from time to time. Continued use of ${c.domain} after changes take effect constitutes acceptance of the updated Policy.`,
  },
  {
    num: '5.',
    title: 'Contact',
    content: `Questions about this Policy can be directed to ${c.email}.`,
  },
];

export default function EraCookies() {
  const c = useLegalContext();
  const sections = buildSections(c);
  return (
    <div className="bg-obsidian min-h-screen">
      <Navbar />
      <section className="pt-36 pb-20 max-w-4xl mx-auto px-6">
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-4">LEGAL</p>
        <h1 className="text-5xl font-grotesk font-bold text-vapor mb-3">COOKIE POLICY</h1>
        <p className="text-xs font-mono-tech text-vapor/30 mb-16 tracking-widest">{c.legalName.toUpperCase()} · LAST UPDATED: AUGUST 17, 2026</p>

        <p className="text-vapor/60 leading-relaxed mb-12 border-l border-gold/20 pl-8">
          {`${c.legalName} ("ERA Systems," "we," "us," or "our") uses cookies and similar technologies on ${c.domain} and through the Service.`}
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
          <Link to="/terms" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            TERMS OF SERVICE →
          </Link>
          <Link to="/privacy" className="text-sm font-mono-tech text-gold/60 hover:text-gold transition-colors">
            PRIVACY POLICY →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}