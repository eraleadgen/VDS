import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';

const LOGO = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png";

const navLinks = [
  { label: 'HOME', path: '/' },
  { label: 'SERVICES', path: '/services' },

  { label: 'FAQ', path: '/faq' },

];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-header py-3' : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={LOGO} alt="VDS Mobile" className="h-12 w-auto" />

        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs font-mono-tech tracking-widest transition-colors duration-200 ${
                location.pathname === link.path
                  ? 'text-gold'
                  : 'text-vapor/60 hover:text-vapor'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: VDS Gold + CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/vds-gold"
            className="vds-gold-btn px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm"
          >
            ◆ VDS GOLD
          </Link>
          <a
            href="sms:+14704128986"
            className="flex items-center gap-2 bg-vapor text-obsidian px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold transition-colors duration-200"
          >
            <Phone size={12} />
            TEXT NOW
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-vapor p-2"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden glass-header border-t border-gold/10 mt-2">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-5">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-mono-tech tracking-widest ${
                  location.pathname === link.path ? 'text-gold' : 'text-vapor/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/vds-gold"
              className="vds-gold-btn px-4 py-3 text-sm font-mono-tech tracking-widest text-center rounded-sm"
            >
              ◆ VDS GOLD — FROM $250/MO
            </Link>
            <a
              href="sms:+14704128986"
              className="bg-vapor text-obsidian px-4 py-3 text-sm font-mono-tech tracking-widest text-center rounded-sm"
            >
              TEXT (470) 412-8986
            </a>
          </div>
        </div>
      )}
    </header>
  );
}