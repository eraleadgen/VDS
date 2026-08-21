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
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-[#F6F8F8]/85 backdrop-blur-md border-b border-[#DCE1E5]' : 'bg-transparent'}`}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <EraLogo size={30} />
          <span className="font-['Fraunces'] font-semibold text-[#0C1B1A] text-lg tracking-tight">Systems</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="font-['Inter'] text-sm text-[#5B6770] hover:text-[#0C1B1A] transition-colors">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/era-login" className="font-['Inter'] text-sm font-medium text-[#0C1B1A] hover:text-[#0B7C72] transition-colors">Sign in</Link>
          <Link to="/era-register" className="font-['Inter'] text-sm font-medium bg-[#0B7C72] text-white px-4 py-2 rounded-[6px] hover:bg-[#0A6B62] transition-colors">Start your business</Link>
        </div>

        <button className="md:hidden text-[#0C1B1A]" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#F6F8F8] border-b border-[#DCE1E5] px-6 py-4 space-y-3">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block font-['Inter'] text-sm text-[#0C1B1A]">{l.label}</a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-[#DCE1E5]">
            <Link to="/era-login" className="flex-1 text-center font-['Inter'] text-sm font-medium text-[#0C1B1A] border border-[#DCE1E5] rounded-[6px] py-2">Sign in</Link>
            <Link to="/era-register" className="flex-1 text-center font-['Inter'] text-sm font-medium bg-[#0B7C72] text-white rounded-[6px] py-2">Start your business</Link>
          </div>
        </div>
      )}
    </header>
  );
}