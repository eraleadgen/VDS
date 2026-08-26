import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBusinessConfig } from '@/lib/BusinessConfigContext';

// Tenant-aware route isolation. For the era_systems tenant (the ERA Systems
// marketing/SaaS site on eraleadgen.com), only a deliberate allowlist of routes
// is reachable; every other path redirects to "/" so no client-business
// template (gallery, specialist portal, member dashboard, booking, etc.)
// ever renders under that tenant.
//
// For EVERY OTHER tenant (vds, and any future provisioned tenant), this guard
// is a pure pass-through — it renders <Outlet /> immediately and changes
// nothing. VDS and all client tenants are 100% unaffected.
//
// This component only mounts after BusinessConfig has resolved (the authLoaded
// gate in App.jsx holds the routes until then), so business_id is always
// available. If config is somehow still null, business_id is undefined — which
// is !== 'era_systems' — so it passes through safely rather than redirecting.

const ERA_ALLOWLIST = new Set([
  '/',
  '/era-register',
  '/era-login',
  '/era-portal',
  '/era-console',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/cookies',
  '/era-platform',
  '/era-results',
  '/era-pricing',
  '/era-who-for',
  '/era-demo',
  '/era-home',
]);

export default function TenantRouteGuard() {
  const config = useBusinessConfig();
  const location = useLocation();

  if (config?.business_id === 'era_systems' && !ERA_ALLOWLIST.has(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}