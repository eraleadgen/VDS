import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// 4 calendars based on vehicle count
// 1 vehicle = 2hr, 2 vehicles = 4hr, 3 vehicles = 6hr, 4 vehicles = 8hr
const CALENDAR_IDS = {
  1: 'W3YOnJ9bJ9j1djLVwEUO', // VDS Calendar — 1 Vehicle (2hr)
  2: '2HH9Lex4GmTLrPjoXoP4',  // VDS Calendar — 2 Vehicles (4hr)
  3: 'QAeZZSeyLXJSiLOq7WzG', // VDS Calendar — 3 Vehicles (6hr)
  4: 'BNR6W3lXdovjpF7hJ0zg',  // VDS Calendar — 4 Vehicles (8hr)
};

// Ceramic/Paint Correction consultation calendar
const CONSULTATION_CALENDAR_ID = 'K65mCRHHLWHJwXI7uIQn';

const SERVICE_LABELS = {
  exterior_detail: 'Exterior Detail',
  interior_detail: 'Interior Detail',
  full_detail: 'Full Interior + Exterior Detail',
  vds_gold_exterior: 'VDS Gold — Exterior Detail',
  vds_gold_full: 'VDS Gold — Full Detail',
  ceramic_coating: 'Ceramic Coating Consultation',
  paint_correction: 'Paint Correction Consultation',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth is optional — guests can book without an account
    let user = null;
    try { user = await base44.auth.me(); } catch (e) { /* guest */ }

    const {
      name, phone, email, address,
      service_type, vehicle_type, vehicle_info,
      vehicle_details, notes,
      preferred_date, preferred_time,
    } = await req.json();

    if (!name || !phone || !address || !service_type) {
      return Response.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return Response.json({ success: false, error: 'Please enter a valid phone number.' }, { status: 400 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL secrets not configured. Booking received:', { name, phone, email });
      return Response.json({ success: true, message: 'Booking received (GHL not configured).' });
    }

    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ') || '';

    const GHL_HEADERS = {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };

    // ── 1. Upsert GHL Contact ──────────────────────────────────────────────
    let contactId = null;
    if (email) {
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
        { headers: GHL_HEADERS }
      );
      if (searchRes.ok) {
        const d = await searchRes.json();
        contactId = d?.contact?.id || null;
      }
    }

    const contactBase = {
      firstName, lastName, phone,
      email: email || undefined,
      address1: address,
      tags: ['website-booking', service_type],
      source: 'VDS Website Booking Form',
    };

    if (contactId) {
      const res = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        method: 'PUT', headers: GHL_HEADERS, body: JSON.stringify(contactBase),
      });
      if (!res.ok) console.error('GHL contact update failed:', res.status, await res.text());
    } else {
      const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST', headers: GHL_HEADERS,
        body: JSON.stringify({ ...contactBase, locationId: GHL_LOCATION_ID }),
      });
      const d = await res.json();
      if (!res.ok) {
        const fallbackId = d?.meta?.contactId;
        if (fallbackId) {
          await fetch(`https://services.leadconnectorhq.com/contacts/${fallbackId}`, {
            method: 'PUT', headers: GHL_HEADERS, body: JSON.stringify(contactBase),
          });
          contactId = fallbackId;
        } else {
          console.error('GHL contact creation failed:', JSON.stringify(d));
          return Response.json({ success: false, error: 'Failed to create contact in GHL.' }, { status: 500 });
        }
      } else {
        contactId = d.contact?.id;
      }
    }

    // ── 2. Parse vehicle entries from vehicle_details ──────────────────────
    // Format: "2020 Toyota Camry, White (Sedan/Coupe) — Full Detail | 2018 Ford F-150 (Truck/SUV) — Exterior Detail"
    const vehicleEntries = vehicle_details
      ? vehicle_details.split(' | ').map(v => v.trim()).filter(Boolean)
      : [];

    // Determine if any vehicle has Gold membership
    const isGoldBooking = vehicleEntries.some(e => e.includes('VDS Gold'));

    // ── 3. Add booking note to contact ─────────────────────────────────────
    if (contactId) {
      const appointmentLine = preferred_date && preferred_time
        ? `Appointment: ${preferred_date} at ${preferred_time}`
        : 'Appointment: No date/time selected';

      const noteBody = [
        isGoldBooking ? '◆ VDS GOLD MEMBER BOOKING — VDS WEBSITE' : 'BOOKING REQUEST — VDS WEBSITE',
        appointmentLine,
        `Number of Vehicles: ${vehicleEntries.length || 1}`,
        vehicleEntries.length > 0
          ? `Vehicles:\n${vehicleEntries.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}`
          : `Vehicle: ${vehicle_info || 'N/A'}`,
        `Service Address: ${address}`,
        notes ? `Notes/Add-ons/Quote: ${notes}` : null,
      ].filter(Boolean).join('\n');

      const noteRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST', headers: GHL_HEADERS,
        body: JSON.stringify({ body: noteBody, userId: '' }),
      });
      if (!noteRes.ok) console.error('GHL note failed:', await noteRes.text());
    }

    // ── 4. Create ONE appointment on the vehicle-count calendar ───────────
    const ghlAppointmentIds = [];

    if (contactId && preferred_date && preferred_time && vehicleEntries.length > 0) {
      const vehicleCount = Math.min(vehicleEntries.length, 4);
      const calendarId = CALENDAR_IDS[vehicleCount];

      if (!calendarId) {
        console.error('No calendar for vehicle count:', vehicleCount);
      } else {
        // Parse start time
        const [timePart, meridiem] = preferred_time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;

        // Duration = vehicleCount × 2 hours
        const durationHours = vehicleCount * 2;
        const TZ_OFFSET = '-04:00'; // EDT (Atlanta, DST)

        const startIso = `${preferred_date}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00${TZ_OFFSET}`;
        const endHours = hours + durationHours;
        const endIso = `${preferred_date}T${String(endHours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00${TZ_OFFSET}`;

        // Build description listing each vehicle and its service
        const vehicleLines = vehicleEntries.map((entry, i) => {
          const parts = entry.split(' — ');
          const vehicleInfoClean = parts[0]?.replace(/\([^)]+\)/g, '').trim();
          const serviceInfo = parts[1] || '';
          return `${i + 1}. ${vehicleInfoClean} — ${serviceInfo}`;
        }).join('\n');

        const membershipTag = isGoldBooking ? '◆ VDS GOLD MEMBER\n\n' : '';
        const apptDescription = [
          `${membershipTag}VEHICLES (${vehicleCount}):`,
          vehicleLines,
          '',
          `Service Address: ${address}`,
          notes ? `Notes/Add-ons/Quote: ${notes}` : null,
        ].filter(v => v !== null).join('\n');

        const apptTitle = `${name} — ${vehicleCount} Vehicle${vehicleCount > 1 ? 's' : ''}${isGoldBooking ? ' ◆ Gold' : ''}`;

        const apptRes = await fetch('https://services.leadconnectorhq.com/calendars/events/appointments', {
          method: 'POST', headers: GHL_HEADERS,
          body: JSON.stringify({
            calendarId,
            locationId: GHL_LOCATION_ID,
            contactId,
            startTime: startIso,
            endTime: endIso,
            title: apptTitle,
            description: apptDescription,
            appointmentStatus: 'confirmed',
            address: address || '',
          }),
        });
        const apptData = await apptRes.json();
        if (!apptRes.ok) {
          console.error('GHL appointment creation failed:', JSON.stringify(apptData));
        } else {
          console.log('GHL appointment created:', apptData?.id);
          if (apptData?.id) ghlAppointmentIds.push(apptData.id);
        }
      }
    }

    // ── 5. Save Appointment entity (authenticated users only) ─────────────
    if (!user) {
      return Response.json({ success: true, contactId });
    }

    try {
      const serviceLabel = SERVICE_LABELS[service_type] || service_type.replace(/_/g, ' ').toUpperCase();
      const servicesNotes = vehicleEntries.length > 0
        ? vehicleEntries.map((entry, idx) => {
            const parts = entry.split(' — ');
            const vehicleInfoClean = parts[0]?.replace(/\([^)]+\)/g, '').trim() || '';
            const service = parts[1] || '';
            return `${idx + 1}. ${vehicleInfoClean} — ${service}`;
          }).join('\n')
        : notes || '';

      await base44.asServiceRole.entities.Appointment.create({
        created_by_id: user.id,
        service_type,
        service_label: serviceLabel,
        vehicle_info: vehicle_info || 'TBD',
        preferred_date,
        preferred_time,
        status: 'confirmed',
        notes: servicesNotes,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || '',
        service_address: address,
        ghl_appointment_ids: ghlAppointmentIds.join(','),
      });
    } catch (err) {
      console.error('Failed to create Appointment entity:', err.message);
    }

    return Response.json({ success: true, contactId });

  } catch (error) {
    console.error('submitBookingToGHL error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});