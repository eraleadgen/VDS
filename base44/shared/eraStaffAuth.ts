// Cross-tenant ERA Systems staff authorization — the ONLY mechanism that grants access
// to the ERA Staff Console and any future cross-tenant function. Deliberately independent
// of role (every tenant owner is 'admin', so a role check would let any customer in) and
// of business_id (ERA staff need not belong to any tenant).
//
// Authorization = a record exists in the EraStaff allowlist with user_id === me.id.
// This check runs via the service role (base44.asServiceRole) so it bypasses EraStaff's
// deny-all RLS — it is the authoritative check and cannot be spoofed by the caller.
//
// Returns { authorized, status, user, staff }. The caller returns the appropriate HTTP
// status when authorized === false. EraStaff records are never returned to the app user;
// only a boolean/staff-meta shape leaves the calling function.

export async function assertEraStaff(base44) {
  const user = await base44.auth.me();
  if (!user) {
    return { authorized: false, status: 401, user: null, staff: null };
  }
  let staff = [];
  try {
    staff = await base44.asServiceRole.entities.EraStaff.filter({ user_id: user.id });
  } catch (e) {
    return { authorized: false, status: 403, user, staff: null };
  }
  if (!staff || !staff.length) {
    return { authorized: false, status: 403, user, staff: null };
  }
  return { authorized: true, status: 200, user, staff: staff[0] };
}