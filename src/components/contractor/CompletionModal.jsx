import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2 } from 'lucide-react';

const INPUT = 'w-full bg-asphalt border border-vapor/10 focus:border-gold/50 outline-none text-vapor px-4 py-3 text-sm font-mono-tech rounded-sm transition-colors duration-200';
const LABEL = 'block text-xs font-mono-tech tracking-widest text-vapor/50 mb-2';

export default function CompletionModal({ job, onClose, onSubmit, saving }) {
  const [before, setBefore] = useState(job.before_photos || []);
  const [after, setAfter] = useState(job.after_photos || []);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState(job.completion_notes || '');
  const [products, setProducts] = useState(job.products_used || '');
  const [upsell, setUpsell] = useState(job.upsell_recommendation || '');
  const [nextDate, setNextDate] = useState(job.recommended_next_detail_date || '');

  const upload = async (files, setter) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        if (file_url) urls.push(file_url);
      }
      setter(prev => [...prev, ...urls]);
    } catch (e) {
      alert('Upload failed: ' + (e.message || 'unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      before_photos: before,
      after_photos: after,
      services_completed: [job.service_type].filter(Boolean),
      products_used: products,
      completion_notes: notes,
      upsell_recommendation: upsell,
      recommended_next_detail_date: nextDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel border border-gold/20 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-grotesk font-bold text-vapor">Upload Photos & Details</h3>
          <button onClick={onClose}><X size={18} className="text-vapor/50 hover:text-vapor" /></button>
        </div>
        <p className="text-xs font-mono-tech text-gold/70 mb-4">{job.service_label} · {job.customer_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL}>BEFORE PHOTOS</label>
            <input type="file" accept="image/*" multiple disabled={uploading}
              onChange={e => upload(Array.from(e.target.files), setBefore)}
              className="text-xs font-mono-tech text-vapor/60 file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border file:border-gold/30 file:bg-gold/10 file:text-gold file:text-xs" />
            <p className="text-xs text-vapor/40 mt-1">{before.length} photo(s) uploaded</p>
          </div>
          <div>
            <label className={LABEL}>AFTER PHOTOS</label>
            <input type="file" accept="image/*" multiple disabled={uploading}
              onChange={e => upload(Array.from(e.target.files), setAfter)}
              className="text-xs font-mono-tech text-vapor/60 file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border file:border-gold/30 file:bg-gold/10 file:text-gold file:text-xs" />
            <p className="text-xs text-vapor/40 mt-1">{after.length} photo(s) uploaded</p>
          </div>
          <div>
            <label className={LABEL}>PRODUCTS USED</label>
            <input value={products} onChange={e => setProducts(e.target.value)} className={INPUT} placeholder="e.g. Koch-Chemie, Gtechniq" />
          </div>
          <div>
            <label className={LABEL}>COMPLETION NOTES</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={INPUT} placeholder="Anything notable about this job" />
          </div>
          <div>
            <label className={LABEL}>UPSELL RECOMMENDATION</label>
            <input value={upsell} onChange={e => setUpsell(e.target.value)} className={INPUT} placeholder="e.g. Ceramic coating in 3 months" />
          </div>
          <div>
            <label className={LABEL}>RECOMMENDED NEXT DETAIL</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className={INPUT} />
          </div>
          <button type="submit" disabled={saving || uploading}
            className="w-full bg-gold text-obsidian py-3 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold-light disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> SAVING...</> : <><Upload size={14} /> SAVE PHOTOS</>}
          </button>
        </form>
      </div>
    </div>
  );
}