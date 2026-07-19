import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Lock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const GUIDE_FILENAME = 'ERA-Core-Onboarding-Guide.html';

export default function EraDocDownload() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [authState, setAuthState] = useState('loading'); // loading | admin | denied

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setAuthState(me?.role === 'admin' ? 'admin' : 'denied');
      } catch {
        setAuthState('denied');
      }
    })();
  }, []);

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // Fetch the guide HTML from the admin-gated backend function. The document
  // is never shipped in the public client bundle — the server verifies the
  // admin role before returning the content.
  async function fetchGuideHtml() {
    const res = await base44.functions.invoke('eraDocDownload', {});
    const html = res?.data?.html;
    if (!html) throw new Error('Guide content unavailable.');
    return html;
  }

  async function handleDownload() {
    setStatus('Preparing…');
    setError('');
    try {
      const html = await fetchGuideHtml();
      triggerDownload(new Blob([html], { type: 'text/html' }), GUIDE_FILENAME);
      setStatus('Download started ✓');
    } catch (e) {
      setStatus('');
      setError('Error: ' + (e?.message || 'Unable to download the guide.'));
    }
  }

  async function handleView() {
    setError('');
    try {
      const html = await fetchGuideHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError('Error: ' + (e?.message || 'Unable to preview the guide.'));
    }
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="text-gold animate-spin" size={28} />
      </div>
    );
  }

  if (authState !== 'admin') {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center border border-gold/25 rounded-2xl bg-asphalt p-10 shadow-2xl">
          <div className="w-14 h-14 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-5">
            <Lock className="text-gold" size={24} />
          </div>
          <h1 className="text-xl font-semibold text-vapor mb-2">Admin Access Required</h1>
          <p className="text-sm text-vapor/50 leading-relaxed mb-7">
            The ERA Core Onboarding Guide is restricted to ERA Systems administrators. If you've already downloaded the guide, you can open that file directly at any time.
          </p>
          <Link
            to="/admin-login"
            className="inline-flex items-center gap-2 bg-gold text-obsidian font-bold tracking-wider text-sm px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors"
          >
            Admin Sign In
          </Link>
        </div>
      </div>
    );
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
          Full system overview — ERA Core architecture and how VDS Mobile connects to it — ready for future vertical onboarding.
        </p>
        <button
          onClick={handleDownload}
          className="w-full inline-flex items-center justify-center gap-2 bg-gold text-obsidian font-bold tracking-wider text-sm py-3.5 rounded-md hover:bg-gold-light transition-colors"
        >
          <Download size={16} /> Download Guide (.html)
        </button>
        <button
          onClick={handleView}
          className="w-full mt-3 text-xs text-vapor/50 hover:text-gold transition-colors font-mono-tech py-2"
        >
          preview the formatted guide in a new tab
        </button>
        {status && (
          <p className="mt-5 text-xs text-vapor/50 font-mono-tech min-h-[18px]">{status}</p>
        )}
        {error && (
          <p className="mt-3 text-xs text-red-400/80 font-mono-tech min-h-[18px]">{error}</p>
        )}
      </div>
    </div>
  );
}