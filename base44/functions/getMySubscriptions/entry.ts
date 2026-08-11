import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { getUserBusinessId } from '../../shared/tenantContext.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = await getUserBusinessId(base44, user);

    // Get all vehicles owned by this user
    const vehicles = await base44.entities.MemberVehicle.list();
    if (!vehicles || vehicles.length === 0) {
      return Response.json({ subscriptions: [] });
    }

    const vehicleIds = vehicles.map(v => v.id);

    // Fetch all active subscriptions using service role, filter to user's vehicles (tenant-scoped)
    const allSubs = await base44.asServiceRole.entities.VehicleSubscription.filter({ business_id: businessId, status: 'active' });
    const userSubs = allSubs.filter(s => vehicleIds.includes(s.vehicle_id));

    return Response.json({ subscriptions: userSubs });
  } catch (error) {
    console.error('getMySubscriptions error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});