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

// Email allowlist for ERA Systems staff who get free access to the cross-tenant
// ERA Admin Portal (/era-admin) without any subscription payment. This is separate
// from the per-tenant admin portal (which requires a paid BusinessConfig). These
// users are authorized by email so they get access immediately upon login, even
// before an EraStaff record is seeded for their user_id.
const ERA_STAFF_EMAIL_ALLOWLIST = [
  'noahgrove3@gmail.com',
  'shanemuenkel@gmail.com',
];

export async function assertEraStaff(base44) {
  const user = await base44.auth.me();
  if (!user) {
    return { authorized: false, status: 401, user: null, staff: null };
  }
  // Email-based allowlist: grants access without requiring a seeded EraStaff record.
  const emailAllowed = user.email && ERA_STAFF_EMAIL_ALLOWLIST.includes(user.email.toLowerCase());
  let staff = [];
  try {
    staff = await base44.asServiceRole.entities.EraStaff.filter({ user_id: user.id });
  } catch (e) {
    if (emailAllowed) return { authorized: true, status: 200, user, staff: { name: user.email, email: user.email } };
    return { authorized: false, status: 403, user, staff: null };
  }
  if (staff && staff.length) {
    return { authorized: true, status: 200, user, staff: staff[0] };
  }
  if (emailAllowed) {
    return { authorized: true, status: 200, user, staff: { name: user.email, email: user.email } };
  }
  return { authorized: false, status: 403, user, staff: null };
}