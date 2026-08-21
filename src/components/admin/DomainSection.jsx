import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Check, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';

const invoke = (payload) => base44.functions.invoke('tenantSettings', payload).then((r) => r.data ?? r);

export default function DomainSection() {
  const [settings, setSettings] = useState(null);
  const [domainInput, setDomainInput] = useState('');
  const [domainRecords, setDomainRecords] = useState(null);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [desiredDomain, setDesiredDomain] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await invoke({ action: 'get' });
      if (r.error) setError(r.error);
      else {
        setSettings(r);
        setDomainInput(r.custom_domain || '');
        if (r.domain_status === 'pending' && r.custom_domain && r.domain_verification_token) {
          setDomainRecords([
            { type: 'TXT', host: `_era-verify.${r.custom_domain}`, value: r.domain_verification_token, description: 'Verification record' },
            { type: 'CNAME', host: r.custom_domain, value: `${r.business_name ? '' : ''}erasystems.com`, description: 'Points to ERA Systems' },
          ]);
        }
      }
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const fail = (msg) => { setError(msg); setTimeout(() => setError(''), 6000); };

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

  const copyToClipboard = (text) => { navigator.clipboard?.writeText(text); };

  return (
    <section className="border border-vapor/10 rounded-sm bg-asphalt/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={18} className="text-gold" />
        <h3 className="font-grotesk text-lg text-vapor">Custom Domain</h3>
        {settings?.domain_status === 'verified' && <span className="ml-auto text-xs text-green-400 flex items-center gap-1"><Check size={12} /> Verified</span>}
        {settings?.domain_status === 'pending' && <span className="ml-auto text-xs text-gold/70 flex items-center gap-1"><Loader2 size={12} /> Pending verification</span>}
      </div>

      {error && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/20 border border-red-900/30 rounded-sm px-3 py-2 mb-4"><AlertCircle size={16} /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-950/20 border border-green-900/30 rounded-sm px-3 py-2 mb-4"><Check size={16} /> {success}</div>}

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
  );
}