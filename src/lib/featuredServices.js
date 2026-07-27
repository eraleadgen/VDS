// Featured-services display layer. The operational `services` catalog drives pricing and
// booking; this layer holds the curated marketing cards shown on Home/Services. Each card
// references a real catalog service_key (and an optional booking_preselect that defaults to
// service_key). resolveFeaturedCards validates those references against the live catalog and
// marks stale cards so the UI can flag them instead of silently linking to a removed service.
// When config.featured_services is empty, DEFAULT_FEATURED (VDS's 3 cards, real catalog keys)
// is used so the pages always render.

export const DEFAULT_FEATURED = [
  {
    service_key: 'full_detail',
    title: 'FULL DETAIL',
    subtitle: 'Interior & Exterior Restoration',
    image_url: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/322538cef_IMG_3881.jpg',
    specs: ['Interior & Exterior Restoration', 'Odor & Stain Removal', 'Professional Products', 'Ceramic Sealant'],
    not_in_membership: false,
    booking_preselect: 'full_detail',
    display_order: 1,
  },
  {
    service_key: 'ceramic_coating_2yr',
    title: 'CERAMIC COATINGS',
    subtitle: 'Long-Term Paint Protection',
    image_url: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/3a80c18b3_ceramic-coating-being-professionally-applied-to-car-paint-for-long-term-protection.webp',
    specs: ['2–7 Year Coatings', 'Professional-Grade Coatings', 'Hydrophobic Surface Protection', 'UV & Chemical Resistance'],
    not_in_membership: true,
    booking_preselect: 'ceramic_coating_2yr',
    display_order: 2,
  },
  {
    service_key: 'paint_correction_stage1',
    title: 'PAINT CORRECTION',
    subtitle: 'Swirl & Scratch Removal',
    image_url: 'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/2e390daf5_ChatGPTImageFeb17202611_00_33PM.png',
    specs: ['Swirl Mark Elimination', 'Scratch & Buffer Trail Removal', 'Flawless Paint Quality', 'Coating Recommended'],
    not_in_membership: true,
    booking_preselect: 'paint_correction_stage1',
    display_order: 3,
  },
];

// Returns featured cards with _preselect (resolved booking key) and _stale (true if the
// referenced service_key or booking_preselect no longer exists in the operational catalog).
export function resolveFeaturedCards(featured, services) {
  const keys = new Set((services || []).map(s => s.key));
  const list = featured && featured.length ? featured : DEFAULT_FEATURED;
  return list
    .map(card => {
      const preselect = card.booking_preselect || card.service_key;
      const serviceOk = !card.service_key || keys.has(card.service_key);
      const preselectOk = !preselect || keys.has(preselect);
      return { ...card, _preselect: preselect, _stale: !serviceOk || !preselectOk };
    })
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}