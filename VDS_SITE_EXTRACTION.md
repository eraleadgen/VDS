# VDS Mobile — Complete Site Extraction Specification

> **Purpose:** A real, rebuild-ready specification of VDS Mobile's current public-facing website. Every route, design token, configuration value, integration, and image asset is documented below from the live codebase and database.

---

## 1. SITEMAP & PAGE-BY-PAGE CONTENT

### Route Map (Public-Facing)

| Route | Page Component | Nav Label | Auth Required |
|---|---|---|---|
| `/` | `Home.jsx` | HOME | No |
| `/services` | `Services.jsx` | SERVICES | No |
| `/book` | `BookAppointment.jsx` | QUOTE & BOOK | No (guest allowed) |
| `/gallery` | `Gallery.jsx` | GALLERY | No |
| `/membership` | `VdsGold.jsx` | VDS GOLD | No |
| `/membership-signup` | `VdsGoldSignup.jsx` | (from membership CTA) | No |
| `/faq` | `FAQ.jsx` | FAQ | No |
| `/pricing` | `Pricing.jsx` | (redirects to `/book`) | No |
| `/contact` | `Contact.jsx` | (from footer/legal) | No |
| `/terms` | `Terms.jsx` | TERMS & CONDITIONS | No |
| `/privacy` | `Privacy.jsx` | PRIVACY POLICY | No |
| `/cookies` | `Cookies.jsx` | COOKIES POLICY | No |
| `/member-login` | `MemberLogin.jsx` | MEMBER LOGIN | No |
| `/member-dashboard` | `MemberDashboard.jsx` | MY ACCOUNT | Yes |
| `/member-signup` | `GoldSignup.jsx` | CREATE ACCOUNT | No |
| `/care-guide/:key` | `CareGuide.jsx` | (email link) | No |

**Note:** `/pricing` is a redirect — it sends users to `/book` (the unified quote-and-book flow). There is no standalone pricing page; pricing is embedded in the booking flow and the services page.

---

### 1.1 Home (`/`)

**Structure:** Hero → Google Reviews Carousel → Services Grid → About → FAQ Preview → Final CTA → Footer

**HERO SECTION**
- Background image: `https://media.base44.com/images/public/6a191df337222815cd0b1f5e/f695b9a84_PhotoFeb23202651724PM.jpg` (full-bleed, object-cover)
- Overlays: gradient-to-t from obsidian + gradient-to-r from obsidian/70
- Gold particle animation layer (GoldParticles component, 55 particles)
- Eyebrow: `VALET DETAILING SERVICE` (gold, mono-tech, 0.3em tracking)
- Sub-eyebrow: `METRO ATLANTA · MOBILE DETAILING` (vapor/40, mono-tech)
- Headline: `THE RITUAL OF REFLECTION.` — "REFLECTION." wrapped in GoldShimmer (animated gold gradient text)
- Subhead: `Premium mobile detailing for luxury and performance vehicles across Metro Atlanta. We come to you — no shop visit required.`
- CTAs (3 buttons):
  - `GET A QUOTE →` (border outline, links to `/book`)
  - `BOOK NOW →` (border outline, links to `/book`)
  - `◆ EXPLORE VDS GOLD` (gold-button style, links to `/membership`)
- Stats strip (4 items, below hero, separated by border-t):
  - `500+` — VEHICLES DETAILED
  - `5.0` — GOOGLE RATING
  - `4+` — YEARS IN ATLANTA
  - `100%` — SATISFACTION GUARANTEED

**GOOGLE REVIEWS CAROUSEL**
- Component: `ReviewsCarousel` — infinite marquee of cached Google reviews (from GoogleReview entity, fetched via Places API). Pauses on hover.

**SERVICES GRID** (3-column on desktop, config-driven via `featured_services` / `DEFAULT_FEATURED`)
- Section eyebrow: `WHAT WE OFFER`
- Section heading: `OUR SERVICES`
- 3 cards (see §3.4 for full card data). Each card:
  - Image (h-64, object-cover, hover scale-105)
  - Title, subtitle (mono-tech)
  - Spec list with `◆` gold bullet markers
  - Hover overlay: shows "INCLUDED IN VDS GOLD MEMBERSHIP" (with "From $250/mo per vehicle") or "Not included in VDS Gold" + "BOOK NOW" link
  - Buttons: `BOOK NOW` (vapor bg → gold on hover) + arrow link to `/services`
- Cards alternate: Full Detail, Ceramic Coatings, Paint Correction

**ABOUT SECTION**
- Eyebrow: `WHO WE ARE`
- Heading: `ABOUT VALET DETAILING SERVICE` (two lines)
- Body: `Premium mobile detailing for luxury and performance vehicles across Metro Atlanta. We come to you — delivering concierge-level care at your home, office, or wherever your vehicle rests.`
- 4 feature items (gold ◆ bullets):
  1. **Luxury & Performance Specialists** — "We're not a high-volume car wash. Our tools, techniques, and professional-grade products are specifically chosen for Porsche, Rolls Royce, and Mercedes-Benz."
  2. **Meticulous, Unrushed Craftsmanship** — "Quality over speed. Every vehicle receives our full attention, ensuring a flawless result without cutting corners."
  3. **Professional, Insured & Reliable** — "Registered LLC with comprehensive business insurance. Clear communication, on-time arrivals, and complete peace of mind."
  4. **Long-Term Client Relationships** — "Our goal is to be your trusted partner for car care — delivering consistent, exceptional results every single time."
- Image: `https://media.base44.com/images/public/6a191df337222815cd0b1f5e/36815783a_PorscheGoogleReview.webp` (aspect 3/4)
- Floating glass panel overlay with 5 gold stars + review quote: `"VDS Mobile does an amazing job, I highly recommend. They will exceed your expectations every time."` — VERIFIED GOOGLE REVIEW

**FAQ PREVIEW** (3 items, accordion, see §1.6 for full FAQ)
- Eyebrow: `STILL NOT SURE?`
- Heading: `FREQUENTLY ASKED QUESTIONS`
- Link: `VIEW ALL FAQS →` to `/faq`

**FINAL CTA SECTION**
- Background: radial gold gradients on obsidian with `goldPulse` animation
- Eyebrow: `METRO ATLANTA · ON-SITE SERVICE`
- Heading: `YOUR VEHICLE DESERVES THE BEST.`
- Buttons: `BOOK YOUR DETAIL` (vapor→gold) + `◆ JOIN VDS GOLD` (gold-button)

---

### 1.2 Services (`/services`)

**Structure:** Page Header → VDS Gold Callout → Service Modules → CTA → Footer

