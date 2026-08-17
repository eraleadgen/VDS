import React from "react";
import { useBusinessConfig } from "@/lib/BusinessConfigContext";
import Home from "@/pages/Home";
import EraHome from "@/pages/EraHome";

// Tenant-aware homepage switch. Renders the distinct ERA marketing page for the
// era_systems tenant, and the standard client-business homepage for every other
// tenant. Mounted on the "/" route — so eraleadgen.com shows EraHome while
// vdsmobile.com shows Home. This component only mounts after the BusinessConfig
// has resolved (the authLoaded gate in App.jsx holds the routes until then),
// so business_id is always available here — no flash of the wrong page.
export default function HomeRouter() {
  const config = useBusinessConfig();
  if (config?.business_id === "era_systems") return <EraHome />;
  return <Home />;
}