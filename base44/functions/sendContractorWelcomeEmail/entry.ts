// Contractor Welcome Email — reusable HTML template (VDS Mobile dark/gold theme)
// POST /functions/sendContractorWelcomeEmail
// Sends a branded onboarding email to a newly created contractor.
// Dynamic vars: {{firstName}}, {{contractorPortalUrl}}
// Auto-invoked from scheduler -> admin_create_contractor, but can also be called directly.
// Theme matches the site: obsidian (#0A0B0D), asphalt (#14161A), gold (#D4AF37), vapor (#E2E8F0).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const SUBJECT = 'Welcome to VDS Mobile — Your Contractor Account is Ready';
const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";

function bullet(items) {
  return items.map(t =>
    `<tr><td style="padding:0 0 8px 0;font-size:15px;line-height:24px;color:#CBD5E1;">
      <span style="color:#D4AF37;font-weight:700;">&#9670;</span>&nbsp;&nbsp;${t}
    </td></tr>`
  ).join('');
}

function workflowStep(n, label, last) {
  return `
  <tr>
    <td width="34" valign="top" style="padding:0 0 ${last ? 0 : 12}px 0;">
      <span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:6px;background:#D4AF37;color:#0A0B0D;font-size:13px;font-weight:700;text-align:center;font-family:Arial,sans-serif;">${n}</span>
    </td>
    <td valign="middle" style="padding:0 0 ${last ? 0 : 12}px 12px;font-size:15px;color:#E2E8F0;font-weight:500;">${label}</td>
  </tr>`;
}

function buildHtml(firstName, portalUrl) {
  const workflow = [
    'New Assignment', 'Accept Job', 'Drive to Customer', 'Arrived',
    'Service In Progress', 'Upload Before Photos', 'Complete Detail',
    'Upload After Photos', 'Submit Completion', 'Quality Review', 'Payment Processing',
  ];
  const portalItems = [
    'View available and assigned jobs',
    'Accept or decline job requests',
    'Navigate to customer locations',
    'Upload before and after photos',
    'Complete job checklists',
    'Submit completion details',
    'View your upcoming schedule',
    'Update your weekly availability',
    'Edit your profile and contact information',
    'Receive important company updates',
  ];
  const reminders = [
    'Arrive on time.',
    'Wear clean VDS apparel whenever possible.',
    'Be professional and courteous.',
    'Take clear before and after photos.',
    'Never mark a job complete until all work has been finished.',
    'Contact management immediately if an issue arises during a job.',
  ];
  const wfHtml = workflow.map((s, i) => workflowStep(i + 1, s, i === workflow.length - 1)).join('');

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:${FONT};color:#E2E8F0;-webkit-font-smoothing:antialiased;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your contractor account is ready — start accepting jobs in the VDS Mobile portal.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">

<!-- Header -->
<tr><td style="background-color:#0A0B0D;padding:26px 32px;border-bottom:2px solid #D4AF37;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-family:${FONT};font-size:19px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</td>
    <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Contractor Portal</td>
  </tr></table>
</td></tr>

<!-- Hero -->
<tr><td style="padding:40px 32px 6px 32px;">
  <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Welcome to the team</p>
  <h1 style="margin:0;font-size:27px;line-height:34px;color:#E2E8F0;font-weight:700;">Hi ${firstName},</h1>
</td></tr>

<!-- Intro -->
<tr><td style="padding:14px 32px 0 32px;">
  <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Welcome to the VDS Mobile team! Your contractor account has been created and you're officially ready to start accepting jobs.</p>
  <p style="margin:0 0 22px 0;font-size:15px;line-height:25px;color:#CBD5E1;">As a VDS Contractor you'll use the <strong style="color:#F1F5F9;">Contractor Portal</strong> to manage everything related to your work.</p>
</td></tr>

<!-- What you can do -->
<tr><td style="padding:0 32px 24px 32px;background-color:#0F1115;">
  <p style="margin:0 0 14px 0;padding-top:22px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">What you can do inside the portal</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bullet(portalItems)}</table>
</td></tr>

