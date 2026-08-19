// Era Portal — Plan & Features tab.
// Phase E2: full feature matrix driven by the same rules as planFeatures.ts
// (the backend gating source of truth), so the display never drifts from what
// actually gates the tenant dashboard. Display-only — upgrade actions live in
// the Billing tab.
import { Check, Lock, Sparkles, ArrowRight } from 'lucide-react';

// Mirrors base44/shared/planFeatures.ts FEATURE_MIN_TIER exactly.
// If the gating map changes there, update this list to match.
const FEATURE_GROUPS = [
  {
    label: 'Core Platform',
    minTier: 'basic',
    features: [
      { key: 'website', label: 'Branded website' },
      { key: 'ai_chat_widget', label: 'AI concierge chat widget' },
      { key: 'core_engines', label: 'CRM, job & pricing engines' },
      { key: 'booking', label: 'Online booking & scheduling' },
      { key: 'payments', label: 'Payments & invoicing' },
      { key: 'admin_dashboard', label: 'Admin dashboard' },
      { key: 'self_serve_domain', label: 'Self-serve domain & email' },
    ],
  },
  {
    label: 'Portals & Automation',
    minTier: 'foundation',
    features: [
      { key: 'member_portal', label: 'Customer member portal' },
      { key: 'specialist_portal', label: 'Specialist / employee portal' },
      { key: 'simple_automations', label: 'Simple automations & reminders' },
    ],
  },
  {
    label: 'AI Agents',
    minTier: 'growth',
    features: [
      { key: 'ai_sms_agent', label: 'AI SMS agent (Valerie)' },
      { key: 'ai_voice_agent', label: 'AI voice agent' },
    ],
  },
  {
    label: 'Growth & Analytics',
    minTier: 'enterprise',
    features: [
      { key: 'partner_engine', label: 'Partner / referral engine' },
      { key: 'advanced_analytics', label: 'Advanced analytics & reporting' },
    ],
  },
];

const TIER_RANK = { basic: 0, foundation: 1, growth: 2, enterprise: 3 };
const TIER_LABEL = { basic: 'Basic', foundation: 'Foundation', growth: 'Growth', enterprise: 'Enterprise' };

function hasFeature(planTier, featureMinTier) {
  return (TIER_RANK[planTier] || 0) >= (TIER_RANK[featureMinTier] || 0);
}

export default function EraPortalPlanTab({ summary, onNavigate }) {
  const tier = summary?.account?.current_plan_tier || 'basic';
  const subStatus = summary?.account?.subscription_status || 'none';
  const adEnabled = summary?.account?.ad_management_enabled;
  const tierLabel = TIER_LABEL[tier] || 'Basic';

  const statusColor = {
    active: 'text-gold',
    trialing: 'text-gold',
    past_due: 'text-red-400',
    canceled: 'text-vapor/40',
    none: 'text-vapor/40',
  }[subStatus] || 'text-vapor/60';

  const canUpgrade = tier === 'basic'; // Foundation is the only purchasable upgrade tier today.

  return (
    <div className="space-y-10">
      {/* Current plan header */}
      <div>
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">CURRENT PLAN</p>
        <div className="flex items-baseline gap-4 flex-wrap">
          <h2 className="text-4xl font-grotesk font-bold text-vapor">{tierLabel}</h2>
          <span className={`text-xs font-mono-tech tracking-widest uppercase ${statusColor}`}>
            {subStatus.replace('_', ' ')}
          </span>
        </div>
        <p className="text-vapor/50 text-sm mt-3 max-w-lg">
          Your feature access is determined by this tier. The matrix below is pulled from the same
          rules engine that gates your dashboard — what you see here is exactly what's active.
        </p>
      </div>

      {/* Ad Management add-on status */}
      <div className="glass-panel p-5 rounded-sm flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-grotesk font-bold text-vapor flex items-center gap-2">
            <Sparkles size={14} className="text-gold" /> Ad Management
          </p>
          <p className="text-vapor/50 text-xs mt-1">Paid add-on, available on any tier. {tier === 'enterprise' ? 'Included at Enterprise.' : ''}</p>
        </div>
        <span className={`text-[10px] font-mono-tech tracking-widest ${adEnabled ? 'text-gold' : 'text-vapor/40'}`}>
          {adEnabled ? 'ACTIVE' : 'NOT ACTIVE'}
        </span>
      </div>

      {/* Feature matrix */}
      <div className="space-y-6">
        {FEATURE_GROUPS.map(group => {
          const groupIncluded = hasFeature(tier, group.minTier);
          return (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-grotesk font-bold text-vapor">{group.label}</h3>
                <span className={`text-[10px] font-mono-tech tracking-widest ${groupIncluded ? 'text-gold' : 'text-vapor/40'}`}>
                  {groupIncluded ? 'INCLUDED' : `REQUIRES ${TIER_LABEL[group.minTier].toUpperCase()}`}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {group.features.map(f => {
                  const included = hasFeature(tier, group.minTier);
                  return (
                    <div
                      key={f.key}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-sm border ${included ? 'border-gold/20 bg-gold/5' : 'border-vapor/10 bg-vapor/[0.02]'}`}
                    >
                      {included ? (
                        <Check size={14} className="text-gold shrink-0" />
                      ) : (
                        <Lock size={14} className="text-vapor/30 shrink-0" />
                      )}
                      <span className={`text-sm ${included ? 'text-vapor' : 'text-vapor/40'}`}>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {canUpgrade && (
        <div className="pt-6 border-t border-vapor/10">
          <button
            onClick={() => onNavigate?.('billing')}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-mono-tech tracking-widest rounded-sm bg-gold text-obsidian hover:bg-gold-light transition-colors"
          >
            UPGRADE TO FOUNDATION <ArrowRight size={14} />
          </button>
          <p className="text-vapor/40 text-xs font-mono-tech mt-3">
            Unlock the member portal, specialist portal, and automations.
          </p>
        </div>
      )}
    </div>
  );
}