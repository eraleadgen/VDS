// Retell AI — Check Existing Customer
// POST /functions/retellCheckCustomer
// Quick CRM lookup by phone number before Valerie collects info.
// Response under 1 second, JSON only, Bearer-secured.

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
    const { phone_number, call_id } = body;

    if (!phone_number) return Response.json({ error: 'phone_number is required.' }, { status: 400 });

    const digits = phone_number.replace(/\D/g, '');
    if (digits.length < 10) return Response.json({ error: 'phone_number is invalid.' }, { status: 400 });

    // ── Search Base44 users by phone ──
    const all = await base44.asServiceRole.entities.User.list();
    const match = all.find(u => u.phone && u.phone.replace(/\D/g, '') === digits);

    if (!match) {
      try {
        await base44.asServiceRole.entities.AILog.create({
          call_id: call_id || '', action: 'check_existing_customer',
          customer_phone: phone_number, outcome: 'info_provided',
          raw_request: JSON.stringify(body), raw_response: JSON.stringify({ exists: false }),
        });
      } catch (e) { console.error('AILog error:', e.message); }
      return Response.json({ exists: false });
    }

    // ── Pull enrichment data in parallel for sub-1s response ──
    const [vehicles, subs, appointments, records] = await Promise.all([
      base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: match.id }).catch(() => []),
      base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' }).catch(() => []),
      base44.asServiceRole.entities.Appointment.filter({ customer_phone: match.phone }).catch(() => []),
      base44.asServiceRole.entities.ServiceRecord.list().catch(() => []),
    ]);

    const vehicleIds = vehicles.map(v => v.id);
    const goldSubs = subs.filter(s => vehicleIds.includes(s.vehicle_id));
    const isGoldMember = goldSubs.length > 0;

    // Last service + vehicle from most recent completed appointment
    const completed = appointments
      .filter(a => a.status === 'completed')
      .sort((a, b) => new Date(b.preferred_date || 0) - new Date(a.preferred_date || 0));
    const lastAppt = completed[0] || null;
    const lastService = lastAppt?.service_label || lastAppt?.service_type || null;
    const lastVehicle = lastAppt?.vehicle_info || (vehicles[0] ? `${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}` : null);
    const lastVisit = lastAppt?.preferred_date || match.last_detail_date || null;

    // Vehicle-related service records for this user's vehicles
    const myRecords = records.filter(r => vehicleIds.includes(r.vehicle_id));
    const totalVisits = match.total_details_completed || myRecords.length || completed.length;
    const favoriteService = (() => {
      const counts = {};
      for (const r of myRecords) { counts[r.service_type] = (counts[r.service_type] || 0) + 1; }
      for (const a of appointments) { if (a.service_type) counts[a.service_type] = (counts[a.service_type] || 0) + 1; }
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return top ? top[0] : null;
    })();

    const preferredLocation = (match.saved_addresses && match.saved_addresses[0]) || null;
    const nextRecommendedService = lastVisit ? recommendNext(lastService, isGoldMember) : null;

    const result = {
      exists: true,
      customer_name: match.full_name || null,
      last_service: lastService,
      last_vehicle: lastVehicle,
      last_visit: lastVisit,
      is_gold_member: isGoldMember,
      notes: match.notes || null,
      // ── Optional expansion fields (null if unavailable) ──
      email: match.email || null,
      address: preferredLocation,
      last_invoice: null,
      total_visits: totalVisits || null,
      lifetime_spend: match.lifetime_spend ?? null,
      favorite_service: favoriteService,
      preferred_location: preferredLocation,
      preferred_contact_method: match.preferred_contact_method || null,
      next_recommended_service: nextRecommendedService,
    };

    try {
      await base44.asServiceRole.entities.AILog.create({
        call_id: call_id || '', action: 'check_existing_customer',
        customer_phone: match.phone || '', customer_name: match.full_name || '',
        outcome: 'info_provided', raw_request: JSON.stringify(body),
        raw_response: JSON.stringify(result),
      });
    } catch (e) { console.error('AILog error:', e.message); }

    return Response.json(result);

  } catch (error) {
    console.error('retellCheckCustomer error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function recommendNext(lastService, isGoldMember) {
  if (!lastService) return isGoldMember ? 'exterior_detail' : 'full_detail';
  const s = lastService.toLowerCase();
  if (s.includes('full') || s.includes('exterior')) return 'exterior_detail';
  if (s.includes('interior')) return 'exterior_detail';
  return 'full_detail';
}