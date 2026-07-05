// Retell AI — Create Lead
// POST /functions/retellCreateLead
// Creates or updates a GHL contact after every completed call, stores call summary + quote, tags it.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GHL_HEADERS = (key) => ({
  'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Version': '2021-07-28',
});

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
      customer_name, phone_number, email, service, vehicle,
      quote_summary, call_summary, call_id,
    } = body;

    // ── Validate required fields ──
    if (!customer_name) return Response.json({ error: 'customer_name is required.' }, { status: 400 });
    if (!phone_number) return Response.json({ error: 'phone_number is required.' }, { status: 400 });

    const cleanPhone = phone_number.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) return Response.json({ error: 'phone_number is invalid.' }, { status: 400 });

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error('createLead: GHL not configured.');
      return Response.json({ error: 'CRM not configured.' }, { status: 503 });
    }

    // ── Upsert contact ──
    const firstName = customer_name.split(' ')[0];
    const lastName = customer_name.split(' ').slice(1).join(' ') || '';
    let contactId = null;

    if (email) {
      const dupRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
        { headers: GHL_HEADERS(GHL_API_KEY) }
      );
      if (dupRes.ok) { const d = await dupRes.json(); contactId = d?.contact?.id || null; }
    }
    if (!contactId) {
      const phoneRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&phone=${encodeURIComponent(cleanPhone)}`,
        { headers: GHL_HEADERS(GHL_API_KEY) }
      );
      if (phoneRes.ok) { const d = await phoneRes.json(); contactId = d?.contacts?.[0]?.id || null; }
    }

    const payload = {
      firstName, lastName, phone: cleanPhone,
      email: email || undefined, locationId: GHL_LOCATION_ID,
      tags: ['retell-ai-lead', service ? `service:${service}` : 'service:general'].filter(Boolean),
      source: 'Retell AI — Valerie',
    };

    if (contactId) {
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        method: 'PUT', headers: GHL_HEADERS(GHL_API_KEY), body: JSON.stringify(payload),
      });
    } else {
      const createRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST', headers: GHL_HEADERS(GHL_API_KEY), body: JSON.stringify(payload),
      });
      if (createRes.ok) {
        const d = await createRes.json();
        contactId = d?.contact?.id || d?.meta?.contactId || null;
      }
    }

    if (!contactId) {
      console.error('createLead: contact upsert failed.');
      return Response.json({ error: 'Failed to create or update lead.' }, { status: 502 });
    }

    // ── Store call summary + quote as a note ──
    const noteLines = [
      'VALERIE CALL SUMMARY',
      `Service Requested: ${service || 'Not specified'}`,
      `Vehicle: ${vehicle || 'Not specified'}`,
      quote_summary ? `Quote: ${quote_summary}` : null,
      call_summary ? `Call Notes: ${call_summary}` : null,
    ].filter(Boolean);

    try {
      await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
        body: JSON.stringify({ body: noteLines.join('\n'), userId: '' }),
      });
    } catch (e) { console.error('Note error:', e.message); }

    // ── Store quote in Base44 for tracking ──
    let quoteId = '';
    if (quote_summary || service) {
      try {
        const quote = await base44.asServiceRole.entities.Quote.create({
          customer_name, customer_phone: cleanPhone,
          customer_email: email || '', quote_summary: quote_summary || service || '',
          status: 'sent', sms_sent: false,
          booking_url: 'https://vdsmobile.com/book',
        });
        quoteId = quote.id;
      } catch (e) { console.error('Quote save error:', e.message); }
    }

    // ── Conversation history ──
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '', action: 'create_lead',
        customer_phone: cleanPhone, customer_name,
        vehicle_info: vehicle || '',
        outcome: 'customer_updated',
        quote_id: quoteId,
        transcript: call_summary || '',
        raw_request: JSON.stringify(body),
        raw_response: JSON.stringify({ success: true, contact_id: contactId }),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json({ success: true });

  } catch (error) {
    console.error('retellCreateLead error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});