**PAGE HEADER**
- Eyebrow: `WHAT WE OFFER`
- Heading: `OUR SERVICES`
- Subhead: `Professional-grade detailing for luxury and performance vehicles. Every service uses professional products and paint-safe techniques perfected over 4+ years.`

**VDS GOLD CALLOUT** — `GoldPromoCard` component (membership teaser)

**SERVICE MODULES** — Alternating left/right image+content layout (config-driven, same 3 featured cards as Home)
- Each module:
  - Image side (alternates left/right on desktop)
  - "◆ INCLUDED IN VDS GOLD" badge (if applicable)
  - Service key label (mono-tech, gold, e.g. `FULL_DETAIL`)
  - Title (3xl, grotesk bold)
  - Subtitle (mono-tech, vapor/40)
  - Description (from `config.services[].description`)
  - "// TECHNICAL STACK" spec box (bordered, monospaced checklist with gold checkmarks)
  - Buttons: `BOOK NOW` (vapor→gold) + `GET QUOTE` (outline)

**CTA SECTION**
- Eyebrow: `GET STARTED TODAY`
- Heading: `NOT SURE WHICH SERVICE? WE'LL HELP.`
- Body: `Call or text us. We'll assess your vehicle's needs and recommend the right service — no pressure, no upsells you don't need.`
- Buttons: `BOOK NOW` + `TEXT US` (sms: link to business phone)

---

### 1.3 Quote & Book (`/book`)

**Structure:** Guest Gate → Multi-step booking form with live quote sidebar

**GUEST GATE** (shown first if not logged in)
- Eyebrow: `BOOK YOUR DETAIL`
- Heading: `GET AN INSTANT QUOTE`
- Subhead: `Build a custom quote & schedule in one flow. Metro Atlanta, GA · We come to you.`
- Options:
  - **MEMBER ACCOUNT** box: `SIGN IN` (→ `/member-login`) + `CREATE ACCOUNT` (→ `/gold-signup`)
  - Divider: `OR`
  - `CONTINUE AS GUEST →` button

**BOOKING FORM** (5 steps, left 2/3; sticky quote summary right 1/3)
- Page header: `QUOTE & BOOK` (GoldShimmer), subhead: `Build your custom quote and schedule in one place. Pricing adjusts to your vehicle size, condition, and add-ons.`
- **Step 1 — YOUR VEHICLE:** Saved vehicle picker (members) or Year/Make/Model selector (guests) + optional color field
- **Step 2 — VEHICLE CONDITION:** Condition selector (Light/Moderate/Heavy Wear — from `pricing_rules.condition_multipliers`)
- **Step 3 — CHOOSE YOUR SERVICES:** ServicePicker (detail services, add-ons, consultations) + PaintProtectionSelector (if a detail service is selected — applies 20% discount if PPF/ceramic already present)
- **Step 4 — SCHEDULE:** BookingCalendar (date picker + time slots, fetches availability via `getCalendarAvailability` function)
- **Step 5 — YOUR DETAILS:** First name*, last name, phone*, email, service address* (saved addresses for members), notes, SMS consent checkbox
- **Quote Summary sidebar:** Live computed quote (line items, condition multiplier, paint protection discount, total, estimated duration). Updates in real-time.

**SUBMISSION:** Calls `submitBooking` function → creates Job entity, sends booking notifications. Success screen: `Appointment Requested!` with date/time confirmation.

---

### 1.4 Gallery (`/gallery`)

**Structure:** Header → Filter Bar → Photo Grid → CTA → Lightbox

**HEADER**
- Eyebrow: `OUR WORK`
- Heading: `GALLERY`
- Subhead: `Real results on real vehicles across Metro Atlanta. Every photo is an actual client vehicle serviced by VDS Mobile.`

**FILTERS** (button bar): `ALL`, `FULL DETAIL`, `EXTERIOR DETAIL`, `CERAMIC SEALANT`, `CERAMIC COATING`, `PAINT CORRECTION`

**PHOTO GRID** — 23 photos total (see §5 for full manifest). 3-column desktop, 2-column tablet, 1-column mobile. Each tile: 4:3 aspect, hover overlay with service tags + service name. Click opens lightbox.

**CTA:** `READY FOR YOUR VEHICLE?` / `BOOK YOUR DETAIL` / `TEXT FOR A QUOTE` (sms:+14704128986)

**LIGHTBOX:** Full-screen obsidian/95 overlay, image centered, tags + service name below.

---

### 1.5 VDS Gold Membership (`/membership`)

**Structure:** Hero → Spec Split (Exterior/Interior) → Value Calculator → How It Works → Sign Up Card → Footer

**HERO**
- Background: layered radial gold gradients + goldPulse animation + 60 gold particles
- Eyebrow: `INTRODUCING`
- Headline: `VDS GOLD` ("GOLD" in GoldShimmer, 9xl on desktop)
- Subhead: `The premium monthly membership that keeps your vehicle in a permanent state of perfection.`
- Spec line: `UNLIMITED EXTERIOR DETAILS + 1 INTERIOR DETAIL / MONTH + CERAMIC SEALANT EVERY DETAIL`
- Pricing display: `$250 SEDAN / COUPE` / `$300 TRUCK / SUV` — `PER VEHICLE / MONTH` — `vs. $700+ retail value`
- CTA: `JOIN THE CIRCLE →` (gold button → `/membership-signup`)

**SPEC SPLIT** (2-column)
- Eyebrow: `THE TECHNICAL STACK` / Heading: `WHAT'S INCLUDED`
- **EXTERIOR DETAIL** (unlimited/month):
  - HAND WASH — Rims & Wheel Barrels
  - HAND WASH — All Exterior Panels
  - DOOR JAMBS — Full Clean & Dress
  - 1-MONTH CERAMIC SEALANT — Applied
  - WINDOWS — Exterior Glass Clean
  - TIRES — Dress & Shine
  - UNLIMITED frequency per month
  - Callout box: `◆ UNLIMITED ACCESS` — "Schedule as many exterior details as you need each month. No caps, no limits."
- **INTERIOR DETAIL** (1×/month):
  - STEAM CLEAN — All Surfaces & Crevices
  - DEEP VACUUM — Every Inch of Interior
  - GLASS — Interior Windows Cleaned
  - DASHBOARD — All Surfaces Wiped
  - DOOR PANELS — Full Wipe-Down
  - SEATS — Every Surface & Stitch
  - FLOORS & MATS — Deep Cleaned
  - 1× PER MONTH — Included in Membership
  - Callout box: `◆ STEAM TECHNOLOGY` — "High-temperature steam penetrates every crevice for a truly sanitized, showroom-quality interior."

