// Retell AI — Send Quote SMS
// POST /functions/retellSendQuoteSms
// Receives a completed quote from Valerie and texts it to the customer via GHL.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GHL_HEADERS = (key) => ({
  'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Version': '2021-07-28',
});

Deno.serve(async (req) => {
  try {
    // ── Auth ──
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (RETELL_API_KEY) {
      const auth = req.headers.get('Authorization') || '';
      const provided = auth.replace(/^Bearer\s+/i, '').trim();
      if (!provided || provided !== RETELL_API_KEY) {
        return Response.json({ error: 'Unauthorized — invalid or missing API key.' }, { status: 401 });
      }
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      customer_name, phone_number, service, vehicle, vehicle_count,
      price, quote_summary, booking_url, call_id,
    } = body;

    // ── Validate required fields ──
    if (!phone_number) return Response.json({ error: 'phone_number is required.' }, { status: 400 });
    if (!service && !quote_summary) return Response.json({ error: 'service or quote_summary is required.' }, { status: 400 });

    const cleanPhone = phone_number.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      return Response.json({ error: 'phone_number is invalid.' }, { status: 400 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error('sendQuoteSms: GHL not configured.');
      return Response.json({ error: 'SMS gateway not configured.' }, { status: 503 });
    }

    // ── Upsert GHL contact so we have a conversation to text into ──
    const firstName = (customer_name || 'Valued Customer').split(' ')[0];
    const lastName = (customer_name || '').split(' ').slice(1).join(' ') || '';
    let contactId = null;

    // Search by phone
    const searchRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&phone=${encodeURIComponent(cleanPhone)}`,
      { headers: GHL_HEADERS(GHL_API_KEY) }
    );
    if (searchRes.ok) {
      const d = await searchRes.json();
      contactId = d?.contacts?.[0]?.id || null;
    }

    if (!contactId) {
      const createRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
        body: JSON.stringify({
          firstName, lastName, phone: cleanPhone, locationId: GHL_LOCATION_ID,
          tags: ['retell-ai-quote'], source: 'Retell AI — Valerie',
        }),
      });
      if (createRes.ok) {
        const d = await createRes.json();
        contactId = d?.contact?.id || d?.meta?.contactId || null;
      }
    }

    if (!contactId) {
      console.error('sendQuoteSms: could not resolve GHL contact.');
      return Response.json({ error: 'Could not resolve customer contact for SMS.' }, { status: 502 });
    }

    // ── Build the SMS body ──
    const vehicleLine = vehicle_count && vehicle_count > 1
      ? `${vehicle} ×${vehicle_count}`
      : (vehicle || 'Vehicle');
    const smsBody = `Hi ${firstName}!

Here's your VDS quote:

• Service: ${service || 'Detail Service'}
• Vehicle: ${vehicleLine}
• Starting Price: $${price ?? '—'}

Book online anytime:
${booking_url || 'https://vdsmobile.com/book'}

Reply if you have any questions!

-Valet Detailing Service`;

    // ── Send SMS via GHL ──
    const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
      body: JSON.stringify({ type: 'SMS', contactId, message: smsBody }),
    });

    const smsSent = smsRes.ok;
    if (!smsSent) {
      console.error('sendQuoteSms: GHL SMS failed:', smsRes.status, await smsRes.text());
      return Response.json({ success: false, error: 'SMS delivery failed.' }, { status: 502 });
    }

    // ── Save conversation history ──
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '', action: 'send_quote_sms',
        customer_phone: cleanPhone, customer_name: customer_name || '',
        outcome: 'info_provided',
        raw_request: JSON.stringify(body),
        raw_response: JSON.stringify({ sms_sent: true }),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json({ success: true, message: 'SMS sent.' });

  } catch (error) {
    console.error('retellSendQuoteSms error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});