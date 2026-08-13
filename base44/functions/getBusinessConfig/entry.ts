// Public: returns the active BusinessConfig — business identity, dictionary,
// concierge persona, services catalog, pricing, membership plans, and branding.
// No auth required (public app). This is the single source the frontend
// BusinessConfigContext loads at app root. Contains only public business info;
// no secrets are stored on the BusinessConfig entity.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { resolveBusinessIdFromHost, logTenantMismatch } from "../../shared/tenantContext.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Phase 4: resolve business_id from the request hostname (multi-tenant).
    // Authenticated users take priority (priority 2); if their business_id differs
    // from the hostname-resolved tenant, log the mismatch but proceed with the user's own.
    const hostBusinessId = await resolveBusinessIdFromHost(base44, req);
    let businessId = hostBusinessId;
    try {
      const me = await base44.auth.me();
      if (me && me.id) {
        const user = await base44.asServiceRole.entities.User.get(me.id);
        if (user && user.business_id) {
          if (user.business_id !== hostBusinessId) {
            await logTenantMismatch(base44, user.business_id, hostBusinessId, 'getBusinessConfig');
          }
          businessId = user.business_id;
        }
      }
    } catch {}

    const configs = await base44.asServiceRole.entities.BusinessConfig.filter({
      is_active: true,
      business_id: businessId,
    });
    if (!configs || configs.length === 0) {
      return Response.json({ error: "No active BusinessConfig" }, { status: 500 });
    }
    return Response.json(configs[0]);
  } catch (error) {
    console.error("getBusinessConfig error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});