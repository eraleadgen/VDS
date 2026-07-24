import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Route-aware SEO: sets a unique, keyword-rich <title> + meta description per page,
// keeps Open Graph / Twitter / canonical in sync, and applies noindex to internal
// portals (auth, admin, specialist, member dashboard) so only public marketing
// pages are indexed. Defaults live in index.html; this updates them on navigation.
const SITE = 'VDS Mobile Detailing';
const BASE_URL = 'https://vdsmobile.com';
const DEFAULT_IMAGE = 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';

const PAGE_META = {
  '/': {
    title: 'VDS Mobile Detailing | Mobile Car Detailing in Metro Atlanta',
    description: 'VDS Mobile brings premium mobile auto detailing to your home or office across Metro Atlanta. Ceramic coatings, paint correction, interior & exterior details, and the VDS Gold unlimited membership.',
  },
  '/services': {
    title: 'Detailing Services | VDS Mobile — Metro Atlanta',
    description: 'Full mobile detailing services in Metro Atlanta: interior detail, exterior detail, full detail, ceramic coating, paint correction, and headlight restoration — we come to you.',
  },
  '/pricing': {
    title: 'Pricing & Instant Quote | VDS Mobile Detailing',
    description: 'Get an instant custom quote for mobile car detailing in Metro Atlanta. Transparent pricing by vehicle size, condition, and add-ons, plus VDS Gold membership plans.',
  },
  '/book': {
    title: 'Book a Mobile Detail | VDS Mobile — Metro Atlanta',
    description: 'Schedule your mobile detailing appointment in Metro Atlanta. Choose your service, date, and time and a VDS specialist comes to your home or office.',
  },
  '/vds-gold': {
    title: 'VDS Gold Membership | Unlimited Mobile Detailing',
    description: 'VDS Gold: a monthly membership for unlimited exterior details, priority booking, and member pricing on full details and ceramic coatings across Metro Atlanta.',
  },
  '/gallery': {
    title: 'Detailing Gallery | VDS Mobile',
    description: 'Before & after results from VDS Mobile detailing across Metro Atlanta — ceramic coatings, paint corrections, and full interior and exterior details.',
  },
  '/faq': {
    title: 'FAQ | VDS Mobile Detailing',
    description: 'Answers to common questions about VDS Mobile detailing, booking, the VDS Gold membership, ceramic coatings, and service areas in Metro Atlanta.',
  },
  '/vds-gold-signup': {
    title: 'Sign Up for VDS Gold | VDS Mobile',
    description: 'Enroll your vehicle in VDS Gold — the monthly unlimited mobile detailing membership for Metro Atlanta drivers.',
  },
  '/terms': { title: 'Terms & Conditions | VDS Mobile', description: 'Terms and conditions for VDS Mobile detailing services and the VDS Gold membership.' },
  '/privacy': { title: 'Privacy Policy | VDS Mobile', description: 'Privacy policy for VDS Mobile detailing services.' },
  '/cookies': { title: 'Cookies Policy | VDS Mobile', description: 'Cookie policy for VDS Mobile detailing services.' },
};

// Internal portals that should never be indexed.
const NOINDEX = new Set([
  '/member-login', '/member-dashboard', '/member-signup', '/gold-booking',
  '/specialist-login', '/specialist-portal', '/specialist-setup',
  '/admin-login', '/admin',
  '/forgot-password', '/reset-password',
]);

// Per-page structured data (JSON-LD) for rich search results.
const PROVIDER = {
  '@type': 'Organization', name: 'VDS Mobile Detailing',
  url: 'https://vdsmobile.com/', telephone: '+14704128986',
  address: { '@type': 'PostalAddress', addressLocality: 'Alpharetta', addressRegion: 'GA', addressCountry: 'US' },
};

