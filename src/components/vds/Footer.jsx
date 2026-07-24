import { Link } from 'react-router-dom';
import { Instagram, Phone, Mail } from 'lucide-react';

const LOGO = "https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png";

export default function Footer() {
  return (
    <footer className="bg-obsidian border-t border-gold/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <img src={LOGO} alt="VDS Mobile" className="h-10 w-auto mb-4" />
            <p className="text-vapor/40 text-sm leading-relaxed font-mono-tech">
              VALET DETAILING SERVICE LLC<br />
              Metro Atlanta, GA
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://www.instagram.com/vdsmobile/" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-vapor/20 flex items-center justify-center hover:border-gold hover:text-gold text-vapor/50 transition-colors duration-200 rounded-sm">
                <Instagram size={14} />
              </a>
              <a href="https://www.tiktok.com/@vdsmobile" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-vapor/20 flex items-center justify-center hover:border-gold hover:text-gold text-vapor/50 transition-colors duration-200 rounded-sm text-xs font-bold">
                TK
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-mono-tech tracking-widest text-gold mb-6">NAVIGATE</p>
            <div className="flex flex-col gap-3">
              {[['/', 'Home'], ['/services', 'Services'], ['/book', 'Quote & Book'], ['/gallery', 'Gallery'], ['/vds-gold', 'VDS Gold'], ['/faq', 'FAQ']].map(([path, label]) => (
                <Link key={path} to={path} className="text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">{label}</Link>
              ))}
            </div>
          </div>

          {/* Portal Logins */}
          <div>
            <p className="text-xs font-mono-tech tracking-widest text-gold mb-6">PORTALS</p>
            <div className="flex flex-col gap-3">
              <Link to="/specialist-login" className="text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">Specialist Login</Link>
              <Link to="/partner-login" className="text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">Partner Login</Link>
              <Link to="/admin-login" className="text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">Admin Login</Link>
              <Link to="/project-overview" className="text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">Project Overview</Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-mono-tech tracking-widest text-gold mb-6">SERVICES</p>
            <div className="flex flex-col gap-3">
              {['Full Detail', 'Ceramic Coatings', 'Paint Correction', 'VDS Gold Membership', 'Interior Detail', 'Exterior Detail'].map(s => (
                <Link key={s} to="/services" className="text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">{s}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-mono-tech tracking-widest text-gold mb-6">CONTACT</p>
            <div className="flex flex-col gap-4">
              <a href="tel:+14704128986" className="flex items-center gap-3 text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">
                <Phone size={13} className="text-gold" />
                Call / Text (470) 412-8986
              </a>
              <a href="mailto:Valetdetailingservice@gmail.com" className="flex items-center gap-3 text-sm text-vapor/50 hover:text-vapor transition-colors duration-200 font-mono-tech">
                <Mail size={13} className="text-gold" />
                Valetdetailingservice@gmail.com
              </a>
            </div>
            <div className="mt-8">
              <Link to="/vds-gold"
                className="inline-block vds-gold-btn px-5 py-3 text-xs font-mono-tech tracking-widest rounded-sm">
                ◆ JOIN VDS GOLD
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-vapor/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-vapor/30 text-xs font-mono-tech tracking-widest">
            © 2026 VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            <Link to="/terms" className="text-vapor/30 text-xs font-mono-tech hover:text-vapor/60 transition-colors">TERMS & CONDITIONS</Link>
            <Link to="/privacy" className="text-vapor/30 text-xs font-mono-tech hover:text-vapor/60 transition-colors">PRIVACY POLICY</Link>
            <Link to="/cookies" className="text-vapor/30 text-xs font-mono-tech hover:text-vapor/60 transition-colors">COOKIES POLICY</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}