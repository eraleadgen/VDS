import { useBusinessConfig } from '@/lib/BusinessConfigContext';

// Single source of truth for the tenant's legal-identity fields, used by the Terms,
// Privacy, and Cookies legal pages. Every reference to the entity name, brand,
// jurisdiction, domain, contact email, service area, and membership label is derived
// here so a tenant's legal pages never name a different company, jurisdiction, or
// product than the rest of their site.
//
// BusinessConfig fields pulled:
//   legal_name                → formal legal entity name (fallback: business_name)
//   business_name             → brand display name
//   business_short_name       → compact brand label (fallback: business_name)
//   legal_jurisdiction        → state/region of legal registration
//   business_email            → contact email
//   website_links.booking_url → hostname used as the public domain
//   service_areas             → service-area description (fallback: address_locality)
//   membership_plans[0].short_label / label → membership product name (fallback: "Gold")
//
// Fallbacks are the VDS Mobile defaults (the platform's primary tenant) and only show
// briefly before BusinessConfig resolves; for any onboarded tenant the config is loaded
// by the time these pages are visited, so the fallbacks never render to a customer.
export function useLegalContext() {
  const config = useBusinessConfig();
  const legalName = config?.legal_name || config?.business_name || 'Valet Detailing Service LLC';
  const businessName = config?.business_name || 'VDS Mobile';
  const shortName = config?.business_short_name || config?.business_name || businessName;
  const jurisdiction = config?.legal_jurisdiction || 'Georgia';
  const email = config?.business_email || 'Valetdetailingservice@gmail.com';
  let domain = '';
  try {
    const bookingUrl = config?.website_links?.booking_url;
    domain = bookingUrl ? new URL(bookingUrl).hostname : (typeof window !== 'undefined' ? window.location.hostname : '');
  } catch (_) { domain = typeof window !== 'undefined' ? window.location.hostname : ''; }
  const serviceArea = (config?.service_areas && config.service_areas.length)
    ? config.service_areas.join(', ')
    : (config?.address_locality || 'the metro area');
  const plan = config?.membership_plans?.[0];
  const goldLabel = (plan && (plan.short_label || plan.label)) || 'Gold';
  return { legalName, businessName, shortName, jurisdiction, email, domain, serviceArea, goldLabel };
}