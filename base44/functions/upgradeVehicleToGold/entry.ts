import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { vehicle_id } = await req.json();
    if (!vehicle_id) {
      return Response.json({ error: 'vehicle_id is required' }, { status: 400 });
    }

    // Verify the vehicle belongs to this user
    const vehicle = await base44.entities.MemberVehicle.get(vehicle_id);
    if (!vehicle || vehicle.created_by_id !== user.id) {
      return Response.json({ error: 'Vehicle not found or unauthorized' }, { status: 404 });
    }

    // Verify there is an active Stripe-backed subscription for this vehicle
    const activeSubs = await base44.asServiceRole.entities.VehicleSubscription.filter({ vehicle_id, status: 'active' });
    if (activeSubs.length === 0) {
      return Response.json({ error: 'No active Gold subscription found for this vehicle' }, { status: 403 });
    }

    // Update vehicle to Gold registered
    await base44.entities.MemberVehicle.update(vehicle_id, { is_gold_registered: true });

    // Also ensure user is marked as Gold member via auth SDK
    await base44.auth.updateMe({ is_gold_member: true });

    return Response.json({ 
      success: true, 
      message: 'Vehicle enrolled in VDS Gold membership',
      vehicle_id: vehicle_id
    });
  } catch (error) {
    console.error('upgradeVehicleToGold error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});