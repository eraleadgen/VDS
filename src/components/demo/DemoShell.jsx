import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CalendarRange, Users, Wrench, Receipt, MessageSquare, Settings, Lock, ArrowLeft, Eye } from 'lucide-react';
import { DEMO_TENANT } from '@/lib/demoTenantData';

// Faux admin shell for the interactive demo. Uses the same inline hex palette
// as the rest of eraleadgen.com (#060A09 base, #DFEDE9 text, #10B981 green,
// #D4AF37 gold) so it renders identically on the era_systems tenant.
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
    <div className="min-h-screen bg-[#060A09] flex flex-col" style={{ color: '#DFEDE9', fontFamily: "'Inter', sans-serif" }}>
      {/* Demo banner */}
      <div style={{ background: 'rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.2)' }} className="px-4 py-2 flex items-center justify-center gap-2 text-center">
        <Eye size={13} style={{ color: '#D4AF37' }} className="shrink-0" />
        <p style={{ fontFamily: "'JetBrains_Mono', monospace", color: '#D4AF37', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 600 }}>
          INTERACTIVE DEMO — FICTIONAL SAMPLE DATA · READ-ONLY · NO CHANGES ARE SAVED
        </p>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col" style={{ borderRight: '1px solid #1A2A24', background: '#08110E' }}>
          <div className="p-5" style={{ borderBottom: '1px solid #1A2A24' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[6px] flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontFamily: "'Sora', sans-serif" }}>A</div>
              <div>
                <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: '#DFEDE9', fontSize: '14px', lineHeight: 1.2 }}>{DEMO_TENANT.business_name}</p>
                <p style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.6)', marginTop: '2px' }}>DEMO · {DEMO_TENANT.plan_tier.toUpperCase()}</p>
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm transition-all duration-200"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: active ? 600 : 400,
                    background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                    border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                    color: active ? '#D4AF37' : '#7A9A92',
                  }}
                >
                  <Icon size={16} style={{ color: active ? '#D4AF37' : '#4A6359' }} />
                  {t.label}
                </button>
              );
            })}

            <div className="pt-4 pb-2 px-3">
              <p style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#4A6359' }}>FULL PRODUCT</p>
            </div>

            {LOCKED_TABS.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  onMouseEnter={() => setLockedHover(t.label)}
                  onMouseLeave={() => setLockedHover(null)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm relative cursor-not-allowed"
                  style={{ fontFamily: "'Inter', sans-serif", color: '#4A6359', border: '1px solid transparent' }}
                >
                  <Icon size={16} style={{ color: '#2D4239' }} />
                  {t.label}
                  <Lock size={11} className="ml-auto" style={{ color: '#2D4239' }} />
                  {lockedHover === t.label && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-[6px] whitespace-nowrap shadow-xl"
                      style={{ background: '#0C1614', border: '1px solid rgba(212,175,55,0.25)', fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', color: '#7A9A92' }}>
                      Sign up to unlock
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-3" style={{ borderTop: '1px solid #1A2A24' }}>
            <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-[6px] text-sm transition-colors" style={{ fontFamily: "'Inter', sans-serif", color: '#7A9A92' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#7A9A92'}>
              <ArrowLeft size={15} />
              Back to ERA
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #1A2A24', background: '#08110E' }}>
            <div className="flex items-center gap-3">
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: '#DFEDE9', fontSize: '18px' }}>{DEMO_TENANT.business_name}</p>
              <span style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.6)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '4px', padding: '2px 6px' }}>DEMO</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:block" style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: '#4A6359' }}>{DEMO_TENANT.service_area}</span>
              <Link to="/era-register" className="px-4 py-1.5 rounded-[6px] text-sm font-semibold transition-colors"
                style={{ fontFamily: "'Inter', sans-serif", background: '#D4AF37', color: '#060A09' }}>
                Start your trial
              </Link>
            </div>
          </header>

          {/* Mobile tab switcher */}
          <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto" style={{ borderBottom: '1px solid #1A2A24' }}>
            {ACTIVE_TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onTabChange(t.key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm whitespace-nowrap transition-all"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: active ? 600 : 400,
                    background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                    border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                    color: active ? '#D4AF37' : '#7A9A92',
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
            <span className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap" style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', color: '#4A6359' }}>
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