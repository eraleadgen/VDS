import { Link } from 'react-router-dom';
import EraLogo from './EraLogo';

const COLS = [
  { title: 'Platform', links: [['/era-platform', 'What we do'], ['/era-results', 'Results'], ['/era-pricing', 'Pricing'], ['/era-who-for', "Who it's for"]] },
  { title: 'Account', links: [['/era-register', 'Get started'], ['/era-login', 'Sign in'], ['/era-portal', 'Account portal'], ['/era-admin', 'Admin portal']] },
  { title: 'Legal', links: [['/terms', 'Terms'], ['/privacy', 'Privacy'], ['/cookies', 'Cookies']] },
];

export default function EraFooter() {
  return (
    <footer className="bg-[#08110E] border-t border-[#10B981]/10 pt-16 pb-10 relative">
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)' }} />
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <EraLogo size={30} />
            </div>
            <p className="font-['Inter'] text-[#7A9A92] text-sm leading-relaxed max-w-[260px]">
              Bringing service businesses to a new ERA of efficiency.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#10B981] mb-4">{c.title.toUpperCase()}</p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l[1]}>
                    {l[0].startsWith('#') ? (
                      <a href={l[0]} className="font-['Inter'] text-sm text-[#7A9A92] hover:text-[#34D399] transition-colors">{l[1]}</a>
                    ) : (
                      <Link to={l[0]} className="font-['Inter'] text-sm text-[#7A9A92] hover:text-[#34D399] transition-colors">{l[1]}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#10B981]/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-['JetBrains_Mono'] text-[11px] text-[#4A6359]">© 2026 ERA Systems LLC · Registered in Georgia</p>
          <p className="font-['JetBrains_Mono'] text-[11px] text-[#4A6359]">Built on ERA Core</p>
        </div>
      </div>
    </footer>
  );
}