import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CalendarRange, Users, Wrench, Receipt, MessageSquare, Settings, Lock, ArrowLeft, Eye } from 'lucide-react';
import { DEMO_TENANT } from '@/lib/demoTenantData';

// Faux admin shell for the interactive demo. Mirrors the real admin layout
// (left sidebar + top bar) but every nav item except Overview and Analytics
// is shown as "locked" to hint at the fuller product without granting access.
// No auth, no data fetching — purely presentational.

const ACTIVE_TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const LOCKED_TABS = [
  { label: 'Jobs', icon: CalendarRange },
  { label: 'Customers', icon: Users },
  { label: 'Specialists', icon: Wrench },
  { label: 'Invoices', icon: Receipt },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Settings', icon: Settings },
];

export default function DemoShell({ activeTab, onTabChange, children }) {
  const [lockedHover, setLockedHover] = useState(null);

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-vapor flex flex-col">
      {/* Demo banner */}
      <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/25 px-4 py-2 flex items-center justify-center gap-2 text-center">
        <Eye size={13} className="text-[#D4AF37] shrink-0" />
        <p className="font-mono-tech text-[11px] tracking-widest text-[#D4AF37]">
          INTERACTIVE DEMO — FICTIONAL SAMPLE DATA · READ-ONLY · NO CHANGES ARE SAVED
        </p>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-vapor/10 bg-[#0A0B0D]">
          <div className="p-5 border-b border-vapor/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center font-grotesk font-bold text-gold text-sm">A</div>
              <div>
                <p className="font-grotesk font-bold text-vapor text-sm leading-tight">{DEMO_TENANT.business_name}</p>
                <p className="font-mono-tech text-[10px] tracking-widest text-gold/60 mt-0.5">DEMO · {DEMO_TENANT.plan_tier.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {ACTIVE_TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onTabChange(t.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-grotesk transition-all duration-200 ${
                    active
                      ? 'bg-gold/10 border border-gold/30 text-gold'
                      : 'border border-transparent text-vapor/60 hover:text-vapor hover:bg-vapor/[0.04]'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-gold' : 'text-vapor/40'} />
                  {t.label}
                </button>
              );
            })}

            <div className="pt-4 pb-2 px-3">
              <p className="font-mono-tech text-[10px] tracking-widest text-vapor/30">FULL PRODUCT</p>
            </div>

            {LOCKED_TABS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  onMouseEnter={() => setLockedHover(t.label)}
                  onMouseLeave={() => setLockedHover(null)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-grotesk text-vapor/30 border border-transparent cursor-not-allowed relative group"
                >
                  <Icon size={16} className="text-vapor/20" />
                  {t.label}
                  <Lock size={11} className="ml-auto text-vapor/20" />
                  {lockedHover === t.label && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#14161A] border border-gold/25 rounded-sm px-3 py-1.5 text-xs font-mono-tech text-vapor/70 whitespace-nowrap z-50 shadow-xl">
                      Sign up to unlock
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-3 border-t border-vapor/10">
            <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-sm text-sm font-grotesk text-vapor/50 hover:text-gold transition-colors">
              <ArrowLeft size={15} />
              Back to ERA
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="border-b border-vapor/10 px-5 py-3.5 flex items-center justify-between bg-[#0A0B0D]">
            <div className="flex items-center gap-3">
              <p className="font-grotesk font-bold text-vapor text-lg">{DEMO_TENANT.business_name}</p>
              <span className="font-mono-tech text-[10px] tracking-widest text-gold/60 border border-gold/25 rounded-sm px-1.5 py-0.5">DEMO</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:block font-mono-tech text-xs tracking-widest text-vapor/40">{DEMO_TENANT.service_area}</span>
              <Link to="/era-register" className="font-grotesk text-sm font-medium bg-gold text-[#0A0B0D] px-4 py-1.5 rounded-sm hover:bg-gold-light transition-colors">
                Start your trial
              </Link>
            </div>
          </header>

          {/* Mobile tab switcher */}
          <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-b border-vapor/10 overflow-x-auto">
            {ACTIVE_TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onTabChange(t.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-grotesk whitespace-nowrap transition-all ${
                    active ? 'bg-gold/10 border border-gold/30 text-gold' : 'text-vapor/60 border border-transparent'
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
            <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono-tech text-vapor/30 whitespace-nowrap">
              <Lock size={11} /> +6 locked
            </span>
          </div>

          {/* Content */}
          <main className="flex-1 p-5 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}