import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { CARE_GUIDES, buildGuidePrintHtml } from '@/lib/careGuides';
import printHtml from '@/components/shared/printHtml';
import Navbar from '../components/vds/Navbar';
import Footer from '../components/vds/Footer';

// Public single-guide page — linked from the auto-delivered care-guide email so any
// client (registered or guest) can view and download/print their guide.
export default function CareGuide() {
  const { key } = useParams();
  const guide = CARE_GUIDES.find((g) => g.key === key) || CARE_GUIDES[0];

  return (
    <div className="bg-obsidian min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 sm:px-6 pt-28 md:pt-36 pb-16">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono-tech tracking-widest text-vapor/50 hover:text-vapor mb-8">
          <ArrowLeft size={13} /> BACK TO VDS MOBILE
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center border border-gold/40 text-gold bg-gold/10 shrink-0">
              <guide.icon size={18} />
            </div>
            <div>
              <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70">CLIENT CARE GUIDE</p>
              <h1 className="text-2xl font-grotesk font-bold text-vapor">{guide.title}</h1>
            </div>
          </div>
          <button
            onClick={() => printHtml(guide.title, buildGuidePrintHtml(guide))}
            className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm transition-colors shrink-0"
          >
            <Printer size={13} /> PRINT / PDF
          </button>
        </div>

        <div className="glass-panel border border-gold/15 rounded-sm p-5 mb-6">
          <p className="text-sm text-vapor/70 leading-relaxed">{guide.intro}</p>
        </div>

        <div className="space-y-5">
          {guide.sections.map((s) => (
            <div key={s.title} className="glass-panel border border-vapor/10 rounded-sm p-5">
              <h2 className="text-base font-grotesk font-semibold text-gold mb-3">{s.title}</h2>
              <ul className="space-y-2">
                {s.bullets.map((b, idx) => (
                  <li key={idx} className="text-sm text-vapor/70 leading-relaxed flex gap-2.5">
                    <span className="text-gold/60 mt-1.5 shrink-0">◆</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="glass-panel border border-gold/30 rounded-sm p-5 bg-gold/5 mt-6">
          <h3 className="text-base font-grotesk font-semibold text-gold mb-2">{guide.goldCta.title}</h3>
          <p className="text-sm text-vapor/70 leading-relaxed mb-4">{guide.goldCta.body}</p>
          <a href={guide.goldCta.link} className="inline-block vds-gold-btn px-5 py-3 text-xs font-mono-tech tracking-widest rounded-sm">
            ◆ {guide.goldCta.linkLabel.toUpperCase()}
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}