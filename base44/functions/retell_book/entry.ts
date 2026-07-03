// Retell AI — Book Service
// POST /functions/retell_book
// Returns the booking URL for the customer to complete their appointment online.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOOKING_URL = 'https://vdsmobile.com/book';

Deno.serve(async (req) => {
  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (RETELL_API_KEY) {
      const auth = req.headers.get('Authorization') || '';
      const provided = auth.replace(/^Bearer\s+/i, '').trim();
      if (!provided || provided !== RETELL_API_KEY) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { call_id } = body;

    const result = {
      success: true,
      booking_url: BOOKING_URL,
      message: 'Direct the customer to the booking link to select their date, time, and vehicle details.',
    };

    await base44.asServiceRole.entities.AILog.create({
      call_id: call_id || '', action: 'book_service',
      outcome: 'appointment_booked',
      raw_request: JSON.stringify(body), raw_response: JSON.stringify(result),
    });

    return Response.json(result);

  } catch (error) {
    console.error('retell_book error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});