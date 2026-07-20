import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ERA Core appointment cancellation.
// GoHighLevel sync has been eliminated — ERA Core is the sole source of truth.
// Cancels the Appointment (deprecated mirror), the linked Job, and the Google Calendar mirror.

async function logEvent(base44, event) {
  try {
    await base44.functions.invoke('logEvent', {
      scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      ...event,
    });
  } catch (e) {
    console.error('logEvent failed:', e.message);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { appointment_id } = await req.json();
    if (!appointment_id) return Response.json({ success: false, error: 'Missing appointment_id' }, { status: 400 });

    // Fetch appointment via service role (bypasses read RLS)
    const appointment = await base44.asServiceRole.entities.Appointment.get(appointment_id);
    if (!appointment) return Response.json({ success: false, error: 'Appointment not found' }, { status: 404 });

    // Ownership check — authorize via the verified user id → the member's Customer record →
    // the appointment's stored customer phone. Never trust the caller's email as a sole
    // authorization boundary (CWE-639): emails are enumerable, and a user could register with
    // a victim's email to hijack guest bookings. Guest appointments (no verifiable owner) and
    // appointments whose stored phone does not match the caller's verified Customer may only be
    // cancelled by an admin.
    let owns = !!(user.id && appointment.created_by_id && appointment.created_by_id === user.id);
    // Email match — mirrors the Appointment read RLS (customer_email === caller email).
    // Covers members whose bookings predate the ERA Core Customer entity (no Customer row yet),
    // which was causing a silent 403 and the "cancel does nothing" symptom on the live site.
    if (!owns && user.email && appointment.customer_email) {
      owns = appointment.customer_email.toLowerCase() === user.email.toLowerCase();
    }
    // Phone match against the caller's verified profile phone (Appointment read RLS).
    if (!owns && user.data?.phone && appointment.customer_phone) {
      owns = appointment.customer_phone.replace(/\D/g, '').slice(-10) === String(user.data.phone).replace(/\D/g, '').slice(-10);
    }
    if (!owns && user.id) {
      const myCustomers = await base44.asServiceRole.entities.Customer.filter({ linked_user_id: user.id }).catch(() => []);
      const c = myCustomers && myCustomers[0];
      if (c && c.phone && appointment.customer_phone) {
        owns = appointment.customer_phone.replace(/\D/g, '').slice(-10) === c.phone.replace(/\D/g, '').slice(-10);
      }
    }
    if (!owns && user.role !== 'admin') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // ── Delete Google Calendar event mirror (if present) ──────────────────
    if (appointment.google_calendar_event_id) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointment.google_calendar_event_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('GCal event deleted:', appointment.google_calendar_event_id);
      } catch (e) {
        console.error('GCal event deletion failed (non-blocking):', e.message);
      }
    }

    // ── Update local Appointment status to cancelled ──────────────────────
    await base44.asServiceRole.entities.Appointment.update(appointment_id, { status: 'cancelled' });

    // ── Cancel the linked Job (source of truth) ───────────────────────────
    let jobCancelled = false;
    if (appointment.job_id) {
      try {
        await base44.asServiceRole.entities.Job.update(appointment.job_id, { status: 'cancelled' });
        jobCancelled = true;
        await logEvent(base44, {
          event_type: 'appointment_cancelled',
          entity_type: 'job',
          entity_id: appointment.job_id,
          customer_id: appointment.customer_id || null,
          description: `Appointment cancelled for ${appointment.customer_name || 'customer'}`,
          metadata: { appointment_id, reason: 'reschedule_or_cancellation' },
        });
      } catch (e) {
        console.error('Failed to cancel linked Job:', e.message);
      }
    }

    // ── Internal + customer cancellation notification email ────────────────
    try {
      await base44.functions.invoke('sendCancellationNotification', {
        appointment_id,
        scheduler_token: Deno.env.get('SCHEDULER_TOKEN'),
      });
    } catch (e) { console.error('Cancellation notification failed:', e.message); }

    return Response.json({ success: true, job_cancelled: jobCancelled });

  } catch (error) {
    console.error('cancelAppointment error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});