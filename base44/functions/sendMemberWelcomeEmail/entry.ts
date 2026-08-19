// Member Welcome Email — reusable HTML template (${contact.businessName} dark/gold theme)
// POST /functions/sendMemberWelcomeEmail
// Sends a branded welcome email to a newly registered member.
// If the member has no active ${contact.goldLabel} subscription, a Gold upsell section + CTA button is included.
// Triggered from the client (Register.jsx) right after OTP verification — the caller must be authenticated
// (their own verified email is used as the recipient).
// Theme: obsidian (${obsidian}), asphalt (${asphalt}), gold (${gold}), vapor (${vapor}).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { loadBusinessContact } from '../../shared/businessContact.ts';
import { getUserBusinessId } from '../../shared/tenantContext.ts';
import { checkFeature } from '../../shared/planFeatures.ts';
import { emailAutomationAllowed } from '../../shared/automationSettings.ts';

const SUBJECT = (businessName) => `Welcome to ${businessName}`;
const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bullet(items) {
  return items.map(t =>
    `<tr><td style="padding:0 0 8px 0;font-size:15px;line-height:24px;color:#CBD5E1;">
      <span style="color:${gold};font-weight:700;">&#9670;</span>&nbsp;&nbsp;${t}
    </td></tr>`
  ).join('');
}

