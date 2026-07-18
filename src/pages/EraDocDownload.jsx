import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

export default function EraDocDownload() {
  const [status, setStatus] = useState('');

  async function handleDownload() {
    setStatus('Preparing…');
    try {
      const res = await fetch('/ERA-Core-Onboarding.md');
      if (!res.ok) throw new Error('File not found');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ERA-Core-Onboarding.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('Download started ✓');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center border border-gold/25 rounded-2xl bg-asphalt p-10 shadow-2xl">
        <div className="text-gold font-mono-tech tracking-[3px] text-sm font-bold mb-2">ERA SYSTEMS LLC</div>
        <div className="w-14 h-14 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-5">
          <FileText className="text-gold" size={24} />
        </div>
        <h1 className="text-xl font-semibold text-vapor mb-2">ERA Core Onboarding Guide</h1>
        <p className="text-sm text-vapor/50 leading-relaxed mb-7">
          System overview &amp; vertical onboarding document for prospective ERA Core partners.
        </p>
        <button
          onClick={handleDownload}
          className="w-full inline-flex items-center justify-center gap-2 bg-gold text-obsidian font-bold tracking-wider text-sm py-3.5 rounded-md hover:bg-gold-light transition-colors"
        >
          <Download size={16} /> Download .md
        </button>
        <a
          href="/ERA-Core-Onboarding.md"
          download="ERA-Core-Onboarding.md"
          className="block mt-3 text-xs text-vapor/40 hover:text-gold transition-colors font-mono-tech"
        >
          or download directly
        </a>
        {status && (
          <p className="mt-5 text-xs text-vapor/50 font-mono-tech min-h-[18px]">{status}</p>
        )}
      </div>
    </div>
  );
}