// Public: returns the active BusinessConfig — business identity, dictionary,
// concierge persona, services catalog, pricing, membership plans, and branding.
// No auth required (public app). This is the single source the frontend
// BusinessConfigContext loads at app root. Contains only public business info;
// no secrets are stored on the BusinessConfig entity.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { resolveBusinessIdFromHost } from "../../shared/tenantContext.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow a ?tenant= override for dev/preview testing (production uses TenantMapping
    // via hostname resolution). The frontend passes this from the URL query param so
    // ERA pages can be previewed on the shared Base44 preview domain before DNS is live.
    const body = await req.json().catch(() => ({}));
    let businessId;
    if (body.tenant && typeof body.tenant === 'string') {
      businessId = body.tenant;
    } else {
      // Phase 4: resolve from the request hostname, regardless of auth state.
      businessId = await resolveBusinessIdFromHost(base44, req);
    }

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