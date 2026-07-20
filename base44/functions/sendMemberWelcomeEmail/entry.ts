// Member Welcome Email — reusable HTML template (VDS Mobile dark/gold theme)
// POST /functions/sendMemberWelcomeEmail
// Sends a branded welcome email to a newly registered member.
// If the member has no active VDS Gold subscription, a Gold upsell section + CTA button is included.
// Triggered from the client (Register.jsx) right after OTP verification — the caller must be authenticated
// (their own verified email is used as the recipient).
// Theme: obsidian (#0A0B0D), asphalt (#14161A), gold (#D4AF37), vapor (#E2E8F0).

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const SUBJECT = 'Welcome to VDS Mobile';
const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";
const GOLD_URL = 'https://vdsmobile.com/vds-gold';

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
      <span style="color:#D4AF37;font-weight:700;">&#9670;</span>&nbsp;&nbsp;${t}
    </td></tr>`
  ).join('');
}

// Static "glowing gold particles" field — emulates the VDS Gold page canvas in email.
// Absolute-positioned gold dots with a soft glow (box-shadow) over a black + radial-glow backdrop.
// Degrades gracefully: Outlook shows black + text only.
function goldParticles(count) {
  const GOLDS = ['#D4AF37', '#F5E17A', '#C9A028', '#E8CC60', '#B8860B', '#FFD700'];
  let dots = '';
  for (let i = 0; i < count; i++) {
    const size = (Math.random() * 2.4 + 0.8).toFixed(1);
    const x = (Math.random() * 100).toFixed(2);
    const y = (Math.random() * 100).toFixed(2);
    const alpha = (Math.random() * 0.45 + 0.25).toFixed(2);
    const color = GOLDS[Math.floor(Math.random() * GOLDS.length)];
    const blur = (parseFloat(size) * 3.5).toFixed(1);
    dots += `<div style="position:absolute;left:${x}%;top:${y}%;width:${size}px;height:${size}px;border-radius:50%;background:${color};opacity:${alpha};box-shadow:0 0 ${blur}px ${color};"></div>`;
  }
  return dots;
}

function buildHtml(firstName, hasGold) {
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
  <p style="margin:0 0 14px 0;padding-top:20px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Get the most out of your membership</p>
  <p style="margin:0 0 14px 0;font-size:15px;line-height:25px;color:#CBD5E1;">You're not yet enrolled in <strong style="color:#D4AF37;">VDS Gold</strong> &mdash; our premium membership that keeps your vehicle in showroom condition all year long.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">${bullet(goldBenefits)}</table>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 4px 0;">
    <a href="${GOLD_URL}" style="display:inline-block;background-color:#D4AF37;color:#0A0B0D;font-size:15px;font-weight:700;text-decoration:none;padding:15px 32px;border-radius:6px;font-family:${FONT};letter-spacing:0.5px;">Explore VDS Gold &rarr;</a>
  </td></tr></table>
</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:${FONT};color:#E2E8F0;-webkit-font-smoothing:antialiased;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your VDS Mobile member account is ready &mdash; start booking premium detailing services.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">

<!-- Header -->
<tr><td style="background-color:#000000;padding:26px 32px;border-bottom:2px solid #D4AF37;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-family:${FONT};font-size:19px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</td>
    <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Member</td>
  </tr></table>
</td></tr>

<!-- Hero with glowing gold particles -->
<tr><td style="padding:0;background-color:#000000;">
  <div style="position:relative;background-color:#000000;background-image:radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 70%, rgba(180,140,20,0.10) 0%, transparent 55%);padding:48px 32px 30px 32px;overflow:hidden;">
    ${goldParticles(45)}
    <div style="position:relative;z-index:2;">
      <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Welcome</p>
      <h1 style="margin:0;font-size:27px;line-height:34px;color:#E2E8F0;font-weight:700;">Hi ${firstName},</h1>
    </div>
  </div>
</td></tr>

<!-- Intro -->
<tr><td style="padding:14px 32px 0 32px;">
  <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Welcome to VDS Mobile &mdash; Atlanta's premier concierge detailing service, operated by Valet Detailing Service LLC. Your member account is ready, and you can now book premium detailing from the convenience of your phone.</p>
  <p style="margin:0 0 22px 0;font-size:15px;line-height:25px;color:#CBD5E1;">We bring the spa to your vehicle. Here's everything you can do with your new account:</p>
</td></tr>

<!-- What you can do -->
<tr><td style="padding:0 32px 24px 32px;background-color:#0F1115;">
  <p style="margin:0 0 14px 0;padding-top:22px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Your member benefits</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bullet(memberItems)}</table>
</td></tr>

${goldSection}

<!-- Need help -->
<tr><td style="padding:28px 32px 12px 32px;">
  <p style="margin:0 0 12px 0;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Need Help?</p>
  <p style="margin:0 0 12px 0;font-size:15px;line-height:25px;color:#CBD5E1;">If you have any questions, simply reply to this email or give us a call &mdash; we're here to help.</p>
  <p style="margin:0 0 6px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Welcome to the VDS family.</p>
  <p style="margin:0;font-size:15px;line-height:25px;color:#CBD5E1;"><strong style="color:#D4AF37;">See you soon!</strong></p>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#000000;padding:28px 32px;border-top:2px solid #D4AF37;">
  <p style="margin:0 0 6px 0;font-size:15px;line-height:24px;color:#E2E8F0;font-weight:600;">&mdash; The VDS Mobile Team</p>
  <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:Valetdetailingservice@gmail.com" style="color:#D4AF37;text-decoration:none;">Valetdetailingservice@gmail.com</a></p>
  <p style="margin:0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="https://vdsmobile.com" style="color:#D4AF37;text-decoration:none;">https://vdsmobile.com</a></p>
  <p style="margin:16px 0 0 0;font-family:${MONO};font-size:11px;line-height:18px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
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

    const rawFirstName = (body.firstName || (me.full_name || '').split(' ')[0] || 'there').trim() || 'there';
    // Escape user-supplied input before interpolating into the HTML email template
    // to prevent HTML injection / email content spoofing (CWE-79).
    const firstName = escapeHtml(rawFirstName);

    // Check if the member already has an active VDS Gold subscription.
    let hasGold = false;
    try {
      const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
      hasGold = (subs || []).some(s => s.created_by_id === me.id);
    } catch (e) { console.error('gold status check error:', e.message); }

    const html = buildHtml(firstName, hasGold);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: SUBJECT,
      body: html,
      from_name: 'VDS Mobile',
    });

    return Response.json({ success: true, sent_to: email, has_gold: hasGold });
  } catch (error) {
    console.error('sendMemberWelcomeEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});