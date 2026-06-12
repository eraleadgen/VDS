import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // Verify user has an active VehicleSubscription before marking as gold member
    const activeSubs = await base44.asServiceRole.entities.VehicleSubscription.filter({ status: 'active' });
    const userVehicles = await base44.entities.MemberVehicle.list();
    const userVehicleIds = userVehicles.map(v => v.id);
    const hasActiveSub = activeSubs.some(s => userVehicleIds.includes(s.vehicle_id));
    if (!hasActiveSub) return Response.json({ success: false, error: 'No active Gold subscription found' }, { status: 403 });

    await base44.entities.User.update(user.id, { is_gold_member: true });
    return Response.json({ success: true, message: 'Upgraded to VDS Gold' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});