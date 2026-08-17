import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Palette, Check, AlertCircle, Loader2, Trash2, Upload } from 'lucide-react';

const invoke = (payload) => base44.functions.invoke('tenantSettings', payload).then((r) => r.data ?? r);

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
];

export default function BrandingSection({ settings, onSaved }) {
  const [shortName, setShortName] = useState(settings?.business_short_name || '');
  const [tagline, setTagline] = useState(settings?.tagline || '');
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '');
  const [colors, setColors] = useState(() => {
    const bc = settings?.brand_colors || {};
    const out = {};
    for (const f of COLOR_FIELDS) out[f.key] = bc[f.key] || '';
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const fail = (msg) => { setError(msg); setTimeout(() => setError(''), 6000); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { fail('Please select an image file.'); return; }
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
    } catch (err) { fail(err.message || 'Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const removeLogo = () => setLogoUrl('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await invoke({
        action: 'update_branding',
        logo_url: logoUrl,
        tagline: tagline.trim(),
        business_short_name: shortName.trim(),
        brand_colors: colors,
      });
      if (r.error) fail(r.error);
      else { flash('Branding saved. Changes are live across your site.'); onSaved?.(r); }
    } catch (err) { fail(err.message); }
    finally { setSaving(false); }
  };

  return (
    <section className="border border-vapor/10 rounded-sm bg-asphalt/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette size={18} className="text-gold" />
        <h3 className="font-grotesk text-lg text-vapor">Branding</h3>
      </div>

      {error && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-sm px-3 py-2 mb-4"><AlertCircle size={16} /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/20 border border-green-900/30 rounded-sm px-3 py-2 mb-4"><Check size={16} /> {success}</div>}

      <div className="space-y-5">
        {/* Logo */}
        <div>
          <Label className="text-vapor/60 text-xs font-mono-tech mb-1.5 block">LOGO</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border border-vapor/15 rounded-sm bg-obsidian/50 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <ImageIcon size={24} className="text-vapor/30" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="border-gold/40 text-gold hover:bg-gold/10"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : 'Upload Logo'}
              </Button>
              {logoUrl && (
                <button onClick={removeLogo} className="text-vapor/40 hover:text-red-400 text-sm flex items-center gap-1">
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
          </div>
          <p className="text-vapor/40 text-xs mt-1.5">Used in the nav, loading screen, and footer. PNG or SVG with transparent background recommended.</p>
        </div>

        {/* Short name */}
        <div>
          <Label className="text-vapor/60 text-xs font-mono-tech mb-1.5 block">SHORT NAME</Label>
          <Input
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="VDS"
            className="bg-asphalt border-vapor/15 text-vapor"
          />
          <p className="text-vapor/40 text-xs mt-1.5">Compact label for nav links and tight CTAs. Falls back to your full business name.</p>
        </div>

        {/* Tagline */}
        <div>
          <Label className="text-vapor/60 text-xs font-mono-tech mb-1.5 block">TAGLINE</Label>
          <Textarea
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Premium mobile detailing for luxury vehicles"
            rows={2}
            className="bg-asphalt border-vapor/15 text-vapor"
          />
        </div>

        {/* Brand colors */}
        <div>
          <Label className="text-vapor/60 text-xs font-mono-tech mb-2 block">BRAND COLORS</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COLOR_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[f.key] || '#000000'}
                  onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="w-9 h-9 rounded-sm border border-vapor/15 bg-asphalt cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-vapor/70 text-xs block">{f.label}</span>
                  <Input
                    value={colors[f.key] || ''}
                    onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                    placeholder="#a4874c"
                    className="bg-asphalt border-vapor/15 text-vapor text-xs h-8 font-mono-tech"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-vapor/40 text-xs mt-2">Applied as CSS variables across your entire site. Leave blank to keep the default ERA theme.</p>
        </div>

        <Button onClick={save} disabled={saving} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk">
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Branding'}
        </Button>
      </div>
    </section>
  );
}