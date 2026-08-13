// tenantSettings — self-serve domain, email, and phone connection settings.
// Available from the admin dashboard at any time (not just during onboarding).
//
// Actions:
//   - get:                     Load current domain/email/phone settings from BusinessConfig.
//   - update_phone:            Update business_phone (display-only, no Twilio provisioning).
//   - init_domain:             Generate a verification token for a custom domain, return DNS records.
//   - verify_domain:           Check DNS via Google DoH for the verification TXT record.
//   - request_domain_purchase: Log a SystemEventLog for ERA Systems staff to handle manually.
//   - init_email_custom:       Call Resend POST /domains to create a per-tenant sending domain.
//   - verify_email_custom:     Call Resend POST /domains/{id}/verify.
//   - set_email_shared:        Switch email_mode to 'shared' (no DNS, uses ERA Systems domain).
//
// Auth: authenticated admin only. business_id is derived from the admin's own User record
// via getUserBusinessId — NEVER from the request body. An admin can only modify their own
// tenant's settings.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getUserBusinessId } from '../../shared/tenantContext.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Auth: require authenticated admin.
    let me = null;
    try { me = await base44.auth.me(); } catch {}
    if (!me || !me.id) return Response.json({ error: 'Authentication required.' }, { status: 401 });
    if (me.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });

    // business_id is ALWAYS derived from the admin's own User record — never from the body.
    // This prevents any admin from modifying another tenant's settings.
    const businessId = await getUserBusinessId(base44, me);

    // Load the tenant's active BusinessConfig.
    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId, is_active: true }).catch(() => []);
    const cfg = configs && configs[0];
    if (!cfg) return Response.json({ error: 'BusinessConfig not found.' }, { status: 404 });

    // ── get: return current settings ────────────────────────────────────
    if (action === 'get') {
      return Response.json({
        business_phone: cfg.business_phone || '',
        custom_domain: cfg.custom_domain || '',
        domain_status: cfg.domain_status || 'none',
        domain_verification_token: cfg.domain_verification_token || '',
        email_mode: cfg.email_mode || 'shared',
        email_from_name: cfg.email_from_name || cfg.business_name || '',
        resend_domain_id: cfg.resend_domain_id || '',
        email_domain_status: cfg.email_domain_status || 'shared',
        business_name: cfg.business_name || '',
      });
    }

    // ── update_phone: save business phone (display-only) ─────────────────
    if (action === 'update_phone') {
      const { phone } = body;
      if (!phone || !phone.trim()) return Response.json({ error: 'Phone number is required.' }, { status: 400 });
      await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, { business_phone: phone.trim() });
      return Response.json({ success: true, business_phone: phone.trim() });
    }

    // ── init_domain: generate verification token + return DNS records ───
    if (action === 'init_domain') {
      const { domain } = body;
      if (!domain || !domain.trim()) return Response.json({ error: 'Domain is required.' }, { status: 400 });
      const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

      // Generate a random verification token.
      const token = 'era-' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);

      await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, {
        custom_domain: cleanDomain,
        domain_status: 'pending',
        domain_verification_token: token,
      });

      return Response.json({
        domain: cleanDomain,
        token,
        records: [
          {
            type: 'TXT',
            host: `_era-verify.${cleanDomain}`,
            value: token,
            description: 'Verification record — proves you own this domain.',
          },
          {
            type: 'CNAME',
            host: cleanDomain,
            value: `${businessId}.erasystems.com`,
            description: 'Points your domain to your ERA Systems site.',
          },
        ],
      });
    }

    // ── verify_domain: check DNS via Google DoH ─────────────────────────
    if (action === 'verify_domain') {
      const token = cfg.domain_verification_token;
      const domain = cfg.custom_domain;
      if (!token || !domain) return Response.json({ error: 'No domain verification in progress.' }, { status: 400 });

      try {
        const dohRes = await fetch(`https://dns.google/resolve?name=_era-verify.${domain}&type=TXT`);
        const dohData = await dohRes.json();
        const answers = dohData.Answer || [];
        const found = answers.some((a) => (a.data || '').includes(token));

        if (found) {
          // Create/update TenantMapping for the custom hostname.
          const existing = await base44.asServiceRole.entities.TenantMapping.filter({ business_id: businessId, hostname: domain, is_active: true }).catch(() => []);
          if (!existing || !existing.length) {
            await base44.asServiceRole.entities.TenantMapping.create({
              business_id: businessId,
              hostname: domain,
              is_active: true,
            });
          }
          await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, { domain_status: 'verified' });
          return Response.json({ verified: true, domain });
        } else {
          await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, { domain_status: 'pending' });
          return Response.json({ verified: false, domain, message: 'DNS records not found yet. DNS propagation can take up to 48 hours.' });
        }
      } catch (e) {
        return Response.json({ error: `DNS lookup failed: ${e.message}` }, { status: 500 });
      }
    }

    // ── request_domain_purchase: log for ERA Systems staff ──────────────
    if (action === 'request_domain_purchase') {
      const { desired_domain, notes } = body;
      if (!desired_domain || !desired_domain.trim()) return Response.json({ error: 'Desired domain is required.' }, { status: 400 });

      await base44.asServiceRole.entities.SystemEventLog.create({
        business_id: businessId,
        event_type: 'domain_purchase_requested',
        entity_type: 'business_config',
        entity_id: cfg.id,
        description: `Domain purchase requested: ${desired_domain.trim()}`,
        metadata: { desired_domain: desired_domain.trim(), notes: notes || '', business_name: cfg.business_name },
      });

      return Response.json({ success: true, message: 'Domain purchase request submitted. Our team will contact you within 1-2 business days.' });
    }

    // ── init_email_custom: create Resend domain ─────────────────────────
    if (action === 'init_email_custom') {
      const { email_domain } = body;
      if (!email_domain || !email_domain.trim()) return Response.json({ error: 'Email domain is required.' }, { status: 400 });
      const cleanDomain = email_domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (!resendKey) return Response.json({ error: 'Resend API key not configured.' }, { status: 500 });

      // Check if we already have a Resend domain for this tenant.
      let resendDomainId = cfg.resend_domain_id;
      let records = [];

      if (!resendDomainId) {
        // Create new domain in Resend.
        const res = await fetch('https://api.resend.com/domains', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanDomain, region: 'us-east-1' }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return Response.json({ error: `Resend domain creation failed: ${err.message || res.statusText}` }, { status: 400 });
        }
        const data = await res.json();
        resendDomainId = data.id;
        records = data.records || [];
      } else {
        // Fetch existing domain records.
        const res = await fetch(`https://api.resend.com/domains/${resendDomainId}`, {
          headers: { Authorization: `Bearer ${resendKey}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return Response.json({ error: `Resend domain lookup failed: ${err.message || res.statusText}` }, { status: 400 });
        }
        const data = await res.json();
        records = data.records || [];
      }

      await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, {
        email_mode: 'custom',
        resend_domain_id: resendDomainId,
        email_domain_status: 'pending',
      });

      return Response.json({
        domain: cleanDomain,
        resend_domain_id: resendDomainId,
        records: records.map((r) => ({
          type: r.record,
          host: r.name,
          value: r.value,
          ttl: r.ttl || 'auto',
          priority: r.priority,
        })),
      });
    }

    // ── verify_email_custom: call Resend verify endpoint ─────────────────
    if (action === 'verify_email_custom') {
      const resendDomainId = cfg.resend_domain_id;
      if (!resendDomainId) return Response.json({ error: 'No custom email domain to verify.' }, { status: 400 });

      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (!resendKey) return Response.json({ error: 'Resend API key not configured.' }, { status: 500 });

      const res = await fetch(`https://api.resend.com/domains/${resendDomainId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return Response.json({ error: `Resend verification failed: ${data.message || res.statusText}` }, { status: 400 });
      }

      // Check current domain status.
      const statusRes = await fetch(`https://api.resend.com/domains/${resendDomainId}`, {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      const statusData = await statusRes.json().catch(() => ({}));
      const domainStatus = statusData.status || 'pending';

      const mapped = domainStatus === 'verified' ? 'verified' : (domainStatus === 'failed' ? 'failed' : 'pending');
      await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, { email_domain_status: mapped });

      return Response.json({ verified: mapped === 'verified', status: mapped, domain: statusData.name || '' });
    }

    // ── set_email_shared: switch to shared ERA Systems domain ───────────
    if (action === 'set_email_shared') {
      const { from_name } = body;
      await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, {
        email_mode: 'shared',
        email_from_name: (from_name || cfg.business_name || '').trim(),
        email_domain_status: 'shared',
      });
      return Response.json({ success: true, email_mode: 'shared' });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('tenantSettings error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});