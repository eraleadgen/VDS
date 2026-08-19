// Era Portal — Billing tab.
// Phase E1: renders the current plan + subscription status from the provisioned summary.
// Phase E3 will add upgrade/downgrade (Stripe subscription update w/ proration), the
// Ad Management add-on toggle, and a Stripe Customer Portal link for invoice history.
// Flags only change on webhook confirmation — never on button click.
export default function EraPortalBillingTab({ summary }) {
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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono-tech tracking-[0.3em] text-gold/70 mb-3">SUBSCRIPTION</p>
        <h2 className="text-3xl font-grotesk font-bold text-vapor">{tierLabel} Plan</h2>
        <p className={`text-xs font-mono-tech tracking-widest uppercase mt-2 ${statusColor}`}>
          {subStatus.replace('_', ' ')}
        </p>
        <p className="text-vapor/50 text-sm mt-3 max-w-lg">
          Plan changes, the Ad Management add-on, and invoice history will be managed here.
          All changes confirm via Stripe webhook before any flag updates.
        </p>
      </div>
    </div>
  );
}