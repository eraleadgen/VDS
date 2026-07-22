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
  '/admin-login', '/admin', '/era-doc',
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
  }, [path]);

  return null;
}