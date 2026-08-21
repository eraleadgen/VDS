import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Check, AlertCircle, Loader2, Copy } from 'lucide-react';
import BrandingSection from '@/components/admin/BrandingSection';
import AutomationsSection from '@/components/admin/AutomationsSection';

const invoke = (payload) => base44.functions.invoke('tenantSettings', payload).then((r) => r.data ?? r);

export default function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Email state
  const [emailDomainInput, setEmailDomainInput] = useState('');
  const [emailRecords, setEmailRecords] = useState(null);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailFromName, setEmailFromName] = useState('');

  // Phone state
  const [phoneInput, setPhoneInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await invoke({ action: 'get' });
      if (r.error) setError(r.error);
      else {
        setSettings(r);
        setPhoneInput(r.business_phone || '');
        setEmailFromName(r.email_from_name || r.business_name || '');
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const fail = (msg) => { setError(msg); setTimeout(() => setError(''), 6000); };

  // ── Phone save ──
  const savePhone = async () => {
    setSaving('phone');
    try {
      const r = await invoke({ action: 'update_phone', phone: phoneInput });
      if (r.error) fail(r.error); else { flash('Phone number saved.'); setSettings((s) => ({ ...s, business_phone: phoneInput })); }
    } catch (e) { fail(e.message); }
    finally { setSaving(''); }
  };

  // ── Email: set shared ──
  const setShared = async () => {
    setSaving('email_shared');
    setError('');
    try {
      const r = await invoke({ action: 'set_email_shared', from_name: emailFromName });
      if (r.error) fail(r.error);
      else { flash('Email mode set to shared.'); setSettings((s) => ({ ...s, email_mode: 'shared', email_domain_status: 'shared' })); setEmailRecords(null); }
    } catch (e) { fail(e.message); }
    finally { setSaving(''); }
  };

  // ── Email: init custom ──
  const initEmailCustom = async () => {
    setSaving('email_init');
    setError('');
    try {
      const r = await invoke({ action: 'init_email_custom', email_domain: emailDomainInput });
      if (r.error) fail(r.error);
      else { setEmailRecords(r.records); setSettings((s) => ({ ...s, email_mode: 'custom', email_domain_status: 'pending', resend_domain_id: r.resend_domain_id })); }
    } catch (e) { fail(e.message); }
    finally { setSaving(''); }
  };

  // ── Email: verify custom ──
  const verifyEmailCustom = async () => {
    setEmailVerifying(true);
    setError('');
    try {
      const r = await invoke({ action: 'verify_email_custom' });
      if (r.error) fail(r.error);
      else if (r.verified) { flash('Email domain verified!'); setSettings((s) => ({ ...s, email_domain_status: 'verified' })); }
      else fail('Email domain not verified yet. Make sure all DNS records are added and propagated.');
    } catch (e) { fail(e.message); }
    finally { setEmailVerifying(false); }
  };

  const copyToClipboard = (text) => { navigator.clipboard?.writeText(text); };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold/40" /></div>;

  return (
    <div className="space-y-8 max-w-3xl">
      {error && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-sm px-3 py-2"><AlertCircle size={16} /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/20 border border-green-900/30 rounded-sm px-3 py-2"><Check size={16} /> {success}</div>}

      {/* ── BRANDING ── */}
      <BrandingSection settings={settings} onSaved={(r) => setSettings((s) => ({ ...s, ...r }))} />

      {/* ── EMAIL ── */}
      <section className="border border-vapor/10 rounded-sm bg-asphalt/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-gold" />
          <h3 className="font-grotesk text-lg text-vapor">Email Sending</h3>
          {settings?.email_mode === 'custom' && settings?.email_domain_status === 'verified' && <span className="ml-auto text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Custom domain verified</span>}
          {settings?.email_mode === 'shared' && <span className="ml-auto text-xs text-gold/50">Shared domain</span>}
        </div>

        {/* Two-card choice */}
        {!emailRecords && settings?.email_mode !== 'custom' && (
          <div className="space-y-3">
            {/* Card 1: Shared (recommended) */}
            <div className={`border rounded-sm p-4 cursor-pointer transition-colors ${settings?.email_mode === 'shared' ? 'border-gold bg-gold/5' : 'border-vapor/15 hover:border-vapor/25'}`}>
              <div className="flex items-start gap-3">
                <input type="radio" checked={settings?.email_mode === 'shared'} onChange={setShared} className="mt-1 accent-gold" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-grotesk text-vapor">Use ERA Systems shared domain</span>
                    <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded font-mono-tech">RECOMMENDED</span>
                  </div>
                  <p className="text-vapor/50 text-sm">No DNS setup required. Emails are sent as <span className="text-vapor/70">{settings?.business_name || 'Your Business'} &lt;noreply@erasystems.com&gt;</span>. Your clients see your business name as the sender.</p>
                </div>
              </div>
            </div>

            {/* Card 2: Custom */}
            <div className="border border-vapor/15 rounded-sm p-4 cursor-pointer hover:border-vapor/25 transition-colors">
              <div className="flex items-start gap-3">
                <input type="radio" checked={false} readOnly className="mt-1 accent-gold" />
                <div className="flex-1">
                  <span className="font-grotesk text-vapor">Use my own domain</span>
                  <p className="text-vapor/50 text-sm mb-3">Requires adding 3 DNS records (SPF, DKIM, MX) at your domain provider. Emails send from <code className="text-vapor/70 font-mono-tech text-xs">hello@yourdomain.com</code> for maximum brand trust.</p>
                  <div className="flex items-center gap-2">
                    <Input value={emailDomainInput} onChange={(e) => setEmailDomainInput(e.target.value)} placeholder="mail.yourdomain.com" className="bg-asphalt border-vapor/15 text-vapor text-sm flex-1" />
                    <Button onClick={initEmailCustom} disabled={saving === 'email_init' || !emailDomainInput.trim()} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk text-sm">
                      {saving === 'email_init' ? <Loader2 size={14} className="animate-spin" /> : 'Set Up'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom email: DNS records */}
        {emailRecords && (
          <div className="space-y-4">
            <div className="bg-obsidian/50 border border-vapor/10 rounded-sm p-4 space-y-3">
              <p className="text-vapor/60 text-sm">Add these DNS records at your domain provider, then click Verify:</p>
              {emailRecords.map((rec, i) => (
                <div key={i} className="border border-vapor/10 rounded-sm p-3 bg-asphalt/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono-tech text-gold bg-gold/10 px-2 py-0.5 rounded">{rec.type}</span>
                    {rec.priority && <span className="text-xs text-vapor/40">Priority: {rec.priority}</span>}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-vapor/40 text-xs w-16">Host:</span>
                      <code className="text-vapor/80 flex-1 font-mono-tech text-xs break-all">{rec.host}</code>
                      <button onClick={() => copyToClipboard(rec.host)} className="text-vapor/30 hover:text-gold"><Copy size={14} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-vapor/40 text-xs w-16">Value:</span>
                      <code className="text-vapor/80 flex-1 font-mono-tech text-xs break-all">{rec.value}</code>
                      <button onClick={() => copyToClipboard(rec.value)} className="text-vapor/30 hover:text-gold"><Copy size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={verifyEmailCustom} disabled={emailVerifying} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk">
                {emailVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify Domain'}
              </Button>
              <button onClick={() => setEmailRecords(null)} className="text-vapor/40 hover:text-vapor text-sm">← Back</button>
            </div>
          </div>
        )}

        {/* Already on custom: show status */}
        {settings?.email_mode === 'custom' && !emailRecords && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {settings.email_domain_status === 'verified' ? (
                <span className="text-green-400 flex items-center gap-1.5"><Check size={14} /> Custom email domain verified</span>
              ) : settings.email_domain_status === 'pending' ? (
                <span className="text-gold/70 flex items-center gap-1.5"><Loader2 size={14} /> Verification pending — add the DNS records and verify</span>
              ) : (
                <span className="text-red-400 flex items-center gap-1.5"><AlertCircle size={14} /> Verification failed</span>
              )}
            </div>
            {settings.email_domain_status !== 'verified' && (
              <Button onClick={verifyEmailCustom} disabled={emailVerifying} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                {emailVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Re-verify'}
              </Button>
            )}
            <button onClick={setShared} disabled={saving === 'email_shared'} className="block text-vapor/40 hover:text-vapor text-sm">
              ← Switch back to shared domain
            </button>
          </div>
        )}
      </section>

      {/* ── PHONE ── */}
      <section className="border border-vapor/10 rounded-sm bg-asphalt/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone size={18} className="text-gold" />
          <h3 className="font-grotesk text-lg text-vapor">Business Phone</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-vapor/60 text-xs font-mono-tech mb-1.5 block">PHONE NUMBER</Label>
            <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="(470) 555-1234" className="bg-asphalt border-vapor/15 text-vapor" />
            <p className="text-vapor/40 text-xs mt-1.5">This number appears on your website's contact section and tel: links. SMS/AI agent features require a Growth tier upgrade.</p>
          </div>
          <Button onClick={savePhone} disabled={saving === 'phone'} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk">
            {saving === 'phone' ? <Loader2 size={16} className="animate-spin" /> : 'Save Phone'}
          </Button>
        </div>
      </section>

      {/* ── AUTOMATIONS ── */}
      <AutomationsSection settings={settings} onSaved={(r) => setSettings((s) => ({ ...s, ...r }))} />
    </div>
  );
}