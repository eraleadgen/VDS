import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, FileText, Lock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DOC_FILENAME = 'ERA-Core-1.0-VDS-Mobile-Project-Overview.html';

export default function ProjectOverview() {
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

  async function fetchDocHtml() {
    const res = await base44.functions.invoke('projectOverviewDoc', {});
    const html = res?.data?.html;
    if (!html) throw new Error('Document content unavailable.');
    return html;
  }

  async function handleDownload() {
    setStatus('Preparing…');
    setError('');
    try {
      const html = await fetchDocHtml();
      triggerDownload(new Blob([html], { type: 'text/html' }), DOC_FILENAME);
      setStatus('Download started ✓');
    } catch (e) {
      setStatus('');
      setError('Error: ' + (e?.message || 'Unable to download the document.'));
    }
  }

  async function handleView() {
    setError('');
    try {
      const html = await fetchDocHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError('Error: ' + (e?.message || 'Unable to preview the document.'));
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
            The ERA Core 1.0 + VDS Mobile Project Overview is restricted to ERA Systems administrators.
          </p>
          <Link to="/admin-login" className="inline-flex items-center gap-2 bg-gold text-obsidian font-bold tracking-wider text-sm px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors">
            Admin Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center border border-gold/25 rounded-2xl bg-asphalt p-10 shadow-2xl">
        <div className="text-gold font-mono-tech tracking-[3px] text-sm font-bold mb-2">ERA SYSTEMS LLC · PROJECT ARCHIVE</div>
        <div className="w-14 h-14 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-5">
          <FileText className="text-gold" size={24} />
        </div>
        <h1 className="text-xl font-semibold text-vapor mb-2">ERA Core 1.0 + VDS Mobile — Project Overview</h1>
        <p className="text-sm text-vapor/50 leading-relaxed mb-2">
          An in-depth record of the platform built so far — architecture, data model, engines, portals, integrations, and how ERA Core &amp; VDS connect and communicate.
        </p>
        <p className="text-xs font-mono-tech text-gold/70 mb-7">Authored &amp; built by Noah Grove &amp; Shane Muenkel, Owners of ERA &amp; VDS · v1.0 · July 2026</p>
        <div className="flex gap-3">
          <button onClick={handleDownload} className="flex-1 inline-flex items-center justify-center gap-2 bg-gold text-obsidian font-bold tracking-wider text-sm py-3.5 rounded-md hover:bg-gold-light transition-colors">
            <Download size={16} /> Download
          </button>
          <button onClick={handleView} className="flex-1 inline-flex items-center justify-center gap-2 border border-gold/40 text-gold font-bold tracking-wider text-sm py-3.5 rounded-md hover:bg-gold/10 transition-colors">
            <Eye size={16} /> View
          </button>
        </div>
        {status && <p className="mt-5 text-xs text-vapor/50 font-mono-tech min-h-[18px]">{status}</p>}
        {error && <p className="mt-3 text-xs text-red-400/80 font-mono-tech min-h-[18px]">{error}</p>}
      </div>
    </div>
  );
}