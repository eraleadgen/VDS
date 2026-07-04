// Send quote via SMS through GoHighLevel workflow trigger.
// Called by Retell AI after customer confirms they want the quote texted.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (RETELL_API_KEY) {
      const auth = req.headers.get('Authorization') || '';
      const provided = auth.replace(/^Bearer\s+/i, '').trim();
      if (!provided || provided !== RETELL_API_KEY) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const { quote_id, call_id } = await req.json();

    if (!quote_id) {
      return Response.json({ error: 'quote_id is required.' }, { status: 400 });
    }

    const quote = await base44.asServiceRole.entities.Quote.get(quote_id);
    if (!quote) {
      return Response.json({ error: 'Quote not found.' }, { status: 404 });
    }

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL not configured — SMS skipped for quote:', quote_id);
      await base44.asServiceRole.entities.Quote.update(quote_id, { status: 'sent', sms_sent: false });
      return Response.json({ success: true, sms_sent: false, note: 'GHL not configured' });
    }

    // Find GHL contact by phone
    let contactId = null;
    const phone = quote.customer_phone;
    if (phone) {
      const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&phone=${encodeURIComponent(phone)}`,
        { headers: { 'Authorization': `Bearer ${GHL_API_KEY}`, 'Version': '2021-07-28' } }
      );
      if (searchRes.ok) {
        const d = await searchRes.json();
        contactId = d?.contacts?.[0]?.id || null;
      }
    }

    if (!contactId) {
      console.error('GHL contact not found for phone:', phone);
      return Response.json({ success: false, error: 'GHL contact not found. Cannot send SMS.' }, { status: 404 });
    }

    // Send SMS via GHL conversations
    const message = `Hi ${quote.customer_name || 'there'}! Here's your VDS quote:\n\n${quote.quote_summary}\n\nReady to book? ${quote.booking_url}`;
    const smsRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GHL_API_KEY}`, 'Content-Type': 'application/json', 'Version': '2021-07-28' },
      body: JSON.stringify({
        type: 'SMS',
        contactId,
        message,
      }),
    });

    const smsSent = smsRes.ok;
    if (!smsSent) {
      console.error('GHL SMS failed:', smsRes.status, await smsRes.text());
    }

    // Update quote status
    await base44.asServiceRole.entities.Quote.update(quote_id, { status: 'sent', sms_sent: smsSent });

    // Log interaction
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '',
        action: 'send_quote_sms',
        customer_phone: quote.customer_phone,
        customer_name: quote.customer_name || '',
        outcome: smsSent ? 'info_provided' : 'error',
        quote_id,
        raw_request: JSON.stringify({ quote_id }),
        raw_response: JSON.stringify({ sms_sent: smsSent }),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json({ success: true, sms_sent: smsSent });

  } catch (error) {
    console.error('sendQuoteSMS error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});