**VALUE CALCULATOR** (glass panel, line items)
- Exterior Detail (×4/mo) — $400+
- Interior Deep Clean (×1/mo) — $125+
- Ceramic Sealant (×4/mo) — $200+
- Total Retail Value — $700+ (strikethrough)
- VDS GOLD — SEDAN/COUPE — $250 (gold, bold)
- VDS GOLD — TRUCK/SUV — $300 (gold, bold)
- Footer: `SAVE $400+ EVERY MONTH · PRIORITY SCHEDULING · CANCEL ANYTIME`
- CTA: `JOIN THE CIRCLE TODAY →`

**HOW IT WORKS** (4-step grid)
1. `01 CREATE ACCOUNT` — "Sign up online in minutes. Add your vehicle(s), set your preferences, and get instant access to your member portal."
2. `02 SCHEDULE` — "Book your exterior details any time — as many as you need throughout the month."
3. `03 WE COME TO YOU` — "Our team arrives at your location with professional equipment and premium detailing products."
4. `04 STAY PERFECT` — "Your vehicle remains in a permanent state of immaculate perfection, month after month."

**SIGN UP CARD**
- Badge: `◆ VDS GOLD MEMBERSHIP`
- Heading: `JOIN THE CIRCLE.` ("THE CIRCLE." in GoldShimmer)
- Body: "Stop thinking about your car's condition. With VDS Gold, your vehicle is always appointment-ready, always immaculate. Starting at $250/mo — unlimited exterior details, 1 interior detail monthly, ceramic sealant included every detail."
- Membership card (glass panel):
  - `MONTHLY MEMBERSHIP` / `VDS Gold` / `$250 sedan/coupe` / `$300 truck/suv` / `/mo per vehicle`
  - Benefits checklist: Unlimited Exterior Details, 1× Monthly Interior Detail, Ceramic Sealant with Every Detail, Steam Clean & Deep Vacuum, Interior Glass & All Surfaces, Hand Wash Rims & All Panels, Door Jambs Cleaned, Priority Scheduling, Cancel Anytime
  - CTA: `ENROLL NOW`
  - Footer: `NO CONTRACTS · CANCEL ANYTIME · METRO ATLANTA`

---

### 1.6 FAQ (`/faq`)

**Structure:** Header → 4 Category Sections → CTA

**HEADER**
- Eyebrow: `STILL NOT SURE?`
- Heading: `FREQUENTLY ASKED`
- Subhead: `Everything you need to know about our services, booking process, and VDS Gold membership.`

**CATEGORY 1 — BOOKING & SCHEDULING**
1. **Do I need to be home during the service?** — "No. As long as we have access to the vehicle and the keys are arranged ahead of time, you don't need to be present. Many of our clients are at work or away while we service their vehicle."
2. **What do you need from me to get started?** — "We only need access to the vehicle and adequate space to work around the car. We bring all professional equipment and supplies — no hookups or power needed in most cases."
3. **How long does a detail usually take?** — "Service time depends on the package and vehicle condition. Most appointments range from 2–5 hours. We'll give you an accurate time estimate before your service begins."
4. **What is your cancellation or rescheduling policy?** — "We ask for at least 24 hours' notice for cancellations or reschedules. This allows us to provide availability to other clients. Failure to provide sufficient notice may result in a cancellation fee."

**CATEGORY 2 — OUR SERVICES**
1. **Is mobile detailing safe for high-end vehicles?** — "Absolutely. We specialize in luxury and performance vehicles and use professional-grade products, tools, and paint-safe techniques to ensure the highest level of care. We work on Porsche, Rolls Royce, Mercedes-Benz, and other exotics regularly."
2. **What products do you use?** — "We exclusively use GTechniq professional detailing and protection products — the same brand trusted by luxury OEM manufacturers and professional detailers worldwide."
3. **Do you offer paint protection film (PPF)?** — "Currently our protection offerings focus on ceramic coatings using GTechniq's professional range, from 3-month maintenance coatings to 7-year permanent protection. Contact us for specific recommendations."
4. **What's the difference between a full detail and VDS Gold?** — "A full detail is a one-time comprehensive service. VDS Gold is our monthly membership — $250/mo for sedans/coupes, $300/mo for trucks & 3-row vehicles. It gives you unlimited exterior details and 1 interior deep clean every month, so your car stays perpetually perfect."

**CATEGORY 3 — VDS GOLD MEMBERSHIP**
1. **What is VDS Gold?** — "VDS Gold is our monthly membership program — $250/mo for sedans/coupes and $300/mo for trucks & 3-row vehicles. Members receive unlimited exterior details (hand wash on rims, all panels, door jambs, and 1-month ceramic sealant) plus 1 full interior detail per month (steam clean, deep vacuum, glass, every surface and crevice)."
2. **Can I cancel VDS Gold anytime?** — "Yes. VDS Gold is a month-to-month membership with no long-term contracts. You can cancel anytime."
3. **Can I add multiple vehicles to VDS Gold?** — "Yes. The membership is priced at $250/mo (sedans/coupes) or $300/mo (trucks/3-row vehicles) per vehicle, so you can enroll as many vehicles as you need."
4. **How do I schedule my VDS Gold appointments?** — "Log in to your Member Dashboard and use the VDS Gold Booking section to schedule your exterior or interior detail. As a Gold member, you receive priority scheduling — book directly through your portal anytime."

**CATEGORY 4 — PAYMENT & POLICY**
1. **What forms of payment do you accept?** — "We accept Cash, Zelle, Venmo, Cash App, and Debit/Credit Card via Invoice. Payment is collected after the service is completed unless otherwise arranged."
2. **Are you insured?** — "Yes. Valet Detailing Service LLC is fully insured and a registered LLC in Georgia. You can have complete peace of mind when we service your vehicle."
3. **What if I'm not satisfied with the service?** — "Your satisfaction is our priority. Upon completion, we encourage you to inspect our work. If you're not satisfied, notify our on-site detailer immediately and we'll address and rectify any issue before we leave."
4. **Can you take photos of my vehicle?** — "We reserve the right to capture before/during/after photos for quality control and marketing. Images may appear on our website or social media. No personally identifiable information will be associated without your explicit consent."

**CTA:** `STILL HAVE QUESTIONS?` / `CALL / TEXT (470) 412-8986` / `◆ BOOK A SERVICE`

---

### 1.7 Terms & Conditions (`/terms`)

