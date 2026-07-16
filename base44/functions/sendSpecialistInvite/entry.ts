// Specialist Invite Email — themed HTML (VDS Mobile dark/gold theme)
// POST /functions/sendSpecialistInvite
// Sends a branded invitation email containing a private set-password link.
// Dynamic vars: {{firstName}}, {{setupUrl}}
// Invoked from the scheduler (admin_send_specialist_invite) via an internal scheduler token
// or an authenticated admin. Never exposed to anonymous callers (prevents phishing links).
// Theme: obsidian (#0A0B0D), asphalt (#14161A), gold (#D4AF37), vapor (#E2E8F0).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const SUBJECT = "You're Invited — Set Up Your VDS Mobile Specialist Account";
const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";

function buildHtml(firstName, setupUrl) {
  const steps = [
    'Click the button below to open your private setup page.',
    'Create your account password.',
    'Verify your email with the code we send you.',
    'Log in to your Specialist Portal and start accepting jobs.',
  ];
  const stepsHtml = steps.map((t, i) => `
   <tr>
     <td width="34" valign="top" style="padding:0 0 ${i === steps.length - 1 ? 0 : 12}px 0;">
       <span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:6px;background:#D4AF37;color:#0A0B0D;font-size:13px;font-weight:700;text-align:center;font-family:Arial,sans-serif;">${i + 1}</span>
     </td>
     <td valign="middle" style="padding:0 0 ${i === steps.length - 1 ? 0 : 12}px 12px;font-size:15px;color:#E2E8F0;font-weight:500;">${t}</td>
   </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:${FONT};color:#E2E8F0;-webkit-font-smoothing:antialiased;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;">You've been invited to join VDS Mobile as a Specialist — set up your account to get started.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">

<!-- Header -->
<tr><td style="background-color:#0A0B0D;padding:26px 32px;border-bottom:2px solid #D4AF37;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-family:${FONT};font-size:19px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</td>
    <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Specialist Invite</td>
  </tr></table>
</td></tr>

<!-- Hero -->
<tr><td style="padding:40px 32px 6px 32px;">
  <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">You're invited</p>
  <h1 style="margin:0;font-size:27px;line-height:34px;color:#E2E8F0;font-weight:700;">Hi ${firstName},</h1>
</td></tr>

<!-- Intro -->
<tr><td style="padding:14px 32px 0 32px;">
  <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">You've been invited to join the VDS Mobile team as a Specialist. Set up your account password below to activate your Specialist Portal access.</p>
  <p style="margin:0 0 22px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Once your account is created, you'll be able to view your schedule, accept jobs, manage your availability, and upload before &amp; after photos.</p>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 32px 26px 32px;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td>
    <a href="${setupUrl}" style="display:inline-block;background-color:#D4AF37;color:#0A0B0D;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:6px;font-family:${FONT};letter-spacing:0.5px;">Set Your Password &rarr;</a>
  </td></tr></table>
  <p style="margin:14px 0 0 0;font-size:13px;line-height:22px;color:#94A3B8;">This link is private to you. If you weren't expecting this invitation, you can safely ignore this email.</p>
</td></tr>

<!-- Steps -->
<tr><td style="padding:24px 32px 8px 32px;background-color:#0F1115;">
  <p style="margin:0 0 16px 0;padding-top:18px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">What Happens Next</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepsHtml}</table>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#0A0B0D;padding:28px 32px;border-top:2px solid #D4AF37;">
  <p style="margin:0 0 6px 0;font-size:15px;line-height:24px;color:#E2E8F0;font-weight:600;">&mdash; The VDS Mobile Team</p>
  <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:support@vdsmobile.com" style="color:#D4AF37;text-decoration:none;">support@vdsmobile.com</a></p>
  <p style="margin:0;font-family:${MONO};font-size:11px;line-height:18px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
</td></tr>

</table>

</td></tr></table>
</body>
</html>`;
}

async function resolveSetupUrl(base44, token, explicit) {
  if (explicit) return explicit;
  try {
    const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
    const cfg = cfgs && cfgs[0];
    const booking = cfg && cfg.website_links && cfg.website_links.booking_url;
    if (booking) {
      try { return new URL(booking).origin + '/specialist-setup?token=' + encodeURIComponent(token); }
      catch (_) {}
    }
  } catch (e) { console.error('BusinessConfig lookup error:', e.message); }
  return 'https://vdsmobile.com/specialist-setup?token=' + encodeURIComponent(token);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth: an authenticated admin, or an internal service call via SCHEDULER_TOKEN.
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

    const setupUrl = await resolveSetupUrl(base44, inviteToken, (body.setupUrl || '').trim() || null);
    const html = buildHtml(firstName, setupUrl);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: SUBJECT,
      body: html,
      from_name: 'VDS Mobile',
    });

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    console.error('sendSpecialistInvite error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});