import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Mail, Phone, Check, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import BrandingSection from '@/components/admin/BrandingSection';
import AutomationsSection from '@/components/admin/AutomationsSection';

const invoke = (payload) => base44.functions.invoke('tenantSettings', payload).then((r) => r.data ?? r);

export default function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Domain state
  const [domainInput, setDomainInput] = useState('');
  const [domainRecords, setDomainRecords] = useState(null);
  const [domainVerifying, setDomainVerifying] = useState(false);

  // Domain purchase request
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [desiredDomain, setDesiredDomain] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

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
        setDomainInput(r.custom_domain || '');
        if (r.domain_status === 'pending' && r.custom_domain && r.domain_verification_token) {
          setDomainRecords([
            { type: 'TXT', host: `_era-verify.${r.custom_domain}`, value: r.domain_verification_token, description: 'Verification record' },
            { type: 'CNAME', host: r.custom_domain, value: `${r.business_name ? '' : ''}erasystems.com`, description: 'Points to ERA Systems' },
          ]);
        }
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

  // ── Domain init ──
  const initDomain = async () => {
    setSaving('domain_init');
    setError('');
    try {
      const r = await invoke({ action: 'init_domain', domain: domainInput });
      if (r.error) fail(r.error);
      else {
        setDomainRecords(r.records);
        setSettings((s) => ({ ...s, custom_domain: r.domain, domain_status: 'pending', domain_verification_token: r.token }));
      }
    } catch (e) { fail(e.message); }
    finally { setSaving(''); }
  };

  // ── Domain verify ──
  const verifyDomain = async () => {
    setDomainVerifying(true);
    setError('');
    try {
      const r = await invoke({ action: 'verify_domain' });
      if (r.error) fail(r.error);
      else if (r.verified) { flash('Domain verified! Your custom domain is now active.'); setSettings((s) => ({ ...s, domain_status: 'verified' })); }
      else fail(r.message || 'DNS records not found yet. Propagation can take up to 48 hours.');
    } catch (e) { fail(e.message); }
    finally { setDomainVerifying(false); }
  };

  // ── Domain purchase request ──
  const requestPurchase = async () => {
    setSaving('purchase');
    setError('');
    try {
      const r = await invoke({ action: 'request_domain_purchase', desired_domain: desiredDomain, notes: purchaseNotes });
      if (r.error) fail(r.error);
      else { flash(r.message || 'Request submitted.'); setShowPurchaseForm(false); setDesiredDomain(''); setPurchaseNotes(''); }
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

      {/* ── DOMAIN ── */}
      <section className="border border-vapor/10 rounded-sm bg-asphalt/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-gold" />
          <h3 className="font-grotesk text-lg text-vapor">Custom Domain</h3>
          {settings?.domain_status === 'verified' && <span className="ml-auto text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Verified</span>}
          {settings?.domain_status === 'pending' && <span className="ml-auto text-xs text-gold/70 flex items-center gap-1"><Loader2 size={12} /> Pending verification</span>}
        </div>

        {!domainRecords ? (
          <div className="space-y-4">
            <div>
              <Label className="text-vapor/60 text-xs font-mono-tech mb-1.5 block">YOUR DOMAIN</Label>
              <Input value={domainInput} onChange={(e) => setDomainInput(e.target.value)} placeholder="bobsdetail.com" className="bg-asphalt border-vapor/15 text-vapor" />
              <p className="text-vapor/40 text-xs mt-1.5">Enter a domain you already own. We'll show you the DNS records to add.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={initDomain} disabled={saving === 'domain_init' || !domainInput.trim()} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk">
                {saving === 'domain_init' ? <Loader2 size={16} className="animate-spin" /> : 'Get DNS Records'}
              </Button>
              <button onClick={() => setShowPurchaseForm(!showPurchaseForm)} className="text-vapor/50 hover:text-gold text-sm font-grotesk">
                I need a new domain →
              </button>
            </div>

            {showPurchaseForm && (
              <div className="mt-4 pt-4 border-t border-vapor/10 space-y-3">
                <p className="text-vapor/50 text-sm">Tell us the domain you'd like and our team will handle the purchase and setup for you.</p>
                <Input value={desiredDomain} onChange={(e) => setDesiredDomain(e.target.value)} placeholder="mybusiness.com" className="bg-asphalt border-vapor/15 text-vapor" />
                <Textarea value={purchaseNotes} onChange={(e) => setPurchaseNotes(e.target.value)} placeholder="Any notes (optional)..." className="bg-asphalt border-vapor/15 text-vapor" rows={2} />
                <Button onClick={requestPurchase} disabled={saving === 'purchase' || !desiredDomain.trim()} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                  {saving === 'purchase' ? <Loader2 size={16} className="animate-spin" /> : 'Submit Request'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-obsidian/50 border border-vapor/10 rounded-sm p-4 space-y-3">
              <p className="text-vapor/60 text-sm">Add these DNS records at your domain provider:</p>
              {domainRecords.map((rec, i) => (
                <div key={i} className="border border-vapor/10 rounded-sm p-3 bg-asphalt/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono-tech text-gold bg-gold/10 px-2 py-0.5 rounded">{rec.type}</span>
                    <span className="text-vapor/40 text-xs">{rec.description}</span>
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
              <Button onClick={verifyDomain} disabled={domainVerifying} className="bg-gold text-obsidian hover:bg-gold-light font-grotesk">
                {domainVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify Now'}
              </Button>
              <button onClick={() => setDomainRecords(null)} className="text-vapor/40 hover:text-vapor text-sm">← Back</button>
              <a href="https://dns.google/" target="_blank" rel="noopener noreferrer" className="ml-auto text-vapor/30 hover:text-gold text-xs flex items-center gap-1">
                Check DNS <ExternalLink size={12} />
              </a>
            </div>
            {settings?.domain_status === 'verified' && (
              <p className="text-green-400 text-sm flex items-center gap-1.5"><Check size={14} /> Your domain is verified and active.</p>
            )}
          </div>
        )}
      </section>

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