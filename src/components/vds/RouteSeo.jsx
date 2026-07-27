import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusinessName, useBusinessConfig, useMembershipPlan } from '@/lib/BusinessConfigContext';

// Route-aware SEO: sets a unique, keyword-rich <title> + meta description per page,
// keeps Open Graph / Twitter / canonical in sync, and applies noindex to internal
// portals (auth, admin, specialist, member dashboard) so only public marketing
// pages are indexed. Defaults live in index.html; this updates them on navigation.
//
// Identity tokens (business name, service area, plan name, phone, logo, prices) are
// read from BusinessConfig so the SEO adapts per tenant. The canonical/OG base URL
// uses window.location.origin so it always reflects the real serving domain. The
// descriptive marketing wording (industry terms, FAQ Q&A bodies) is still templated
// for an automotive vertical — see the tenant-#2 list before onboarding a non-automotive client.

const DEFAULT_IMAGE = 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';
const DEFAULT_AREA = 'Metro Atlanta';

// Internal portals that should never be indexed.
const NOINDEX = new Set([
  '/member-login', '/member-dashboard', '/member-signup', '/gold-booking',
  '/specialist-login', '/specialist-portal', '/specialist-setup',
  '/admin-login', '/admin', '/project-overview',
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
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
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
  const area = config?.service_areas?.[0] || config?.business_address || DEFAULT_AREA;
  const phone = config?.business_phone || '';
  const phoneHref = phone.replace(/[^0-9+]/g, '');
  const logo = config?.logo_url || DEFAULT_IMAGE;
  const currency = config?.currency || 'USD';
  const planShort = plan.short_label;
  const planLabel = plan.label;

  // Pricing-group display labels (config.pricing_groups labels with safe fallbacks).
  const groupLabel = (key) => {
    const found = (config?.pricing_groups || []).find(g => g.key === key);
    if (found?.label) return found.label;
    return key === 'truck_suv' ? 'Truck/SUV' : key === 'sedan_coupe' ? 'Sedan/Coupe' : key;
  };
  const priceFor = (key) => plan.pricing_by_group.find(g => g.pricing_group === key)?.price_monthly;
  const sedanPrice = priceFor('sedan_coupe') || 250;
  const truckPrice = priceFor('truck_suv') || 300;

  // Structured address parts derived from business_address ("City, ST" heuristic).
  const addrParts = (config?.business_address || 'Metro Atlanta, GA').split(',').map(s => s.trim());
  const locality = addrParts[0] || 'Metro Atlanta';
  const region = addrParts[1] || 'GA';

  const PROVIDER = {
    '@type': 'Organization',
    name: `${businessName} Detailing`,
    url: `${baseUrl}/`,
    telephone: phoneHref,
    address: { '@type': 'PostalAddress', addressLocality: locality, addressRegion: region, addressCountry: 'US' },
  };

  const PAGE_META = {
    '/': {
      title: `${businessName} Detailing | Mobile Car Detailing in ${area}`,
      description: `${businessName} brings premium mobile auto detailing to your home or office across ${area}. Ceramic coatings, paint correction, interior & exterior details, and the ${planShort} unlimited membership.`,
    },
    '/services': {
      title: `Detailing Services | ${businessName} — ${area}`,
      description: `Full mobile detailing services in ${area}: interior detail, exterior detail, full detail, ceramic coating, paint correction, and headlight restoration — we come to you.`,
    },
    '/pricing': {
      title: `Pricing & Instant Quote | ${businessName} Detailing`,
      description: `Get an instant custom quote for mobile car detailing in ${area}. Transparent pricing by vehicle size, condition, and add-ons, plus ${planShort} membership plans.`,
    },
    '/book': {
      title: `Book a Mobile Detail | ${businessName} — ${area}`,
      description: `Schedule your mobile detailing appointment in ${area}. Choose your service, date, and time and a ${businessName} specialist comes to your home or office.`,
    },
    '/vds-gold': {
      title: `${planLabel} | Unlimited Mobile Detailing`,
      description: `${planShort}: a monthly membership for unlimited exterior details, priority booking, and member pricing on full details and ceramic coatings across ${area}.`,
    },
    '/gallery': {
      title: `Detailing Gallery | ${businessName}`,
      description: `Before & after results from ${businessName} detailing across ${area} — ceramic coatings, paint corrections, and full interior and exterior details.`,
    },
    '/faq': {
      title: `FAQ | ${businessName} Detailing`,
      description: `Answers to common questions about ${businessName} detailing, booking, the ${planShort} membership, ceramic coatings, and service areas in ${area}.`,
    },
    '/vds-gold-signup': {
      title: `Sign Up for ${planShort} | ${businessName}`,
      description: `Enroll your vehicle in ${planShort} — the monthly unlimited mobile detailing membership for ${area} drivers.`,
    },
    '/terms': { title: `Terms & Conditions | ${businessName}`, description: `Terms and conditions for ${businessName} detailing services and the ${planShort} membership.` },
    '/privacy': { title: `Privacy Policy | ${businessName}`, description: `Privacy policy for ${businessName} detailing services.` },
    '/cookies': { title: `Cookies Policy | ${businessName}`, description: `Cookie policy for ${businessName} detailing services.` },
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
    '/vds-gold': {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: planLabel,
      description: `Monthly unlimited mobile detailing membership: unlimited exterior details, one interior detail per month, and ceramic sealant on every detail, across ${area}. Cancel anytime.`,
      brand: { '@type': 'Brand', name: businessName },
      category: 'Auto Detailing Membership',
      offers: plan.pricing_by_group.map(g => ({
        '@type': 'Offer',
        name: `${planShort} — ${groupLabel(g.pricing_group)}`,
        price: String(g.price_monthly),
        priceCurrency: currency,
        description: `$${g.price_monthly}/month per vehicle (${groupLabel(g.pricing_group)}).`,
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/vds-gold-signup`,
        seller: PROVIDER,
      })),
    },
    '/faq': {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Do I need to be home during the service?', acceptedAnswer: { '@type': 'Answer', text: "No. As long as we have access to the vehicle and the keys are arranged ahead of time, you don't need to be present." } },
        { '@type': 'Question', name: 'How long does a detail usually take?', acceptedAnswer: { '@type': 'Answer', text: "Most appointments range from 2–5 hours. We'll give you an accurate time estimate before your service begins." } },
        { '@type': 'Question', name: 'Is mobile detailing safe for high-end vehicles?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. We specialize in luxury and performance vehicles and use professional-grade products, tools, and paint-safe techniques.' } },
        { '@type': 'Question', name: 'What products do you use?', acceptedAnswer: { '@type': 'Answer', text: "We exclusively use GTechniq professional detailing and protection products." } },
        { '@type': 'Question', name: 'Do you offer paint protection film (PPF)?', acceptedAnswer: { '@type': 'Answer', text: 'Our protection offerings focus on ceramic coatings using GTechniq professional range, from 3-month maintenance to 7-year permanent protection.' } },
        { '@type': 'Question', name: `What's the difference between a full detail and ${planShort}?`, acceptedAnswer: { '@type': 'Answer', text: `A full detail is a one-time service. ${planShort} is a monthly membership ($${sedanPrice}/mo sedan/coupe, $${truckPrice}/mo truck/SUV) with unlimited exterior details and 1 interior detail per month.` } },
        { '@type': 'Question', name: `What is ${planShort}?`, acceptedAnswer: { '@type': 'Answer', text: `${planShort} is our monthly membership: unlimited exterior details and 1 full interior detail per month, with ceramic sealant on every detail.` } },
        { '@type': 'Question', name: `Can I cancel ${planShort} anytime?`, acceptedAnswer: { '@type': 'Answer', text: `Yes. ${planShort} is month-to-month with no long-term contracts. You can cancel anytime.` } },
        { '@type': 'Question', name: `Can I add multiple vehicles to ${planShort}?`, acceptedAnswer: { '@type': 'Answer', text: `Yes. Membership is priced per vehicle — $${sedanPrice}/mo (sedan/coupe) or $${truckPrice}/mo (truck/3-row SUV) — so you can enroll as many vehicles as you need.` } },
        { '@type': 'Question', name: 'What forms of payment do you accept?', acceptedAnswer: { '@type': 'Answer', text: 'We accept Cash, Zelle, Venmo, Cash App, and Debit/Credit Card via Invoice. Payment is collected after the service is completed.' } },
        { '@type': 'Question', name: 'Are you insured?', acceptedAnswer: { '@type': 'Answer', text: `Yes. ${config?.legal_name || businessName} is fully insured and a registered LLC in Georgia.` } },
        { '@type': 'Question', name: 'What is your cancellation or rescheduling policy?', acceptedAnswer: { '@type': 'Answer', text: "We ask for at least 24 hours' notice for cancellations or reschedules." } },
      ],
    },
  };

  useEffect(() => {
    const meta = PAGE_META[path];
    const noindex = NOINDEX.has(path) || !meta;

    if (meta) {
      document.title = meta.title;
      upsertMeta('name', 'description', meta.description);
      upsertMeta('property', 'og:title', meta.title);
      upsertMeta('property', 'og:description', meta.description);
      upsertMeta('property', 'og:url', `${baseUrl}${path}`);
      upsertMeta('property', 'og:image', logo);
      upsertMeta('name', 'twitter:title', meta.title);
      upsertMeta('name', 'twitter:description', meta.description);
      upsertMeta('name', 'twitter:image', logo);
      upsertLink('canonical', `${baseUrl}${path}`);
      upsertMeta('name', 'robots', 'index, follow');
    } else {
      upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
      upsertLink('canonical', `${baseUrl}${path}`);
    }
    // Per-route structured data (rich results). Removed on internal/non-indexed routes.
    upsertJsonLd(NOINDEX.has(path) ? null : ROUTE_JSON_LD[path]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, config]);

  return null;
}