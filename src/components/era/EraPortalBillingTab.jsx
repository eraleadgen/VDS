// Era Portal — Billing tab.
// Phase E3: upgrade/downgrade (Stripe subscription price swap w/ proration),
// Ad Management add-on toggle, and Stripe Customer Portal link for invoices.
// Flags only change on webhook confirmation — never on button click. The UI
// shows a "pending confirmation" state after each action and re-fetches the
// summary so the user sees the update once the webhook lands.
import { useState } from 'react';
import { Loader2, ArrowRight, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const invokeBilling = (payload) => base44.functions.invoke('eraBilling', payload).then(r => r.data ?? r);

const TIER_LABEL = { basic: 'Basic', foundation: 'Foundation', growth: 'Growth', enterprise: 'Enterprise' };
const TIER_PRICE = { basic: '$199/mo', foundation: '$499/mo' };

export default function EraPortalBillingTab({ summary, onRefresh }) {
  const account = summary?.account;
  const tier = account?.current_plan_tier || 'basic';
  const subStatus = account?.subscription_status || 'none';
  const adEnabled = !!account?.ad_management_enabled;
  const tierLabel = TIER_LABEL[tier] || 'Basic';

  const [busy, setBusy] = useState(null); // 'upgrade' | 'downgrade' | 'ad' | 'portal'
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const isLive = typeof window !== 'undefined' && window.location.hostname.includes('eraleadgen.com');
  const mode = isLive ? 'live' : 'test';

  const statusColor = {
    active: 'text-gold', trialing: 'text-gold', past_due: 'text-red-400',
    canceled: 'text-vapor/40', none: 'text-vapor/40',
  }[subStatus] || 'text-vapor/60';

  const run = async (key, payload, successMsg) => {
    setErr(''); setMsg(''); setBusy(key);
    try {
      const res = await invokeBilling({ ...payload, mode });
      const data = res.data || res;
      if (data.url) {
        window.location.href = data.url;
        return; // redirecting
      }
      if (data.success === false || data.error) {
        setErr(data.error || 'Action failed');
      } else {
        setMsg(data.message || successMsg);
        // Re-fetch after a short delay so the webhook has time to land.
        setTimeout(() => { onRefresh?.(); }, 3000);
      }
    } catch (e) {
      setErr(e.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const handleTierChange = () => {
    const newTier = tier === 'basic' ? 'foundation' : 'basic';
    const label = newTier.charAt(0).toUpperCase() + newTier.slice(1);
    const confirmMsg = tier === 'basic'
      ? `Upgrade to Foundation? Your subscription will be prorated and your features unlock once Stripe confirms.`
      : `Downgrade to Basic? Your subscription will be prorated. Foundation features (member portal, specialist portal, automations) will retract once Stripe confirms.`;
    if (!window.confirm(confirmMsg)) return;
    run(tier === 'basic' ? 'upgrade' : 'downgrade', { action: 'change_tier', tier: newTier }, `Plan change to ${label} submitted.`);
  };

  const handleAdToggle = () => {
    const action = adEnabled ? 'remove' : 'add';
    if (!window.confirm(`${adEnabled ? 'Remove' : 'Add'} Ad Management? This is a ${adEnabled ? 'prorated removal' : 'prorated $500/mo add-on'} and updates once Stripe confirms.`)) return;
    run('ad', { action: 'toggle_ad_management', enable: !adEnabled }, `Ad Management ${action} submitted.`);
  };

  const handlePortal = () => run('portal', { action: 'portal_session' }, 'Opening billing portal…');

  const canChangeTier = tier === 'basic' || tier === 'foundation';

  return (
    <div className="space-y-8">
      {/* Subscription summary */}
      <div>
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">SUBSCRIPTION</p>
        <div className="flex items-baseline gap-4 flex-wrap">
          <h2 className="text-3xl font-grotesk font-bold text-vapor">{tierLabel} Plan</h2>
          <span className="text-sm text-vapor/50 font-mono-tech">{TIER_PRICE[tier] || ''}</span>
        </div>
        <p className={`text-xs font-mono-tech tracking-widest uppercase mt-2 ${statusColor}`}>
          {subStatus.replace('_', ' ')}
        </p>
      </div>

      {err && (
        <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono-tech">
          {err}
        </div>
      )}
      {msg && !err && (
        <div className="p-3 rounded-sm bg-gold/10 border border-gold/20 text-gold text-xs font-mono-tech flex items-center gap-2">
          <CheckCircle2 size={14} /> {msg}
        </div>
      )}

      {/* Plan change */}
      {canChangeTier && (
        <div className="glass-panel p-5 rounded-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-grotesk font-bold text-vapor">
                {tier === 'basic' ? 'Upgrade to Foundation' : 'Downgrade to Basic'}
              </p>
              <p className="text-vapor/50 text-xs mt-1 max-w-md">
                {tier === 'basic'
                  ? 'Unlock the member portal, specialist portal, and automations. Prorated charge applies immediately.'
                  : 'Foundation features will retract once Stripe confirms. Prorated credit applies.'}
              </p>
            </div>
            <button
              onClick={handleTierChange}
              disabled={!!busy}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm transition-colors shrink-0 ${
                tier === 'basic'
                  ? 'bg-gold text-obsidian hover:bg-gold-light'
                  : 'border border-vapor/20 text-vapor/70 hover:bg-vapor/10'
              } disabled:opacity-50`}
            >
              {busy === 'upgrade' || busy === 'downgrade' ? (
                <><Loader2 size={14} className="animate-spin" /> PROCESSING…</>
              ) : (
                <>{tier === 'basic' ? 'UPGRADE' : 'DOWNGRADE'} <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Ad Management add-on */}
      <div className="glass-panel p-5 rounded-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-grotesk font-bold text-vapor flex items-center gap-2">
              <Sparkles size={14} className="text-gold" /> Ad Management
            </p>
            <p className="text-vapor/50 text-xs mt-1 max-w-md">
              $500/mo add-on. Manage Google Ads campaigns directly from your dashboard. {tier === 'enterprise' ? 'Included at Enterprise.' : 'Available on any tier.'}
            </p>
            <p className={`text-[10px] font-mono-tech tracking-widest mt-2 ${adEnabled ? 'text-gold' : 'text-vapor/40'}`}>
              STATUS: {adEnabled ? 'ACTIVE' : 'NOT ACTIVE'}
            </p>
          </div>
          <button
            onClick={handleAdToggle}
            disabled={!!busy || tier === 'enterprise'}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm transition-colors shrink-0 ${
              adEnabled
                ? 'border border-vapor/20 text-vapor/70 hover:bg-vapor/10'
                : 'bg-gold text-obsidian hover:bg-gold-light'
            } disabled:opacity-50`}
          >
            {busy === 'ad' ? <><Loader2 size={14} className="animate-spin" /> PROCESSING…</> : (adEnabled ? 'REMOVE' : 'ADD')}
          </button>
        </div>
      </div>

      {/* Billing portal / invoices */}
      <div className="pt-6 border-t border-vapor/10">
        <button
          onClick={handlePortal}
          disabled={!!busy}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono-tech tracking-widest rounded-sm border border-vapor/20 text-vapor/70 hover:bg-vapor/10 transition-colors disabled:opacity-50"
        >
          {busy === 'portal' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          VIEW INVOICES & BILLING PORTAL
        </button>
        <p className="text-vapor/40 text-xs font-mono-tech mt-3">
          Opens Stripe's secure portal to view invoices, update your card, and download receipts.
        </p>
      </div>
    </div>
  );
}