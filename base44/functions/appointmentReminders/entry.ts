// Appointment Reminders — scheduled function (runs every 10 min via automation).
// Sends a 24-hour email reminder and a 1-hour SMS reminder for upcoming confirmed appointments.
// Idempotent: tracks sent state via reminder_24h_email_sent / reminder_1h_sms_sent flags on the Appointment entity.
// No user auth context (scheduled) — uses asServiceRole throughout.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";
const BUSINESS_PHONE = '(470) 412-8986';
const WINDOW_24H = 24 * 3600000;
const WINDOW_1H = 1 * 3600000;

// ── Timezone helpers (Deno runtime is UTC; convert wall times explicitly) ──
function parseTimeTo24h(preferred_time) {
  if (!preferred_time) return null;
  const m = preferred_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = (m[3] || '').toUpperCase();
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
function getTzOffsetMs(date, tz) {
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return tzDate.getTime() - utcDate.getTime();
}
function zonedToUtc(dateStr, timeStr, tz) {
  const wallAsUtc = new Date(`${dateStr}T${timeStr}:00.000Z`);
  return new Date(wallAsUtc.getTime() - getTzOffsetMs(wallAsUtc, tz));
}
function apptStartMs(appt, tz) {
  if (!appt || !appt.preferred_date) return null;
  const t24 = parseTimeTo24h(appt.preferred_time);
  if (!t24) return null;
  try { return zonedToUtc(appt.preferred_date, t24, tz).getTime(); }
  catch { return null; }
}

async function sendTwilioSms(base44, to, body, customerName) {
  if (!to) return false;
  try {
    await base44.asServiceRole.entities.ConversationHistory.create({
      customer_phone: to, customer_name: customerName || '', role: 'assistant', content: body,
    });
  } catch (e) { console.error('log sms error:', e.message); }
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_FROM_NUMBER');
  if (!sid || !token || !from) { console.log('Twilio not configured — SMS not sent.'); return false; }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams({ From: from, To: to, Body: body });
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`${sid}:${token}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); console.error('Twilio send error:', d); return false; }
    return true;
  } catch (e) { console.error('twilio send error:', e.message); return false; }
}

function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function fieldRow(label, value) {
  return value ? `<tr><td style="padding:4px 0;"><span style="font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">${label}</span><br><span style="font-size:15px;color:#E2E8F0;font-weight:500;">${esc(value)}</span></td></tr>` : '';
}

function buildReminderEmail(firstName, appt) {
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
      <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Reminder</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Appointment Reminder</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">Hi ${esc(firstName)},</h1>
  </td></tr>
  <tr><td style="padding:14px 28px 0 28px;">
    <p style="margin:0 0 16px 0;font-size:15px;line-height:25px;color:#CBD5E1;">This is a reminder for your upcoming VDS Mobile detailing appointment.</p>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Appointment Details</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${fieldRow('Date', appt.preferred_date)}
      ${fieldRow('Time', appt.preferred_time)}
      ${fieldRow('Service', appt.service_label)}
      ${fieldRow('Service Address', appt.service_address)}
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 8px 28px;">
    <p style="margin:0 0 8px 0;font-size:15px;line-height:25px;color:#CBD5E1;">Please ensure your vehicle is accessible and a water source is available if needed.</p>
    <p style="margin:0;font-size:15px;line-height:25px;color:#CBD5E1;">Need to make changes? Call or text us at <strong style="color:#D4AF37;">${BUSINESS_PHONE}</strong>.</p>
  </td></tr>
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-top:2px solid #D4AF37;">
    <p style="margin:0 0 6px 0;font-size:15px;color:#E2E8F0;font-weight:600;">&mdash; The VDS Mobile Team</p>
    <p style="margin:0 0 4px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="mailto:support@vdsmobile.com" style="color:#D4AF37;text-decoration:none;">support@vdsmobile.com</a></p>
    <p style="margin:0 0 12px 0;font-family:${MONO};font-size:13px;line-height:22px;color:#94A3B8;"><a href="https://vdsmobile.com" style="color:#D4AF37;text-decoration:none;">https://vdsmobile.com</a></p>
    <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Load business config for timezone
    let tz = 'America/New_York';
    try {
      const configs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
      if (configs && configs[0] && configs[0].timezone) tz = configs[0].timezone;
    } catch (e) { console.error('Config load error:', e.message); }

    // Fetch all confirmed appointments
    const appts = await base44.asServiceRole.entities.Appointment.filter({ status: 'confirmed' });
    const now = Date.now();
    let emailSent = 0, smsSent = 0, skipped = 0;

    for (const appt of (appts || [])) {
      const startMs = apptStartMs(appt, tz);
      if (startMs == null) { skipped++; continue; }
      const msUntilStart = startMs - now;

      // Skip past appointments
      if (msUntilStart <= 0) { skipped++; continue; }

      // 24h email reminder: send if between 1h and 24h away and not yet sent
      if (msUntilStart > WINDOW_1H && msUntilStart <= WINDOW_24H && !appt.reminder_24h_email_sent) {
        if (appt.customer_email) {
          try {
            const firstName = (appt.customer_name || '').split(' ')[0] || 'there';
            const html = buildReminderEmail(firstName, appt);
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: appt.customer_email,
              subject: `Reminder: Your VDS Mobile Appointment — ${appt.preferred_date} at ${appt.preferred_time}`,
              body: html,
              from_name: 'VDS Mobile',
            });
            await base44.asServiceRole.entities.Appointment.update(appt.id, { reminder_24h_email_sent: true });
            emailSent++;
          } catch (e) { console.error('24h reminder email failed (may not be registered):', e.message); }
        }
      }

      // 1h SMS reminder: send if within 1h and not yet sent
      if (msUntilStart > 0 && msUntilStart <= WINDOW_1H && !appt.reminder_1h_sms_sent) {
        if (appt.customer_phone) {
          const firstName = (appt.customer_name || '').split(' ')[0] || 'there';
          const service = appt.service_label || 'Detailing';
          const msg = `Hi ${firstName}, your VDS Mobile detailing appointment starts in about 1 hour at ${appt.preferred_time}.${appt.service_address ? ' Service address: ' + appt.service_address : ''} Please ensure your vehicle is accessible. Questions? Call/text ${BUSINESS_PHONE}. — VDS Mobile`;
          const sent = await sendTwilioSms(base44, appt.customer_phone, msg, appt.customer_name);
          if (sent) {
            await base44.asServiceRole.entities.Appointment.update(appt.id, { reminder_1h_sms_sent: true });
            smsSent++;
          }
        }
      }
    }

    return Response.json({ success: true, processed: (appts || []).length, email_sent: emailSent, sms_sent: smsSent, skipped });
  } catch (error) {
    console.error('appointmentReminders error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});