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

    // Phase 4: always resolve from the request hostname, regardless of auth state.
    // This function renders the branding/pricing of whichever business's site is
    // being visited. If Business A's admin browses Business B's site while logged in,
    // they should see Business B's config — not their own. The "user's own tenant wins"
    // pattern is reserved for personal-data functions (account, getMySubscriptions,
    // valerie customer lookups), not for public-facing config rendering.
    const businessId = await resolveBusinessIdFromHost(base44, req);

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