18 numbered sections, all templated from BusinessConfig legal identity fields. Key sections:
- §1 Services — performed at customer location in Metro Atlanta
- §2 SMS Messaging Terms — consent, STOP/HELP, frequency varies
- §4 Pricing and Payment — quotes valid 7 days, accepts Cash/Zelle/Venmo/Cash App/Card via Invoice
- §5 Vehicle Condition Assessment — pricing adjustable if condition differs
- §6 Cancellation — 24 hours notice required
- §8 Limitation of Liability — not liable for pre-existing damage, cosmetic services only
- §11 VDS Gold Membership — $250/mo sedan/coupe, $300/mo truck/SUV, billed via Stripe, per-vehicle
- §12 VDS Gold Cancellation & Refund — full refund only within 48hrs of start AND no services used
- §15 Partner Network & Referral Incentives — $30 initial detail (once per client), $100 ceramic coating, $100 paint correction
- §16 Governing Law — State of Georgia
- Last updated: July 23, 2026

### 1.8 Privacy Policy (`/privacy`)

11 numbered sections. Key: Information collected (name, phone, address), SMS/Text policy (consent, no sharing), data security, children's privacy (18+), cookie tracking, mobile information sharing statement. Last updated: July 16, 2026.

### 1.9 Cookies Policy (`/cookies`)

9 numbered sections. Covers: what cookies are, how used (preferences, analytics, SMS consent), types (essential, preference, analytics, SMS consent), A2P 10DLC compliance, third-party (Google Analytics, Stripe), managing/deleting. Last updated: July 16, 2026.

---

## 2. DESIGN TOKENS

### 2.1 Brand Colors (exact hex values)

| Token | Hex | RGB (for CSS) | Usage |
|---|---|---|---|
| **Gold** (primary) | `#D4AF37` | `212 175 55` | Primary accent, CTAs, headings highlights, borders, bullets |
| **Gold Light** | `#F5E17A` | `245 225 122` | Gold shimmer gradient highlight, hover states |
| **Gold Dark** | `#A08020` | `160 128 32` | Gold shimmer gradient shadow |
| **Obsidian** (background) | `#0A0B0D` | `10 11 13` | Page background, darkest base |
| **Asphalt** (surface) | `#14161A` | `20 22 26` | Cards, input fields, secondary surfaces |
| **Vapor** (text) | `#E2E8F0` | `226 232 240` | Primary text color, light gray-blue |

**BusinessConfig brand_colors** (live database):
```json
{
  "primary": "#D4AF37",
  "secondary": "#F5E17A",
  "background": "#0A0B0D",
  "surface": "#14161A",
  "text": "#E2E8F0"
}
```

**Additional CSS variables** (from `index.css`):
- `--background: 0 0% 4%` (HSL — near-black, slightly different from obsidian)
- `--foreground: 214 32% 91%` (HSL — light blue-gray)
- `--card: 220 13% 8%` / `--card-foreground: 214 32% 91%`
- `--border: 220 13% 15%`
- `--destructive: 0 84% 60%` (red for errors)
- `--radius: 0.25rem` (sharp corners — 4px)

### 2.2 Fonts

| Role | Font Family | Weights | Usage |
|---|---|---|---|
| **Primary headings** | Space Grotesk | 300–700 | All h1/h2/h3/h4, button labels (via `font-grotesk`) |
| **Mono/Technical** | Space Mono | 400, 700 | Eyebrows, labels, specs, nav links, CTAs (via `font-mono-tech`) |
| **Body text** | Space Grotesk | 400–500 | Paragraphs (inherits from body) |

**Google Fonts import** (top of `index.css`):
```
Space Grotesk: 300;400;500;600;700
Space Mono: 400;700
```

> Note: `index.css` also imports Sora, Fraunces, Inter, and JetBrains Mono — these are used by the ERA Systems marketing site (separate tenant), NOT by VDS. VDS uses only Space Grotesk + Space Mono.

### 2.3 Layout & Spacing Conventions

- **Max content width:** `max-w-7xl` (1280px) for all main content sections
- **Legal pages max width:** `max-w-4xl` (896px)
- **Horizontal padding:** `px-6` (24px) mobile, `lg:px-8` (32px) on some pages
- **Section vertical padding:** `py-16 md:py-24` (64px / 96px) — consistent across all pages
- **Card gaps:** `gap-4` (16px) mobile, `md:gap-0.5` (2px — tight grid with `bg-vapor/5` as separator) on desktop for service/gallery grids
- **Border radius:** `rounded-sm` (2px) — intentionally sharp/minimal throughout
- **Border color:** `border-vapor/5` to `border-vapor/20` for subtle dividers; `border-gold/20` to `border-gold/40` for accents
- **Sticky header:** Navbar is `fixed top-0 z-50`, transitions from transparent to `glass-header` (obsidian/85 + blur-24) on scroll past 40px
- **Glass panel:** `bg-asphalt/70 + backdrop-blur-20 + border-gold/12 + shadow` — used for floating cards, quote summaries
- **Button styles:**
  - Primary: `bg-vapor text-obsidian hover:bg-gold` (light button that turns gold on hover)
  - Gold: `vds-gold-btn` class — gold border + gold text + goldPulse animation, fills gold on hover
  - Outline: `border border-vapor/40 text-vapor hover:border-vapor hover:bg-vapor/5`
- **Typography scale:** Hero h1 = `text-5xl md:text-7xl lg:text-8xl`, Section h2 = `text-4xl md:text-5xl`, Card h3 = `text-xl` to `text-3xl`
- **Tracking:** Eyebrows/labels use `tracking-[0.3em]` to `tracking-widest`; headings use `tracking-tight`

### 2.4 Key Animations (CSS keyframes in `index.css`)

- `goldShine` — 6s linear infinite gold gradient sweep on text (GoldShimmer component)
- `goldPulse` — 2s ease-in-out infinite box-shadow pulse on gold buttons/elements
- `shimmerText` — 4s linear infinite for gold shimmer text variant
- `marquee` — infinite reviews carousel scroll
- `vdsSpin` — 1.1s linear infinite loading spinner

---

## 3. COMPLETE LIVE BUSINESSCONFIG (VDS)

> Extracted from the live database (business_id: `vds`, is_active: true). This is the actual data driving the site today.

### 3.1 Business Identity

