// Public: returns the active BusinessConfig — business identity, dictionary,
// concierge persona, services catalog, pricing, membership plans, and branding.
// No auth required (public app). This is the single source the frontend
// BusinessConfigContext loads at app root. Contains only public business info;
// no secrets are stored on the BusinessConfig entity.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { resolveBusinessIdFromHostWithMatch, isPreviewHost } from "../../shared/tenantContext.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Phase 4: hostname resolution always wins. A real TenantMapping can never be
    // overridden by a client-supplied parameter — that's the regression Phase 4 fixed.
    const body = await req.json().catch(() => ({}));

    // TEMP DEBUG: echo all request headers so we can see what hostname the proxy
    // actually delivers to the function on custom domains.
    if (body.__debug_headers) {
      const headers = {};
      req.headers.forEach((v, k) => { headers[k] = v; });
      return Response.json({
        hostname_seen: req.headers.get('x-forwarded-host') || req.headers.get('host') || '',
        x_forwarded_host: req.headers.get('x-forwarded-host'),
        host: req.headers.get('host'),
        forwarded: req.headers.get('forwarded'),
        x_original_url: req.headers.get('x-original-url'),
        x_real_ip: req.headers.get('x-real-ip'),
        all_headers: headers,
      });
    }

    const { businessId: hostBusinessId, matched, hostname } = await resolveBusinessIdFromHostWithMatch(base44, req);
    let businessId = hostBusinessId;

    // Dev/preview override: ONLY honored when no real mapping exists AND the hostname
    // is a Base44 preview/dev host. On any real mapped domain (vdsmobile.com,
    // eraleadgen.com), the tenant param is fully ignored — never silently accepted.
    if (!matched && body.tenant && typeof body.tenant === 'string' && isPreviewHost(hostname)) {
      businessId = body.tenant;
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