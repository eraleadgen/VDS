// Client Care Guides — one focused, printable guide per service.
// Content is the customer-facing aftercare reference (also used as the email body when a
// guide is auto-delivered after payment/completion). Every guide closes with a VDS Gold
// enrollment call-to-action so clients can keep their vehicle in shape between visits.
import {
  Shield, Sparkles, Droplets, Wind, Calendar, AlertTriangle, Car, Crown, Leaf, Handshake,
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
    intro: "Ceramic coating is a semi-permanent auto detailing product applied to a vehicle's paint to guard against environmental damage and keep it looking shiny. Maintaining ceramic coating involves regular washing, proper drying, and using products to maintain its properties. Routine maintenance helps keep the ceramic coating effective and ensures your vehicle stays sleek and protected.",
    sections: [
      {
        title: 'How does Ceramic help protect against swirl marks and paint damage?',
        bullets: [
          "Once cured, the coating forms a strong, slick surface that minimizes friction and reduces the likelihood of swirl marks caused by washing or contact with debris. It acts as a sacrificial barrier that absorbs minor abrasion instead of your clear coat. This protection helps preserve the paint's depth and clarity for years.",
        ],
      },
      {
        title: 'The 48-Hour Cure',
        bullets: [
          'Do not get the vehicle wet for the first 48 hours and do not wash for the first week from when the coating is applied.',
          'Do not wash the vehicle for the first 48 hours — the coating is curing and bonding to the paint during this window.',
          'Keep the vehicle in a covered area — your garage or a parking deck — during the entire 48-hour cure. As a mobile service, the car must be sheltered away from rain and the elements until the coating has cured.',
        ],
      },
      {
        title: 'Tips for Regular Maintenance — Washing the Coating',
        bullets: [
          'Wipe the microfiber mitt in horizontal strokes along the aerodynamics of the vehicle. Do not wipe in circular motions.',
          'Bucket Method: Use the two-bucket method with grit guards. Fill one bucket with soapy water and the other with clean water. Dip your wash mitt into the soapy water, wash a section of the car, then rinse the mitt in the clean water before re-soaping.',
          "Wash Mitt: Use a high-quality wash mitt to clean the car's surface gently. Avoid using sponges or brushes that can cause scratches.",
          "pH-Neutral Shampoo: Choose a pH-neutral shampoo designed to work with ceramic coatings. This helps maintain the coating's hydrophobic properties and ensures a thorough cleaning.",
          'Foam Cannon: Use a foam cannon to apply a foam layer to the entire vehicle. This helps loosen dirt and grime without scratching the surface.',
        ],
      },
      {
        title: 'Drying the Coated Surface',
        bullets: [
          'Proper drying techniques will help you avoid swirl marks and water spots. After washing, use a microfiber towel to dry the vehicle. Microfiber towels are gentle on the surface and highly absorbent, making them ideal for this task.',
          'For an even more careful approach, you can use a leaf blower to blow dry the vehicle to ensure no water remains on the surface.',
        ],
      },
      {
        title: 'Protection from Environmental Factors',
        bullets: [
          'Parking in the shade is crucial to avoid the harmful effects of direct sunlight, which can degrade the ceramic coating over time. Park your car in a garage or under a carport to keep it out of the sun when possible.',
          "For quick touch-ups between washes, use a detail spray or ceramic boosters. These products help maintain the coating's hydrophobic properties and provide a quick shine.",
        ],
      },
      {
        title: 'Dealing with Specific Contaminants',
        bullets: [
          'Bird Droppings: Use a quick detailer spray and a microfiber towel to gently remove bird droppings. Avoid scrubbing, as this can damage the coating.',
          'Brake Dust: Brake dust can accumulate on wheels and lower body panels. Use a wheel cleaner safe for ceramic-coated surfaces and a soft brush to clean these areas.',
          'Water Spots: To remove water spots, use a dedicated water spot remover or a vinegar solution. Apply it to the affected area and gently wipe it away with a microfiber cloth.',
        ],
      },
      {
        title: 'Routine Inspection and Professional Maintenance',
        bullets: [
          'Regularly inspect your ceramic coating for any signs of damage or wear. Look for areas where the hydrophobic properties might have diminished, indicating the need for a maintenance booster.',
          'If you notice significant wear or damage, consider consulting a professional detailer. A professional can correct the paint to address any scratches or imperfections and reapply the ceramic coating if necessary.',
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
          'We encourage our clients to apply a Ceramic Coating, Ceramic Sealant, or PPF as soon as possible after the paint correction to help prevent future damage to the paint.',
          'Until protected, treat the paint as freshly polished: minimal contact, gentle washing only.',
        ],
      },
      {
        title: 'Tips for Regular Maintenance — Washing the Coating',
        bullets: [
          'Wipe the microfiber mitt in horizontal strokes along the aerodynamics of the vehicle. Do not wipe in circular motions.',
          'Bucket Method: Use the two-bucket method with grit guards. Fill one bucket with soapy water and the other with clean water. Dip your wash mitt into the soapy water, wash a section of the car, then rinse the mitt in the clean water before re-soaping.',
          "Wash Mitt: Use a high-quality wash mitt to clean the car's surface gently. Avoid using sponges or brushes that can cause scratches.",
          "pH-Neutral Shampoo: Choose a pH-neutral shampoo designed to work with ceramic coatings. This helps maintain the coating's hydrophobic properties and ensures a thorough cleaning.",
          'Foam Cannon: Use a foam cannon to apply a foam layer to the entire vehicle. This helps loosen dirt and grime without scratching the surface.',
        ],
      },
      {
        title: 'Drying the Coated Surface',
        bullets: [
          'Proper drying techniques will help you avoid swirl marks and water spots. After washing, use a microfiber towel to dry the vehicle. Microfiber towels are gentle on the surface and highly absorbent, making them ideal for this task.',
          'For an even more careful approach, you can use a leaf blower to blow dry the vehicle to ensure no water remains on the surface.',
        ],
      },
      {
        title: 'Protection from Environmental Factors',
        bullets: [
          'Parking in the shade is crucial to avoid the harmful effects of direct sunlight, which can degrade the ceramic coating over time. Park your car in a garage or under a carport to keep it out of the sun when possible.',
          "For quick touch-ups between washes, use a detail spray or ceramic boosters. These products help maintain the coating's hydrophobic properties and provide a quick shine.",
        ],
      },
      {
        title: 'Dealing with Specific Contaminants',
        bullets: [
          'Bird Droppings: Use a quick detailer spray and a microfiber towel to gently remove bird droppings. Avoid scrubbing, as this can damage the coating.',
          'Brake Dust: Brake dust can accumulate on wheels and lower body panels. Use a wheel cleaner safe for ceramic-coated surfaces and a soft brush to clean these areas.',
          'Water Spots: To remove water spots, use a dedicated water spot remover or a vinegar solution. Apply it to the affected area and gently wipe it away with a microfiber cloth.',
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
        title: 'Tips for Regular Maintenance — Washing the Vehicle',
        bullets: [
          'Wipe the microfiber mitt in horizontal strokes along the aerodynamics of the vehicle. Do not wipe in circular motions.',
          'Bucket Method: Use the two-bucket method with grit guards. Fill one bucket with soapy water and the other with clean water. Dip your wash mitt into the soapy water, wash a section of the car, then rinse the mitt in the clean water before re-soaping.',
          "Wash Mitt: Use a high-quality wash mitt to clean the car's surface gently. Avoid using sponges or brushes that can cause scratches.",
          "pH-Neutral Shampoo: Choose a pH-neutral shampoo designed to work with ceramic coatings. This helps maintain the coating's hydrophobic properties and ensures a thorough cleaning.",
          'Foam Cannon: Use a foam cannon to apply a foam layer to the entire vehicle. This helps loosen dirt and grime without scratching the surface.',
        ],
      },
      {
        title: 'Drying the Vehicle',
        bullets: [
          'Proper drying techniques will help you avoid swirl marks and water spots. After washing, use a microfiber towel to dry the vehicle. Microfiber towels are gentle on the surface and highly absorbent, making them ideal for this task.',
          'For an even more careful approach, you can use a leaf blower to blow dry the vehicle to ensure no water remains on the surface.',
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
        title: 'Protection from Environmental Factors',
        bullets: [
          'Parking in the shade is crucial to avoid the harmful effects of direct sunlight, which can degrade the coating over time. Park your car in a garage or under a carport to keep it out of the sun when possible.',
          "For quick touch-ups between washes, use a detail spray or ceramic boosters. These products help maintain the coating's hydrophobic properties and provide a quick shine.",
          'Avoid parking under trees — sap and bird droppings etch paint within hours.',
          'Avoid parking in sprinkler range — sprinklers cause hard-water spots that can stain the finish.',
        ],
      },
      {
        title: 'Dealing with Specific Contaminants',
        bullets: [
          'Bird Droppings: Use a quick detailer spray and a microfiber towel to gently remove bird droppings. Avoid scrubbing, as this can damage the coating.',
          'Brake Dust: Brake dust can accumulate on wheels and lower body panels. Use a wheel cleaner safe for ceramic-coated surfaces and a soft brush to clean these areas.',
          'Water Spots: To remove water spots, use a dedicated water spot remover or a vinegar solution. Apply it to the affected area and gently wipe it away with a microfiber cloth.',
          'Tree Sap: Use isopropyl alcohol or a dedicated sap remover on a microfiber, then rinse.',
          'Bug Splatter: Pre-soak with a bug-remover spray before washing.',
        ],
      },
      {
        title: 'What to Avoid',
        bullets: [
          'Automated brush car washes — the #1 cause of swirl marks.',
          'Dish soap, household cleaners, or degreasers — they strip coatings and waxes.',
          'Wiping paint with a dry towel or your hand (even "just dusting").',
          'Letting bird droppings or sap sit for more than a day.',
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
          'Priority scheduling — lock in your preferred slots ahead of other clients.',
          '$250/month for sedans and coupes · $300/month for trucks and SUVs.',
        ],
      },
      {
        title: 'Maintenance Cadence',
        bullets: [
          'Bi-weekly express exterior washes prevent contaminant buildup between details.',
          'Schedule your monthly full detail through your Member Dashboard to lock in your preferred slot.',
          'Avoid automated brush car washes between visits — hand wash or touchless only to protect your finish.',
        ],
      },
      {
        title: 'How to Sign Up',
        bullets: [
          'Visit vdsmobile.com/vds-gold-signup to start your VDS Gold enrollment.',
          'Select your vehicle — pricing is automatically set to $250/mo for sedans & coupes and $300/mo for trucks & SUVs.',
          'Add your vehicle details (year, make, model, color) and create your member account.',
          'Complete checkout through our secure Stripe payment to activate your membership.',
          'Once enrolled, manage your vehicle, schedule details, and track usage from your Member Dashboard at vdsmobile.com/member-dashboard.',
        ],
      },
    ],
    goldCta: { ...GOLD_CTA, title: 'Already a Gold Member?', body: GOLD_CTA.body + ' Manage your membership from your Member Dashboard.', link: '/member-dashboard', linkLabel: 'Go to Member Dashboard' },
  },
  {
    key: 'partner_network',
    icon: Handshake,
    title: 'VDS Partner Network Guide',
    eyebrow: 'VDS Mobile · Partner Network Reference',
    intro: 'Everything partners need to share their referral link, track referrals, and earn incentives. VDS Mobile partners are valued equally across the network — every referral you send is tracked end-to-end.',
    sections: [
      {
        title: 'Your Referral Link',
        bullets: [
          'Your unique referral code is shown in the Partner Portal under "Referral Link." Share it as a short link (domain/CODE) or the QR code.',
          'When a customer visits your link, they are sent to the booking flow with attribution automatically applied to their account.',
          'Attribution stays with the client for the relationship — you earn on their first detail, and again if they later book a ceramic coating or paint correction.',
        ],
      },
      {
        title: 'How Referrals Are Tracked',
        bullets: [
          'A referral is created the moment a customer books through your link.',
          'It converts when the job\'s invoice is paid — at that point your conversion count and revenue are updated automatically.',
          'Your Partner Portal shows a per-client incentive tracker: Detail 0/1 → 1/1 once their first detail is paid, Ceramic Coating 0/1 → 1/1 once a coating is paid, and Paint Correction 0/1 → 1/1 once a correction is paid.',
          'You see the initial detail, any ceramic coating, and any paint correction that client books — repeat details are not shown or credited again.',
        ],
      },
      {
        title: 'Incentive Earnings',
        bullets: [
          'You earn one payout per service type, per referred client:',
          'Initial Detail: $30 one-time payout the first time a referred client completes a detail (0/1 → 1/1).',
          'Ceramic Coating: $100 one-time payout when that client books a ceramic coating (0/1 → 1/1).',
          'Paint Correction: $100 one-time payout when that client books a paint correction (0/1 → 1/1).',
          'VDS Gold Signup: $30 one-time compensation when a referred client registers for VDS Gold using your link.',
          'Incentives apply to primary service packages only; add-ons (such as ceramic sealant) are excluded from payout calculations.',
        ],
      },
      {
        title: 'Why Partner with VDS',
        bullets: [
          'Your customers just made a significant investment in their vehicle — referring them to VDS ensures that investment is taken care of by professionals.',
          'Recommending a trusted, high-end detailing partner makes you a more valuable, professional resource to your clients — not just a salesperson.',
          'We are fully mobile, so we come to your customers wherever they are — at the dealership, at home, or at work, and it reflects well on the person who recommended it.',
          'You do not have to be a detail expert: we handle the service, the quality, and the follow-up — your role is simply the introduction.',
        ],
      },
    ],
    goldCta: { title: 'Refer Clients to VDS Gold', body: 'VDS Gold keeps your referred clients\' vehicles showroom-fresh all year — $250/mo for sedans & coupes · $300/mo for trucks & SUVs. You earn a $30 bonus every time a referred client registers for Gold.', link: '/vds-gold', linkLabel: 'Explore VDS Gold' },
  },
];

export const CARE_GUIDE_ICONS = { Shield, Sparkles, Droplets, Wind, Calendar, AlertTriangle, Car, Crown, Leaf, Handshake };

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