import { Link } from 'react-router-dom';
import EraLogo from './EraLogo';

const COLS = [
  { title: 'Platform', links: [['#platform', 'Modules'], ['#proof', 'Proof'], ['#pricing', 'Pricing'], ['#customers', 'Customers']] },
  { title: 'Account', links: [['/era-register', 'Get started'], ['/era-login', 'Sign in'], ['/era-portal', 'Account portal'], ['/era-console', 'Staff console']] },
  { title: 'Legal', links: [['/terms', 'Terms'], ['/privacy', 'Privacy'], ['/cookies', 'Cookies']] },
];

export default function EraFooter() {
  return (
    <footer className="bg-[#06231F] border-t border-[#14B8A6]/15 pt-16 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <EraLogo size={30} />
              <span className="font-['Fraunces'] font-semibold text-white text-lg">Systems</span>
            </div>
            <p className="font-['Inter'] text-[#A6B8B4] text-sm leading-relaxed max-w-[260px]">
              The operating system for service businesses. Modular. Event-driven. Already running one.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#14B8A6] mb-4">{c.title.toUpperCase()}</p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l[1]}>
                    {l[0].startsWith('#') ? (
                      <a href={l[0]} className="font-['Inter'] text-sm text-[#A6B8B4] hover:text-white transition-colors">{l[1]}</a>
                    ) : (
                      <Link to={l[0]} className="font-['Inter'] text-sm text-[#A6B8B4] hover:text-white transition-colors">{l[1]}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#14B8A6]/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-['JetBrains_Mono'] text-[11px] text-[#6B8580]">© 2026 ERA Systems LLC · Registered in Georgia</p>
          <p className="font-['JetBrains_Mono'] text-[11px] text-[#6B8580]">Built on ERA Core</p>
        </div>
      </div>
    </footer>
  );
}