import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Edit3, Check, X, Globe, ExternalLink, Mail, Phone, MapPin, CreditCard, Loader2, Save } from 'lucide-react';

const TIER_OPTIONS = ['basic', 'foundation', 'growth', 'enterprise'];
const TIER_COLORS = {
  basic: 'text-zinc-300 bg-zinc-800',
  foundation: 'text-blue-300 bg-blue-900/40',
  growth: 'text-purple-300 bg-purple-900/40',
  enterprise: 'text-[#D4AF37] bg-[#D4AF37]/10',
};

const invoke = (body) => base44.functions.invoke('eraAdmin', body).then(r => r.data ?? r);

function Field({ label, value, editKey, editing, editValues, onEdit, onChange }) {
  return (
    <div>
      <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">{label}</p>
      {editing && editKey ? (
        <input
          value={editValues[editKey] ?? value ?? ''}
          onChange={e => onChange(editKey, e.target.value)}
          className="w-full bg-white/5 border border-[#D4AF37]/30 rounded-sm px-3 py-1.5 text-sm text-white focus:outline-none"
        />
      ) : (
        <p className="text-sm text-white/80">{value || <span className="text-white/20">—</span>}</p>
      )}
    </div>
  );
}

export default function EraClientDetail({ client: initialClient, onBack, onUpdated }) {
  const [client, setClient] = useState(initialClient);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const siteUrl = client.custom_domain
    ? `https://${client.custom_domain}`
    : client.website_links?.booking_url
      ? client.website_links.booking_url.replace('/book', '')
      : null;

  // The live preview iframe loads the app's own origin with a ?tenant= override
  // (supported by BusinessConfigContext) instead of the custom domain. Custom
  // domains often send X-Frame-Options that block embedding, and a 'pending'
  // domain doesn't resolve at all. This way the preview always renders the
  // tenant's branded site, domain-live or not.
  const previewUrl = `${window.location.origin}?tenant=${encodeURIComponent(client.business_id)}`;

  const startEdit = () => {
    setEditValues({
      business_name: client.business_name || '',
      tagline: client.tagline || '',
      business_email: client.business_email || '',
      business_phone: client.business_phone || '',
      business_address: client.business_address || '',
      plan_tier: client.plan_tier || 'basic',
      subscription_status: client.subscription_status || 'active',
      ad_management_enabled: client.ad_management_enabled ? 'true' : 'false',
      is_active: client.is_active !== false ? 'true' : 'false',
    });
    setEditing(true);
    setError('');
    setSuccessMsg('');
  };

  const cancelEdit = () => { setEditing(false); setEditValues({}); setError(''); };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = { ...editValues };
      // Coerce booleans
      updates.ad_management_enabled = updates.ad_management_enabled === 'true';
      updates.is_active = updates.is_active === 'true';

      const res = await invoke({ action: 'update_client', business_id: client.business_id, updates });
      if (!res.success) throw new Error(res.error || 'Update failed');

      const merged = { ...client, ...updates };
      setClient(merged);
      setEditing(false);
      setEditValues({});
      setSuccessMsg('Changes saved.');
      onUpdated?.(merged);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onChange = (key, val) => setEditValues(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            {client.logo_url && (
              <img src={client.logo_url} alt="" className="w-10 h-10 rounded-sm object-contain bg-white/5" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{client.business_name}</h2>
              <p className="text-xs font-mono text-white/30">{client.business_id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-sm transition-colors">
              <ExternalLink size={12} /> View Site
            </a>
          )}
          {!editing ? (
            <button onClick={startEdit} className="flex items-center gap-1.5 text-xs font-mono bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 px-3 py-1.5 rounded-sm transition-colors">
              <Edit3 size={12} /> Edit
            </button>
          ) : (
            <>
              <button onClick={cancelEdit} className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white border border-white/10 px-3 py-1.5 rounded-sm transition-colors">
                <X size={12} /> Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 text-xs font-mono bg-[#D4AF37] text-black hover:bg-[#F5E07A] px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 font-mono bg-red-950/20 border border-red-500/20 px-4 py-2 rounded-sm">{error}</p>}
      {successMsg && <p className="text-sm text-green-400 font-mono bg-green-950/20 border border-green-500/20 px-4 py-2 rounded-sm">{successMsg}</p>}

      {/* Plan & Status */}
      <div className="border border-white/8 rounded-sm bg-white/[0.03] p-5">
        <p className="text-[10px] font-mono tracking-widest text-white/30 mb-4">PLAN & STATUS</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">PLAN TIER</p>
            {editing ? (
              <select
                value={editValues.plan_tier}
                onChange={e => onChange('plan_tier', e.target.value)}
                className="w-full bg-white/5 border border-[#D4AF37]/30 rounded-sm px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                {TIER_OPTIONS.map(t => <option key={t} value={t} className="bg-zinc-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            ) : (
              <span className={`text-[11px] font-mono tracking-widest px-2 py-0.5 rounded ${TIER_COLORS[client.plan_tier] || ''}`}>
                {(client.plan_tier || 'basic').toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">SUBSCRIPTION</p>
            {editing ? (
              <select
                value={editValues.subscription_status}
                onChange={e => onChange('subscription_status', e.target.value)}
                className="w-full bg-white/5 border border-[#D4AF37]/30 rounded-sm px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                {['active','past_due','canceled'].map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
              </select>
            ) : (
              <p className={`text-sm font-mono ${client.subscription_status === 'active' ? 'text-green-400' : client.subscription_status === 'past_due' ? 'text-red-400' : 'text-white/30'}`}>
                {client.subscription_status || '—'}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">AD MANAGEMENT</p>
            {editing ? (
              <select
                value={editValues.ad_management_enabled}
                onChange={e => onChange('ad_management_enabled', e.target.value)}
                className="w-full bg-white/5 border border-[#D4AF37]/30 rounded-sm px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="true" className="bg-zinc-900">Enabled</option>
                <option value="false" className="bg-zinc-900">Disabled</option>
              </select>
            ) : (
              <p className={`text-sm font-mono ${client.ad_management_enabled ? 'text-[#D4AF37]' : 'text-white/30'}`}>
                {client.ad_management_enabled ? 'Enabled' : 'Disabled'}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">ACCOUNT</p>
            {editing ? (
              <select
                value={editValues.is_active}
                onChange={e => onChange('is_active', e.target.value)}
                className="w-full bg-white/5 border border-[#D4AF37]/30 rounded-sm px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="true" className="bg-zinc-900">Active</option>
                <option value="false" className="bg-zinc-900">Inactive</option>
              </select>
            ) : (
              <p className={`text-sm font-mono ${client.is_active !== false ? 'text-green-400' : 'text-white/30'}`}>
                {client.is_active !== false ? 'Active' : 'Inactive'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="border border-white/8 rounded-sm bg-white/[0.03] p-5">
        <p className="text-[10px] font-mono tracking-widest text-white/30 mb-4">BUSINESS INFO</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="BUSINESS NAME" value={client.business_name} editKey="business_name" editing={editing} editValues={editValues} onChange={onChange} />
          <Field label="TAGLINE" value={client.tagline} editKey="tagline" editing={editing} editValues={editValues} onChange={onChange} />
          <Field label="EMAIL" value={client.business_email} editKey="business_email" editing={editing} editValues={editValues} onChange={onChange} />
          <Field label="PHONE" value={client.business_phone} editKey="business_phone" editing={editing} editValues={editValues} onChange={onChange} />
          <div className="md:col-span-2">
            <Field label="ADDRESS / SERVICE AREA" value={client.business_address} editKey="business_address" editing={editing} editValues={editValues} onChange={onChange} />
          </div>
        </div>
      </div>

      {/* Domain & Web */}
      <div className="border border-white/8 rounded-sm bg-white/[0.03] p-5">
        <p className="text-[10px] font-mono tracking-widest text-white/30 mb-4">DOMAIN & WEB</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">CUSTOM DOMAIN</p>
            <div className="flex items-center gap-2">
              {client.custom_domain ? (
                <a href={`https://${client.custom_domain}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1">
                  <Globe size={12} /> {client.custom_domain}
                </a>
              ) : <span className="text-sm text-white/20">—</span>}
              <span className={`text-[10px] font-mono ${client.domain_status === 'verified' ? 'text-green-400' : client.domain_status === 'pending' ? 'text-yellow-400' : 'text-white/20'}`}>
                {client.domain_status}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">EMAIL MODE</p>
            <p className="text-sm text-white/70 font-mono">{client.email_mode || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-1">EMAIL DOMAIN</p>
            <p className={`text-sm font-mono ${client.email_domain_status === 'verified' ? 'text-green-400' : 'text-white/40'}`}>
              {client.email_domain_status || '—'}
            </p>
          </div>
        </div>

        {/* Embedded site preview */}
        {siteUrl && (
          <div className="mt-5">
            <p className="text-[10px] font-mono tracking-widest text-white/30 mb-2">LIVE SITE PREVIEW</p>
            <div className="border border-white/8 rounded-sm overflow-hidden" style={{ height: 400 }}>
              <iframe src={previewUrl} title="Client site" className="w-full h-full bg-white" />
            </div>
          </div>
        )}
      </div>

      {/* ERA Account (billing mirror) */}
      {client.era_account && (
        <div className="border border-white/8 rounded-sm bg-white/[0.03] p-5">
          <p className="text-[10px] font-mono tracking-widest text-white/30 mb-4">ERA BILLING ACCOUNT</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
            <div>
              <p className="text-[10px] font-mono text-white/30 mb-1">OWNER EMAIL</p>
              <p className="text-white/70">{client.era_account.owner_email || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/30 mb-1">STRIPE CUSTOMER</p>
              <p className="text-white/50 font-mono text-xs">{client.era_account.stripe_customer_id || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/30 mb-1">SETUP FEE PAID</p>
              <p className={`font-mono ${client.era_account.setup_fee_paid ? 'text-green-400' : 'text-white/30'}`}>
                {client.era_account.setup_fee_paid ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="text-[10px] font-mono text-white/20 px-1">
        Signed up: {client.created_date ? new Date(client.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} · {client.services_count} services · {client.team_count} team members
      </div>
    </div>
  );
}