import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { assertEraStaff } from '../../shared/eraStaffAuth.ts';

// ERA Systems cross-tenant staff console. Returns one row per tenant BusinessConfig with
// plan tier, signup date, contact info, domain/email status, and billing health.
//
// Authorization: EraStaff allowlist only (assertEraStaff). NOT role === 'admin' and NOT
// business_id — both would leak cross-tenant data to a tenant's own owner. All tenant
// reads use the service role to bypass per-tenant RLS. Every access is audited to
// SystemEventLog (who, when) under a platform-level business_id 'era_systems'.

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

    // Cross-tenant reads via service role — bypasses each entity's business_id RLS.
    const configs = await base44.asServiceRole.entities.BusinessConfig.list('-created_date', 200);
    const subs = await base44.asServiceRole.entities.VehicleSubscription.list('-created_date', 500);

    // Billing health per business_id
    const billingByBiz = {};
    for (const s of (subs || [])) {
      const bid = s.business_id || '_unknown';
      if (!billingByBiz[bid]) billingByBiz[bid] = { active: 0, past_due: 0, canceled: 0, trialing: 0 };
      const st = s.status || 'active';
      if (billingByBiz[bid][st] !== undefined) billingByBiz[bid][st]++;
    }

    const rows = (configs || []).map(c => ({
      business_id: c.business_id,
      business_name: c.business_name,
      plan_tier: c.plan_tier,
      ad_management_enabled: !!c.ad_management_enabled,
      signup_date: c.created_date,
      business_email: c.business_email || '',
      business_phone: c.business_phone || '',
      domain: c.custom_domain || '',
      domain_status: c.domain_status || 'none',
      email_mode: c.email_mode || 'shared',
      email_domain_status: c.email_domain_status || 'shared',
      is_active: c.is_active !== false,
      billing: billingByBiz[c.business_id] || { active: 0, past_due: 0, canceled: 0, trialing: 0 },
    }));

    // Audit: log staff access to the console (who, when). Scoped to platform-level
    // business_id 'era_systems' via the service role (bypasses tenant RLS).
    try {
      await base44.asServiceRole.entities.SystemEventLog.create({
        business_id: 'era_systems',
        event_type: 'era_staff_console_access',
        entity_type: 'era_staff',
        entity_id: auth.user.id,
        description: `ERA Systems staff console access by ${auth.user.email || auth.user.id}`,
        metadata: {
          staff_user_id: auth.user.id,
          staff_email: auth.user.email || '',
          staff_name: auth.staff?.name || '',
          tenants_viewed: rows.length,
        },
      });
    } catch (logErr) {
      console.error('EraStaff audit log failed:', logErr.message);
    }

    return Response.json({
      rows,
      staff: { name: auth.staff?.name || '', email: auth.staff?.email || '' },
    });
  } catch (error) {
    console.error('getEraStaffConsole error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}