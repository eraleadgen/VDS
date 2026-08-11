// Cancellation Notification — internal email to the business when an appointment is cancelled.
// POST /functions/sendCancellationNotification
// Called after a cancellation (cancelAppointment, scheduler cancel, adminChangeStatus).
// Auth: SCHEDULER_TOKEN (internal) or admin session.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { loadBusinessContact } from '../../shared/businessContact.ts';

const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";

function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function fieldRow(label, value) {
  return value ? `<tr><td style="padding:4px 0;"><span style="font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">${label}</span><br><span style="font-size:15px;color:${vapor};font-weight:500;">${esc(value)}</span></td></tr>` : '';
}

// Send an outbound SMS — routed through sendMessage → Communication Rules Engine.
async function sendTwilioSms(base44, to, body, customerName, messageType) {
  if (!to) return false;
  try {
    await base44.asServiceRole.functions.invoke('sendMessage', {
      customer_phone: to, message_type: messageType || 'cancellation_confirmation', content: body,
      customer_name: customerName || '', scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      suppress_email_fallback: true,
    });
    return true;
  } catch (e) { console.error('sendMessage error:', e.message); return false; }
}

function buildCustomerCancellationEmail(appt, contact) {
  const firstName = (appt.customer_name || '').split(' ')[0] || 'there';
  const { gold, obsidian, asphalt, vapor } = contact.theme;
  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>
<body style="margin:0;padding:0;background-color:${obsidian};color-scheme:dark;font-family:${FONT};color:${vapor};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${obsidian};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${asphalt};border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:${obsidian};padding:22px 28px;border-bottom:2px solid ${gold};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">${contact.businessNameHeader}</td>
      <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${gold};font-weight:700;text-transform:uppercase;">Cancelled</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${gold};font-weight:700;">Appointment Cancelled</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:${vapor};font-weight:700;">Hi ${esc(firstName)},</h1>
  </td></tr>
  <tr><td style="padding:14px 28px 0 28px;">
    <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Your ${contact.businessName} detailing appointment has been cancelled. We're sorry we won't be servicing your vehicle as scheduled.</p>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${gold};">Cancelled Appointment Details</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${fieldRow('Date', appt.preferred_date)}
      ${fieldRow('Time', appt.preferred_time)}
      ${fieldRow('Service', appt.service_label)}
      ${appt.service_address ? fieldRow('Service Address', appt.service_address) : ''}
      ${appt.contractor_name ? fieldRow('Assigned Specialist', appt.contractor_name) : ''}
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 8px 28px;">
    <p style="margin:0 0 8px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Ready to reschedule? Call or text us at <strong style="color:${gold};">${'&quot;'}${contact.phone}${'&quot;'}</strong> or visit <strong style="color:${gold};">${contact.websiteDisplay}</strong> to book a new appointment.</p>
    <p style="margin:0;font-size:15px;line-height:25px;color:#CBD5E1;">Thank you for choosing ${contact.businessName}.</p>
  </td></tr>
  <tr><td style="background-color:${obsidian};padding:22px 28px;border-top:2px solid ${gold};">
    <p style="margin:0 0 6px 0;font-size:15px;color:${vapor};font-weight:600;">&mdash; The ${contact.businessName} Team</p>
    <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:${contact.email}" style="color:${gold};text-decoration:none;">${contact.email}</a></p>
    <p style="margin:0 0 12px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="${contact.website}" style="color:${gold};text-decoration:none;">${contact.website}</a></p>
    <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} ${contact.legalName.toUpperCase()}. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildCancellationEmail(appt, contact) {
  const { gold, obsidian, asphalt, vapor } = contact.theme;
  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>
<body style="margin:0;padding:0;background-color:${obsidian};color-scheme:dark;font-family:${FONT};color:${vapor};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${obsidian};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${asphalt};border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:${obsidian};padding:22px 28px;border-bottom:2px solid ${gold};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">${contact.businessNameHeader}</td>
      <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${gold};font-weight:700;text-transform:uppercase;">Cancelled</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${gold};font-weight:700;">Appointment Cancelled</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:${vapor};font-weight:700;">${esc(appt.customer_name)}</h1>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${gold};">Cancelled Appointment Details</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${fieldRow('Client Name', appt.customer_name)}
      ${fieldRow('Phone', appt.customer_phone)}
      ${appt.customer_email ? fieldRow('Email', appt.customer_email) : ''}
      ${fieldRow('Date', appt.preferred_date)}
      ${fieldRow('Time', appt.preferred_time)}
      ${fieldRow('Service', appt.service_label)}
      ${appt.service_address ? fieldRow('Address', appt.service_address) : ''}
      ${appt.contractor_name ? fieldRow('Assigned Specialist', appt.contractor_name) : ''}
    </table>
  </td></tr>
  <tr><td style="background-color:${obsidian};padding:22px 28px;border-top:2px solid ${gold};">
    <p style="margin:0 0 6px 0;font-size:15px;color:${vapor};font-weight:600;">&mdash; The ${contact.businessName} Team</p>
    <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} ${contact.legalName.toUpperCase()}. ALL RIGHTS RESERVED.</p>
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

    const contact = await loadBusinessContact(base44);

    try {
      const internalHtml = buildCancellationEmail(appt, contact);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: contact.internalEmail,
        subject: `Appointment Cancelled — ${appt.customer_name} — ${appt.preferred_date} ${appt.preferred_time}`,
        body: internalHtml,
        from_name: contact.businessName,
      });

      let customerSent = false;
      if (appt.customer_email) {
        try {
          const firstName = (appt.customer_name || '').split(' ')[0] || 'there';
          const customerHtml = buildCustomerCancellationEmail(appt, contact);
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: appt.customer_email,
            subject: `Your ${contact.businessName} Appointment Has Been Cancelled — ${appt.preferred_date} at ${appt.preferred_time}`,
            body: customerHtml,
            from_name: contact.businessName,
          });
          customerSent = true;
        } catch (e) { console.error('Customer cancellation email failed:', e.message); }
      }

      let customerSmsSent = false;
      if (appt.customer_phone && appt.sms_consent !== false) {
        const firstName = (appt.customer_name || '').split(' ')[0] || 'there';
        const msg = `Hi ${firstName}, your ${contact.businessName} appointment for ${appt.preferred_date} at ${appt.preferred_time} has been cancelled. We're sorry we won't be servicing your vehicle as scheduled. To reschedule, call/text ${contact.phone} or visit ${contact.websiteDisplay}. — ${contact.businessName}`;
        customerSmsSent = await sendTwilioSms(base44, appt.customer_phone, msg, appt.customer_name, 'cancellation_confirmation');
      }

      return Response.json({ success: true, internal: true, customer: customerSent, customer_sms: customerSmsSent });
    } catch (e) {
      console.error('Cancellation notification email failed:', e.message);
      return Response.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (error) {
    console.error('sendCancellationNotification error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});