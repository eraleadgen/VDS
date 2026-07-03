// Retell AI — Request Specialist
// POST /functions/retellRequestSpecialist
// Escalates to the VDS team for ceramic coatings, paint correction, fleet, multi-vehicle, custom jobs.

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
    const { customer_name, phone_number, reason, call_id } = body;

    // ── Validate required fields ──
    if (!customer_name) return Response.json({ error: 'customer_name is required.' }, { status: 400 });
    if (!phone_number) return Response.json({ error: 'phone_number is required.' }, { status: 400 });
    if (!reason) return Response.json({ error: 'reason is required.' }, { status: 400 });

    const cleanPhone = phone_number.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) return Response.json({ error: 'phone_number is invalid.' }, { status: 400 });

    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');
    const VDS_TEAM_PHONE = Deno.env.get('VDS_TEAM_PHONE');

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error('requestSpecialist: GHL not configured.');
      return Response.json({ error: 'CRM not configured.' }, { status: 503 });
    }

    // ── Upsert contact with escalation tag ──
    const firstName = customer_name.split(' ')[0];
    const lastName = customer_name.split(' ').slice(1).join(' ') || '';
    let contactId = null;

    const phoneRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&phone=${encodeURIComponent(cleanPhone)}`,
      { headers: GHL_HEADERS(GHL_API_KEY) }
    );
    if (phoneRes.ok) { const d = await phoneRes.json(); contactId = d?.contacts?.[0]?.id || null; }

    const payload = {
      firstName, lastName, phone: cleanPhone, locationId: GHL_LOCATION_ID,
      tags: ['valerie-escalation', 'high-priority'],
      source: 'Retell AI — Valerie Escalation',
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

    const escalationNote = `🚨 VALERIE ESCALATION\n\n${customer_name}\n${cleanPhone}\n\nReason:\n${reason}`;

    // ── Add high-priority note to the contact ──
    if (contactId) {
      try {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
          method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
          body: JSON.stringify({ body: escalationNote, userId: '' }),
        });
      } catch (e) { console.error('Escalation note error:', e.message); }
    }

    // ── Send internal SMS to the VDS team if configured ──
    if (VDS_TEAM_PHONE) {
      try {
        // Find or create a conversation with the team number, then send the alert SMS.
        const teamContactRes = await fetch(
          `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&phone=${encodeURIComponent(VDS_TEAM_PHONE)}`,
          { headers: GHL_HEADERS(GHL_API_KEY) }
        );
        let teamContactId = null;
        if (teamContactRes.ok) { const d = await teamContactRes.json(); teamContactId = d?.contacts?.[0]?.id || null; }

        if (!teamContactId) {
          const createTeam = await fetch('https://services.leadconnectorhq.com/contacts/', {
            method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
            body: JSON.stringify({
              firstName: 'VDS', lastName: 'Team', phone: VDS_TEAM_PHONE,
              locationId: GHL_LOCATION_ID, tags: ['internal-team'],
            }),
          });
          if (createTeam.ok) { const d = await createTeam.json(); teamContactId = d?.contact?.id || d?.meta?.contactId || null; }
        }

        if (teamContactId) {
          await fetch('https://services.leadconnectorhq.com/conversations/messages', {
            method: 'POST', headers: GHL_HEADERS(GHL_API_KEY),
            body: JSON.stringify({ type: 'SMS', contactId: teamContactId, message: escalationNote }),
          });
        }
      } catch (e) { console.error('Internal SMS error:', e.message); }
    } else {
      console.log('VDS_TEAM_PHONE not set — internal SMS skipped.');
    }

    // ── Conversation history ──
    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '', action: 'request_specialist',
        customer_phone: cleanPhone, customer_name,
        outcome: 'other', transcript: reason,
        raw_request: JSON.stringify(body),
        raw_response: JSON.stringify({ success: true, contact_id: contactId || '' }),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json({ success: true });

  } catch (error) {
    console.error('retellRequestSpecialist error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});