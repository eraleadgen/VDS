// Retell AI — End Call
// POST /functions/retellEndCall
// Stores conversation analytics (transcript, summary, duration, booking outcome) after every call.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // ── Auth ──
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const auth = req.headers.get('Authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (!RETELL_API_KEY || !provided || provided !== RETELL_API_KEY) {
      return Response.json({ error: 'Unauthorized — invalid or missing API key.' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      call_summary, customer_name, phone_number, duration,
      service, booking_outcome, transcript, call_id,
    } = body;

    // ── Validate required fields ──
    if (!call_summary && !transcript) {
      return Response.json({ error: 'call_summary or transcript is required.' }, { status: 400 });
    }
    if (!phone_number && !customer_name) {
      return Response.json({ error: 'phone_number or customer_name is required.' }, { status: 400 });
    }

    const cleanPhone = phone_number ? phone_number.replace(/[^\d+]/g, '') : '';

    // ── Store analytics ──
    const outcomeMap = {
      booked: 'appointment_booked',
      quote_sent: 'quote_created',
      info_provided: 'info_provided',
      escalated: 'other',
      no_action: 'other',
    };
    const outcome = booking_outcome ? (outcomeMap[booking_outcome] || 'other') : 'other';

    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '', action: 'end_call',
        customer_phone: cleanPhone, customer_name: customer_name || '',
        transcript: transcript || call_summary || '',
        duration_seconds: typeof duration === 'number' ? duration : 0,
        outcome,
        raw_request: JSON.stringify(body),
        raw_response: JSON.stringify({ success: true }),
      });
    } catch (e) {
      console.error('AILog save error:', e.message);
      return Response.json({ error: 'Failed to store call analytics.' }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('retellEndCall error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});