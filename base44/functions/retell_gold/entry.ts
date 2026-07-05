// Retell AI — Check Gold Status
// POST /functions/retell_gold
// Returns the customer's VDS Gold membership status.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const auth = req.headers.get('Authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    if (!RETELL_API_KEY || !provided || provided !== RETELL_API_KEY) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { phone, email, call_id } = body;

    if (!phone && !email) return Response.json({ error: 'phone or email required.' }, { status: 400 });

    const all = await base44.asServiceRole.entities.User.list();
    let match = null;
    if (phone) { const d = phone.replace(/\D/g, ''); match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === d); }
    if (!match && email) { match = all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()); }

    if (!match) {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '', action: 'check_gold_status',
        customer_phone: phone || '', outcome: 'info_provided',
        raw_request: JSON.stringify(body), raw_response: JSON.stringify({ found: false, is_gold_member: false }),
      });
      return Response.json({ found: false, is_gold_member: false, subscriptions: [] });
    }

    const vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: match.id });
    const vehicleIds = vehicles.map(v => v.id);
    const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
    const goldSubs = subs.filter(s => vehicleIds.includes(s.vehicle_id));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const records = await base44.asServiceRole.entities.ServiceRecord.filter({});

    const enriched = goldSubs.map(sub => {
      const vehicle = vehicles.find(v => v.id === sub.vehicle_id);
      const vehicleRecords = records.filter(r => r.vehicle_id === sub.vehicle_id && r.month_year === currentMonth);
      const fullDetailsUsed = vehicleRecords.filter(r => r.service_type === 'full_detail').length;
      return {
        vehicle_id: sub.vehicle_id,
        vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
        tier: sub.tier,
        status: sub.status,
        current_period_end: sub.current_period_end,
        remaining_full_details: Math.max(0, 1 - fullDetailsUsed),
        exterior_details_unlimited: true,
      };
    });

    const result = {
      found: true,
      is_gold_member: goldSubs.length > 0,
      gold_vehicle_count: goldSubs.length,
      monthly_rate: goldSubs.reduce((sum, s) => sum + (s.tier === 'truck_suv' ? 300 : 250), 0),
      subscriptions: enriched,
    };

    await base44.asServiceRole.entities.AILog.create({
      call_id: call_id || '', action: 'check_gold_status',
      customer_phone: match.phone || '', customer_name: match.full_name || '',
      outcome: 'info_provided', raw_request: JSON.stringify(body),
      raw_response: JSON.stringify(result),
    });

    return Response.json(result);

  } catch (error) {
    console.error('retell_gold error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});