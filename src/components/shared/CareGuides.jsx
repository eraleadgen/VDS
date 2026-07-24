import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, Library, Eye, Download, ChevronDown } from 'lucide-react';
import { CARE_GUIDES, buildGuidePrintHtml } from '@/lib/careGuides';
import printHtml from '@/components/shared/printHtml';

// Client Care Guides — a separate, printable guide per service (Ceramic Coating,
// Paint Correction, Detailing, VDS Gold). Shown in the Resource Center of every portal
// (admin / specialist / partner) with a dropdown to switch guides. Each guide closes with
// a VDS Gold enrollment call-to-action.
//
// `compact` mode (used on the Member Dashboard) renders only the selector plus View and
// Download buttons — no expanded accordion content — to keep the dashboard short.
export default function CareGuides({ compact = false, onAction, from = 'member' }) {
  // The Partner Network guide is internal — only shown to admin, specialist, and partner portals.
  const guides = from === 'member' ? CARE_GUIDES.filter((g) => g.key !== 'partner_network') : CARE_GUIDES;
  const [active, setActive] = useState(guides[0].key);
  const [open, setOpen] = useState(0);
  const guide = guides.find((g) => g.key === active) || guides[0];

  const onPick = (key) => { setActive(key); setOpen(0); };

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
          <Link
            to={`/care-guide/${guide.key}?from=${from}`}
            onClick={() => onAction && onAction()}
            className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm transition-colors"
          >
            <Eye size={13} /> VIEW GUIDE
          </Link>
          <button
            onClick={() => { onAction && onAction(); printHtml(guide.title, buildGuidePrintHtml(guide)); }}
            className="flex items-center gap-2 text-xs font-mono-tech text-vapor/70 border border-vapor/20 hover:border-gold/40 hover:text-gold px-4 py-2.5 rounded-sm transition-colors"
          >
            <Download size={13} /> DOWNLOAD
          </button>
        </div>
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
          onClick={() => printHtml(guide.title, buildGuidePrintHtml(guide))}
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
                        <span>{b}</span>
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