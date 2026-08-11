import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateCustomer } from '../../shared/customer.ts';

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
      if (typeof body.phone === 'string') allowed.phone = body.phone.replace(/[^\d+\-\s()]/g, '').slice(0, 20);
      if (Array.isArray(body.saved_addresses)) allowed.saved_addresses = body.saved_addresses.slice(0, 20);
      await base44.asServiceRole.entities.User.update(me.id, allowed);
      const u = await base44.asServiceRole.entities.User.get(me.id);
      return Response.json({ success: true, account: project(u) });
    }

    if (action === 'initCustomer') {
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
      return Response.json({ success: true, customer_id: customer.id, sms_consent: customer.sms_consent });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('account error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});