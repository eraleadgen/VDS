// Retell AI — Specialist Followup
// POST /functions/retell_followup
// Flags a customer for a human callback and logs a note in GHL.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GHL_HEADERS = (key) => ({
  'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Version': '2021-07-28',
});

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
    const { customer_name, customer_phone, customer_email, reason, ai_notes, call_id } = body;

    if (!customer_phone) return Response.json({ error: 'customer_phone is required.' }, { status: 400 });

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (GHL_API_KEY && GHL_LOCATION_ID) {
      try {
        const firstName = (customer_name || 'Unknown').split(' ')[0];
        const lastName = (customer_name || '').split(' ').slice(1).join(' ') || '';
        let contactId = null;
        if (customer_email) {
          const res = await fetch(`https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(customer_email)}`, { headers: GHL_HEADERS(GHL_API_KEY) });
          if (res.ok) { const d = await res.json(); contactId = d?.contact?.id || null; }
        }
        const payload = { firstName, lastName, phone: customer_phone, email: customer_email || undefined, locationId: GHL_LOCATION_ID, tags: ['retell-followup'], source: 'Retell AI — Specialist Followup' };
        if (contactId) {
          await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, { method: 'PUT', headers: GHL_HEADERS(GHL_API_KEY), body: JSON.stringify(payload) });
        } else {
          const res = await fetch('https://services.leadconnectorhq.com/contacts/', { method: 'POST', headers: GHL_HEADERS(GHL_API_KEY), body: JSON.stringify(payload) });
          const d = await res.json(); contactId = d?.contact?.id || d?.meta?.contactId || null;
        }
        if (contactId) {
          const noteBody = `SPECIALIST FOLLOWUP REQUESTED\nReason: ${reason || 'Customer requested callback'}\nAI Notes: ${ai_notes || 'None'}\nPhone: ${customer_phone}`;
          await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
            body: JSON.stringify({ body: noteBody, userId: '' }),
          });
        }
      } catch (e) { console.error('GHL followup error:', e.message); }
    }

    const result = { success: true, message: 'Specialist followup requested. A team member will contact the customer shortly.' };

    await base44.asServiceRole.entities.AILog.create({
      call_id: call_id || '', action: 'specialist_followup',
      customer_phone, customer_name: customer_name || '',
      outcome: 'other', raw_request: JSON.stringify(body),
      raw_response: JSON.stringify(result),
    });

    return Response.json(result);

  } catch (error) {
    console.error('retell_followup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});