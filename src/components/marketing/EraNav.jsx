import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import EraLogo from './EraLogo';

const LINKS = [
  { href: '#platform', label: 'Platform' },
  { href: '#proof', label: 'Proof' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#customers', label: 'Customers' },
];

export default function EraNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#060A09]/80 backdrop-blur-xl border-b border-[#10B981]/10' : 'bg-transparent'}`}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <EraLogo size={30} />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="font-['Inter'] text-sm text-[#7A9A92] hover:text-[#34D399] transition-colors duration-200">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/era-login" className="font-['Inter'] text-sm font-medium text-[#DFEDE9] hover:text-[#34D399] transition-colors">Sign in</Link>
          <Link to="/era-register" className="font-['Inter'] text-sm font-medium bg-[#10B981] text-[#060A09] px-4 py-2 rounded-[6px] hover:bg-[#34D399] transition-all duration-200 shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_-4px_rgba(52,211,153,0.6)]">Start your business</Link>
        </div>

        <button className="md:hidden text-[#DFEDE9]" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#060A09] border-b border-[#10B981]/10 px-6 py-4 space-y-3">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block font-['Inter'] text-sm text-[#DFEDE9]">{l.label}</a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-[#10B981]/10">
            <Link to="/era-login" className="flex-1 text-center font-['Inter'] text-sm font-medium text-[#DFEDE9] border border-[#1A2A24] rounded-[6px] py-2">Sign in</Link>
            <Link to="/era-register" className="flex-1 text-center font-['Inter'] text-sm font-medium bg-[#10B981] text-[#060A09] rounded-[6px] py-2">Start your business</Link>
          </div>
        </div>
      )}
    </header>
  );
}