function buildHtml(firstName, hasGold, contact) {
  const { gold, obsidian, asphalt, vapor } = contact.theme;
  const memberItems = [
    'Book detailing appointments in seconds',
    'Manage your vehicle garage and service history',
    'Save your preferred addresses and payment details',
    'Track upcoming and past appointments',
    'Receive exclusive member-only offers',
  ];

  const goldBenefits = [
    'Monthly full detail included with your membership',
    'Priority booking and preferred scheduling',
    'Exclusive member pricing on add-on services',
    'Maintain a showroom-quality vehicle year-round',
  ];

  const goldSection = hasGold ? '' : `
<!-- Gold upsell -->
<tr><td style="padding:28px 32px 8px 32px;background-color:#0F1115;">
  <p style="margin:0 0 14px 0;padding-top:20px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${gold};">Get the most out of your membership</p>
  <p style="margin:0 0 14px 0;font-size:15px;line-height:25px;color:#CBD5E1;">You're not yet enrolled in <strong style="color:${gold};">${contact.goldLabel}</strong> &mdash; our premium membership that keeps your vehicle in showroom condition all year long.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">${bullet(goldBenefits)}</table>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 4px 0;">
    <a href="${contact.goldSignupUrl}" style="display:inline-block;background-color:${gold};color:${obsidian};font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:6px;font-family:${FONT};letter-spacing:0.5px;">Explore ${contact.goldLabel} &rarr;</a>
  </td></tr></table>
</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${SUBJECT(contact.businessName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:${FONT};color:${vapor};-webkit-font-smoothing:antialiased;" bgcolor="#000000">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your ${contact.businessName} member account is ready &mdash; start booking premium detailing services.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;" bgcolor="#000000">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${asphalt};border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);" bgcolor="${asphalt}">

<!-- Header -->
<tr><td style="background-color:#000000;padding:26px 32px;border-bottom:2px solid ${gold};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-family:${FONT};font-size:19px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">${contact.businessNameHeader}</td>
    <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${gold};font-weight:700;text-transform:uppercase;">Member</td>
  </tr></table>
</td></tr>

<!-- Hero with glowing gold particles -->
<tr><td style="padding:0;background-color:#000000;" bgcolor="#000000">
  <div style="background-color:#000000;background-image:radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 70%, rgba(180,140,20,0.10) 0%, transparent 55%);padding:48px 32px 30px 32px;" bgcolor="#000000">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${gold};font-weight:700;">Welcome</p>
    <h1 style="margin:0;font-size:27px;line-height:34px;color:${vapor};font-weight:700;">Hi ${firstName},</h1>
  </div>
</td></tr>

<!-- Intro -->
<tr><td style="padding:14px 32px 0 32px;">
  <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Welcome to ${contact.businessName} &mdash; ${contact.tagline}. Your member account is ready, and you can now book premium detailing from the convenience of your phone.</p>
  <p style="margin:0 0 22px 0;font-size:15px;line-height:25px;color:#CBD5E1;">We bring the spa to your vehicle. Here's everything you can do with your new account:</p>
</td></tr>

<!-- What you can do -->
<tr><td style="padding:0 32px 24px 32px;background-color:#0F1115;">
  <p style="margin:0 0 14px 0;padding-top:22px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${gold};">Your member benefits</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bullet(memberItems)}</table>
</td></tr>

${goldSection}

<!-- Need help -->
<tr><td style="padding:28px 32px 12px 32px;">
  <p style="margin:0 0 12px 0;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${gold};">Need Help?</p>
  <p style="margin:0 0 12px 0;font-size:15px;line-height:25px;color:#CBD5E1;">If you have any questions, simply reply to this email or give us a call &mdash; we're here to help.</p>
  <p style="margin:0 0 6px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Welcome to the ${contact.businessName} family.</p>
  <p style="margin:0;font-size:15px;line-height:25px;color:#CBD5E1;"><strong style="color:${gold};">See you soon!</strong></p>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#000000;padding:28px 32px;border-top:2px solid ${gold};">
  <p style="margin:0 0 6px 0;font-size:15px;line-height:24px;color:${vapor};font-weight:600;">&mdash; The ${contact.businessName} Team</p>
  <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:${contact.email}" style="color:${gold};text-decoration:none;">${contact.email}</a></p>
  <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;">Call/Text: <a href="tel:${contact.phoneTel}" style="color:${gold};text-decoration:none;">${contact.phone}</a></p>
  <p style="margin:0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="${contact.website}" style="color:${gold};text-decoration:none;">${contact.website}</a></p>
  <p style="margin:16px 0 0 0;font-family:${MONO};font-size:11px;line-height:18px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} ${contact.legalName.toUpperCase()}. ALL RIGHTS RESERVED.</p>
</td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // The caller must be an authenticated user (they just verified their email).
    // The welcome email is sent to the caller's own verified email — no arbitrary recipients.
    const me = await base44.auth.me().catch(() => null);
    if (!me) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

    const email = me.email;
    if (!email) return Response.json({ error: 'No email on account.' }, { status: 400 });
    const businessId = await getUserBusinessId(base44, me);

    const fc = await checkFeature(base44, businessId, 'email_automations');
    if (!fc.ok) return Response.json({ error: 'Automated emails are not available on your current plan.' }, { status: 403 });
    if (!emailAutomationAllowed(fc.cfg, 'welcome_email')) return Response.json({ error: 'Welcome email is turned off in your automation settings.' }, { status: 403 });

    // Optional recipient override for admin test sends (defaults to the caller's own email).
    const to = typeof body.to === 'string' && body.to.includes('@') ? body.to : email;

    const rawFirstName = (body.firstName || (me.full_name || '').split(' ')[0] || 'there').trim() || 'there';
    // Escape user-supplied input before interpolating into the HTML email template
    // to prevent HTML injection / email content spoofing (CWE-79).
    const firstName = escapeHtml(rawFirstName);

    // Check if the member already has an active ${contact.goldLabel} subscription.
    let hasGold = false;
    try {
      const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ business_id: businessId, status: 'active' });
      hasGold = (subs || []).some(s => s.created_by_id === me.id);
    } catch (e) { console.error('gold status check error:', e.message); }

    const contact = await loadBusinessContact(base44, businessId);
    const html = buildHtml(firstName, hasGold, contact);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: SUBJECT(contact.businessName),
      body: html,
      from_name: contact.businessName,
    });

    return Response.json({ success: true, sent_to: to, has_gold: hasGold });
  } catch (error) {
    console.error('sendMemberWelcomeEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});