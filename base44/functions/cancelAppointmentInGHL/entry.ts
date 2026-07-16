import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // Ownership check — verify against immutable, verified identity only (user id or verified auth email).
    // Phone is a mutable/enumerable contact field and must NOT be used as an authorization key
    // (a user could otherwise set their phone to a victim's to bypass ownership).
    const owns =
      appointment.created_by_id === user.id ||
      (appointment.customer_email && user.email && appointment.customer_email.toLowerCase() === user.email.toLowerCase());
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

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    const GHL_HEADERS = {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };

    // ── Cancel in GHL using stored appointment IDs ─────────────────────────
    if (GHL_API_KEY && GHL_LOCATION_ID && appointment.ghl_appointment_ids) {
      const ids = appointment.ghl_appointment_ids.split(',').map(s => s.trim()).filter(Boolean);
      for (const ghlId of ids) {
        const deleteRes = await fetch(
          `https://services.leadconnectorhq.com/calendars/events/appointments/${ghlId}`,
          { method: 'DELETE', headers: GHL_HEADERS }
        );
        if (!deleteRes.ok) {
          console.error('GHL appointment deletion failed for ID', ghlId, ':', deleteRes.status, await deleteRes.text());
        } else {
          console.log('GHL appointment deleted:', ghlId);
        }
      }
    } else if (GHL_API_KEY && GHL_LOCATION_ID) {
      // Fallback: search by contact + date if no stored ID
      console.log('No stored GHL IDs — attempting fallback search by contact and date');
      let contactId = null;
      const searchField = appointment.customer_email
        ? `email=${encodeURIComponent(appointment.customer_email)}`
        : appointment.customer_phone
          ? `phoneNumber=${encodeURIComponent(appointment.customer_phone)}`
          : null;

      if (searchField) {
        const searchRes = await fetch(
          `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&${searchField}`,
          { headers: GHL_HEADERS }
        );
        if (searchRes.ok) {
          const d = await searchRes.json();
          contactId = d?.contact?.id || null;
        }
      }

      if (contactId) {
        const eventsRes = await fetch(
          `https://services.leadconnectorhq.com/calendars/events?locationId=${GHL_LOCATION_ID}&contactId=${contactId}&start=${appointment.preferred_date}&end=${appointment.preferred_date}`,
          { headers: GHL_HEADERS }
        );
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const events = eventsData?.events || [];
          // Match by time proximity
          const timeMatch = (appointment.preferred_time || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let h = parseInt(timeMatch[1]), m = parseInt(timeMatch[2]);
            const mer = timeMatch[3].toUpperCase();
            if (mer === 'PM' && h !== 12) h += 12;
            if (mer === 'AM' && h === 12) h = 0;
            const apptMins = h * 60 + m;
            for (const event of events) {
              if (!event.startTime) continue;
              const [eH, eM] = (event.startTime.split('T')[1] || '').split(':').map(Number);
              if (Math.abs((eH * 60 + eM) - apptMins) <= 5) {
                await fetch(
                  `https://services.leadconnectorhq.com/calendars/events/appointments/${event.id}`,
                  { method: 'DELETE', headers: GHL_HEADERS }
                );
                console.log('Fallback: GHL appointment deleted:', event.id);
                break;
              }
            }
          }
        }
      }
    }

    // ── Update local status to cancelled via service role ─────────────────
    await base44.asServiceRole.entities.Appointment.update(appointment_id, { status: 'cancelled' });

    return Response.json({ success: true });

  } catch (error) {
    console.error('cancelAppointmentInGHL error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});