import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { parseTimeTo24h, zonedToUtc } from '../../shared/timezone.ts';

// ERA Core appointment reschedule.
// The member picks a new date/time only (no re-entry of contact/vehicle info).
// Updates the Appointment (deprecated mirror), the linked Job (source of truth),
// and the Google Calendar mirror event, then notifies the assigned specialist.
// The old date is overwritten in place — this preserves the Job link and specialist
// assignment (which a delete+recreate would orphan), satisfying "the new date becomes
// the appointment, the old one is gone, and anyone assigned is notified."

const FONT = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Space Mono','Courier New',monospace";

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function logEvent(base44, event) {
  try {
    await base44.functions.invoke('logEvent', { scheduler_token: Deno.env.get('SCHEDULER_TOKEN'), ...event });
  } catch (e) { console.error('logEvent failed:', e.message); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { appointment_id, new_date, new_time } = await req.json();
    if (!appointment_id || !new_date || !new_time) {
      return Response.json({ success: false, error: 'Missing appointment_id, new_date, or new_time' }, { status: 400 });
    }

    const appt = await base44.asServiceRole.entities.Appointment.get(appointment_id);
    if (!appt) return Response.json({ success: false, error: 'Appointment not found' }, { status: 404 });

    // ── Ownership check (same boundary as cancelAppointmentInGHL) ──────────
    let owns = !!(user.id && appt.created_by_id && appt.created_by_id === user.id);
    if (!owns && user.email && appt.customer_email) {
      owns = appt.customer_email.toLowerCase() === user.email.toLowerCase();
    }
    if (!owns && user.data?.phone && appt.customer_phone) {
      owns = appt.customer_phone.replace(/\D/g, '').slice(-10) === String(user.data.phone).replace(/\D/g, '').slice(-10);
    }
    if (!owns && user.id) {
      const myCustomers = await base44.asServiceRole.entities.Customer.filter({ linked_user_id: user.id }).catch(() => []);
      const c = myCustomers && myCustomers[0];
      if (c && c.phone && appt.customer_phone) {
        owns = appt.customer_phone.replace(/\D/g, '').slice(-10) === c.phone.replace(/\D/g, '').slice(-10);
      }
    }
    if (!owns && user.role !== 'admin') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // ── Duplicate-booking check for the new date (same customer, non-cancelled) ──
    const phoneDigits = (appt.customer_phone || '').replace(/\D/g, '');
    if (phoneDigits) {
      try {
        const dayJobs = await base44.asServiceRole.entities.Job.filter({ appointment_date: new_date });
        const dup = (dayJobs || []).find(j =>
          j.status !== 'cancelled' &&
          j.id !== appt.job_id &&
          (j.customer_phone || '').replace(/\D/g, '').slice(-10) === phoneDigits.slice(-10)
        );
        if (dup) {
          return Response.json({ success: false, error: 'You already have another appointment booked on that date.' }, { status: 409 });
        }
      } catch (e) { console.error('Duplicate check error:', e.message); }
    }

    const durationMin = appt.estimated_duration_minutes || 120;
    const oldDate = appt.preferred_date;
    const oldTime = appt.preferred_time;

    // ── Update the Appointment mirror ──────────────────────────────────────
    await base44.asServiceRole.entities.Appointment.update(appointment_id, {
      preferred_date: new_date,
      preferred_time: new_time,
      status: 'confirmed',
    });

    // ── Update the linked Job (source of truth) + resolve assigned specialist ──
    let specialist = null;
    let job = null;
    if (appt.job_id) {
      try {
        job = await base44.asServiceRole.entities.Job.get(appt.job_id);
        const jobUpdates = { appointment_date: new_date, appointment_time: new_time };
        if (job && job.status === 'cancelled') jobUpdates.status = 'appointment_scheduled';
        await base44.asServiceRole.entities.Job.update(appt.job_id, jobUpdates);

        if (job && job.specialist_id) {
          try {
            specialist = await base44.asServiceRole.entities.Contractor.get(job.specialist_id);
          } catch (e) { console.error('Specialist lookup failed:', e.message); }
        }

        await logEvent(base44, {
          event_type: 'appointment_rescheduled',
          entity_type: 'job',
          entity_id: appt.job_id,
          customer_id: job?.customer_id || null,
          description: `Appointment rescheduled to ${new_date} at ${new_time}`,
          metadata: { appointment_id, old_date: oldDate, old_time: oldTime, new_date, new_time },
        });
      } catch (e) { console.error('Job update failed:', e.message); }
    }

    // ── Move the Google Calendar mirror event ─────────────────────────────
    const eventId = appt.google_calendar_event_id || (job && job.google_calendar_event_id);
    if (eventId) {
      try {
        let tz = 'America/New_York';
        try {
          const cfgs = await base44.asServiceRole.entities.BusinessConfig.filter({ is_active: true });
          if (cfgs && cfgs[0] && cfgs[0].timezone) tz = cfgs[0].timezone;
        } catch {}

        const t24 = parseTimeTo24h(new_time) || '08:00';
        const startUtc = zonedToUtc(new_date, t24, tz);
        const endUtc = new Date(startUtc.getTime() + durationMin * 60000);

        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: { dateTime: startUtc.toISOString(), timeZone: tz },
            end: { dateTime: endUtc.toISOString(), timeZone: tz },
          }),
        });
      } catch (e) { console.error('GCal event update failed (non-blocking):', e.message); }
    }

    // ── Notify the assigned specialist ─────────────────────────────────────
    if (specialist && specialist.email) {
      try {
        const custName = escapeHtml(appt.customer_name || 'the customer');
        const veh = escapeHtml(appt.vehicle_info || 'N/A');
        const addr = escapeHtml(appt.service_address || 'N/A');
        const svc = escapeHtml(appt.service_label || appt.service_type || 'Detailing service');
        const datePretty = escapeHtml(new_date);
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:${FONT};color:#E2E8F0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;"><tr><td align="center" style="padding:32px 16px;">
<table cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#14161A;border-radius:12px;border:1px solid rgba(212,175,55,0.18);">
<tr><td style="background-color:#000000;padding:22px 28px;border-bottom:2px solid #D4AF37;">
  <p style="margin:0;font-family:${FONT};font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</p>
  <p style="margin:4px 0 0 0;font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;text-transform:uppercase;">Appointment Rescheduled</p>
</td></tr>
<tr><td style="padding:26px 28px;">
  <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#CBD5E1;">Hi ${escapeHtml(specialist.name || 'Specialist')},</p>
  <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#CBD5E1;">A customer has rescheduled an appointment assigned to you. Details below:</p>
  <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px 0;">
    <tr><td style="padding:0 0 8px 0;font-family:${MONO};font-size:12px;color:#94A3B8;">CLIENT</td><td style="padding:0 0 8px 0;font-size:14px;color:#E2E8F0;">${custName}</td></tr>
    <tr><td style="padding:0 0 8px 0;font-family:${MONO};font-size:12px;color:#94A3B8;">SERVICE</td><td style="padding:0 0 8px 0;font-size:14px;color:#E2E8F0;">${svc}</td></tr>
    <tr><td style="padding:0 0 8px 0;font-family:${MONO};font-size:12px;color:#94A3B8;">VEHICLE</td><td style="padding:0 0 8px 0;font-size:14px;color:#E2E8F0;">${veh}</td></tr>
    <tr><td style="padding:0 0 8px 0;font-family:${MONO};font-size:12px;color:#94A3B8;">NEW DATE</td><td style="padding:0 0 8px 0;font-size:14px;color:#D4AF37;font-weight:700;">${datePretty}</td></tr>
    <tr><td style="padding:0 0 8px 0;font-family:${MONO};font-size:12px;color:#94A3B8;">NEW TIME</td><td style="padding:0 0 8px 0;font-size:14px;color:#D4AF37;font-weight:700;">${escapeHtml(new_time)}</td></tr>
    <tr><td style="padding:0 0 8px 0;font-family:${MONO};font-size:12px;color:#94A3B8;">ADDRESS</td><td style="padding:0 0 8px 0;font-size:14px;color:#E2E8F0;">${addr}</td></tr>
  </table>
  <p style="margin:0;font-size:13px;line-height:22px;color:#94A3B8;font-family:${MONO};">This change is reflected on your calendar and in the Specialist Portal.</p>
</td></tr>
<tr><td style="background-color:#000000;padding:20px 28px;border-top:1px solid rgba(212,175,55,0.15);">
  <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC</p>
</td></tr>
</table>
</td></tr></table></body></html>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: specialist.email,
          subject: 'Appointment Rescheduled — VDS Mobile',
          body: html,
          from_name: 'VDS Mobile',
        });
      } catch (e) { console.error('Specialist notify failed:', e.message); }
    }

    // ── Internal notification email to the business ────────────────────────
    try {
      const iCust = escapeHtml(appt.customer_name || 'N/A');
      const iPhone = escapeHtml(appt.customer_phone || 'N/A');
      const iEmail = escapeHtml(appt.customer_email || 'N/A');
      const iAddr = escapeHtml(appt.service_address || 'N/A');
      const iSvc = escapeHtml(appt.service_label || appt.service_type || 'Detailing');
      const iSpec = escapeHtml(specialist?.name || 'Unassigned');
      const iVeh = escapeHtml(appt.vehicle_info || 'N/A');
      const internalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0A0B0D;font-family:${FONT};color:#E2E8F0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0B0D;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14161A;border-radius:14px;overflow:hidden;border:1px solid rgba(212,175,55,0.15);box-shadow:0 8px 30px rgba(0,0,0,0.5);">
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-bottom:2px solid #D4AF37;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:700;letter-spacing:3px;color:#FFFFFF;">VDS&nbsp;MOBILE</td>
      <td align="right" style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700;text-transform:uppercase;">Rescheduled</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 6px 28px;">
    <p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Appointment Rescheduled</p>
    <h1 style="margin:0;font-size:24px;line-height:32px;color:#E2E8F0;font-weight:700;">${iCust}</h1>
    <p style="margin:4px 0 0 0;font-family:${MONO};font-size:13px;color:#94A3B8;">Old: ${escapeHtml(oldDate)} at ${escapeHtml(oldTime)} &rarr; New: ${escapeHtml(new_date)} at ${escapeHtml(new_time)}</p>
  </td></tr>
  <tr><td style="padding:16px 28px 8px 28px;background-color:#0F1115;">
    <p style="margin:0 0 12px 0;padding-top:14px;font-family:${MONO};font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;">Updated Details</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Client</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${iCust}</td></tr>
      <tr><td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Phone</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${iPhone}</td></tr>
      <tr><td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Email</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${iEmail}</td></tr>
      <tr><td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Service Address</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${iAddr}</td></tr>
      <tr><td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Service</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${iSvc}</td></tr>
      <tr><td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Vehicle</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${iVeh}</td></tr>
      <tr><td style="padding:4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;">Assigned Specialist</td></tr>
      <tr><td style="font-size:15px;color:#E2E8F0;font-weight:500;padding-bottom:8px;">${iSpec}</td></tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#0A0B0D;padding:22px 28px;border-top:2px solid #D4AF37;">
    <p style="margin:0;font-family:${MONO};font-size:11px;color:#64748B;letter-spacing:0.5px;">&copy; ${new Date().getUTCFullYear()} VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'valetdetailingservice@gmail.com',
        subject: `Appointment Rescheduled — ${appt.customer_name || 'Client'} — ${new_date} ${new_time}`,
        body: internalHtml,
        from_name: 'VDS Mobile',
      });
    } catch (e) { console.error('Internal reschedule notification email failed:', e.message); }

    return Response.json({ success: true, specialist_notified: !!(specialist && specialist.email), internal_notified: true });

  } catch (error) {
    console.error('rescheduleAppointment error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});