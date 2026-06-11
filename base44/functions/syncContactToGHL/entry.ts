import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { firstName, lastName, email, phone, source, tags } = await req.json();

    if (!email && !phone) {
      return Response.json({ success: false, error: 'Email or phone required.' }, { status: 400 });
    }

    // Ensure the contact being synced belongs to the authenticated user
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL secrets not configured. Contact sync received:', { firstName, lastName, email, phone });
      return Response.json({ success: true, message: 'Contact received (GHL not yet configured).' });
    }

    // 1. Search for existing contact by email
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
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || undefined,
      phone: phone || undefined,
      tags: tags || ['website-signup'],
      source: source || 'VDS Website Account Creation',
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
        console.error('GHL contact creation failed:', createData);
        return Response.json({ success: false, error: 'Failed to create contact in GHL.' }, { status: 500 });
      }
      contactId = createData.contact?.id;
    }

    // 2. Add a note
    if (contactId) {
      const noteBody = `NEW ACCOUNT CREATED\nName: ${firstName} ${lastName}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nSource: ${source || 'VDS Website'}`;
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
    console.error('syncContactToGHL error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});