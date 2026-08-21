import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { assertEraStaff } from '../../shared/eraStaffAuth.ts';

// ERA Systems master admin function — cross-tenant read/write for ERA staff only.
// Actions:
//   get_clients      — returns all BusinessConfigs with rich detail
//   get_client       — single BusinessConfig by business_id
//   update_client    — patch any fields on a BusinessConfig by business_id
//   get_overview     — aggregate stats (tenant count, tier breakdown, MRR estimate)

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await assertEraStaff(base44);
    if (!auth.authorized) {
      return Response.json(
        { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden: ERA Systems staff only' },
        { status: auth.status }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, business_id, updates } = body;

    // ── get_clients ──────────────────────────────────────────────
    if (action === 'get_clients') {
      const configs = await base44.asServiceRole.entities.BusinessConfig.list('-created_date', 200);
      const eraAccounts = await base44.asServiceRole.entities.EraAccount.list('-created_date', 200);
      const accountByBiz: Record<string, any> = {};
      for (const a of (eraAccounts || [])) {
        if (a.business_id) accountByBiz[a.business_id] = a;
      }

      const clients = (configs || []).map(c => ({
        id: c.id,
        business_id: c.business_id,
        business_name: c.business_name,
        business_short_name: c.business_short_name || '',
        legal_name: c.legal_name || '',
        tagline: c.tagline || '',
        logo_url: c.logo_url || '',
        plan_tier: c.plan_tier || 'basic',
        subscription_status: c.subscription_status || 'active',
        ad_management_enabled: !!c.ad_management_enabled,
        business_email: c.business_email || '',
        business_phone: c.business_phone || '',
        business_address: c.business_address || '',
        service_areas: c.service_areas || [],
        custom_domain: c.custom_domain || '',
        domain_status: c.domain_status || 'none',
        email_mode: c.email_mode || 'shared',
        email_domain_status: c.email_domain_status || 'shared',
        is_active: c.is_active !== false,
        created_date: c.created_date,
        timezone: c.timezone || '',
        website_links: c.website_links || {},
        social_links: c.social_links || {},
        services_count: (c.services || []).length,
        team_count: (c.technicians || []).length,
        era_account: accountByBiz[c.business_id] ? {
          stripe_customer_id: accountByBiz[c.business_id].stripe_customer_id || '',
          stripe_subscription_id: accountByBiz[c.business_id].stripe_subscription_id || '',
          subscription_status: accountByBiz[c.business_id].subscription_status || 'none',
          setup_fee_paid: !!accountByBiz[c.business_id].setup_fee_paid,
          owner_email: accountByBiz[c.business_id].email || '',
        } : null,
      }));

      return Response.json({ success: true, clients });
    }

    // ── get_client ────────────────────────────────────────────────
    if (action === 'get_client') {
      if (!business_id) return Response.json({ error: 'business_id required' }, { status: 400 });
      const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id });
      const config = configs?.[0];
      if (!config) return Response.json({ error: 'Client not found' }, { status: 404 });
      return Response.json({ success: true, client: config });
    }

    // ── update_client ─────────────────────────────────────────────
    if (action === 'update_client') {
      if (!business_id) return Response.json({ error: 'business_id required' }, { status: 400 });
      if (!updates || typeof updates !== 'object') return Response.json({ error: 'updates required' }, { status: 400 });

      const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id });
      const config = configs?.[0];
      if (!config) return Response.json({ error: 'Client not found' }, { status: 404 });

      // Safety: block changing business_id or id
      const { id: _id, business_id: _bid, ...safeUpdates } = updates;
      const updated = await base44.asServiceRole.entities.BusinessConfig.update(config.id, safeUpdates);

      // Audit log
      try {
        await base44.asServiceRole.entities.SystemEventLog.create({
          business_id: 'era_systems',
          event_type: 'era_admin_client_update',
          entity_type: 'BusinessConfig',
          entity_id: config.id,
          description: `ERA admin updated ${config.business_name} (${business_id}) — fields: ${Object.keys(safeUpdates).join(', ')}`,
          metadata: { staff_user_id: auth.user.id, business_id, fields: Object.keys(safeUpdates) },
        });
      } catch (_) {}

      return Response.json({ success: true, client: updated });
    }

    // ── get_overview ──────────────────────────────────────────────
    if (action === 'get_overview') {
      const configs = await base44.asServiceRole.entities.BusinessConfig.list('-created_date', 200);
      const active = (configs || []).filter(c => c.is_active !== false);
      const tierCounts: Record<string, number> = { basic: 0, foundation: 0, growth: 0, enterprise: 0 };
      const TIER_MRR: Record<string, number> = { basic: 199, foundation: 499, growth: 899, enterprise: 1499 };
      let mrr = 0;
      let adCount = 0;
      for (const c of active) {
        const t = c.plan_tier || 'basic';
        tierCounts[t] = (tierCounts[t] || 0) + 1;
        if (c.subscription_status === 'active') {
          mrr += TIER_MRR[t] || 199;
          if (c.ad_management_enabled && t !== 'enterprise') mrr += 500;
        }
        if (c.ad_management_enabled) adCount++;
      }
      return Response.json({
        success: true,
        overview: {
          total_clients: active.length,
          tier_counts: tierCounts,
          mrr_estimate: mrr,
          ad_clients: adCount,
          recent_signups: (configs || []).slice(0, 5).map(c => ({
            business_name: c.business_name,
            plan_tier: c.plan_tier,
            created_date: c.created_date,
          })),
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('eraAdmin error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}