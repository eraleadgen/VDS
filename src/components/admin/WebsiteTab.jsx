import { useState } from 'react';
import { ExternalLink, Monitor, Smartphone } from 'lucide-react';
import DomainSection from '@/components/admin/DomainSection';

export default function WebsiteTab() {
  const [device, setDevice] = useState('desktop');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-grotesk font-bold text-vapor leading-tight">Website</h1>
          <p className="text-xs font-mono-tech text-vapor/40">Live preview of your customer-facing site</p>
        </div>
        <a href={window.location.origin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-mono-tech tracking-widest text-vapor/60 hover:text-gold border border-vapor/15 hover:border-gold/40 px-3 py-2 rounded-sm transition-colors">
          <ExternalLink size={14} />
          OPEN LIVE SITE
        </a>
      </div>

      <div className="glass-panel border border-vapor/10 rounded-sm flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 260px)', minHeight: 420 }}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-vapor/10 bg-obsidian/40">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gold/60" />
            <span className="text-[10px] font-mono-tech tracking-widest text-vapor/50">LIVE PREVIEW</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setDevice('desktop')} className={`p-1 rounded transition-colors ${device === 'desktop' ? 'text-gold' : 'text-vapor/40 hover:text-vapor'}`}><Monitor size={14} /></button>
            <button onClick={() => setDevice('mobile')} className={`p-1 rounded transition-colors ${device === 'mobile' ? 'text-gold' : 'text-vapor/40 hover:text-vapor'}`}><Smartphone size={14} /></button>
          </div>
        </div>
        <div className="flex-1 bg-obsidian flex items-center justify-center p-3 overflow-hidden">
          <iframe
            src={window.location.origin}
            title="Website Preview"
            className={`bg-obsidian rounded-sm border border-vapor/10 transition-all duration-300 ${device === 'mobile' ? 'w-[390px] h-full' : 'w-full h-full'}`}
          />
        </div>
      </div>

      <DomainSection />
    </div>
  );
}