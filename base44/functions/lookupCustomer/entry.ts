// Lookup a customer by phone or email.
// Used by Retell AI to identify returning customers.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, email } = await req.json();

    if (!phone && !email) {
      return Response.json({ error: 'phone or email required.' }, { status: 400 });
    }

    // Search User entities via service role
    let users = [];
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      const all = await base44.asServiceRole.entities.User.list();
      users = all.filter(u => u.phone && u.phone.replace(/\D/g, '') === digits);
    }
    if (users.length === 0 && email) {
      const all = await base44.asServiceRole.entities.User.list();
      users = all.filter(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    }

    if (users.length === 0) {
      return Response.json({ found: false, customer: null });
    }

    const u = users[0];

    // Load their vehicles
    const vehicles = await base44.asServiceRole.entities.MemberVehicle.filter({ created_by_id: u.id });

    // Load active Gold subscriptions
    const subs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
    const vehicleIds = vehicles.map(v => v.id);
    const goldSubs = subs.filter(s => vehicleIds.includes(s.vehicle_id));

    return Response.json({
      found: true,
      customer: {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        ghl_contact_id: u.ghl_contact_id || null,
        stripe_customer_id: u.stripe_customer_id || null,
        saved_addresses: u.saved_addresses || [],
        total_details_completed: u.total_details_completed || 0,
        last_detail_date: u.last_detail_date || null,
        lifetime_spend: u.lifetime_spend || 0,
        preferred_contact_method: u.preferred_contact_method || 'sms',
        is_gold_member: goldSubs.length > 0,
        gold_vehicle_count: goldSubs.length,
      },
      vehicles: vehicles.map(v => ({
        id: v.id,
        year: v.year,
        make: v.make,
        model: v.model,
        color: v.color,
        license_plate: v.license_plate,
        vehicle_type: v.vehicle_type,
        is_gold_registered: v.is_gold_registered || false,
      })),
    });

  } catch (error) {
    console.error('lookupCustomer error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});