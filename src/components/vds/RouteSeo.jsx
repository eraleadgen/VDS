import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusinessName, useBusinessConfig, useMembershipPlan } from '@/lib/BusinessConfigContext';

// Route-aware SEO. Per-route <title> + meta description come from config.seo (content
// supplied by the onboarding wizard, not auto-generated). Canonical/OG/Twitter URLs use
// window.location.origin so they always reflect the real serving domain. Internal portals
// (and any public route missing a config.seo entry) are noindex. Per-route JSON-LD is
// emitted for /services, /membership, and /faq (the FAQ Q&A itself comes from config.faq).
// Structured address fields (address_locality/region/country) feed the Organization
// PostalAddress; a comma-split of business_address is only a last-resort fallback.

const DEFAULT_IMAGE = 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';

// Internal portals that should never be indexed.
const NOINDEX = new Set([
  '/member-login', '/member-dashboard', '/member-signup', '/gold-booking',
  '/specialist-login', '/specialist-portal', '/specialist-setup',
  '/admin-login', '/admin',
  '/forgot-password', '/reset-password',
]);

function upsertMeta(attrKey, attrValue, content) {
  let el = document.head.querySelector(`meta[${attrKey}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrKey, attrValue);
    document.head.appendChild(el);
  }
  if (content === null) {
    el.remove();
  } else {
    el.setAttribute('content', content);
  }
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel, rel');
  }
  el.setAttribute('href', href);
}

// Inject or remove the route-specific JSON-LD structured-data block.
function upsertJsonLd(obj) {
  const id = 'route-ld-json';
  let el = document.getElementById(id);
  if (!obj) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}

export default function RouteSeo() {
  const location = useLocation();
  const path = location.pathname;
  const businessName = useBusinessName();
  const config = useBusinessConfig();
  const plan = useMembershipPlan();

  const baseUrl = (typeof window !== 'undefined' ? window.location.origin : '').replace(/\/$/, '');
  const area = config?.service_areas?.[0] || config?.business_address || 'Metro Atlanta';
  const phone = config?.business_phone || '';
  const phoneHref = phone.replace(/[^0-9+]/g, '');
  const logo = config?.logo_url || DEFAULT_IMAGE;
  const currency = config?.currency || 'USD';

  // Structured address — explicit fields first, comma-split of business_address as fallback.
  const fallbackParts = (config?.business_address || 'Metro Atlanta, GA').split(',').map(s => s.trim());
  const locality = config?.address_locality || fallbackParts[0] || 'Metro Atlanta';
  const region = config?.address_region || fallbackParts[1] || 'GA';
  const country = config?.address_country || 'US';

  const groupLabel = (key) => {
    const found = (config?.pricing_groups || []).find(g => g.key === key);
    if (found?.label) return found.label;
    return key === 'truck_suv' ? 'Truck/SUV' : key === 'sedan_coupe' ? 'Sedan/Coupe' : key;
  };

  const PROVIDER = {
    '@type': 'Organization',
    name: `${businessName} Detailing`,
    url: `${baseUrl}/`,
    telephone: phoneHref,
    address: { '@type': 'PostalAddress', addressLocality: locality, addressRegion: region, addressCountry: country },
  };

  const ROUTE_JSON_LD = {
    '/services': {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Mobile Detailing Services — ${businessName}`,
      serviceType: 'Mobile Auto Detailing',
      provider: PROVIDER,
      areaServed: area,
      description: `Full mobile detailing services in ${area}: interior detail, exterior detail, full detail, ceramic coating, paint correction, and headlight restoration — performed at your home or office.`,
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'Detailing Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Full Mobile Detail' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ceramic Coating' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Paint Correction' } },
        ],
      },
    },
    '/membership': {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: plan.label,
      description: `Monthly unlimited mobile detailing membership: unlimited exterior details, one interior detail per month, and ceramic sealant on every detail, across ${area}. Cancel anytime.`,
      brand: { '@type': 'Brand', name: businessName },
      category: 'Auto Detailing Membership',
      offers: plan.pricing_by_group.map(g => ({
        '@type': 'Offer',
        name: `${plan.short_label} — ${groupLabel(g.pricing_group)}`,
        price: String(g.price_monthly),
        priceCurrency: currency,
        description: `$${g.price_monthly}/month per vehicle (${groupLabel(g.pricing_group)}).`,
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/membership-signup`,
        seller: PROVIDER,
      })),
    },
  };

  if (config?.faq?.length) {
    ROUTE_JSON_LD['/faq'] = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: config.faq.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    };
  }

  useEffect(() => {
    const seoEntry = (config?.seo || []).find(s => s.route === path);
    const noindex = NOINDEX.has(path) || !seoEntry;

    if (seoEntry) {
      document.title = seoEntry.title;
      upsertMeta('name', 'description', seoEntry.description);
      upsertMeta('property', 'og:title', seoEntry.title);
      upsertMeta('property', 'og:description', seoEntry.description);
      upsertMeta('property', 'og:url', `${baseUrl}${path}`);
      upsertMeta('property', 'og:image', logo);
      upsertMeta('name', 'twitter:title', seoEntry.title);
      upsertMeta('name', 'twitter:description', seoEntry.description);
      upsertMeta('name', 'twitter:image', logo);
      upsertLink('canonical', `${baseUrl}${path}`);
      upsertMeta('name', 'robots', 'index, follow');
    } else {
      // Default title based on the resolved tenant so the browser tab never shows a
      // different brand while config-specific SEO loads or on unlisted routes.
      // When config is null (still loading), use a neutral title to avoid flashing
      // the wrong brand before tenant resolution completes.
      document.title = config
        ? (config.business_id === 'era_systems'
            ? 'ERA Core — Business Operating System for Service Companies'
            : `${businessName} | Mobile Car Detailing in Metro Atlanta`)
        : 'Loading…';
      upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
      upsertLink('canonical', `${baseUrl}${path}`);
    }
    // Per-route structured data (rich results). Removed on internal/non-indexed routes.
    upsertJsonLd(NOINDEX.has(path) ? null : ROUTE_JSON_LD[path]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, config]);

  return null;
}