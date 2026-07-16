import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

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
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone: u.phone || '',
      saved_addresses: u.saved_addresses || [],
    });

    if (action === 'get') {
      const u = await base44.asServiceRole.entities.User.get(me.id);
      return Response.json({ success: true, account: project(u) });
    }

    if (action === 'update') {
      const allowed = {};
      for (const k of ['first_name', 'last_name', 'phone', 'saved_addresses']) {
        if (body[k] !== undefined) allowed[k] = body[k];
      }
      await base44.asServiceRole.entities.User.update(me.id, allowed);
      const u = await base44.asServiceRole.entities.User.get(me.id);
      return Response.json({ success: true, account: project(u) });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('account error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});