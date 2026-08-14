import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { sendCustomerEmail } from '../../shared/customerEmail.ts';

// Thin HTTP wrapper around the shared sendCustomerEmail helper, so it can be tested
// directly and invoked by the frontend if needed. The real routing logic lives in
// base44/shared/customerEmail.ts and is imported by every customer-facing email path
// (booking confirmation, reminders, quotes, review requests).

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth gate — this wrapper can send arbitrary HTML to arbitrary recipients via the
    // Resend ESP path, so it must NOT be an open relay. Require either a valid internal
    // SCHEDULER_TOKEN or an authenticated admin session.
    const schedulerToken = Deno.env.get('SCHEDULER_TOKEN');
    const tokenOk = !!(schedulerToken && body.scheduler_token && body.scheduler_token === schedulerToken);
    if (!tokenOk) {
      const me = await base44.auth.me().catch(() => null);
      if (!me || me.role !== 'admin') return Response.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { to, subject, html, from_name } = body;
    if (!to || !subject || !html) {
      return Response.json({ error: 'to, subject, and html are required.' }, { status: 400 });
    }
    const result = await sendCustomerEmail(base44, { to, subject, html, fromName: from_name });
    return Response.json(result, { status: result.sent ? 200 : 502 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}