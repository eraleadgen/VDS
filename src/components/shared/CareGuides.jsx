import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, Library, Eye, Download, ChevronDown } from 'lucide-react';
import { CARE_GUIDES, buildGuidePrintHtml, fillWebsite } from '@/lib/careGuides';
import { useBusinessConfig } from '@/lib/BusinessConfigContext';
import printHtml from '@/components/shared/printHtml';
import { base44 } from '@/api/base44Client';

// Client Care Guides — a separate, printable guide per service (Ceramic Coating,
// Paint Correction, Detailing, VDS Gold). Shown in the Resource Center of every portal
// (admin / specialist / partner) with a dropdown to switch guides. Each guide closes with
// a VDS Gold enrollment call-to-action.
//
// `compact` mode (used on the Member Dashboard) renders only the selector plus View and
// Download buttons — no expanded accordion content — to keep the dashboard short.
export default function CareGuides({ compact = false, onAction, from = 'member' }) {
  // The Partner Network guide is internal — only shown to admin, specialist, and partner portals.
  const baseGuides = from === 'member' ? CARE_GUIDES.filter((g) => g.key !== 'partner_network') : CARE_GUIDES;
  // Admin-only: the ERA Core + VDS Mobile Project Overview appears as a selectable resource
  // option in the admin portal's Resource Center, alongside the care guides.
  const projectOverviewOption = { key: 'project_overview', title: 'Project Overview' };
  const guides = compact && from === 'admin' ? [...baseGuides, projectOverviewOption] : baseGuides;
  const [active, setActive] = useState(guides[0].key);
  const [open, setOpen] = useState(0);
  const [poStatus, setPoStatus] = useState('');
  const [poError, setPoError] = useState('');
  const guide = guides.find((g) => g.key === active) || baseGuides[0];
  const isProjectOverview = active === 'project_overview';

  // Resolve the tenant's hostname from BusinessConfig so guide copy and the printable
  // footer show the tenant's own domain, never a hardcoded VDS domain.
  const config = useBusinessConfig();
  const websiteHost = (() => {
    const bookingUrl = config?.website_links?.booking_url;
    try { return bookingUrl ? new URL(bookingUrl).hostname : (typeof window !== 'undefined' ? window.location.hostname : ''); }
    catch { return typeof window !== 'undefined' ? window.location.hostname : ''; }
  })();

  const onPick = (key) => { setActive(key); setOpen(0); setPoStatus(''); setPoError(''); };

  const fetchProjectOverviewHtml = async () => {
    const res = await base44.functions.invoke('projectOverviewDoc', {});
    const html = res?.data?.html;
    if (!html) throw new Error('Document content unavailable.');
    return html;
  };
  const downloadProjectOverview = async () => {
    setPoError(''); setPoStatus('Preparing…');
    try {
      const html = await fetchProjectOverviewHtml();
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'ERA-Core-1.0-VDS-Mobile-Project-Overview.html';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setPoStatus('Download started ✓');
    } catch (e) { setPoStatus(''); setPoError('Error: ' + (e?.message || 'Unable to download the document.')); }
  };

  if (compact) {
    return (
      <div className="glass-panel border border-gold/15 rounded-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-gold/70 shrink-0">
            <Library size={13} /> SELECT GUIDE
          </div>
          <select
            value={active}
            onChange={(e) => onPick(e.target.value)}
            className="bg-asphalt border border-gold/30 text-vapor text-sm font-mono-tech px-4 py-2.5 rounded-sm outline-none focus:border-gold/60 transition-colors flex-1"
          >
            {guides.map((g) => (
              <option key={g.key} value={g.key}>{g.title}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {isProjectOverview ? (
            <button
              onClick={() => { onAction && onAction(); downloadProjectOverview(); }}
              className="flex items-center gap-2 text-xs font-mono-tech text-vapor/70 border border-vapor/20 hover:border-gold/40 hover:text-gold px-4 py-2.5 rounded-sm transition-colors"
            >
              <Download size={13} /> DOWNLOAD
            </button>
          ) : (
            <>
              <Link
                to={`/care-guide/${guide.key}?from=${from}`}
                onClick={() => onAction && onAction()}
                className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm transition-colors"
              >
                <Eye size={13} /> VIEW GUIDE
              </Link>
              <button
                onClick={() => { onAction && onAction(); printHtml(guide.title, buildGuidePrintHtml(guide, websiteHost)); }}
                className="flex items-center gap-2 text-xs font-mono-tech text-vapor/70 border border-vapor/20 hover:border-gold/40 hover:text-gold px-4 py-2.5 rounded-sm transition-colors"
              >
                <Download size={13} /> DOWNLOAD
              </button>
            </>
          )}
        </div>
        {(poStatus || poError) && (
          <p className={`mt-3 text-xs font-mono-tech ${poError ? 'text-red-400/80' : 'text-vapor/50'}`}>{poError || poStatus}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-grotesk font-bold text-vapor">Client Care Guides</h2>
          <p className="text-sm text-vapor/50 font-mono-tech mt-1">A focused aftercare guide for every service we perform — print any guide as a PDF hand-out.</p>
        </div>
      </div>

      {/* Guide selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-mono-tech tracking-widest text-gold/70">
          <Library size={13} /> SELECT GUIDE
        </div>
        <select
          value={active}
          onChange={(e) => onPick(e.target.value)}
          className="bg-asphalt border border-gold/30 text-vapor text-sm font-mono-tech px-4 py-2.5 rounded-sm outline-none focus:border-gold/60 transition-colors"
        >
          {guides.map((g) => (
            <option key={g.key} value={g.key}>{g.title}</option>
          ))}
        </select>
        <button
          onClick={() => printHtml(guide.title, buildGuidePrintHtml(guide, websiteHost))}
          className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm transition-colors ml-auto"
        >
          <Printer size={13} /> PRINT GUIDE
        </button>
      </div>

      {/* Intro */}
      <div className="glass-panel border border-gold/15 rounded-sm p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center border border-gold/40 text-gold bg-gold/10 shrink-0">
            <guide.icon size={16} />
          </div>
          <h3 className="text-base font-grotesk font-semibold text-gold">{guide.title}</h3>
        </div>
        <p className="text-sm text-vapor/70 leading-relaxed">{guide.intro}</p>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {guide.sections.map((s, i) => {
          const isOpen = open === i;
          return (
            <div key={s.title} className={`glass-panel rounded-sm border transition-colors ${isOpen ? 'border-gold/30' : 'border-vapor/10'}`}>
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-grotesk font-semibold ${isOpen ? 'text-gold' : 'text-vapor'}`}>{s.title}</h3>
                </div>
                <ChevronDown size={16} className={`text-vapor/40 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5">
                  <ul className="space-y-2">
                    {s.bullets.map((b, idx) => (
                      <li key={idx} className="text-sm text-vapor/70 leading-relaxed flex gap-2.5">
                        <span className="text-gold/60 mt-1.5 shrink-0">◆</span>
                        <span>{fillWebsite(b, websiteHost)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gold CTA */}
      <div className="glass-panel border border-gold/30 rounded-sm p-5 bg-gold/5">
        <h3 className="text-base font-grotesk font-semibold text-gold mb-2">{guide.goldCta.title}</h3>
        <p className="text-sm text-vapor/70 leading-relaxed mb-4">{guide.goldCta.body}</p>
        <Link to={guide.goldCta.link} className="inline-block vds-gold-btn px-5 py-3 text-xs font-mono-tech tracking-widest rounded-sm">
          ◆ {guide.goldCta.linkLabel.toUpperCase()}
        </Link>
      </div>
    </div>
  );
}