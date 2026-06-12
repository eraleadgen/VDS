import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { name, phone, email, address, service_type, vehicle_type, vehicle_info, vehicle_details, notes, preferred_date, preferred_time } = await req.json();

    if (!name || !phone || !address || !service_type) {
      return Response.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    // Basic phone number validation (must contain at least 7 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return Response.json({ success: false, error: 'Please enter a valid phone number.' }, { status: 400 });
    }

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
      // Consultation calendars
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

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL secrets not configured. Booking received:', { name, phone, email, address, service_type });
      return Response.json({ success: true, message: 'Booking received (GHL not configured).' });
    }

    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ') || '';

    const GHL_HEADERS = {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };

    // 1. Search for existing contact by email
    let existingContactId = null;
    if (email) {
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
        { headers: GHL_HEADERS }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        existingContactId = searchData?.contact?.id || null;
      }
    }

    // Base contact fields (locationId only for POST, not PUT)
    const contactBase = {
      firstName,
      lastName,
      phone,
      email: email || undefined,
      address1: address,
      tags: ['website-booking', service_type],
      source: 'VDS Website Booking Form',
    };

    let contactId;

    if (existingContactId) {
      const updateRes = await fetch(`https://services.leadconnectorhq.com/contacts/${existingContactId}`, {
        method: 'PUT',
        headers: GHL_HEADERS,
        body: JSON.stringify(contactBase),  // no locationId on PUT
      });
      const updateData = await updateRes.json();
      console.log('GHL contact update status:', updateRes.status, JSON.stringify(updateData));
      if (!updateRes.ok) {
        // If update fails, just proceed with the existing contactId — don't block booking
        console.error('GHL contact update failed, proceeding with existing contact');
      }
      contactId = existingContactId;
    } else {
      const createRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: GHL_HEADERS,
        body: JSON.stringify({ ...contactBase, locationId: GHL_LOCATION_ID }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        // GHL may reject if duplicate exists by phone — try fallback ID
        const fallbackId = createData?.meta?.contactId;
        if (fallbackId) {
          await fetch(`https://services.leadconnectorhq.com/contacts/${fallbackId}`, {
            method: 'PUT',
            headers: GHL_HEADERS,
            body: JSON.stringify(contactBase),
          });
          contactId = fallbackId;
        } else {
          console.error('GHL contact creation failed:', JSON.stringify(createData));
          return Response.json({ success: false, error: 'Failed to create contact in GHL.' }, { status: 500 });
        }
      } else {
        contactId = createData.contact?.id;
      }
    }

    // 2. Add a detailed booking note
    if (contactId) {
      const appointmentLine = preferred_date && preferred_time
        ? `Appointment: ${preferred_date} at ${preferred_time}`
        : 'Appointment: No date/time selected';
      // Parse vehicle info for note
      const vehicleList = vehicle_info ? vehicle_info.split(',').map(v => v.trim()) : [];
      const vehicleCount = vehicleList.length;
      const vehicleDetails = vehicleList.map((v, i) => `  ${i + 1}. ${v}`).join('\n');
      const noteBody = [
        'BOOKING REQUEST — VDS WEBSITE',
        `Service: ${service_type.replace(/_/g, ' ').toUpperCase()}`,
        appointmentLine,
        `Number of Vehicles: ${vehicleCount}`,
        vehicleCount > 0 ? `Vehicles:\n${vehicleDetails}` : `Vehicle: ${vehicle_info || 'N/A'}`,
        `Service Address: ${address}`,
        notes ? `Notes/Add-ons/Quote: ${notes}` : null,
      ].filter(Boolean).join('\n');

      const noteRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: GHL_HEADERS,
        body: JSON.stringify({ body: noteBody, userId: '' }),
      });
      if (!noteRes.ok) {
        const noteData = await noteRes.json();
        console.error('GHL note creation failed:', JSON.stringify(noteData));
      }
    }

    // 3. Create appointment if date/time + calendar are available
    if (contactId && calendarId && preferred_date && preferred_time) {
      const [timePart, meridiem] = preferred_time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;

      const startIso = `${preferred_date}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00-05:00`;
      let endHours = hours, endMinutes = minutes;
      if (CONSULTATION_SERVICES.includes(service_type)) {
        endMinutes = minutes + 15;
        if (endMinutes >= 60) { endHours += 1; endMinutes -= 60; }
      } else {
        endHours = hours + 2;
      }
      const endIso = `${preferred_date}T${String(endHours).padStart(2,'0')}:${String(endMinutes).padStart(2,'0')}:00-05:00`;

      // Use vehicle_details if provided (per-vehicle services), otherwise parse vehicle_info
      let vehicleDisplayText;
      if (vehicle_details) {
        vehicleDisplayText = `Vehicles:\n${vehicle_details.split(' | ').map((v, i) => `  ${i + 1}. ${v}`).join('\n')}`;
      } else {
        const vehicleList = vehicle_info ? vehicle_info.split(',').map(v => v.trim()) : [];
        const vehicleCount = vehicleList.length;
        vehicleDisplayText = vehicleCount > 0 
          ? `Vehicles:\n${vehicleList.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}`
          : `Vehicle: ${vehicle_info || 'N/A'}`;
      }

      // Build comprehensive appointment description with all booking details
      const apptDescription = [
        'BOOKING DETAILS',
        `Service: ${service_type.replace(/_/g, ' ').toUpperCase()}`,
        vehicleDisplayText,
        `Service Address: ${address}`,
        notes ? `Notes/Add-ons/Quote: ${notes}` : null,
      ].filter(Boolean).join('\n\n');

      const apptPayload = {
        calendarId,
        locationId: GHL_LOCATION_ID,
        contactId,
        startTime: startIso,
        endTime: endIso,
        title: `${service_type.replace(/_/g, ' ').toUpperCase()} — ${name}`,
        description: apptDescription,
        appointmentStatus: 'new',
        address: address || '',
      };

      const apptRes = await fetch('https://services.leadconnectorhq.com/calendars/events/appointments', {
        method: 'POST',
        headers: GHL_HEADERS,
        body: JSON.stringify(apptPayload),
      });
      const apptData = await apptRes.json();
      if (!apptRes.ok) {
        console.error('GHL appointment creation failed:', JSON.stringify(apptData));
      } else {
        console.log('GHL appointment created:', apptData?.id);
      }
    }

    // 3. Create Appointment entity record for user dashboard access
    try {
      const user = await base44.auth.me();
      if (user) {
        const serviceLabels = {
          exterior_detail: 'Exterior Detail',
          interior_detail: 'Interior Detail',
          full_detail: 'Full Interior + Exterior Detail',
          vds_gold_exterior: 'VDS Gold — Exterior Detail',
          vds_gold_full: 'VDS Gold — Full Detail',
          ceramic_coating: 'Ceramic Coating',
          paint_correction: 'Paint Correction',
        };
        await base44.entities.Appointment.create({
          service_type,
          service_label: serviceLabels[service_type] || service_type.replace(/_/g, ' ').toUpperCase(),
          vehicle_info: vehicle_info || 'TBD',
          preferred_date,
          preferred_time,
          status: 'pending',
          notes: notes || '',
          customer_name: name,
          customer_phone: phone,
          customer_email: email || '',
          service_address: address,
        });
      }
    } catch (err) {
      console.error('Failed to create Appointment entity:', err.message);
    }

    return Response.json({ success: true, contactId });

  } catch (error) {
    console.error('submitBookingToGHL error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});