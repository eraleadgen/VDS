// Booking Notifications — customer SMS + email confirmation + internal email.
// POST /functions/sendBookingNotifications
// Called after a booking is created (submitBookingToGHL, scheduler book, admin book).
// Auth: SCHEDULER_TOKEN (internal) or admin session.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";
const INTERNAL_EMAIL = 'valetdetailingservice@gmail.com';
const BUSINESS_PHONE = '(470) 412-8986';

// Send an outbound SMS — routed through sendMessage → Communication Rules Engine.
async function sendTwilioSms(base44, to, body, customerName, messageType) {
  if (!to) return false;
  try {
    const r = await base44.asServiceRole.functions.invoke('sendMessage', {
      customer_phone: to, message_type: messageType || 'booking_confirmation', content: body,
      customer_name: customerName || '', scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
    });
    return (r && (r.data?.sent || r.sent)) === true;
  } catch (e) { console.error('sendMessage error:', e.message); return false; }
}

// Robust HTML entity escaping — neutralizes &, <, >, ", ', and / to prevent HTML/CSS/script
// injection in email templates (OWASP XSS prevention; CWE-79).
function esc(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function fieldRow(label, value) {
  return value ? `<tr><td style="padding:4px 0;"><span style="font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">${label}</span><br><span style="font-size:15px;color:#E2E8F0;font-weight:500;">${esc(value)}</span></td></tr>` : '';
}

function buildCustomerEmail(firstName, appt) {
  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:${FONT};color:#E2E8F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-bottom:2px solid #D4AF37;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</td>
      <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Confirmed</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Appointment Confirmed</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">Hi ${esc(firstName)},</h1>
  </td></tr>
  <tr><td style="padding:14px 28px 0 28px;">
    <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Your VDS Mobile detailing appointment is confirmed. Our specialist will come to you at the scheduled time.</p>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Appointment Details</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${fieldRow('Date', appt.preferred_date)}
      ${fieldRow('Time', appt.preferred_time)}
      ${fieldRow('Service', appt.service_label)}
      ${fieldRow('Service Address', appt.service_address)}
      ${appt.vehicle_info ? fieldRow('Vehicle', appt.vehicle_info) : ''}
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 8px 28px;">
    <p style="margin:0 0 8px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Please ensure your vehicle is accessible and a water source is available if needed.</p>
    <p style="margin:0;font-size:15px;line-height:25px;color:#CBD5E1;">Need to make changes? Call or text us at <strong style="color:#D4AF37;">${BUSINESS_PHONE}</strong>.</p>
  </td></tr>
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-top:2px solid #D4AF37;">
    <p style="margin:0 0 6px 0;font-size:15px;color:#E2E8F0;font-weight:600;">&mdash; The VDS Mobile Team</p>
    <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildInternalEmail(appt) {
  const notesHtml = appt.notes
    ? `<tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 10px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Vehicles / Notes</p>
    <p style="margin:0;font-size:14px;line-height:22px;color:#CBD5E1;white-space:pre-wrap;">${esc(appt.notes)}</p>
  </td></tr>`
    : '';
  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:${FONT};color:#E2E8F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-bottom:2px solid #D4AF37;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</td>
      <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">New Booking</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Booking Request</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">${esc(appt.customer_name)}</h1>
    <p style="margin:4px 0 0 0;font-family:${MONO};font-size:13px;color:#94A3B8;">${esc(appt.preferred_date)} at ${esc(appt.preferred_time)}</p>
  </td></tr>
  <tr><td style="padding:20px 28px 8px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${fieldRow('Client Name', appt.customer_name)}
    ${fieldRow('Phone', appt.customer_phone)}
    ${appt.customer_email ? fieldRow('Email', appt.customer_email) : ''}
    ${fieldRow('Service Address', appt.service_address)}
  </table></td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Appointment</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${fieldRow('Date', appt.preferred_date)}
      ${fieldRow('Time', appt.preferred_time)}
      ${fieldRow('Service', appt.service_label)}
      ${appt.contractor_name ? fieldRow('Assigned Specialist', appt.contractor_name) : ''}
    </table>
  </td></tr>
  ${notesHtml}
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-top:2px solid #D4AF37;">
    <p style="margin:0 0 6px 0;font-size:15px;color:#E2E8F0;font-weight:600;">&mdash; The VDS Mobile Team</p>
    <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth: SCHEDULER_TOKEN (internal calls) or admin
    const schedulerToken = Deno.env.get('SCHEDULER_TOKEN');
    const tokenOk = !!(schedulerToken && body.scheduler_token && body.scheduler_token === schedulerToken);
    if (!tokenOk) {
      const me = await base44.auth.me().catch(() => null);
      if (!me || me.role !== 'admin') return Response.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const apptId = body.appointment_id;
    if (!apptId) return Response.json({ error: 'appointment_id is required.' }, { status: 400 });

    const appt = await base44.asServiceRole.entities.Appointment.get(apptId);
    if (!appt) return Response.json({ error: 'Appointment not found.' }, { status: 404 });

    const firstName = (appt.customer_name || '').split(' ')[0] || 'there';
    const results = { sms: false, email: false, internal: false };

    // 1. Customer SMS confirmation (only if SMS consent given; otherwise email confirmation below suffices)
    if (appt.customer_phone && appt.sms_consent !== false) {
      const msg = `Hi ${firstName}, your VDS Mobile appointment is confirmed for ${appt.preferred_date} at ${appt.preferred_time}. Service: ${appt.service_label || 'Detailing'}. We'll come to you${appt.service_address ? ' at ' + appt.service_address : ''}. Questions? Call/text ${BUSINESS_PHONE}. — VDS Mobile`;
      results.sms = await sendTwilioSms(base44, appt.customer_phone, msg, appt.customer_name, 'booking_confirmation');
    }

    // 2. Customer email confirmation (registered users only — SendEmail limitation)
    if (appt.customer_email) {
      try {
        const html = buildCustomerEmail(firstName, appt);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: appt.customer_email,
          subject: `Your VDS Mobile Appointment is Confirmed — ${appt.preferred_date} at ${appt.preferred_time}`,
          body: html,
          from_name: 'VDS Mobile',
        });
        results.email = true;
      } catch (e) { console.error('Customer confirmation email failed (may not be a registered user):', e.message); }
    }

    // 3. Internal notification email
    try {
      const html = buildInternalEmail(appt);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: INTERNAL_EMAIL,
        subject: `New Booking — ${appt.customer_name} — ${appt.preferred_date} ${appt.preferred_time}`,
        body: html,
        from_name: 'VDS Mobile',
      });
      results.internal = true;
    } catch (e) { console.error('Internal notification email failed:', e.message); }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('sendBookingNotifications error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});