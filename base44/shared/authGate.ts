// Shared authorization gate for scheduled/admin backend functions (ERA Core).
//
// The platform runs scheduled automations under an authenticated admin context, so
// base44.auth.me() resolves to an admin user. Internal function-to-function calls
// (e.g. scheduler -> appointmentReminders) present the shared SCHEDULER_TOKEN instead.
//
// This gate accepts EITHER an authenticated admin OR a valid SCHEDULER_TOKEN, and
// rejects anonymous/external callers with 403 Forbidden (CWE-306). Returns a 403
// Response when unauthorized, or null when the call is authorized.
export async function requireAdminOrSchedulerToken(base44, req) {
  // 1) Shared-secret path (internal function-to-function invocations).
  const expectedToken = Deno.env.get('SCHEDULER_TOKEN');
  if (expectedToken) {
    let providedToken = null;
    try {
      const parsedBody = await req.clone().json();
      providedToken = parsedBody?.scheduler_token || parsedBody?.args?.scheduler_token || null;
    } catch { /* non-JSON body */ }
    if (providedToken && providedToken === expectedToken) return null;
  }

  // 2) Admin-auth path (platform scheduled runs + admin dashboard calls).
  let user = null;
  try { user = await base44.auth.me(); } catch { /* not authenticated */ }
  if (user && user.role === 'admin') return null;

  return Response.json({ error: 'Forbidden.' }, { status: 403 });
}