import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Called by scheduled automation — polls GHL for cancelled/updated appointments
// and syncs status back to the local Appointment entity via service role.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require an authenticated admin OR a valid scheduler token — blocks anonymous callers.
    let user = null;
    try { user = await base44.auth.me(); } catch (e) { /* no session */ }
    const schedulerToken = req.headers.get('X-Scheduler-Token') || '';
    const SCHEDULER_TOKEN = Deno.env.get('SCHEDULER_TOKEN');
    const isAdmin = user && user.role === 'admin';
    const validToken = SCHEDULER_TOKEN && schedulerToken && schedulerToken === SCHEDULER_TOKEN;
    if (!isAdmin && !validToken) {
      return Response.json({ success: false, error: 'Forbidden — admin or scheduler token required.' }, { status: 403 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return Response.json({ success: true, message: 'GHL not configured, skipping sync.' });
    }

    const GHL_HEADERS = {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };

    // Fetch all non-cancelled, non-completed appointments that have GHL IDs
    const allAppointments = await base44.asServiceRole.entities.Appointment.filter({
      status: 'pending',
    });

    const confirmedAppointments = await base44.asServiceRole.entities.Appointment.filter({
      status: 'confirmed',
    });

    const appointments = [...allAppointments, ...confirmedAppointments].filter(
      a => a.ghl_appointment_ids && a.ghl_appointment_ids.trim() !== ''
    );

    let cancelledCount = 0;
    let confirmedCount = 0;

    for (const appt of appointments) {
      const ghlIds = appt.ghl_appointment_ids.split(',').map(s => s.trim()).filter(Boolean);
      if (ghlIds.length === 0) continue;

      // Check the first GHL appointment ID for this booking
      const ghlId = ghlIds[0];
      const res = await fetch(
        `https://services.leadconnectorhq.com/calendars/events/appointments/${ghlId}`,
        { headers: GHL_HEADERS }
      );

      if (res.status === 404) {
        // Appointment was deleted in GHL — mark as cancelled
        await base44.asServiceRole.entities.Appointment.update(appt.id, { status: 'cancelled' });
        cancelledCount++;
        continue;
      }

      if (!res.ok) {
        console.error('Failed to fetch GHL appointment', ghlId, res.status);
        continue;
      }

      const data = await res.json();
      const ghlStatus = data?.appointment?.appointmentStatus || data?.appointmentStatus || null;

      if (!ghlStatus) continue;

      // Map GHL status to our status
      // GHL statuses: new, confirmed, showed, noshow, cancelled, invalid
      if ((ghlStatus === 'cancelled' || ghlStatus === 'invalid') && appt.status !== 'cancelled') {
        await base44.asServiceRole.entities.Appointment.update(appt.id, { status: 'cancelled' });
        cancelledCount++;
      } else if (ghlStatus === 'confirmed' && appt.status === 'pending') {
        await base44.asServiceRole.entities.Appointment.update(appt.id, { status: 'confirmed' });
        confirmedCount++;
      } else if ((ghlStatus === 'showed') && appt.status !== 'completed') {
        await base44.asServiceRole.entities.Appointment.update(appt.id, { status: 'completed' });
      }
    }

    console.log(`Sync complete: ${cancelledCount} cancelled, ${confirmedCount} confirmed`);
    return Response.json({ success: true, cancelledCount, confirmedCount, checked: appointments.length });

  } catch (error) {
    console.error('syncAppointmentsFromGHL error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});