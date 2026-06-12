import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await base44.entities.User.update(user.id, { is_gold_member: true });
    return Response.json({ success: true, message: 'Upgraded to VDS Gold' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});