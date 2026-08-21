import { Link } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EraLogo from '@/components/marketing/EraLogo';

const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'clients', label: 'Clients', icon: Users },
];

export default function EraAdminShell({ active, onNavigate, children, staffName }) {
  return (
    <div className="min-h-screen bg-[#0A0B0D] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/5 flex flex-col">
        <div className="px-5 py-5 border-b border-white/5">
          <EraLogo size={28} />
          <div className="mt-3">
            <p className="text-[10px] font-mono tracking-[0.25em] text-white/30">ADMIN PORTAL</p>
            {staffName && <p className="text-xs text-white/50 mt-0.5 truncate">{staffName}</p>}
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                active === key
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={() => base44.auth.logout('/era-login')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}