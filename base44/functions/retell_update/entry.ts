// Retell AI — Update Customer
// POST /functions/retell_update
// Updates a customer's profile fields.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const auth = req.headers.get('Authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (!RETELL_API_KEY || !provided || provided !== RETELL_API_KEY) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { phone, email, updates, call_id } = body;

    if (!updates) return Response.json({ error: 'updates object is required.' }, { status: 400 });

    const all = await base44.asServiceRole.entities.User.list();
    let match = null;
    if (phone) { const d = phone.replace(/\D/g, ''); match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === d); }
    if (!match && email) { match = all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()); }

    if (!match) return Response.json({ error: 'Customer not found.' }, { status: 404 });

    const allowed = ['phone', 'notes', 'preferred_contact_method', 'saved_addresses'];
    const safeUpdates = {};
    for (const k of allowed) { if (updates[k] !== undefined) safeUpdates[k] = updates[k]; }

    await base44.asServiceRole.entities.User.update(match.id, safeUpdates);

    const result = { success: true, customer_id: match.id };

    await base44.asServiceRole.entities.AILog.create({
      call_id: call_id || '', action: 'update_customer',
      customer_phone: match.phone || '', customer_name: match.full_name || '',
      outcome: 'customer_updated', raw_request: JSON.stringify(body),
      raw_response: JSON.stringify(result),
    });

    return Response.json(result);

  } catch (error) {
    console.error('retell_update error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});