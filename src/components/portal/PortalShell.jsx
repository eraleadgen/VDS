import { LogOut, Lock } from 'lucide-react';
import { useBusinessName } from '@/lib/BusinessConfigContext';

export default function PortalShell({ title, navItems, active, onNavigate, userLabel, onLogout, children }) {
  const businessName = useBusinessName();
  return (
    <div className="min-h-screen bg-obsidian flex flex-col md:flex-row">
      <aside className="md:w-64 md:flex-col md:border-r border-vapor/10 bg-asphalt/40 flex md:min-h-screen">
        <div className="p-6 border-b border-vapor/10 flex-1 md:flex-none">
          <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70">{businessName.toUpperCase()}</p>
          <h2 className="text-lg font-grotesk font-bold text-vapor mt-1">{title}</h2>
        </div>
        <nav className="hidden md:flex flex-col p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono-tech tracking-widest rounded-sm transition-colors border ${
                active === item.key
                  ? 'bg-gold/10 text-gold border-gold/30'
                  : item.locked
                    ? 'text-vapor/35 hover:text-vapor/60 hover:bg-vapor/5 border-transparent'
                    : 'text-vapor/60 hover:text-vapor hover:bg-vapor/5 border-transparent'
              }`}
            >
              <item.icon size={16} /> <span className="flex-1 text-left">{item.label}</span>
              {item.locked && <Lock size={12} className="text-vapor/30" />}
            </button>
          ))}
        </nav>
        <div className="hidden md:block p-4 border-t border-vapor/10 mt-auto">
          <p className="text-xs font-mono-tech text-vapor/40 truncate mb-3">{userLabel}</p>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-xs font-mono-tech tracking-widest text-vapor/50 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} /> SIGN OUT
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden glass-header px-4 py-3 flex items-center justify-between sticky top-0 z-40 gap-3">
          <h2 className="text-sm font-grotesk font-bold text-vapor flex-1 truncate">{title}</h2>
          <select
            value={active}
            onChange={e => onNavigate(e.target.value)}
            className="bg-asphalt border border-vapor/10 text-vapor text-xs font-mono-tech px-2 py-2 rounded-sm"
          >
            {navItems.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
          </select>
          <button onClick={onLogout} className="text-vapor/50 hover:text-red-400"><LogOut size={16} /></button>
        </header>
        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}