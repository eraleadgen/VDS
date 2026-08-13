// getAdvancedAnalytics — admin-only business intelligence endpoint.
// Returns aggregated revenue trends, customer LTV, repeat-vs-new breakdown,
// and service-type profitability for the admin's tenant.
// Every query is scoped by the admin's business_id (same pattern as adminMetrics).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getUserBusinessId } from '../../shared/tenantContext.ts';
import { hasFeature } from '../../shared/planFeatures.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });

    const businessId = await getUserBusinessId(base44, user);

    // Feature gate: advanced_analytics is Enterprise+.
    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true });
    const cfg = configs && configs[0];
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 500 });
    if (!hasFeature(cfg.plan_tier || 'basic', 'advanced_analytics')) {
      return Response.json({ error: 'Advanced analytics is not available on your current plan.' }, { status: 403 });
    }

    const svcCatalog = cfg.services || [];
    const labelForKey = (key: string): string => {
      const svc = svcCatalog.find(s => s.key === key);
      return (svc && svc.label) || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // ── 1. Revenue Trends — last 12 months of paid invoice revenue ────────
    const invoices = await base44.asServiceRole.entities.Invoice.filter(
      { business_id: businessId, payment_status: 'paid' }, '-paid_date', 500
    );
    const now = new Date();
    const monthlyRevenue: Record<string, number> = {};
    for (const inv of (invoices || [])) {
      if (!inv.paid_date) continue;
      const d = new Date(inv.paid_date + 'T00:00:00');
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (inv.final_amount || inv.amount || 0);
    }
    // Fill all 12 months (including zero-revenue months) for a continuous chart.
    const revenueTrends: Array<{ month: string; revenue: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueTrends.push({ month: monthKey, revenue: monthlyRevenue[monthKey] || 0 });
    }

    // ── 2. Customer Lifetime Value ────────────────────────────────────────
    const customers = await base44.asServiceRole.entities.Customer.filter(
      { business_id: businessId }, '-lifetime_revenue', 500
    );
    const allCustomers = customers || [];
    const totalLtv = allCustomers.reduce((sum, c) => sum + (c.lifetime_revenue || 0), 0);
    const avgLtv = allCustomers.length > 0 ? Math.round(totalLtv / allCustomers.length) : 0;
    const topCustomers = allCustomers.slice(0, 10).map((c) => ({
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown',
      ltv: c.lifetime_revenue || 0,
      jobs: c.total_jobs || 0,
    }));

    // ── 3. Repeat vs. New Customers ───────────────────────────────────────
    // New = exactly 1 lifetime job; Repeat = 2+ lifetime jobs.
    const newCount = allCustomers.filter((c) => (c.total_jobs || 0) === 1).length;
    const repeatCount = allCustomers.filter((c) => (c.total_jobs || 0) >= 2).length;

    // ── 4. Service-Type Profitability ─────────────────────────────────────
    const jobs = await base44.asServiceRole.entities.Job.filter(
      { business_id: businessId }, '-updated_date', 500
    );
    const serviceRevenue: Record<string, number> = {};
    const serviceCounts: Record<string, number> = {};
    for (const job of (jobs || [])) {
      if (job.status === 'cancelled') continue;
      const key = job.service_package || 'unknown';
      const revenue = job.final_price || job.estimated_price || 0;
      serviceRevenue[key] = (serviceRevenue[key] || 0) + revenue;
      serviceCounts[key] = (serviceCounts[key] || 0) + 1;
    }
    const serviceProfitability = Object.keys(serviceRevenue)
      .map((key) => ({
        service_key: key,
        label: labelForKey(key),
        revenue: serviceRevenue[key],
        count: serviceCounts[key],
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return Response.json({
      revenueTrends,
      avgLtv,
      topCustomers,
      customerBreakdown: { new: newCount, repeat: repeatCount },
      serviceProfitability,
    });
  } catch (error) {
    console.error('getAdvancedAnalytics error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}