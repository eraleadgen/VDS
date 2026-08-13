import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Step2Branding({ data, onNext, onBack, saving }) {
  const [form, setForm] = useState(data || {});
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(data || {}); }, [data]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateColor = (key, val) => setForm((f) => ({ ...f, brand_colors: { ...(f.brand_colors || {}), [key]: val } }));
  const updateDict = (key, val) => setForm((f) => ({ ...f, dictionary: { ...(f.dictionary || {}), [key]: val } }));

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const r = await base44.integrations.Core.UploadFile({ file });
      const url = r?.data?.file_url || r?.file_url;
      if (url) update('logo_url', url);
    } catch (e) {
      console.error('Logo upload failed:', e.message);
    } finally {
      setUploading(false);
    }
  };

  const colorFields = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'text', label: 'Text' },
  ];

  const dictFields = [
    { key: 'item_noun', label: 'Item Noun (singular)', default: 'Vehicle' },
    { key: 'item_plural', label: 'Item Noun (plural)', default: 'Vehicles' },
    { key: 'item_category_noun', label: 'Category Noun', default: 'Classification' },
    { key: 'item_category_label', label: 'Category Label', default: 'Vehicle Classification' },
    { key: 'service_noun', label: 'Service Noun', default: 'Detail' },
    { key: 'service_verb', label: 'Service Verb', default: 'detail' },
  ];

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">LOGO</Label>
        <div className="flex items-center gap-4 mt-1.5">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-sm border border-vapor/15 bg-asphalt" />
          ) : (
            <div className="w-20 h-20 rounded-sm border border-vapor/15 bg-asphalt flex items-center justify-center">
              <Upload size={20} className="text-vapor/30" />
            </div>
          )}
          <div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-asphalt border border-vapor/15 text-vapor text-sm rounded-sm hover:border-gold/30 transition-colors">
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Logo'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">TAGLINE</Label>
          <Input value={form.tagline || ''} onChange={(e) => update('tagline', e.target.value)} placeholder="Premium mobile detailing" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
        </div>
        <div>
          <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider">PREFERRED SHORT NAME</Label>
          <Input value={form.business_short_name || ''} onChange={(e) => update('business_short_name', e.target.value)} placeholder="Bob's" className="bg-asphalt border-vapor/15 text-vapor mt-1.5" />
          <p className="text-vapor/40 text-xs mt-1">Used in nav links and compact CTAs. Falls back to brand name.</p>
        </div>
      </div>

      {/* Brand Colors */}
      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider mb-3 block">BRAND COLORS</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {colorFields.map((c) => (
            <div key={c.key}>
              <span className="text-xs text-vapor/50 font-mono-tech">{c.label}</span>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={(form.brand_colors || {})[c.key] || '#D4AF37'} onChange={(e) => updateColor(c.key, e.target.value)} className="w-10 h-10 rounded-sm border border-vapor/15 bg-transparent cursor-pointer" />
                <Input value={(form.brand_colors || {})[c.key] || ''} onChange={(e) => updateColor(c.key, e.target.value)} className="bg-asphalt border-vapor/15 text-vapor text-xs font-mono-tech" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dictionary */}
      <div>
        <Label className="text-vapor/70 text-xs font-mono-tech tracking-wider mb-2 block">DOMAIN VOCABULARY</Label>
        <p className="text-vapor/40 text-xs mb-3">Customize the words used throughout your site. Defaults are for automotive detailing — change these if your business serves a different industry.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dictFields.map((d) => (
            <div key={d.key}>
              <Label className="text-vapor/60 text-xs">{d.label}</Label>
              <Input value={(form.dictionary || {})[d.key] || d.default} onChange={(e) => updateDict(d.key, e.target.value)} className="bg-asphalt border-vapor/15 text-vapor mt-1 text-sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={saving} className="text-vapor/60 hover:text-vapor">
          <ChevronLeft size={18} className="mr-1" /> Back
        </Button>
        <Button onClick={() => onNext(form)} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk font-bold">
          {saving ? 'Saving...' : 'Next'} <ChevronRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}