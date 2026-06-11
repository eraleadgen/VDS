import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Calendar ID map (mirrors submitBookingToGHL)
const CALENDAR_IDS = {
  vds_gold_exterior_sedan_coupe: 'H3DX0ztGWQ4BBliILHim',
  vds_gold_exterior_truck_suv:   'LO4uEJer1WKHdXvjwxhF',
  vds_gold_full_sedan_coupe:     'U30SDSZI19VAr9vzX2we',
  vds_gold_full_truck_suv:       'hgqeZGlC2xXg4WoK4GtG',
  full_detail_sedan_coupe:       'Q9ik2XQBOogEm127sgQf',
  exterior_detail_sedan_coupe:   'PapYeoYdsEQzRVST5mJ9',
  interior_detail_sedan_coupe:   'nqXqR49QjxMCACvE7kcl',
  full_detail_truck_suv:         '57xm2gp8cKGXHiXV8LLt',
  exterior_detail_truck_suv:     '3Z3rjETwPUzvle0sxkGT',
  interior_detail_truck_suv:     '1yz6e2OBSHN2oDlUvNPr',
  // Consultation calendars (ceramic coating / paint correction)
  ceramic_coating_gold:          'eC6OePx9BgUqBdtjH57C',
  paint_correction_gold:         'eC6OePx9BgUqBdtjH57C',
  ceramic_coating_standard:      'K65mCRHHLWHJwXI7uIQn',
  paint_correction_standard:     'K65mCRHHLWHJwXI7uIQn',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { service_type, vehicle_type, date } = await req.json();

    if (!service_type || !date) {
      return Response.json({ error: 'Missing service_type or date' }, { status: 400 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    if (!GHL_API_KEY) {
      // If GHL not configured, return all slots available
      return Response.json({ bookedSlots: [] });
    }

    const CONSULTATION_SERVICES = ['ceramic_coating', 'paint_correction'];
    let calendarKey;
    if (CONSULTATION_SERVICES.includes(service_type)) {
      const tier = vehicle_type === 'gold' ? 'gold' : 'standard';
      calendarKey = `${service_type}_${tier}`;
    } else {
      calendarKey = vehicle_type ? `${service_type}_${vehicle_type}` : null;
    }
    const calendarId = calendarKey ? CALENDAR_IDS[calendarKey] : null;

    if (!calendarId) {
      return Response.json({ bookedSlots: [] });
    }

    // Fetch appointments for the given date from GHL
    // Date range: start of day to end of day in ET (UTC-4 in summer)
    const startTime = `${date}T00:00:00-04:00`;
    const endTime   = `${date}T23:59:59-04:00`;

    const url = `https://services.leadconnectorhq.com/calendars/events?calendarId=${calendarId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-04-15',
      },
    });

    if (!res.ok) {
      console.error('GHL availability fetch failed:', await res.text());
      return Response.json({ bookedSlots: [] });
    }

    const data = await res.json();
    const events = data?.events || [];

    // Extract booked time slots — convert each event start time to "H:MM AM/PM" format
    const bookedSlots = events.map(event => {
      const start = new Date(event.startTime);
      // Convert to ET
      const etString = start.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
      return etString;
    });

    return Response.json({ bookedSlots });

  } catch (error) {
    console.error('getCalendarAvailability error:', error);
    return Response.json({ bookedSlots: [] }); // fail open — don't block the booking form
  }
});