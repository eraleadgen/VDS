// Retell AI — Lookup Customer
// POST /functions/retell_lookup
// Identifies a returning customer by phone or email.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const auth = req.headers.get('Authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (!RETELL_API_KEY || !provided || provided !== RETELL_API_KEY) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { phone, email, call_id } = body;

    if (!phone && !email) return Response.json({ error: 'phone or email required.' }, { status: 400 });

    const all = await base44.asServiceRole.entities.User.list();
    let match = null;
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === digits);
    }
    if (!match && email) {
      match = all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    }

    if (!match) {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '', action: 'lookup_customer',
        customer_phone: phone || '', customer_name: '',
        outcome: 'info_provided', raw_request: JSON.stringify(body),
        raw_response: JSON.stringify({ found: false }),
      });
      return Response.json({ found: false, customer: null, vehicles: [] });
    }

    const vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: match.id });
    const vehicleIds = vehicles.map(v => v.id);
    const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
    const goldSubs = subs.filter(s => vehicleIds.includes(s.vehicle_id));

    const result = {
      found: true,
      customer: {
        id: match.id, full_name: match.full_name, email: match.email, phone: match.phone,
        saved_addresses: match.saved_addresses || [],
        total_details_completed: match.total_details_completed || 0,
        last_detail_date: match.last_detail_date || null,
        lifetime_spend: match.lifetime_spend || 0,
        preferred_contact_method: match.preferred_contact_method || 'sms',
        is_gold_member: goldSubs.length > 0,
        gold_vehicle_count: goldSubs.length,
      },
      vehicles: vehicles.map(v => ({
        id: v.id, year: v.year, make: v.make, model: v.model,
        color: v.color, vehicle_type: v.vehicle_type, is_gold_registered: v.is_gold_registered,
      })),
    };

    await base44.asServiceRole.entities.AILog.create({
      call_id: call_id || '', action: 'lookup_customer',
      customer_phone: match.phone || '', customer_name: match.full_name || '',
      outcome: 'info_provided', raw_request: JSON.stringify(body),
      raw_response: JSON.stringify(result),
    });

    return Response.json(result);

  } catch (error) {
    console.error('retell_lookup error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});