<!-- Getting started -->
<tr><td style="padding:28px 32px 8px 32px;">
  <p style="margin:0 0 14px 0;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Getting Started</p>
  <p style="margin:0 0 18px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Log into your Contractor Portal:</p>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 18px 0;">
    <a href="${portalUrl}" style="display:inline-block;background-color:#D4AF37;color:#0A0B0D;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:6px;font-family:${FONT};letter-spacing:0.5px;">Log in to the Contractor Portal &rarr;</a>
  </td></tr></table>
  <p style="margin:0 0 8px 0;font-size:14px;line-height:23px;color:#94A3B8;">Login using the email address this invitation was sent to.</p>
  <p style="margin:0 0 0 0;font-size:14px;line-height:23px;color:#94A3B8;">If you haven't created a password yet, click <strong style="color:#E2E8F0;">"Forgot Password"</strong> on the login page to set one.</p>
</td></tr>

<!-- Availability -->
<tr><td style="padding:24px 32px 8px 32px;background-color:#0F1115;">
  <p style="margin:0 0 12px 0;padding-top:18px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Keep Your Availability Updated</p>
  <p style="margin:0 0 12px 0;font-size:15px;line-height:25px;color:#CBD5E1;">VDS automatically offers jobs based on your availability.</p>
  <p style="margin:0 0 12px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Please keep your availability calendar updated every week so our scheduling system knows when you're available to work.</p>
  <p style="margin:0 0 18px 0;font-size:15px;line-height:25px;color:#CBD5E1;">You can also block off vacation days or times you're unavailable.</p>
</td></tr>

<!-- Workflow -->
<tr><td style="padding:28px 32px 8px 32px;">
  <p style="margin:0 0 16px 0;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Job Workflow</p>
  <p style="margin:0 0 18px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Each assigned job follows this workflow:</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${wfHtml}</table>
</td></tr>

<!-- Reminders -->
<tr><td style="padding:24px 32px 8px 32px;background-color:#0F1115;">
  <p style="margin:0 0 14px 0;padding-top:20px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Important Reminders</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bullet(reminders)}</table>
</td></tr>

<!-- Need help -->
<tr><td style="padding:28px 32px 12px 32px;">
  <p style="margin:0 0 12px 0;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Need Help?</p>
  <p style="margin:0 0 12px 0;font-size:15px;line-height:25px;color:#CBD5E1;">If you have any questions, simply reply to this email or contact management.</p>
  <p style="margin:0 0 6px 0;font-size:15px;line-height:25px;color:#CBD5E1;">We're excited to have you on the team and look forward to working with you.</p>
  <p style="margin:0;font-size:15px;line-height:25px;color:#CBD5E1;"><strong style="color:#D4AF37;">Welcome aboard!</strong></p>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#0A0B0D;padding:28px 32px;border-top:2px solid #D4AF37;">
  <p style="margin:0 0 6px 0;font-size:15px;line-height:24px;color:#E2E8F0;font-weight:600;">&mdash; The VDS Mobile Team</p>
  <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:support@vdsmobile.com" style="color:#D4AF37;text-decoration:none;">support@vdsmobile.com</a></p>
  <p style="margin:0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="https://vdsmobile.com" style="color:#D4AF37;text-decoration:none;">https://vdsmobile.com</a></p>
  <p style="margin:16px 0 0 0;font-family:${MONO};font-size:11px;line-height:18px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
</td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

async function resolvePortalUrl(base44, explicit) {
  if (explicit) return explicit;
  try {
    const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
    const cfg = cfgs && cfgs[0];
    const booking = cfg && cfg.website_links && cfg.website_links.booking_url;
    if (booking) {
      try { return new URL(booking).origin + '/contractor-login'; }
      catch (_) {}
    }
  } catch (e) { console.error('BusinessConfig lookup error:', e.message); }
  return 'https://vdsmobile.com/contractor-login';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim();
    if (!email) return Response.json({ error: 'email is required.' }, { status: 400 });

    const firstName = (body.firstName || 'there').trim() || 'there';
    const portalUrl = await resolvePortalUrl(base44, (body.contractorPortalUrl || '').trim() || null);
    const html = buildHtml(firstName, portalUrl);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: SUBJECT,
      body: html,
      from_name: 'VDS Mobile',
    });

    return Response.json({ success: true, sent_to: email, subject: SUBJECT, portal_url: portalUrl });
  } catch (error) {
    console.error('sendContractorWelcomeEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});