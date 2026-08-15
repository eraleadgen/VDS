import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateCustomer } from '../../shared/customer.ts';
import { loadBusinessContact } from '../../shared/businessContact.ts';
import { checkFeature } from '../../shared/planFeatures.ts';

function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Account profile self-service.
// The built-in full_name is platform-managed and immutable; first_name / last_name /
// phone / saved_addresses are editable custom fields. auth.me() does not reliably
// return custom fields, and entities.User.list() is RLS-restricted for non-admins,
// so we read/write via the service role scoped to the authenticated user's own id.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get';

    const project = (u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      business_id: u.business_id || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      saved_addresses: u.saved_addresses || [],
    });

    if (action === 'get') {
      const u = await base44.asServiceRole.entities.User.get(me.id);
      // Safety net: stamp business_id on any user missing it (admin-invited users,
      // pre-existing users missed by the backfill). Defaults to 'vds' (VDS tenant).
      if (!u.business_id) {
        await base44.asServiceRole.entities.User.update(me.id, { business_id: 'vds' });
        u.business_id = 'vds';
      }
      return Response.json({ success: true, account: project(u) });
    }

    if (action === 'update') {
      // Only non-sensitive, non-identity custom fields are self-writable. phone is intentionally
      // excluded (it is a contact/identity attribute relied on elsewhere); role/email are
      // platform-managed. Values are type-checked and length-capped to prevent abuse via asServiceRole.
      const allowed = {};
      if (typeof body.first_name === 'string') allowed.first_name = body.first_name.slice(0, 50);
      if (typeof body.last_name === 'string') allowed.last_name = body.last_name.slice(0, 50);
      if (Array.isArray(body.saved_addresses)) allowed.saved_addresses = body.saved_addresses.slice(0, 20);
      await base44.asServiceRole.entities.User.update(me.id, allowed);
      const u = await base44.asServiceRole.entities.User.get(me.id);
      return Response.json({ success: true, account: project(u) });
    }

    if (action === 'initCustomer') {
      // Feature gate: member portal must be active for this tenant.
      const u = await base44.asServiceRole.entities.User.get(me.id);
      const fc = await checkFeature(base44, u?.business_id || 'vds', 'member_portal');
      if (!fc.ok) return Response.json({ error: 'Member portal is not available on your current plan.' }, { status: 403 });

      // Create/link the member's CRM Customer record at signup and tag it with their SMS
      // consent choice. Dupe-safe: reuses findOrCreateCustomer so a prior guest booking
      // record (linked_user_id null, matched by phone/email) is linked to this new user
      // instead of duplicated. Consent is upgrade-only on an existing record (never revoked
      // by a later signup) — revocation happens via STOP reply or account settings.
      const customer = await findOrCreateCustomer(base44, {
        linkedUserId: me.id,
        phone: typeof body.phone === 'string' ? body.phone : '',
        firstName: typeof body.firstName === 'string' ? body.firstName : '',
        lastName: typeof body.lastName === 'string' ? body.lastName : '',
        email: me.email,
        smsConsent: body.smsConsent === true,
      });
      // Internal notification: a new customer just created an account.
      try {
        const contact = await loadBusinessContact(base44, customer.business_id || 'vds');
        const fullName = [body.firstName, body.lastName].filter(Boolean).join(' ') || me.email;
        const phoneRow = body.phone
          ? `<tr><td style="padding:4px 0;font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Phone</td></tr><tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${esc(body.phone)}</td></tr>`
          : '';
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-bottom:2px solid #D4AF37;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">${contact.businessNameHeader}</td>
      <td align="right" style="font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">New Account</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:'Space Mono','Courier New',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Customer Signup</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">${esc(fullName)}</h1>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Email</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${esc(me.email)}</td></tr>
      ${phoneRow}
      <tr><td style="padding:4px 0;font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">SMS Consent</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${body.smsConsent ? 'Yes' : 'No'}</td></tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-top:2px solid #D4AF37;">
    <p style="margin:0;font-family:'Space Mono','Courier New',monospace;font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} ${contact.legalName.toUpperCase()}. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contact.internalEmail,
          subject: `New Customer Account — ${fullName}`,
          body: html,
          from_name: contact.businessName,
        });
      } catch (e) { console.error('Internal account creation email failed:', e.message); }

      return Response.json({ success: true, customer_id: customer.id, sms_consent: customer.sms_consent });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('account error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});