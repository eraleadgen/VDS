// Shared invite-email runner used by both the Specialist and Partner invite flows.
// Extracts the duplicated auth + setup-URL resolution + SendEmail scaffolding so each
// invite endpoint only owns its subject + themed HTML body.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { loadBusinessContact } from './businessContact.ts';

// Resolve the setup URL from the active BusinessConfig booking_url origin, falling back to
// the public domain. `pathSegment` is 'specialist-setup' or 'partner-setup'.
export async function resolveSetupUrl(base44, token, pathSegment, explicit) {
  if (explicit) return explicit;
  try {
    const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
    const cfg = cfgs && cfgs[0];
    const booking = cfg && cfg.website_links && cfg.website_links.booking_url;
    if (booking) {
      try { return new URL(booking).origin + '/' + pathSegment + '?token=' + encodeURIComponent(token); }
      catch (_) {}
    }
  } catch (e) { console.error('BusinessConfig lookup error:', e.message); }
  return 'https://vdsmobile.com/' + pathSegment + '?token=' + encodeURIComponent(token);
}

// Generic invite endpoint: validates admin/scheduler auth, resolves the setup URL, builds the
// themed HTML via the caller's buildHtml(firstName, setupUrl), and sends the email.
export async function runInviteEndpoint(req, opts) {
  const { subject, buildHtml, pathSegment } = opts;
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const schedulerToken = Deno.env.get('SCHEDULER_TOKEN');
    const tokenOk = !!(schedulerToken && body.scheduler_token && body.scheduler_token === schedulerToken);
    if (!tokenOk) {
      const me = await base44.auth.me().catch(() => null);
      if (!me || me.role !== 'admin') return Response.json({ error: 'Admin only.' }, { status: 403 });
    }

    const email = (body.email || '').trim();
    if (!email) return Response.json({ error: 'email is required.' }, { status: 400 });
    const firstName = (body.firstName || 'there').trim() || 'there';
    const inviteToken = (body.invite_token || '').trim();
    if (!inviteToken) return Response.json({ error: 'invite_token is required.' }, { status: 400 });

    const setupUrl = await resolveSetupUrl(base44, inviteToken, pathSegment, (body.setupUrl || '').trim() || null);
    const contact = await loadBusinessContact(base44);
    const subjectText = typeof subject === 'function' ? subject(contact.businessName) : subject;
    const html = buildHtml(firstName, setupUrl, contact);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: subjectText,
      body: html,
      from_name: contact.businessName,
    });

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    console.error('invite endpoint error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}