// Partner Network Invite Email — themed HTML (${contact.businessName} dark/gold theme)
// POST /functions/sendPartnerInvite
// Sends a branded invitation email containing a private set-password link to the Partner
// Setup page. Auth + send scaffolding live in base44/shared/inviteEmail.ts (shared with the
// specialist invite).

// sendPartnerInvite passes business_id through the shared inviteEmail runner so
// the setup URL + BusinessConfig lookup are tenant-scoped. The admin/scheduler caller
// is responsible for including business_id in the request body.
import { runInviteEndpoint } from '../../shared/inviteEmail.ts';

const SUBJECT = (businessName) => `You're Invited — Set Up Your ${businessName} Partner Network Account`;
const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";

function buildHtml(firstName, setupUrl, contact) {
  const { gold, obsidian, asphalt, vapor } = contact.theme;
  const steps = [
    'Click the button below to open your private setup page — your name, phone, and email are pre-filled.',
    'Create your account password.',
    'Verify your email with the code we send you.',
    'Log in to your Partner Portal to access your referral QR code, digital business card, and resources.',
  ];
  const stepsHtml = steps.map((t, i) => `
   <tr>
     <td width="34" valign="top" style="padding:0 0 ${i === steps.length - 1 ? 0 : 12}px 0;">
       <span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:6px;background:${gold};color:${obsidian};font-size:13px;font-weight:700;text-align:center;font-family:Arial,sans-serif;">${i + 1}</span>
     </td>
     <td valign="middle" style="padding:0 0 ${i === steps.length - 1 ? 0 : 12}px 12px;font-size:15px;color:${vapor};font-weight:500;">${t}</td>
   </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${SUBJECT(contact.businessName)}</title>
</head>
<body style="margin:0;padding:0;background-color:${obsidian};font-family:${FONT};color:${vapor};-webkit-font-smoothing:antialiased;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;">You've been invited to join the ${contact.businessName} Partner Network — set up your account to get started.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${obsidian};">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${asphalt};border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">

<tr><td style="background-color:${obsidian};padding:26px 32px;border-bottom:2px solid ${gold};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-family:${FONT};font-size:19px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">${contact.businessNameHeader}</td>
    <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${gold};font-weight:700;text-transform:uppercase;">Partner Invite</td>
  </tr></table>
</td></tr>

<tr><td style="padding:40px 32px 6px 32px;">
  <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${gold};font-weight:700;">You're invited</p>
  <h1 style="margin:0;font-size:27px;line-height:34px;color:${vapor};font-weight:700;">Hi ${firstName},</h1>
</td></tr>

<tr><td style="padding:14px 32px 0 32px;">
  <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">You've been invited to join the ${contact.businessName} Partner Network. As a partner, you'll receive a personalized referral QR code and digital business card — every customer who books through your link is automatically attributed to you.</p>
  <p style="margin:0 0 22px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Set up your account password below to activate your Partner Portal access.</p>
</td></tr>

<tr><td style="padding:0 32px 26px 32px;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td>
    <a href="${setupUrl}" style="display:inline-block;background-color:${gold};color:${obsidian};font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:6px;font-family:${FONT};letter-spacing:0.5px;">Set Your Password &rarr;</a>
  </td></tr></table>
  <p style="margin:14px 0 0 0;font-size:13px;line-height:22px;color:#94A3B8;">This link is private to you. If you weren't expecting this invitation, you can safely ignore this email.</p>
</td></tr>

<tr><td style="padding:24px 32px 8px 32px;background-color:#0F1115;">
  <p style="margin:0 0 16px 0;padding-top:18px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${gold};">What Happens Next</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepsHtml}</table>
</td></tr>

<tr><td style="background-color:${obsidian};padding:28px 32px;border-top:2px solid ${gold};">
  <p style="margin:0 0 6px 0;font-size:15px;line-height:24px;color:${vapor};font-weight:600;">&mdash; The ${contact.businessName} Team</p>
  <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:${contact.email}" style="color:${gold};text-decoration:none;">${contact.email}</a> &nbsp;|&nbsp; Call/Text <a href="tel:${contact.phoneTel}" style="color:${gold};text-decoration:none;">${contact.phone}</a></p>
  <p style="margin:0;font-family:${MONO};font-size:11px;line-height:18px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} ${contact.legalName.toUpperCase()}. ALL RIGHTS RESERVED.</p>
</td></tr>

</table>

</td></tr></table>
</body>
</html>`;
}

Deno.serve((req) => runInviteEndpoint(req, { subject: SUBJECT, buildHtml, pathSegment: 'partner-setup' }));