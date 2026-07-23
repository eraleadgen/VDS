// Client Care Guides — one focused, printable guide per service.
// Content is the customer-facing aftercare reference (also used as the email body when a
// guide is auto-delivered after payment/completion). Every guide closes with a VDS Gold
// enrollment call-to-action so clients can keep their vehicle in shape between visits.
import {
  Shield, Sparkles, Droplets, Wind, Calendar, AlertTriangle, Car, Crown, Leaf,
} from 'lucide-react';

const GOLD_CTA = {
  title: 'Keep It Showroom-Fresh with VDS Gold',
  body: 'The methods in this guide are exactly how we maintain our own clients\' vehicles. With VDS Gold you get unlimited exterior details (ceramic sealant included) and one full detail every month, plus an annual ceramic coating inspection — so your finish stays protected for the life of your membership. $250/mo for sedans & coupes · $300/mo for trucks & SUVs.',
  link: '/vds-gold',
  linkLabel: 'Explore VDS Gold',
};

export const CARE_GUIDES = [
  {
    key: 'ceramic_coating',
    icon: Shield,
    title: 'Ceramic Coating Care Guide',
    eyebrow: 'VDS Mobile · Ceramic Coating Aftercare',
    intro: 'Your ceramic coating needs a brief cure period and gentle maintenance to perform for years. Follow these steps to protect your investment.',
    sections: [
      {
        title: 'The 48-Hour Cure',
        bullets: [
          'Do not wash the vehicle for the first 48 hours — the coating is curing and bonding to the paint during this window.',
          'Keep the vehicle in a covered area — your garage or a parking deck — during the entire 48-hour cure. As a mobile service, the car must be sheltered away from rain and the elements until the coating has cured.',
        ],
      },
      {
        title: 'Ongoing Maintenance',
        bullets: [
          'After curing, wash every 2–4 weeks using a pH-neutral, coating-safe shampoo — never dish soap or degreasers.',
          'Use the two-bucket method (one rinse, one wash) with a clean microfiber mitt to prevent swirl marks.',
          "Top up the coating's hydrophobic behavior with a ceramic sealant every 6 months.",
          'Dry with a leaf blower — it is the most effective method with a ceramic coating because there is less contact with the paint.',
          'Have the coating inspected annually by a VDS specialist to check for worn or compromised areas.',
        ],
      },
      {
        title: 'Hazards to Avoid',
        bullets: [
          'Once cured, do not park under trees or near sprinklers — tree sap, bird droppings, and hard-water spots will etch and stain the coating if left untreated.',
          'Remove bird droppings and sap promptly: soften with a damp microfiber, then gently lift off. Never scrape dry.',
          'VDS Mobile is not responsible for damage caused by improper care or mistreatment of a ceramic-coated vehicle. Follow these guidelines to protect your investment.',
        ],
      },
    ],
    goldCta: GOLD_CTA,
  },
  {
    key: 'paint_correction',
    icon: Sparkles,
    title: 'Paint Correction Care Guide',
    eyebrow: 'VDS Mobile · Paint Correction Aftercare',
    intro: 'Freshly corrected paint is delicate. Protect it and keep it clean to preserve the finish.',
    sections: [
      {
        title: 'Protect Corrected Paint Immediately',
        bullets: [
          'Apply a sealant, ceramic coating, or PPF as soon as possible — corrected paint has no protective layer until you do.',
          'Until protected, treat the paint as freshly polished: minimal contact, gentle washing only.',
        ],
      },
      {
        title: 'Safe Washing',
        bullets: [
          'Wash using the two-bucket method with plush microfiber towels only.',
          'Never wipe the paint dry — always use a detail spray or pre-rinse to lift dirt first.',
          'Blot dry with a clean microfiber towel instead of wiping in circles.',
          'Avoid drive-through brush washes entirely; they will re-introduce swirl marks.',
        ],
      },
      {
        title: 'Hazards to Avoid',
        bullets: [
          'Do not wipe paint with a dry towel or your hand (even "just dusting").',
          'Parking under trees — sap and bird droppings etch paint within hours.',
          'Parking in sprinkler range — sprinklers cause hard-water spots that can stain the finish.',
          'Letting bird droppings or sap sit for more than a day.',
        ],
      },
    ],
    goldCta: GOLD_CTA,
  },
  {
    key: 'detailing',
    icon: Droplets,
    title: 'Detailing Care Guide',
    eyebrow: 'VDS Mobile · Detailing Aftercare',
    intro: 'Proper technique is the single biggest factor in keeping your paint flawless between details. Use these methods yourself, or let us handle it through VDS Gold.',
    sections: [
      {
        title: 'Safe Washing — The Two-Bucket Method',
        bullets: [
          'Bucket 1: clean soapy water (pH-neutral shampoo). Bucket 2: plain rinse water for the mitt.',
          'Work top-down, one panel at a time, rinsing the mitt in the rinse bucket before reloading.',
          'Use grit guards in both buckets to trap dirt at the bottom.',
          'Dry immediately with a clean, plush microfiber drying towel — never air-dry (water spots etch paint).',
          'Wash in shade or early morning; never wash hot paint in direct sunlight.',
        ],
      },
      {
        title: 'Interior Care',
        bullets: [
          'Vacuum weekly to prevent grit from grinding into carpets and seats.',
          'Wipe interior plastics with a damp microfiber; use a UV-safe interior dressing every 6–8 weeks.',
          'Condition leather every 3 months with a pH-balanced leather conditioner — avoid silicone-heavy products.',
          'Clean spills immediately; blot, do not rub, to avoid spreading stains.',
          'Window tint acts as a UV protector for the interior as well — it reduces fading and cracking of the dash, leather, and trim.',
        ],
      },
      {
        title: 'Hazards to Remove Quickly',
        bullets: [
          'Bird droppings — soften with a damp microfiber, then gently lift off. Never scrape dry.',
          'Tree sap — use isopropyl alcohol or a dedicated sap remover on a microfiber, then rinse.',
          'Bug splatter — pre-soak with a bug-remover spray before washing.',
          'Hard water / sprinkler spots — rinse and dry quickly; etched spots may require a light polish.',
          'Industrial fallout — a decontamination clay bar treatment (ask your VDS specialist) removes bonded iron.',
        ],
      },
      {
        title: 'What to Avoid',
        bullets: [
          'Automated brush car washes — the #1 cause of swirl marks.',
          'Dish soap, household cleaners, or degreasers — they strip coatings and waxes.',
          'Wiping paint with a dry towel or your hand (even "just dusting").',
          'Parking under trees — sap and bird droppings etch paint within hours.',
          'Parking in sprinkler range — sprinklers cause hard-water spots that can stain the coating.',
        ],
      },
    ],
    goldCta: GOLD_CTA,
  },
  {
    key: 'vds_gold',
    icon: Crown,
    title: 'VDS Gold Care Guide',
    eyebrow: 'VDS Mobile · VDS Gold Member Care',
    intro: 'Your VDS Gold membership keeps your vehicle in showroom condition all year. Here is how to get the most from your membership and protect your finish between visits.',
    sections: [
      {
        title: "What's Included",
        bullets: [
          'Unlimited exterior details (ceramic sealant included).',
          'One full detail per month.',
          'Annual ceramic coating inspection and maintenance top-up.',
          '$250/month for sedans and coupes · $300/month for trucks and SUVs.',
        ],
      },
      {
        title: 'Maintenance Cadence',
        bullets: [
          'Bi-weekly express exterior washes prevent contaminant buildup between details.',
          'Schedule your monthly full detail through your Member Dashboard to lock in your preferred slot.',
          'Keep your vehicle information up to date (paint protection, mileage) so we tailor every visit.',
        ],
      },
      {
        title: 'Between Visits',
        bullets: [
          'Use the two-bucket method for any at-home washes; never use dish soap or automated brush washes.',
          'Remove bird droppings and sap promptly to protect your coating.',
          'Dry with a leaf blower or plush microfiber to minimize paint contact.',
        ],
      },
    ],
    goldCta: { ...GOLD_CTA, title: 'Already a Gold Member?', body: GOLD_CTA.body + ' Manage your membership from your Member Dashboard.', link: '/member-dashboard', linkLabel: 'Go to Member Dashboard' },
  },
];

export const CARE_GUIDE_ICONS = { Shield, Sparkles, Droplets, Wind, Calendar, AlertTriangle, Car, Crown, Leaf };

// Build the printable HTML for a single guide (used by the portal "print" buttons).
export function buildGuidePrintHtml(guide) {
  const sections = guide.sections.map((s) => `
    <h2>${s.title}</h2>
    <ul>${s.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
  `).join('<div class="sep"></div>');
  const cta = `
    <div class="callout">
      <h2>${guide.goldCta.title}</h2>
      <p>${guide.goldCta.body}</p>
    </div>`;
  return `
    <div class="eyebrow">${guide.eyebrow}</div>
    <h1>${guide.title}</h1>
    <div class="sub">Premium aftercare from Valet Detailing Service</div>
    <div class="callout"><p>${guide.intro}</p></div>
    ${sections}
    ${cta}
    <div class="foot">Valet Detailing Service LLC · (470) 412-8986 · vdsmobile.com</div>
  `;
}