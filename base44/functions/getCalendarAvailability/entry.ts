import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import { resolveBusinessIdFromHost } from '../../shared/tenantContext.ts';

// Public availability endpoint for the booking calendar.
// GoHighLevel has been fully removed — availability is now resolved by the ERA Core
// scheduling engine (Google Calendar busy times + contractor availability + business
// hours), which is the same source of truth bookings are created against. This prevents
// the stale/double-booking risk of querying a calendar that new bookings never reach.
// Returns `bookedSlots` (array of "H:MM AM" strings) so the existing booking calendar can
// disable unavailable hourly slots unchanged.

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

// "09:00" (24h) → "9:00 AM"
function toAmPm(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return '';
  let h = parseInt(hhmm.split(':')[0], 10);
  const m = String(hhmm.split(':')[1]).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ap}`;
}

Deno.serve(async (req) => {
  try {
    // Public read-only endpoint (guests check availability without login). Browser
    // cross-origin access is governed by the platform's CORS configuration; this endpoint
    // exposes only non-sensitive slot availability already shown on the public booking page.
    const base44 = createClientFromRequest(req);
    const { service_type, vehicle_type, date } = await req.json();

    // Phase 4: resolve business_id from the request hostname (multi-tenant).
    const businessId = await resolveBusinessIdFromHost(base44, req);

    if (!service_type || !date) {
      return Response.json({ error: 'Missing service_type or date' }, { status: 400 });
    }

    // Delegate to the scheduling engine. `check_availability` is a public scheduler action
    // that returns the available start times (accounting for service duration + buffer, so
    // overlapping multi-hour events are correctly excluded — preventing double bookings).
    const res = await base44.asServiceRole.functions.invoke('scheduler', {
      action: 'check_availability',
      business_id: businessId,
      service: service_type,
      vehicle_type: vehicle_type || 'sedan_coupe',
      date,
    });
    const data = res?.data || res;
    const slots = (data && Array.isArray(data.slots)) ? data.slots : [];
    const availableSet = new Set(slots.map(s => toAmPm(s.time)).filter(Boolean));

    const bookedSlots = TIME_SLOTS.filter(s => !availableSet.has(s));
    return Response.json({ bookedSlots });
  } catch (error) {
    console.error('getCalendarAvailability error:', error.message);
    // On any failure, surface no booked slots rather than blocking all booking.
    return Response.json({ bookedSlots: [] });
  }
});