| Field | Value |
|---|---|
| business_id | `vds` |
| business_name | `VDS Mobile` |
| business_short_name | `VDS Mobile` |
| legal_name | `Valet Detailing Service LLC` |
| legal_jurisdiction | `Georgia` |
| tagline | `Metro Atlanta Mobile Detailing Concierge` |
| business_phone | `(470) 944-6485` |
| business_email | `Valetdetailingservice@gmail.com` |
| business_address | `Metro Atlanta, GA` |
| address_locality | `Alpharetta` |
| address_region | `GA` |
| address_country | `US` |
| timezone | `America/New_York` |
| currency | `USD` |
| plan_tier | `enterprise` |

### 3.2 Service Areas

```
["Metro Atlanta"]
```

### 3.3 Business Hours

| Day | Open | Close | Status |
|---|---|---|---|
| Monday | 09:00 | 17:00 | Open |
| Tuesday | 09:00 | 17:00 | Open |
| Wednesday | 09:00 | 17:00 | Open |
| Thursday | 09:00 | 17:00 | Open |
| Friday | 09:00 | 17:00 | Open |
| Saturday | — | — | Closed |
| Sunday | — | — | Closed |

### 3.4 Scheduling Rules

| Rule | Value |
|---|---|
| booking_buffer_hours | 24 |
| min_notice_hours | 24 |
| cancellation_hours | 48 |
| slot_interval_minutes | 60 |
| max_bookings_per_day | 4 |

### 3.5 Vehicle Classifications

| Key | Label |
|---|---|
| coupe | Coupe |
| sedan | Sedan |
| hatchback | Hatchback |
| mid_size_suv | Mid Size SUV |
| truck_3_row_suv | Truck / 3 Row SUV |
| other | Other |

### 3.6 Pricing Groups

| Key | Label | Stripe Price ID |
|---|---|---|
| sedan_coupe | Sedan / Coupe | `price_1TuJVK2MUlDjgwKfac7ADwFt` |
| truck_suv | Truck / SUV | `price_1TuJVK2MUlDjgwKfECnrClRv` |

### 3.7 Classification → Pricing Group Mapping

| Classification | Pricing Group |
|---|---|
| coupe | sedan_coupe |
| sedan | sedan_coupe |
| hatchback | sedan_coupe |
| mid_size_suv | truck_suv |
| truck_3_row_suv | truck_suv |
| other | sedan_coupe |

### 3.8 Condition Multipliers (Pricing Rules)

| Key | Label | Multiplier | Duration Add (min) |
|---|---|---|---|
| light | Light Wear | 1.0 | 0 |
| moderate | Moderate Wear | 1.2 | 30 |
| heavy | Heavy Wear | 1.4 | 60 |

### 3.9 Complete Service Catalog

#### Detail Services

| Key | Label | Description | Category | Consult? |
|---|---|---|---|---|
| `full_detail` | Full Detail | Interior & exterior restoration | detail | No |
| `exterior_detail` | Exterior Detail | Hand wash, rims, sealant | detail | No |
| `interior_detail` | Interior Detail | Steam clean, deep vacuum | detail | No |

**Full Detail — Pricing by classification:**

| Classification | Price | Duration |
|---|---|---|
| Coupe | $150 | 120 min |
| Sedan | $175 | 120 min |
| Hatchback | $150 | 120 min |
| Mid Size SUV | $200 | 150 min |
| Truck / 3 Row SUV | $250 | 150 min |

**Exterior Detail — Pricing by group:**

| Pricing Group | Price | Duration |
|---|---|---|
| Sedan / Coupe | $100 | 60 min |
| Truck / SUV | $115 | 60 min |

**Interior Detail — Pricing by group:**

| Pricing Group | Price | Duration |
|---|---|---|
| Sedan / Coupe | $120 | 90 min |
| Truck / SUV | $150 | 90 min |

#### Add-On Services

| Key | Label | Description | Sedan/Coupe | Truck/SUV | Duration |
|---|---|---|---|---|---|
| `ceramic_sealant` | Ceramic Sealant (3 Month) | Optional add-on sealant | $50 | $50 | 30/45 min |
| `engine_bay` | Engine Bay Detail | Optional add-on | $50 | $50 | 30 min |
| `headlight_restoration` | Headlight Restoration | Optional add-on | $100 | $100 | 60 min |
| `pet_hair_removal` | Pet Hair Removal | — | $50 | $50 | 30 min |

#### Ceramic Coating Services (Consultation Required)

| Key | Label | Price | Duration |
|---|---|---|---|
| `ceramic_coating_2yr` | Ceramic Coating | $900 | 30 min |
| `ceramic_coating_3yr` | Ceramic Coating (3 Year) | $1,000 | 30 min |
| `ceramic_coating_5yr` | Ceramic Coating (5 Year) | $1,300 | 30 min |
| `ceramic_coating_7yr` | Ceramic Coating (7 Year) | $1,500 | 30 min |

#### Paint Correction Services (Consultation Required)

| Key | Label | Price | Duration |
|---|---|---|---|
| `paint_correction_stage1` | Paint Correction | $600 | 30 min |
| `paint_correction_stage2` | Paint Correction (Stage 2) | $900 | 30 min |
| `paint_correction_stage3` | Paint Correction (Stage 3) | $1,100 | 30 min |

#### Membership

| Key | Label | Description | Category |
|---|---|---|---|
| `vds_gold` | VDS Gold Membership | Monthly membership per vehicle | membership |

### 3.10 Membership Plans

**VDS Gold Membership**
- Key: `vds_gold`
- Label: `VDS Gold Membership`
- Short Label: `VDS Gold`
- Stripe Product ID: `prod_Uu7j9nsGQPDPtW`
- Benefits:
  - Unlimited exterior details
  - 1 interior deep clean per month
  - Ceramic sealant every visit
- Pricing by group:

| Pricing Group | Monthly Price | Stripe Price ID |
|---|---|---|
| sedan_coupe | $250/mo | `price_1TuJVK2MUlDjgwKfac7ADwFt` |
| truck_suv | $300/mo | `price_1TuJVK2MUlDjgwKfECnrClRv` |

### 3.11 Featured Services (Marketing Cards)

> `featured_services` is empty in the live config — the site falls back to `DEFAULT_FEATURED` (hardcoded in `src/lib/featuredServices.js`):

| # | Service Key | Title | Subtitle | Image | Specs | In Gold? |
|---|---|---|---|---|---|---|
| 1 | `full_detail` | FULL DETAIL | Interior & Exterior Restoration | `...322538cef_IMG_3881.jpg` | Interior & Exterior Restoration; Odor & Stain Removal; Professional Products; Ceramic Sealant | Yes |
| 2 | `ceramic_coating_2yr` | CERAMIC COATINGS | Long-Term Paint Protection | `...ceramic-coating-being-applied.webp` | 2–7 Year Coatings; Professional-Grade Coatings; Hydrophobic Surface Protection; UV & Chemical Resistance | No |
| 3 | `paint_correction_stage1` | PAINT CORRECTION | Swirl & Scratch Removal | `...ChatGPTImageFeb17.png` | Swirl Mark Elimination; Scratch & Buffer Trail Removal; Flawless Paint Quality; Coating Recommended | No |

