import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

// Admin-gated standalone view of the ERA Core 1.0 + VDS Mobile Project Overview document.
// The document HTML is generated server-side (projectOverviewDoc) so the full architecture
// write-up is never shipped in the public client bundle. Rendered inside an isolated iframe
// so the document's own styles don't collide with the app's design tokens. Reachable only
// via the "View" button in the admin Resource Center.
export default function ProjectOverview() {
  const { user, authChecked, isLoadingAuth } = useAuth();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authChecked && (!user || user.role !== 'admin')) window.location.href = '/admin-login';
  }, [authChecked, user]);

  useEffect(() => {
    if (!authChecked || !user || user.role !== 'admin') return;
    (async () => {
      try {
        const res = await base44.functions.invoke('projectOverviewDoc', {});
        const data = res?.data ?? res;
        if (data?.html) setHtml(data.html);
        else setError(data?.error || 'Unable to load document.');
      } catch (e) {
        setError(e?.message || 'Unable to load document.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authChecked, user]);

  const download = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ERA-Core-1.0-VDS-Mobile-Project-Overview.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      <div className="glass-header sticky top-0 z-10 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link
          to="/admin"
          className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-vapor/60 hover:text-gold transition-colors"
        >
          <ArrowLeft size={14} /> BACK TO ADMIN
        </Link>
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 hidden sm:block">
          PROJECT OVERVIEW
        </p>
        <button
          onClick={download}
          disabled={!html}
          className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2 rounded-sm transition-colors disabled:opacity-40"
        >
          <Download size={13} /> DOWNLOAD
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="text-gold animate-spin" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-red-400 text-sm font-mono-tech">{error}</p>
        </div>
      ) : (
        <iframe
          srcDoc={html}
          title="ERA Core 1.0 + VDS Mobile — Project Overview"
          className="flex-1 w-full border-0"
          style={{ minHeight: 'calc(100vh - 49px)' }}
        />
      )}
    </div>
  );
}