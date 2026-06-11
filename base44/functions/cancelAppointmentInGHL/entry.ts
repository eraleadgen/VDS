import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appointment_id } = await req.json();

    if (!appointment_id) {
      return Response.json({ success: false, error: 'Missing appointment_id' }, { status: 400 });
    }

    // Get appointment from database
    const appointment = await base44.entities.Appointment.get(appointment_id);
    if (!appointment) {
      return Response.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL secrets not configured. Cancelling locally only.');
      return Response.json({ success: true, message: 'Local cancellation only (GHL not configured).' });
    }

    const GHL_HEADERS = {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };

    // Find contact in GHL
    let contactId = null;
    if (appointment.customer_email) {
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(appointment.customer_email)}`,
        { headers: GHL_HEADERS }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        contactId = searchData?.contact?.id || null;
      }
    }

    if (!contactId && appointment.customer_phone) {
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&phoneNumber=${encodeURIComponent(appointment.customer_phone)}`,
        { headers: GHL_HEADERS }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        contactId = searchData?.contact?.id || null;
      }
    }

    if (!contactId) {
      console.log('No GHL contact found. Local cancellation only.');
      return Response.json({ success: true, message: 'Contact not found in GHL. Local cancellation only.' });
    }

    // Get calendar events for this contact on the appointment date
    const startDate = appointment.preferred_date;
    const endDate = appointment.preferred_date;

    const eventsRes = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?locationId=${GHL_LOCATION_ID}&contactId=${contactId}&start=${startDate}&end=${endDate}`,
      { headers: GHL_HEADERS }
    );

    if (!eventsRes.ok) {
      console.error('Failed to fetch GHL events:', await eventsRes.text());
      return Response.json({ success: true, message: 'Could not fetch GHL events. Local cancellation only.' });
    }

    const eventsData = await eventsRes.json();
    const events = eventsData?.events || [];

    // Find matching appointment by time
    const matchingEvent = events.find(event => {
      const eventDate = event.startTime?.split('T')[0];
      const eventTime = event.startTime?.split('T')[1]?.substring(0, 5);
      const aptTime = appointment.preferred_time?.replace(/[: ]/g, '');
      const eventTimeFormatted = eventTime?.replace(':', '');
      
      return eventDate === startDate && eventTimeFormatted === aptTime;
    });

    if (matchingEvent && matchingEvent.id) {
      // Update appointment status to cancelled (GHL prefers status update over DELETE)
      const cancelRes = await fetch(
        `https://services.leadconnectorhq.com/calendars/events/appointments/${matchingEvent.id}`,
        {
          method: 'PUT',
          headers: GHL_HEADERS,
          body: JSON.stringify({
            appointmentStatus: 'cancelled',
          }),
        }
      );

      if (!cancelRes.ok) {
        console.error('GHL appointment cancellation failed:', await cancelRes.text());
        return Response.json({ success: true, message: 'Local cancelled, GHL sync failed.' });
      }

      console.log('GHL appointment cancelled:', matchingEvent.id);
      return Response.json({ success: true, message: 'Appointment cancelled in GHL.' });
    } else {
      console.log('No matching GHL appointment found. Local cancellation only.');
      return Response.json({ success: true, message: 'No GHL appointment found. Local cancellation only.' });
    }

  } catch (error) {
    console.error('cancelAppointmentInGHL error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});