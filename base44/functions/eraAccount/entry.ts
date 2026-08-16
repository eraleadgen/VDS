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

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('eraAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});