### 3.12 Feature Flags

| Flag | Value |
|---|---|
| web_chat_enabled | true |
| instant_quote_enabled | true |
| gold_checkout_enabled | true |
| twilio_sms_enabled | true |

### 3.13 Automation Settings

| Setting | Value |
|---|---|
| welcome_email | true |
| reminder_email | true |
| review_request_email | true |
| reminder_sms | true |
| review_request_sms | true |

### 3.14 Concierge (AI Chat Persona)

| Field | Value |
|---|---|
| name | Valerie |
| persona | Warm, professional, and concise luxury automotive concierge. Helps clients book the right service, answers pricing questions, and guides them toward VDS Gold membership when it benefits them. |
| business_summary | Valet Detailing Service (VDS Mobile) is a premium mobile detailing business serving Metro Atlanta, specializing in luxury and performance vehicles. Services include full details, exterior details, ceramic coatings, and paint correction, plus the VDS Gold recurring membership that covers periodic maintenance details. |
| greeting | Hi! I'm Valerie, your detailing concierge. How can I help with your vehicle today? |

### 3.15 Website Links

| Link | URL |
|---|---|
| booking_url | `https://vdsmobile.com/book` |
| gold_signup_url | `https://vdsmobile.com/vds-gold` |
| gallery_url | `https://vdsmobile.com/gallery` |
| google_review_url | `https://g.page/r/Ccmdnzs_a305EBM/review` |

### 3.16 Social Links

| Platform | URL |
|---|---|
| Instagram | `https://www.instagram.com/vdsmobile/` |
| TikTok | `https://www.tiktok.com/@vdsmobile` |

### 3.17 Referral Program

| Field | Value |
|---|---|
| enabled | false |
| credit_amount | 0 |
| incentives | null |

### 3.18 SEO Metadata (per route)

| Route | Title | Description |
|---|---|---|
| `/` | VDS Mobile Detailing \| Mobile Car Detailing in Metro Atlanta | VDS Mobile brings premium mobile auto detailing to your home or office across Metro Atlanta. Ceramic coatings, paint correction, interior & exterior details, and the VDS Gold unlimited membership. |
| `/services` | Detailing Services \| VDS Mobile — Metro Atlanta | Full mobile detailing services in Metro Atlanta: interior detail, exterior detail, full detail, ceramic coating, paint correction, and headlight restoration — we come to you. |
| `/pricing` | Pricing & Instant Quote \| VDS Mobile Detailing | Get an instant custom quote for mobile car detailing in Metro Atlanta. Transparent pricing by vehicle size, condition, and add-ons, plus VDS Gold membership plans. |
| `/book` | Book a Mobile Detail \| VDS Mobile — Metro Atlanta | Schedule your mobile detailing appointment in Metro Atlanta. Choose your service, date, and time and a VDS specialist comes to your home or office. |
| `/membership` | VDS Gold Membership \| Unlimited Mobile Detailing | VDS Gold is Metro Atlanta's unlimited mobile detailing membership — unlimited exterior details, one interior detail per month, and ceramic sealant on every detail. $250/mo for sedans & coupes, $300/mo for trucks & 3-row SUVs. Cancel anytime. |

### 3.19 Dictionary (White-Label Vocabulary)

| Key | Value |
|---|---|
| item_noun | Vehicle |
| item_plural | Vehicles |
| item_category_noun | Classification |
| item_category_label | Vehicle Classification |
| service_noun | Detail |
| service_verb | detail |
| service_area_noun | Service Area |
| before_photo_label | Before |
| after_photo_label | After |
| appointment_noun | Appointment |

---

## 4. THIRD-PARTY INTEGRATIONS

### 4.1 Stripe (Payments — Live Mode)

**Status:** Claimed, Live Mode. Accepting real payments.
**Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (live); `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_PUBLISHABLE_KEY`, `STRIPE_TEST_WEBHOOK_SECRET` (test)

**Stripe Products (live):**

| Product | Stripe Product ID | Pricing |
|---|---|---|
| VDS Gold Membership | `prod_Uu7j9nsGQPDPtW` | $250/mo (sedan/coupe), $300/mo (truck/SUV) |
| VDS Gold (Sedan/Coupe) | `prod_UgMATc8hBTZCwl` | $250/mo |
| VDS Gold (Truck/SUV) | `prod_UgMBcdSUSJsjTo` | $300/mo |
| ERA Basic | `prod_V4vquWlpfB5fwz` | $750 one-time + $199/mo |
| ERA Foundation | `prod_V4vqBpo9Jf9hqe` | $1,200 one-time + $499/mo |
| Ad Management | `prod_V4vqH4UlHUsVpF` | $500/mo |

**What it does:**
- VDS Gold membership checkout (recurring subscriptions) — `createGoldCheckoutSession` function
- Membership cancellation — `cancelGoldSubscription` function
- Gold status checking — `checkGoldStatus` function
- Stripe invoice creation (one-time services) — `createStripeInvoice` function
- Webhook handler — `stripe-webhook` function (syncs subscription status to `VehicleSubscription` and `BusinessConfig`)

