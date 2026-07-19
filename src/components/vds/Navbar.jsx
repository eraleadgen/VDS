import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, UserCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOGO = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png";

const navLinks = [
  { label: 'HOME', path: '/' },
  { label: 'SERVICES', path: '/services' },
  { label: 'QUOTE & BOOK', path: '/book' },
  { label: 'GALLERY', path: '/gallery' },
  { label: 'FAQ', path: '/faq' },
  { label: 'VDS GOLD', path: '/vds-gold', gold: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsLoggedIn);
  }, [location]);

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
        <nav className="hidden lg:flex items-center gap-6 lg:gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs font-mono-tech tracking-widest transition-colors duration-200 ${
                link.gold
                  ? 'text-gold hover:text-gold-light'
                  : location.pathname === link.path
                    ? 'text-gold'
                    : 'text-vapor/60 hover:text-vapor'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              to="/member-dashboard"
              className="flex items-center gap-2 border border-gold/40 text-gold px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold hover:text-obsidian transition-colors duration-200"
            >
              <UserCircle size={14} />
              MY ACCOUNT
            </Link>
          ) : (
            <Link
              to="/member-login"
              className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-vapor/50 hover:text-vapor transition-colors duration-200"
            >
              <UserCircle size={14} />
              MEMBER LOGIN
            </Link>
          )}
          <Link
            to="/specialist-login"
            className="text-xs font-mono-tech tracking-widest text-vapor/50 hover:text-gold transition-colors duration-200"
          >
            SPECIALIST
          </Link>
          </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-vapor p-2"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden glass-header border-t border-gold/10 mt-2">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-5">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-mono-tech tracking-widest transition-colors duration-200 ${
                  link.gold
                    ? 'text-gold hover:text-gold-light'
                    : location.pathname === link.path
                      ? 'text-gold'
                      : 'text-vapor/70 hover:text-vapor'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <Link
                to="/member-dashboard"
                className="text-sm font-mono-tech tracking-widest text-gold border border-gold/40 px-4 py-3 text-center rounded-sm flex items-center justify-center gap-2"
              >
                <UserCircle size={15} /> MY ACCOUNT
              </Link>
            ) : (
              <Link
                to="/member-login"
                className="text-sm font-mono-tech tracking-widest text-vapor/60 border border-vapor/20 px-4 py-3 text-center rounded-sm"
              >
                MEMBER LOGIN
              </Link>
            )}
            <Link
              to="/specialist-login"
              className="text-sm font-mono-tech tracking-widest text-vapor/50 border border-vapor/20 px-4 py-3 text-center rounded-sm hover:text-gold hover:border-gold/40 transition-colors"
            >
              SPECIALIST PORTAL
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}