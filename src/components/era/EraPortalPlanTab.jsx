// Era Portal — Plan & Features tab.
// Phase E1: renders the current tier + subscription status from the provisioned summary.
// Phase E2 will expand this into the full feature matrix driven by planFeatures.ts
// (the same matrix that gates the tenant dashboard), so the display never drifts from
// what actually gates.
export default function EraPortalPlanTab({ summary }) {
  const tier = summary?.account?.current_plan_tier || 'basic';
  const subStatus = summary?.account?.subscription_status || 'none';
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  const statusColor = {
    active: 'text-gold',
    trialing: 'text-gold',
    past_due: 'text-red-400',
    canceled: 'text-vapor/40',
    none: 'text-vapor/40',
  }[subStatus] || 'text-vapor/60';
  const statusLabel = subStatus.replace('_', ' ');

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">CURRENT PLAN</p>
        <div className="flex items-baseline gap-4">
          <h2 className="text-4xl font-grotesk font-bold text-vapor">{tierLabel}</h2>
          <span className={`text-xs font-mono-tech tracking-widest uppercase ${statusColor}`}>{statusLabel}</span>
        </div>
        <p className="text-vapor/50 text-sm mt-3 max-w-lg">
          Your feature access is determined by this tier. The full feature matrix — pulled from
          the same rules engine that gates your dashboard — will appear here.
        </p>
      </div>
    </div>
  );
}