**Rebuild vs Reconnect:** Reconnect with new Stripe API keys. The webhook endpoint URL must be `https://vds-mobile.base44.app/functions/stripe-webhook` (or the new platform's equivalent). All product/price IDs are stored in BusinessConfig and can be re-created or re-referenced.

---

### 4.2 Google Calendar (Appointment Sync)

**Status:** Authorized (shared connector). Scopes: `calendar`, `email`. Supports webhooks (events).
**Connector type:** Shared — platform-level OAuth (builder's account).

**What it does:**
- `scheduler` function — creates/updates Google Calendar events for appointments, prevents double-booking
- `getCalendarAvailability` function — checks calendar for available time slots
- `rescheduleAppointment` function — updates calendar events on reschedule
- `cancelAppointment` function — removes/cancels calendar events

**Rebuild vs Reconnect:** Reconnect — authorize a new Google Calendar OAuth connection. The integration logic (event creation, availability checking) lives in backend functions and would need to be re-implemented on the new platform using the Google Calendar API.

---

### 4.3 Twilio (SMS)

**Secrets:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
**From number:** `+14704128986` (also used as the public SMS/phone number across the site)

**What it does:**
- `sendSms` function — sends SMS messages
- `valerie` function — AI concierge SMS conversation handler (inbound/outbound SMS)
- `valerieTools` function — tool-calling layer for the SMS concierge
- `appointmentReminders` function — 24-hour email + 1-hour SMS reminders
- `sendBookingNotifications` function — booking confirmation SMS
- `sendCancellationNotification` function — cancellation SMS
- `communicationRulesEngine` function — evaluates SMS consent, opt-outs, suppression rules before sending
- `ConversationHistory` entity — stores all SMS conversation history

**Rebuild vs Reconnect:** Reconnect with new Twilio credentials (account SID, auth token, phone number). The phone number `+14704128986` is the business's Twilio number and should be ported or a new one provisioned. All SMS logic is in backend functions.

---

### 4.4 Resend (Email)

**Secrets:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
**Additional:** `ERA_NOTIFICATION_EMAIL` (internal notification recipient)

**What it does:**
- `sendCustomerEmail` function — general customer email sending
- `sendMemberWelcomeEmail` function — welcome email to new members
- `sendContractorWelcomeEmail` function — specialist invite emails
- `sendSpecialistInvite` / `sendPartnerInvite` functions — invitation emails
- `appointmentReminders` function — 24-hour email reminders
- Email domain verification for custom sender domains (`tenantSettings` function)

**Rebuild vs Reconnect:** Reconnect with new Resend API key. The from-email and sending domain need to be re-verified. All email templates and logic are in backend functions.

---

### 4.5 AI Chat Widget (Web Chat / Valerie)

**Backend function:** `webChat`
**AI model:** OpenAI (secret: `OpenAI_Valerie`)
**Persona:** Configured in BusinessConfig.concierge (see §3.14)

**What it does:**
- Floating chat widget (`ChatWidget` component) — bottom-right corner
- Shows on storefront pages only (hidden on admin/specialist/partner/ERA portal pages)
- Gated by `feature_flags.web_chat_enabled`
- Uses `conversation_id` (sessionStorage) for conversation continuity
- Calls `webChat` backend function with message + conversation_id
- Can generate inline quote cards (QuoteCard component) within chat
- Quick-reply suggestions (ChatQuickReplies component)
- Concierge greeting from BusinessConfig

**Rebuild vs Reconnect:** Reconnect with new OpenAI API key. The chat UI component, conversation management, and backend function logic need reimplementation. The persona/greeting/business_summary are all in BusinessConfig and portable.

---

### 4.6 Google Places API (Reviews)

**Secret:** `GOOGLE_PLACES_API_KEY`
**Additional:** `GOOGLE_MAPS_API_KEY`

**What it does:**
- `getGoogleReviews` function — fetches business reviews via Places API, caches them in `GoogleReview` entity
- `ReviewsCarousel` component (Home page) — displays cached reviews as infinite marquee
- Google review URL: `https://g.page/r/Ccmdnzs_a305EBM/review`

**Rebuild vs Reconnect:** Reconnect with new Google Places API key. The Place ID (`Ccmdnzs_a305EBM`) is tied to the Google Business Profile and stays the same. Review caching logic is in the backend function.

---

### 4.7 Retell AI — NOT a live VDS integration (cross-project artifact)

> **Correction:** This is NOT a VDS integration. The `RETELL_API_KEY` secret exists in this workspace but is a cross-project artifact, not part of VDS's live operations. VDS has no voice agent in production.

**What the code actually shows:**
- The `valerie` function (VDS's concierge) is **SMS-only** — Twilio inbound SMS + OpenAI LLM. Its header comment explicitly states "SMS-only (no voice/caller ID)." There is no Retell, OpenAI Realtime, or Twilio Voice code in any VDS function.
- The `RETELL_API_KEY` is used in exactly one place: `checkGoldStatus/entry.ts`, where it serves as a **shared secret for authenticating inbound calls** from an external Retell agent. The function comment says "Used by Retell AI — never calculates pricing itself." This means an external Retell-based voice agent (a separate project) calls this function to check VDS Gold membership status — it is not VDS calling out to Retell.
- The `AILog` entity has a `call_id` field described as "Retell call ID," but **no active code populates it**. The only writes to AILog come from `valerieTools` (the SMS concierge's tool layer), which logs SMS-based actions (quote creation, specialist follow-ups) — not voice calls.
- The `scheduler/entry.ts` contains a comment noting "The previous Retell-API-key + caller-supplied-phone-match path was removed" — Retell auth was previously used in the scheduler but was explicitly stripped out.

**Conclusion:** The `RETELL_API_KEY` is leftover from testing a separate AI Caller project (Retell + Claude) inside the same Base44 workspace. VDS's own voice agent — architected around OpenAI Realtime API + Twilio Voice — is not yet implemented and is not in this codebase. **Do not build around Retell for the VDS rebuild.** The only thing to carry over is the `checkGoldStatus` function's pattern (an auth-gated endpoint that external voice agents can call to verify Gold status), which can be re-implemented with whatever auth mechanism the new platform uses.

---

### 4.8 Other Secrets

| Secret | Purpose |
|---|---|
| `SCHEDULER_TOKEN` | Internal auth token for scheduler function |
| `VDS_TEAM_PHONE` | Internal team notification phone number |

---

## 5. IMAGE ASSET MANIFEST

> All images are hosted on `media.base44.com` under the VDS app's public image directory. URLs are permanent static links. On rebuild, these should be re-hosted or the URLs referenced directly.

### 5.1 Logo

```
https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png
```
Used in: Navbar (h-12), Footer (h-10). Fallback logo hardcoded in both components.

### 5.2 Hero Imagery

| Page | URL | Usage |
|---|---|---|
| Home | `...f695b9a84_PhotoFeb23202651724PM.jpg` | Full-bleed hero background |
| Home (About) | `...36815783a_PorscheGoogleReview.webp` | About section image (3:4 aspect) |

### 5.3 Featured Service Card Images

| Card | URL |
|---|---|
| Full Detail | `...322538cef_IMG_3881.jpg` |
| Ceramic Coatings | `...3a80c18b3_ceramic-coating-being-professionally-applied-to-car-paint-for-long-term-protection.webp` |
| Paint Correction | `...2e390daf5_ChatGPTImageFeb17202611_00_33PM.png` |

### 5.4 Gallery Photos (23 total)

All hosted under `https://media.base44.com/images/public/6a191df337222815cd0b1f5e/`

| # | Filename | Service | Tags |
|---|---|---|---|
| 1 | `aa4571c98_FullDetail.jpg` | Full Detail | Full Detail |
| 2 | `3dc7e5603_FullDetail2.jpg` | Full Detail | Full Detail |
| 3 | `1843ecb8f_FullDetail3.jpg` | Full Detail | Full Detail |
| 4 | `27795897c_FullDetail-CeramicSealant2.jpg` | Full Detail + Ceramic Sealant | Full Detail, Ceramic Sealant |
| 5 | `50fc4ae87_FullDetail-CeramicSealant.jpg` | Full Detail + Ceramic Sealant | Full Detail, Ceramic Sealant |
| 6 | `933c641a9_ExteriorDetail.jpg` | Exterior Detail | Exterior Detail |
| 7 | `02edab55d_FullDetail-5YearCeramicCoating-Stage3PaintCorrection.jpg` | Full Detail + 5-Year Ceramic Coating + Stage 3 Paint Correction | Full Detail, Ceramic Coating, Paint Correction |
| 8 | `a5df93801_FullDetail-5YearCeramicCoating-Stage1PaintCorrection.jpg` | Full Detail + 5-Year Ceramic Coating + Stage 1 Paint Correction | Full Detail, Ceramic Coating, Paint Correction |
| 9 | `73b0c6f48_FullDetail-5YearCeramicCoating-Stage1PaintCorrection.jpg` | Full Detail + 5-Year Ceramic Coating + Stage 1 Paint Correction | Full Detail, Ceramic Coating, Paint Correction |
| 10 | `7e0e8e30c_FullDetail-CeramicSealant2.jpg` | Full Detail + Ceramic Sealant | Full Detail, Ceramic Sealant |
| 11 | `fc5c033c1_FullDetail-CeramicSealant.jpg` | Full Detail + Ceramic Sealant | Full Detail, Ceramic Sealant |
| 12 | `e81a4b27a_FullDetail2.jpg` | Full Detail | Full Detail |
| 13 | `afaaf50c5_FullDetail3.jpg` | Full Detail | Full Detail |
| 14 | `72db908f1_FullDetail4.jpg` | Full Detail | Full Detail |
| 15 | `08e4dab62_FullDetail5.jpg` | Full Detail | Full Detail |
| 16 | `20635cea2_FullDetail6.jpg` | Full Detail | Full Detail |
| 17 | `ddc0a29a7_FullDetail.jpg` | Full Detail | Full Detail |
| 18 | `b46468994_ExteriorDetail3.jpg` | Exterior Detail | Exterior Detail |
| 19 | `e47c4c896_ExteriorDetail5.jpg` | Exterior Detail | Exterior Detail |
| 20 | `52c3ecad8_ExteriorDetail4.jpg` | Exterior Detail | Exterior Detail |
| 21 | `1082fee8c_FullDetail-5YearCeramicCoating-Stage1PaintCorrecton.jpg` | Full Detail + 5-Year Ceramic Coating + Stage 1 Paint Correction | Full Detail, Ceramic Coating, Paint Correction |
| 22 | `67fedece8_FullDetail4.jpg` | Full Detail | Full Detail |
| 23 | `ef3ecb851_FullDetail5.jpg` | Full Detail | Full Detail |

### 5.5 Decorative / UI Assets

- Gold particle animations: generated client-side via `GoldParticles` component (CSS/canvas, no image files)
- Gold shimmer text: CSS gradient animation (no image)
- Favicon: static black square in `index.html` (overridden at runtime by RouteSeo for VDS tenant)

---

## 6. NAVIGATION STRUCTURE

### Navbar (Desktop)
```
[LOGO]                    HOME  SERVICES  QUOTE & BOOK  GALLERY  FAQ  VDS GOLD    [MEMBER LOGIN]
```
- Logo links to `/`
- VDS GOLD link is gold-colored (distinct from other nav links)
- MEMBER LOGIN shows when logged out; MY ACCOUNT shows when logged in (gated by `member_portal` feature)
- Sticky, transparent → glass-header on scroll

### Navbar (Mobile)
Hamburger menu → same links stacked vertically + MEMBER LOGIN / MY ACCOUNT

### Footer (5 columns)
1. **Brand:** Logo, legal name, address, Instagram + TikTok icons
2. **Navigate:** Home, Services, Quote & Book, Gallery, VDS Gold, FAQ
3. **Portals:** Specialist Login, Partner Login, Admin Login
4. **Services:** Full Detail, Ceramic Coatings, Paint Correction, VDS Gold, Interior Detail, Exterior Detail
5. **Contact:** Phone (call/text), Email, `◆ JOIN VDS GOLD` button
- Bottom bar: `© 2026 VALET DETAILING SERVICE LLC. ALL RIGHTS RESERVED.` + Terms / Privacy / Cookies links

---

## 7. KEY BEHAVIORAL NOTES FOR REBUILD

1. **No standalone pricing page** — `/pricing` redirects to `/book`. Pricing is computed dynamically in the booking flow based on vehicle classification, condition multiplier, selected services, add-ons, and paint protection discount (20% if PPF/ceramic already present).

2. **Paint protection discount** — When a customer selects "paint_protection" (existing PPF or ceramic coating) on the booking page, a 20% discount is applied to the detail service base price.

3. **Quote validity** — Quotes are valid for 7 days (stated in Terms §4).

4. **SMS consent** — Required checkbox on booking form. Drives whether confirmations/reminders go via SMS (if consented) or email (if not). The Communication Rules Engine evaluates consent before every send.

5. **Guest booking** — Users can book without an account. After submission, they're prompted to create an account to track their appointment.

6. **VDS Gold checkout** — Membership signup goes through Stripe Checkout (recurring subscription). Multiple vehicles can be enrolled on a single subscription with individual line items (one VehicleSubscription record per vehicle).

7. **Google Reviews** — Reviews are fetched from Google Places API (max 5 per call), cached in the GoogleReview entity, and displayed as an infinite marquee carousel. The carousel shows all accumulated reviews, not just the latest 5.

8. **AI Chat (Valerie)** — The web chat widget uses the concierge persona from BusinessConfig. It can answer questions, generate quotes, and guide users to book. Conversation history is maintained via sessionStorage conversation_id.

9. **Legal pages are templated** — All legal entity references (company name, jurisdiction, domain, email, membership label) are dynamically pulled from BusinessConfig via `useLegalContext`. A different tenant's legal pages would automatically reflect their own entity name.

10. **Tenant-aware** — The entire site is multi-tenant capable. The `business_id: 'vds'` config drives everything. The ERA Systems tenant (`business_id: 'era_systems'`) has its own separate config, pages, and nav structure.