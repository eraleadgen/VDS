import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { name, phone, email, address, service_type, vehicle_info, notes, preferred_date, preferred_time } = await req.json();

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

    return Response.json({ success: true, contactId });

  } catch (error) {
    console.error('submitBookingToGHL error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});