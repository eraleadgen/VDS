// Cancellation Notification — internal email to the business when an appointment is cancelled.
// POST /functions/sendCancellationNotification
// Called after a cancellation (cancelAppointmentInGHL, scheduler cancel, adminChangeStatus).
// Auth: SCHEDULER_TOKEN (internal) or admin session.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";
const INTERNAL_EMAIL = 'valetdetailingservice@gmail.com';

function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function fieldRow(label, value) {
  return value ? `<tr><td style="padding:4px 0;"><span style="font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">${label}</span><br><span style="font-size:15px;color:#E2E8F0;font-weight:500;">${esc(value)}</span></td></tr>` : '';
}

function buildCancellationEmail(appt) {
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
      <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Cancelled</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Appointment Cancelled</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">${esc(appt.customer_name)}</h1>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Cancelled Appointment Details</p>
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

    try {
      const html = buildCancellationEmail(appt);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: INTERNAL_EMAIL,
        subject: `Appointment Cancelled — ${appt.customer_name} — ${appt.preferred_date} ${appt.preferred_time}`,
        body: html,
        from_name: 'VDS Mobile',
      });
      return Response.json({ success: true, internal: true });
    } catch (e) {
      console.error('Cancellation notification email failed:', e.message);
      return Response.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (error) {
    console.error('sendCancellationNotification error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});