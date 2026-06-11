import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { name, phone, email, address, service_type, vehicle_type, vehicle_info, notes, preferred_date, preferred_time } = await req.json();

    // Calendar ID map: service_type + vehicle_type → GHL calendar ID
    const CALENDAR_IDS = {
      // VDS Gold
      vds_gold_exterior_sedan_coupe: 'H3DX0ztGWQ4BBliILHim',
      vds_gold_exterior_truck_suv:   'LO4uEJer1WKHdXvjwxhF',
      vds_gold_full_sedan_coupe:     'U30SDSZI19VAr9vzX2we',
      vds_gold_full_truck_suv:       'hgqeZGlC2xXg4WoK4GtG',
      // Non-Gold
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

    const CONSULTATION_SERVICES = ['ceramic_coating', 'paint_correction'];
    let calendarKey;
    if (CONSULTATION_SERVICES.includes(service_type)) {
      const tier = vehicle_type === 'gold' ? 'gold' : 'standard';
      calendarKey = `${service_type}_${tier}`;
    } else {
      calendarKey = vehicle_type ? `${service_type}_${vehicle_type}` : null;
    }
    const calendarId = calendarKey ? CALENDAR_IDS[calendarKey] : null;

    if (!name || !phone || !address || !service_type) {
      return Response.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL secrets not configured. Booking request received:', { name, phone, email, address, service_type, vehicle_info, notes, preferred_date, preferred_time });
      return Response.json({ success: true, message: 'Booking received (GHL not yet configured).' });
    }

    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ') || '';

    // 1. Search for existing contact by email to avoid duplicates
    let existingContactId = null;
    if (email) {
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
          },
        }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        existingContactId = searchData?.contact?.id || null;
      }
    }

    const contactPayload = {
      locationId: GHL_LOCATION_ID,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      customFields: [
        { key: 'service_type', field_value: service_type },
        { key: 'vehicle_info', field_value: vehicle_info || '' },
        { key: 'service_address', field_value: address },
        { key: 'booking_notes', field_value: notes || '' },
        { key: 'preferred_date', field_value: preferred_date || '' },
        { key: 'preferred_time', field_value: preferred_time || '' },
      ],
      tags: ['website-booking', service_type],
      source: 'VDS Website Booking Form',
    };

    let contactId;

    if (existingContactId) {
      // Update existing contact
      const updateRes = await fetch(`https://services.leadconnectorhq.com/contacts/${existingContactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        body: JSON.stringify(contactPayload),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        console.error('GHL contact update failed:', updateData);
        return Response.json({ success: false, error: 'Failed to update contact in GHL.' }, { status: 500 });
      }
      contactId = existingContactId;
    } else {
      // Create new contact
      const createRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        body: JSON.stringify(contactPayload),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        // GHL may reject if a duplicate contact exists matched by phone
        const fallbackId = createData?.meta?.contactId;
        if (fallbackId) {
          // Update the existing contact instead
          await fetch(`https://services.leadconnectorhq.com/contacts/${fallbackId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28',
            },
            body: JSON.stringify(contactPayload),
          });
          contactId = fallbackId;
        } else {
          console.error('GHL contact creation failed:', createData);
          return Response.json({ success: false, error: 'Failed to create contact in GHL.' }, { status: 500 });
        }
      } else {
        contactId = createData.contact?.id;
      }
    }

    // 2. Add a booking note to the contact
    if (contactId) {
      const appointmentLine = preferred_date && preferred_time
        ? `Appointment: ${preferred_date} at ${preferred_time}`
        : 'Appointment: Quote requested — no date selected';
      const noteBody = `BOOKING REQUEST\nService: ${service_type}\n${appointmentLine}\nVehicle: ${vehicle_info || 'N/A'}\nService Address: ${address}\nNotes: ${notes || 'None'}`;
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        body: JSON.stringify({ body: noteBody, userId: '' }),
      });
    }

    // 3. Create GHL appointment if date/time and calendar are available
    if (contactId && calendarId && preferred_date && preferred_time) {
      // Convert "10:00 AM" + "2026-06-20" → ISO datetime
      const [timePart, meridiem] = preferred_time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      const startIso = `${preferred_date}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00-05:00`;
      // Consultations = 15 min, everything else = 2 hours
      const CONSULTATION_SERVICES = ['ceramic_coating', 'paint_correction'];
      let endHours = hours, endMinutes = minutes;
      if (CONSULTATION_SERVICES.includes(service_type)) {
        endMinutes = minutes + 15;
        if (endMinutes >= 60) { endHours += 1; endMinutes -= 60; }
      } else {
        endHours = hours + 2;
      }
      const endIso = `${preferred_date}T${String(endHours).padStart(2,'0')}:${String(endMinutes).padStart(2,'0')}:00-05:00`;

      const apptPayload = {
        calendarId,
        locationId: GHL_LOCATION_ID,
        contactId,
        startTime: startIso,
        endTime: endIso,
        title: `${service_type.replace(/_/g, ' ').toUpperCase()} — ${name}`,
        appointmentStatus: 'new',
        address: address || '',
      };

      const apptRes = await fetch('https://services.leadconnectorhq.com/calendars/events/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify(apptPayload),
      });
      const apptData = await apptRes.json();
      if (!apptRes.ok) {
        console.error('GHL appointment creation failed:', apptData);
      } else {
        console.log('GHL appointment created:', apptData?.id);
      }
    }

    return Response.json({ success: true, contactId });

  } catch (error) {
    console.error('submitBookingToGHL error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});