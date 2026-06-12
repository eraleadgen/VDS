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
    const appointment = await base44.asServiceRole.entities.Appointment.get(appointment_id);
    if (!appointment) {
      return Response.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // Ownership check: only the appointment owner (or admin) can cancel it
    if (appointment.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
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

    // Find matching appointment by time (more flexible matching)
    const appointmentDate = startDate;
    const appointmentTimeStr = appointment.preferred_time || '';
    
    // Parse appointment time: "1:00 PM" -> hour 13, minute 0
    const timeMatch = appointmentTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let appointmentHour = 0, appointmentMinute = 0;
    if (timeMatch) {
      appointmentHour = parseInt(timeMatch[1], 10);
      appointmentMinute = parseInt(timeMatch[2], 10);
      const meridiem = timeMatch[3].toUpperCase();
      if (meridiem === 'PM' && appointmentHour !== 12) appointmentHour += 12;
      if (meridiem === 'AM' && appointmentHour === 12) appointmentHour = 0;
    }
    
    const matchingEvent = events.find(event => {
      if (!event.startTime) return false;
      
      const eventDate = event.startTime.split('T')[0];
      if (eventDate !== appointmentDate) return false;
      
      // Parse event start time from ISO format
      const eventTimeStr = event.startTime.split('T')[1] || '';
      const [eventHourStr, eventMinuteStr] = eventTimeStr.split(':');
      const eventHour = parseInt(eventHourStr, 10);
      const eventMinute = parseInt(eventMinuteStr, 10);
      
      // Match if within 5 minutes (account for timezone/stagger differences)
      const timeDiff = Math.abs((eventHour * 60 + eventMinute) - (appointmentHour * 60 + appointmentMinute));
      return timeDiff <= 5;
    });

    if (matchingEvent && matchingEvent.id) {
      // DELETE the appointment from GHL calendar (removes it completely)
      const deleteRes = await fetch(
        `https://services.leadconnectorhq.com/calendars/events/appointments/${matchingEvent.id}`,
        {
          method: 'DELETE',
          headers: GHL_HEADERS,
        }
      );

      if (!deleteRes.ok) {
        const errorText = await deleteRes.text();
        console.error('GHL appointment deletion failed:', deleteRes.status, errorText);
        return Response.json({ success: true, message: 'Local cancelled, GHL sync failed.' });
      }

      console.log('GHL appointment deleted:', matchingEvent.id);
      return Response.json({ success: true, message: 'Appointment cancelled in GHL.' });
    } else {
      console.log('No matching GHL appointment found for deletion. Local cancellation only.');
      return Response.json({ success: true, message: 'No GHL appointment found. Local cancellation only.' });
    }

  } catch (error) {
    console.error('cancelAppointmentInGHL error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});