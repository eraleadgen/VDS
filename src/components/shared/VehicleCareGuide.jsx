import { useState } from 'react';
import { ChevronDown, Printer, Car, Shield, Droplets, Sparkles, Calendar, AlertTriangle, Wind } from 'lucide-react';
import printHtml from '@/components/shared/printHtml';

// Customer Vehicle Care Guide — shared resource shown across Admin, Specialist & Partner portals.
// Content doubles as an in-app reference and a printable hand-out (Save as PDF) for customers.
const SECTIONS = [
  {
    icon: Shield,
    title: 'Ceramic Coating Aftercare',
    intro: 'Your ceramic coating needs a brief cure period and gentle maintenance to perform for years.',
    bullets: [
      'Do not wash the vehicle for the first 48 hours — the coating is curing and bonding to the paint during this window.',
      'Keep the vehicle in a covered area — your garage or a parking deck — during the entire 48-hour cure. As a mobile service, the car must be sheltered away from rain and the elements until the coating has cured.',
      'After curing, wash every 2–4 weeks using a pH-neutral, coating-safe shampoo — never dish soap or degreasers.',
      'Use the two-bucket method (one rinse, one wash) with a clean microfiber mitt to prevent swirl marks.',
      "Top up the coating's hydrophobic behavior with a ceramic sealant every 6 months.",
      'Dry with a leaf blower — it is the most effective method with a ceramic coating because there is less contact with the paint.',
      'Have the coating inspected annually by a VDS specialist to check for worn or compromised areas.',
      'Once cured, do not park under trees or near sprinklers — tree sap, bird droppings, and hard-water spots will etch and stain the coating if left untreated.',
      'VDS Mobile is not responsible for damage caused by improper care or mistreatment of a ceramic-coated vehicle. Follow these guidelines to protect your investment.',
    ],
  },
  {
    icon: Sparkles,
    title: 'Paint Correction Aftercare',
    intro: 'Freshly corrected paint is delicate. Protect it and keep it clean to preserve the finish.',
    bullets: [
      'Apply a sealant, ceramic coating, or PPF as soon as possible — corrected paint has no protective layer until you do.',
      'Wash using the two-bucket method with plush microfiber towels only.',
      'Never wipe the paint dry — always use a detail spray or pre-rinse to lift dirt first.',
      'Avoid drive-through brush washes entirely; they will re-introduce swirl marks.',
      'Blot dry with a clean microfiber towel instead of wiping in circles.',
    ],
  },
  {
    icon: Droplets,
    title: 'Safe Washing — The Two-Bucket Method',
    intro: 'Proper technique is the single biggest factor in keeping your paint flawless between details.',
    bullets: [
      'Bucket 1: clean soapy water (pH-neutral shampoo). Bucket 2: plain rinse water for the mitt.',
      'Work top-down, one panel at a time, rinsing the mitt in the rinse bucket before reloading.',
      'Use grit guards in both buckets to trap dirt at the bottom.',
      'Dry immediately with a clean, plush microfiber drying towel — never air-dry (water spots etch paint).',
      'Wash in shade or early morning; never wash hot paint in direct sunlight.',
    ],
  },
  {
    icon: Wind,
    title: 'Interior Care',
    intro: 'Keep the cabin fresh and protect leather and trim from UV and wear.',
    bullets: [
      'Vacuum weekly to prevent grit from grinding into carpets and seats.',
      'Wipe interior plastics with a damp microfiber; use a UV-safe interior dressing every 6–8 weeks.',
      'Condition leather every 3 months with a pH-balanced leather conditioner — avoid silicone-heavy products.',
      'Clean spills immediately; blot, do not rub, to avoid spreading stains.',
      'Window tint acts as a UV protector for the interior as well — it reduces fading and cracking of the dash, leather, and trim.',
    ],
  },
  {
    icon: Calendar,
    title: 'VDS Gold Membership',
    intro: 'VDS Gold is our recurring membership that keeps your vehicle in showroom condition all year.',
    bullets: [
      'Unlimited exterior details (ceramic sealant included) and one full detail per month.',
      '$250/month for sedans and coupes · $300/month for trucks and SUVs.',
      'Bi-weekly express exterior washes prevent contaminant buildup between details.',
      'Annual ceramic coating inspection and maintenance top-up.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Hazards to Remove Quickly',
    intro: 'Some contaminants etch paint within hours. Remove them promptly and safely.',
    bullets: [
      'Bird droppings — soften with a damp microfiber, then gently lift off. Never scrape dry.',
      'Tree sap — use isopropyl alcohol or a dedicated sap remover on a microfiber, then rinse.',
      'Bug splatter — pre-soak with a bug-remover spray before washing.',
      'Hard water / sprinkler spots — rinse and dry quickly; etched spots may require a light polish.',
      'Industrial fallout — a decontamination clay bar treatment (ask your VDS specialist) removes bonded iron.',
    ],
  },
  {
    icon: Car,
    title: 'What to Avoid',
    intro: 'A short list of the most common ways customers accidentally damage a freshly detailed vehicle.',
    bullets: [
      'Automated brush car washes — the #1 cause of swirl marks.',
      'Dish soap, household cleaners, or degreasers — they strip coatings and waxes.',
      'Wiping paint with a dry towel or your hand (even "just dusting").',
      'Parking under trees — sap and bird droppings etch paint within hours.',
      'Parking in sprinkler range — sprinklers cause hard-water spots that can stain the coating.',
      'Letting bird droppings or sap sit for more than a day.',
    ],
  },
];

const buildPrintHtml = () => `
  <div class="eyebrow">VDS Mobile · Resource Center</div>
  <h1>Customer Vehicle Care Guide</h1>
  <div class="sub">Premium aftercare for ceramic coatings, paint correction &amp; full detailing</div>
  <div class="callout"><p>This guide is your reference for protecting the investment we made in your vehicle's finish. Follow these steps and your detail will look showroom-fresh for far longer.</p></div>
  ${SECTIONS.map(s => `
    <h2>${s.title}</h2>
    <p>${s.intro}</p>
    <ul>${s.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
  `).join('<div class="sep"></div>')}
  <div class="foot">Valet Detailing Service LLC · (470) 412-8986 · vdsmobile.com</div>
`;

export default function VehicleCareGuide() {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-grotesk font-bold text-vapor">Customer Vehicle Care Guide</h2>
          <p className="text-sm text-vapor/50 font-mono-tech mt-1">Aftercare instructions for every service we perform — share with customers or print as a hand-out.</p>
        </div>
        <button onClick={() => printHtml('VDS Customer Vehicle Care Guide', buildPrintHtml())} className="flex items-center gap-2 text-xs font-mono-tech text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 px-4 py-2.5 rounded-sm transition-colors shrink-0">
          <Printer size={13} /> PRINT GUIDE
        </button>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          const isOpen = open === i;
          return (
            <div key={s.title} className={`glass-panel rounded-sm border transition-colors ${isOpen ? 'border-gold/30' : 'border-vapor/10'}`}>
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border ${isOpen ? 'border-gold/40 text-gold bg-gold/10' : 'border-vapor/15 text-vapor/50'}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-grotesk font-semibold ${isOpen ? 'text-gold' : 'text-vapor'}`}>{s.title}</h3>
                  <p className="text-xs text-vapor/45 font-mono-tech truncate mt-0.5">{s.intro}</p>
                </div>
                <ChevronDown size={16} className={`text-vapor/40 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pl-[4.5rem]">
                  <ul className="space-y-2">
                    {s.bullets.map((b, idx) => (
                      <li key={idx} className="text-sm text-vapor/70 leading-relaxed flex gap-2.5">
                        <span className="text-gold/60 mt-1.5 shrink-0">◆</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}