const ROUTE_JSON_LD = {
  '/services': {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mobile Detailing Services — VDS Mobile',
    serviceType: 'Mobile Auto Detailing',
    provider: PROVIDER,
    areaServed: 'Metro Atlanta, GA',
    description: 'Full mobile detailing services in Metro Atlanta: interior detail, exterior detail, full detail, ceramic coating, paint correction, and headlight restoration — performed at your home or office.',
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
    name: 'VDS Gold Membership',
    description: 'Monthly unlimited mobile detailing membership: unlimited exterior details, one interior detail per month, and ceramic sealant on every detail, across Metro Atlanta. Cancel anytime.',
    brand: { '@type': 'Brand', name: 'VDS Mobile' },
    category: 'Auto Detailing Membership',
    offers: [
      {
        '@type': 'Offer', name: 'VDS Gold — Sedan/Coupe',
        price: '250', priceCurrency: 'USD', description: '$250/month per sedan or coupe vehicle.',
        availability: 'https://schema.org/InStock', url: 'https://vdsmobile.com/vds-gold-signup',
        seller: PROVIDER,
      },
      {
        '@type': 'Offer', name: 'VDS Gold — Truck/SUV',
        price: '300', priceCurrency: 'USD', description: '$300/month per truck or 3-row SUV vehicle.',
        availability: 'https://schema.org/InStock', url: 'https://vdsmobile.com/vds-gold-signup',
        seller: PROVIDER,
      },
    ],
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
      { '@type': 'Question', name: "What's the difference between a full detail and VDS Gold?", acceptedAnswer: { '@type': 'Answer', text: 'A full detail is a one-time service. VDS Gold is a monthly membership ($250/mo sedan/coupe, $300/mo truck/SUV) with unlimited exterior details and 1 interior detail per month.' } },
      { '@type': 'Question', name: 'What is VDS Gold?', acceptedAnswer: { '@type': 'Answer', text: 'VDS Gold is our monthly membership: unlimited exterior details and 1 full interior detail per month, with ceramic sealant on every detail.' } },
      { '@type': 'Question', name: 'Can I cancel VDS Gold anytime?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. VDS Gold is month-to-month with no long-term contracts. You can cancel anytime.' } },
      { '@type': 'Question', name: 'Can I add multiple vehicles to VDS Gold?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Membership is priced per vehicle — $250/mo (sedan/coupe) or $300/mo (truck/3-row SUV) — so you can enroll as many vehicles as you need.' } },
      { '@type': 'Question', name: 'What forms of payment do you accept?', acceptedAnswer: { '@type': 'Answer', text: 'We accept Cash, Zelle, Venmo, Cash App, and Debit/Credit Card via Invoice. Payment is collected after the service is completed.' } },
      { '@type': 'Question', name: 'Are you insured?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Valet Detailing Service LLC is fully insured and a registered LLC in Georgia.' } },
      { '@type': 'Question', name: 'What is your cancellation or rescheduling policy?', acceptedAnswer: { '@type': 'Answer', text: "We ask for at least 24 hours' notice for cancellations or reschedules." } },
    ],
  },
};

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

  useEffect(() => {
    const meta = PAGE_META[path];
    const noindex = NOINDEX.has(path) || !meta;

    if (meta) {
      document.title = meta.title;
      upsertMeta('name', 'description', meta.description);
      upsertMeta('property', 'og:title', meta.title);
      upsertMeta('property', 'og:description', meta.description);
      upsertMeta('property', 'og:url', `${BASE_URL}${path}`);
      upsertMeta('property', 'og:image', DEFAULT_IMAGE);
      upsertMeta('name', 'twitter:title', meta.title);
      upsertMeta('name', 'twitter:description', meta.description);
      upsertMeta('name', 'twitter:image', DEFAULT_IMAGE);
      upsertLink('canonical', `${BASE_URL}${path}`);
      upsertMeta('name', 'robots', 'index, follow');
    } else {
      upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
      upsertLink('canonical', `${BASE_URL}${path}`);
    }
    // Per-route structured data (rich results). Removed on internal/non-indexed routes.
    upsertJsonLd(NOINDEX.has(path) ? null : ROUTE_JSON_LD[path]);
  }, [path]);

  return null;
}