// Check a customer's VDS Gold membership status.
// Used by Retell AI — never calculates pricing itself.

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
    const { phone, email, customer_id } = await req.json();

    if (!phone && !email && !customer_id) {
      return Response.json({ error: 'phone, email, or customer_id required.' }, { status: 400 });
    }

    let userId = customer_id;

    if (!userId) {
      const all = await base44.asServiceRole.entities.User.list();
      let match = null;
      if (phone) {
        const digits = phone.replace(/\D/g, '');
        match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === digits);
      }
      if (!match && email) {
        match = all.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      }
      if (!match) return Response.json({ found: false, is_gold_member: false, subscriptions: [] });
      userId = match.id;
    }

    const vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: userId });
    const vehicleIds = vehicles.map(v => v.id);

    const allSubs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
    const goldSubs = allSubs.filter(s => vehicleIds.includes(s.vehicle_id));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const records = await base44.asServiceRole.entities.ServiceRecord.filter({});
    
    const enrichedSubs = goldSubs.map(sub => {
      const vehicle = vehicles.find(v => v.id === sub.vehicle_id);
      const vehicleRecords = records.filter(r => r.vehicle_id === sub.vehicle_id && r.month_year === currentMonth);
      const fullDetailsUsed = vehicleRecords.filter(r => r.service_type === 'full_detail').length;
      const exteriorDetailsUsed = vehicleRecords.filter(r => r.service_type === 'exterior_detail').length;

      return {
        vehicle_id: sub.vehicle_id,
        vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
        tier: sub.tier,
        status: sub.status,
        current_period_end: sub.current_period_end,
        remaining_full_details: Math.max(0, 1 - fullDetailsUsed),
        exterior_details_used_this_month: exteriorDetailsUsed,
        exterior_details_unlimited: true,
      };
    });

    return Response.json({
      found: true,
      is_gold_member: goldSubs.length > 0,
      gold_vehicle_count: goldSubs.length,
      monthly_rate: goldSubs.reduce((sum, s) => sum + (s.tier === 'truck_suv' ? 300 : 250), 0),
      subscriptions: enrichedSubs,
    });

  } catch (error) {
    console.error('checkGoldStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});