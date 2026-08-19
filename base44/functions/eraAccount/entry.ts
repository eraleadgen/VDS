import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ERA SaaS account self-service. Reads, creates, and updates the authenticated user's
// EraAccount. Called by:
// - EraRegister page (action: 'create') — after OTP, idempotently creates the EraAccount
// - EraPortal page (action: 'create' on load with ?init=1) — for Google OAuth users
// - Onboarding wizard (action: 'get') — reads tier + setup_fee_paid to decide flow
// - Onboarding wizard (action: 'update') — stamps onboarding_session_id after creating it
//
// EraAccount RLS: create by created_by_id, read/update by created_by_id OR owner_user_id.
// We use the user's own session for create (so created_by_id = user.id) and asServiceRole
// for reads/updates (bypasses RLS, safe since we filter by owner_user_id = me.id).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get';

    const findMyAccount = async () => {
      const accounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: me.id });
      return accounts && accounts[0];
    };

    if (action === 'get') {
      const account = await findMyAccount();
      return Response.json({ success: true, account });
    }

    if (action === 'create') {
      // Idempotent: return existing if found.
      let account = await findMyAccount();
      if (!account) {
        account = await base44.entities.EraAccount.create({
          owner_user_id: me.id,
          email: me.email,
        });
      }
      return Response.json({ success: true, account });
    }

    if (action === 'update') {
      const account = await findMyAccount();
      if (!account) return Response.json({ error: 'No EraAccount found' }, { status: 404 });
      const allowed = {};
      if (typeof body.onboarding_session_id === 'string') allowed.onboarding_session_id = body.onboarding_session_id;
      await base44.asServiceRole.entities.EraAccount.update(account.id, allowed);
      return Response.json({ success: true, account: { ...account, ...allowed } });
    }

    // Provisioned summary: EraAccount + the client's own BusinessConfig (by business_id)
    // + resolved live-site URL. This is the single round-trip the era-portal shell uses to
    // render all three tabs. On eraleadgen.com the BusinessConfigContext resolves to the
    // era_systems tenant, NOT the client's — so the portal must fetch the client's config
    // explicitly here rather than relying on the hostname-resolved context.
    if (action === 'get_provisioned_summary') {
      const account = await findMyAccount();
      if (!account) return Response.json({ success: true, summary: null });
      if (!account.business_id) {
        return Response.json({ success: true, summary: { account, business: null, site_url: null, site_url_source: 'none' } });
      }
      const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: account.business_id, is_active: true });
      const cfg = cfgs && cfgs[0];
      let site_url = null;
      let site_url_source = 'none';
      if (cfg) {
        if (cfg.custom_domain && cfg.domain_status === 'verified') {
          site_url = `https://${cfg.custom_domain}`;
          site_url_source = 'custom_domain';
        } else {
          const sessions = await base44.asServiceRole.entities.OnboardingSession.filter({ business_id: account.business_id }).catch(() => []);
          const sess = sessions && sessions[0];
          if (sess && sess.subdomain) {
            site_url = `https://${sess.subdomain}`;
            site_url_source = 'subdomain';
          }
        }
      }
      const business = cfg ? {
        business_name: cfg.business_name,
        logo_url: cfg.logo_url || null,
        custom_domain: cfg.custom_domain || null,
        domain_status: cfg.domain_status || 'none',
        email_mode: cfg.email_mode || 'shared',
        email_domain_status: cfg.email_domain_status || 'shared',
        business_phone: cfg.business_phone || null,
        plan_tier: cfg.plan_tier || 'basic',
        ad_management_enabled: !!cfg.ad_management_enabled,
        subscription_status: cfg.subscription_status || 'active',
      } : null;
      return Response.json({ success: true, summary: { account, business, site_url, site_url_source } });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('eraAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});