import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// These must match the calendars used in submitBookingToGHL
// 1 vehicle = 2hr block, 2 = 4hr, 3 = 6hr, 4 = 8hr
const VEHICLE_COUNT_CALENDARS = {
  1: 'W3YOnJ9bJ9j1djLVwEUO',
  2: '2HH9Lex4GmTLrPjoXoP4',
  3: 'QAeZZSeyLXJSiLOq7WzG',
  4: 'BNR6W3lXdovjpF7hJ0zg',
};

// Consultation calendar
const CONSULTATION_CALENDAR_ID = 'K65mCRHHLWHJwXI7uIQn';

const CONSULTATION_SERVICES = ['ceramic_coating', 'paint_correction'];

Deno.serve(async (req) => {
  try {
    // Public read-only endpoint (guests check availability without login).
    // Origin/Referer headers are client-controlled and must not be used as a security
    // boundary — they are trivially spoofed by non-browser clients. Browser cross-origin
    // access is governed by the platform's CORS configuration; this endpoint exposes only
    // non-sensitive booked-slot data already shown on the public booking page.
    const base44 = createClientFromRequest(req);

    const { service_type, vehicle_type, date, vehicle_count } = await req.json();

    if (!service_type || !date) {
      return Response.json({ error: 'Missing service_type or date' }, { status: 400 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    if (!GHL_API_KEY) {
      return Response.json({ bookedSlots: [] });
    }

    // Pick the calendar to check
    let calendarId;
    if (CONSULTATION_SERVICES.includes(service_type)) {
      calendarId = CONSULTATION_CALENDAR_ID;
    } else {
      // Default to 1-vehicle calendar; use vehicle_count if provided
      const count = Math.min(Math.max(parseInt(vehicle_count) || 1, 1), 4);
      calendarId = VEHICLE_COUNT_CALENDARS[count];
    }

    if (!calendarId) {
      return Response.json({ bookedSlots: [] });
    }

    // Use the free-slots API — returns available slots; we invert to get booked ones
    // GHL expects Unix timestamps in milliseconds
    const dayStart = new Date(`${date}T00:00:00-04:00`).getTime();
    const dayEnd   = new Date(`${date}T23:59:59-04:00`).getTime();

    const slotsUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${dayStart}&endDate=${dayEnd}&timezone=America/New_York`;

    const res = await fetch(slotsUrl, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-04-15',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('GHL free-slots fetch failed:', res.status, errText);
      // Fallback: try the events endpoint
      const startTime = `${date}T00:00:00-04:00`;
      const endTime   = `${date}T23:59:59-04:00`;
      const eventsUrl = `https://services.leadconnectorhq.com/calendars/events?calendarId=${calendarId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
      const eventsRes = await fetch(eventsUrl, {
        headers: { 'Authorization': `Bearer ${GHL_API_KEY}`, 'Version': '2021-04-15' },
      });
      if (!eventsRes.ok) {
        console.error('GHL events fallback also failed:', eventsRes.status, await eventsRes.text());
        return Response.json({ bookedSlots: [] });
      }
      const eventsData = await eventsRes.json();
      const events = eventsData?.events || [];
      const bookedSlots = events
        .filter(e => e.status !== 'cancelled')
        .map(event => {
          const start = new Date(event.startTime);
          return start.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
        });
      console.log('Events fallback booked slots:', bookedSlots);
      return Response.json({ bookedSlots });
    }

    const data = await res.json();

    // GHL response shape: { "<date>": { slots: ["2026-06-19T09:00:00-04:00", ...] }, "traceId": "..." }
    // slots = available ISO strings; we invert against our TIME_SLOTS to find booked ones
    const ALL_TIME_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM'];

    const rawSlots = data?.[date]?.slots || [];

    const toET = (isoStr) => new Date(isoStr).toLocaleString('en-US', {
      timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const availableSlots = new Set(rawSlots.map(toET));
    const bookedSlots = ALL_TIME_SLOTS.filter(s => !availableSlots.has(s));

    console.log(`Calendar ${calendarId} on ${date}: ${rawSlots.length} available, booked:`, bookedSlots);

    return Response.json({ bookedSlots });

  } catch (error) {
    console.error('getCalendarAvailability error:', error.message);
    return Response.json({ bookedSlots: [] });
  }
});