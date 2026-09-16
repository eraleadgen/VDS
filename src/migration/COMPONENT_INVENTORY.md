# VDS Page-by-Page Component Inventory

Complete dependency map for migrating the VDS website to Lovable. Every file is listed with its imports, grouped by page. Files marked **[BASE44 SDK]** call `base44.functions.invoke()` or `base44.entities.*` and need rewiring to Lovable's backend. Files marked **[STATIC]** are pure UI with no backend calls.

---

## Build Order (bottom-up)

1. **Foundation layer** — design tokens, lib helpers, shared components
2. **Layout components** — Navbar, Footer
3. **Visual effect components** — GoldShimmer, GoldParticles, ReviewsCarousel
4. **Booking sub-components** — the 7 pieces that make up the Book page
5. **Pages** — Home, Services, VdsGold, Gallery, FAQ, Terms, Privacy, Cookies
6. **Router** — App.jsx wiring

---

## 1. Foundation Layer (install first)

### Design Tokens
| File | Purpose | Dependencies |
|------|---------|---------------|
| `src/index.css` | CSS variables, fonts, animations, glass panels | None (already in `migration/design-tokens.css`) |
| `tailwind.config.js` | Tailwind color/font/animation mappings | None (already in `migration/tailwind.config.js`) |

### Lib Helpers
| File | Purpose | Dependencies | Rewiring |
|------|---------|--------------|----------|
| `src/lib/quoteCalc.js` | Client-side pricing calculation | None | **[STATIC]** — already extracted to `migration/pricing-engine.js` |
| `src/lib/featuredServices.js` | Resolves featured service cards from config | None | **[STATIC]** — uses config object, no SDK |
| `src/lib/partnerRef.js` | Captures/stores partner referral codes | localStorage | **[STATIC]** — pure client-side |
| `src/lib/useLegalContext.js` | Templated legal text from config | `BusinessConfigContext` | **[STATIC]** — reads config, no SDK |
| `src/lib/BusinessConfigContext.jsx` | App-wide config provider + hooks | `base44.functions.invoke('getBusinessConfig')` | **[BASE44 SDK]** — replace with Lovable config fetch or import `vds-config.json` directly |
| `src/lib/usePlanFeatures.js` | Feature-gating hook | `BusinessConfigContext` | **[STATIC]** — reads config, no SDK |

### Shared UI (shadcn)
All files in `src/components/ui/` are standard shadcn/ui components. On Lovable, use Lovable's built-in shadcn integration — you do NOT need to copy these individually. The VDS pages use: `button`, `input`, `label`, `textarea`, `dialog`, `select`, `switch`, `tabs`, `accordion`, `badge`, `card`, `separator`, `checkbox`, `radio-group`, `calendar`, `popover`, `scroll-area`, `sheet`, `tooltip`, `dropdown-menu`, `skeleton`, `toast`.

---

## 2. Layout Components

### `src/components/vds/Navbar.jsx`
**Purpose:** Fixed top navigation bar with scroll-aware glass header, mobile hamburger menu, member login link.

**Imports:**
- `react-router-dom` → `Link`, `useLocation`
- `lucide-react` → `Menu`, `X`, `UserCircle`
- `@/lib/BusinessConfigContext` → `useBusinessName`, `useBusinessConfig`, `useMembershipPlan`
- `@/lib/usePlanFeatures` → `usePlanFeatures`
- **[BASE44 SDK]** `@/api/base44Client` → `base44.auth.isAuthenticated()`

**Rewiring:** Replace `base44.auth.isAuthenticated()` with Lovable's auth check. Everything else reads from config context.

### `src/components/vds/Footer.jsx`
**Purpose:** Site footer with brand info, navigation columns, contact, social links.

**Imports:**
- `react-router-dom` → `Link`
- `lucide-react` → `Instagram`, `Phone`, `Mail`
- `@/lib/BusinessConfigContext` → `useBusinessName`, `useBusinessConfig`, `useMembershipPlan`
- `@/lib/usePlanFeatures` → `usePlanFeatures`

**Rewiring:** **[STATIC]** — reads config context only, no direct SDK calls.

---

## 3. Visual Effect Components

### `src/components/vds/GoldShimmer.jsx`
**Purpose:** Animated gold gradient text effect (the shimmering "GOLD" / "REFLECTION" text).

**Imports:** None — pure inline-styled span.

**Rewiring:** **[STATIC]** — self-contained. Uses the `goldShine` keyframe from `index.css`.

### `src/components/vds/GoldParticles.jsx`
**Purpose:** Canvas-based animated gold particle field (floating gold flakes in hero sections).

**Imports:** React `useEffect`, `useRef` only.

**Rewiring:** **[STATIC]** — self-contained. Reads `--gold` CSS variable for particle color.

### `src/components/vds/ReviewsCarousel.jsx`
**Purpose:** Infinite-scrolling marquee of live Google reviews.

**Imports:**
- `lucide-react` → `Star`, `Quote`, `Loader2`
- **[BASE44 SDK]** `@/api/base44Client` → `base44.functions.invoke('getGoogleReviews')`

**Rewiring:** Replace with a Lovable Edge Function calling Google Places API, or hardcode reviews as a static array for the initial visual port.

### `src/components/vds/GoldPromoCard.jsx`
**Purpose:** Gold membership promotional banner card (used on Services page).

**Imports:**
- `react-router-dom` → `Link`
- `lucide-react` → `ArrowRight`
- `./GoldShimmer`

**Rewiring:** **[STATIC]** — pure UI.

---

## 4. Booking Sub-Components (Book page pieces)

These 7 components compose the `/book` page. All are **[STATIC]** except where noted.

| File | Purpose | Key Imports | Rewiring |
|------|---------|-------------|----------|
| `src/components/vds/VehicleSelector.jsx` | Year/make/model picker with classification | `@/lib/quoteCalc` (deriveClassification) | **[STATIC]** |
| `src/components/vds/SmsConsent.jsx` | SMS consent checkbox | None | **[STATIC]** |
| `src/components/booking/ConditionSelector.jsx` | Light/Moderate/Heavy condition picker | None | **[STATIC]** |
| `src/components/booking/ServicePicker.jsx` | Service + add-on + consultation selector | `@/lib/quoteCalc` (lookupTier, CLASSIFICATION_LABEL) | **[STATIC]** |
| `src/components/booking/PaintProtectionSelector.jsx` | PPF/ceramic toggle (20% discount) | None | **[STATIC]** |
| `src/components/booking/QuoteSummary.jsx` | Sticky right-rail quote display | None | **[STATIC]** |
| `src/components/booking/BookingCalendar.jsx` | Calendar + time slot picker | `date-fns` (format) | **[STATIC]** |
| `src/components/booking/SavedVehiclePicker.jsx` | Member's saved vehicle list | None | **[STATIC]** (data passed as props) |

---

## 5. Pages

### `/` — Home (`src/pages/Home.jsx`)
**Sections:** Hero with particles → Google reviews carousel → Featured services grid → About → FAQ preview → Final CTA.

**Imports:**
- `react-router-dom` → `Link`
- `lucide-react` → `ArrowRight`, `Star`, `Shield`, `Clock`, `MapPin`, `ChevronDown`
- `@/components/vds/Navbar`, `Footer`, `GoldShimmer`, `GoldParticles`, `ReviewsCarousel`
- `@/lib/BusinessConfigContext` → `useMembershipPlan`, `useBusinessConfig`
- `@/lib/featuredServices` → `resolveFeaturedCards`

**Rewiring:** **[STATIC]** — all data from config context. The only SDK call is inside `ReviewsCarousel` (Google reviews fetch).

---

### `/services` — Services (`src/pages/Services.jsx`)
**Sections:** Page header → Gold promo card → Service module cards (alternating layout) → CTA.

**Imports:**
- `react-router-dom` → `Link`
- `lucide-react` → `ArrowRight`, `Check`, `ChevronDown`
- `@/components/vds/Navbar`, `Footer`, `GoldPromoCard`
- `@/lib/BusinessConfigContext` → `useBusinessConfig`
- `@/lib/featuredServices` → `resolveFeaturedCards`

**Rewiring:** **[STATIC]** — fully config-driven, no direct SDK calls.

---

### `/book` — Quote & Book (`src/pages/BookAppointment.jsx`)
**Sections:** Guest gate → 5-step form (vehicle → condition → services → schedule → contact) → sticky quote summary → success screen.

**Imports:**
- `react-router-dom` → `Link`, `useLocation`, `useNavigate`
- `lucide-react` → `CheckCircle`, `Loader2`
- `date-fns` → `format`
- `@/components/vds/Navbar`, `Footer`, `GoldShimmer`, `VehicleSelector`, `SmsConsent`
- `@/components/booking/` → `ConditionSelector`, `ServicePicker`, `PaintProtectionSelector`, `QuoteSummary`, `BookingCalendar`, `SavedVehiclePicker`
- `@/lib/quoteCalc` → `computeQuote`, `deriveClassification`, `classificationToPricingGroup`, `CLASSIFICATION_LABEL`
- `@/lib/partnerRef` → `capturePartnerRef`, `getPartnerRef`, `deriveReferralSource`
- `@/lib/BusinessConfigContext` → `useBusinessConfig`
- **[BASE44 SDK]** `@/api/base44Client` → `base44.auth`, `base44.entities.MemberVehicle`, `base44.functions.invoke('account')`, `('getMySubscriptions')`, `('getCalendarAvailability')`, `('saveQuote')`, `('submitBooking')`, `('cancelAppointment')`

**Rewiring:** This is the most complex page. SDK calls to replace:
1. `base44.auth.isAuthenticated()` / `me()` → Lovable auth
2. `base44.entities.MemberVehicle.list/create/delete` → Lovable DB (vehicles table)
3. `base44.functions.invoke('account')` → Lovable user profile fetch
4. `base44.functions.invoke('getMySubscriptions')` → Lovable Stripe subscription query
5. `base44.functions.invoke('getCalendarAvailability')` → Lovable calendar function (Google Calendar)
6. `base44.functions.invoke('saveQuote')` → Lovable DB insert (quotes table)
7. `base44.functions.invoke('submitBooking')` → Lovable booking function (creates Job + Google Calendar event + notifications)
8. `base44.functions.invoke('cancelAppointment')` → Lovable cancel function

**For visual-only port:** Strip all SDK calls, use the `computeQuote` function from `migration/pricing-engine.js` for live pricing display, and mock the submit as a success screen.

---

### `/membership` — VDS Gold (`src/pages/VdsGold.jsx`)
**Sections:** Hero with particles → Exterior/Interior spec split → Value calculator → How it works → Sign-up card.

**Imports:**
- `react-router-dom` → `Link`
- `lucide-react` → `Check`, `ArrowRight`
- `@/components/vds/Navbar`, `Footer`, `GoldShimmer`, `GoldParticles`
- `@/lib/BusinessConfigContext` → `useMembershipPlan`, `useBusinessConfig`

**Rewiring:** **[STATIC]** — all pricing/labels from config context. No SDK calls.

---

### `/gallery` — Gallery (`src/pages/Gallery.jsx`)
**Sections:** Header → Filter buttons → Photo grid with hover overlays → Lightbox modal → CTA.

**Imports:**
- `lucide-react` → `X`
- `@/components/vds/Navbar`, `Footer`

**Rewiring:** **[STATIC]** — fully self-contained. 23 photos hardcoded as a `PHOTOS` array with Base44 media URLs. **Copy the image URLs** — they're public and will continue to work, or re-upload to Lovable's storage.

---

### `/faq` — FAQ (`src/pages/FAQ.jsx`)
**Sections:** Header → 4 categorized FAQ accordions → CTA.

**Imports:**
- `lucide-react` → `ChevronDown`
- `react-router-dom` → `Link`
- `@/components/vds/Navbar`, `Footer`
- `@/lib/BusinessConfigContext` → `useBusinessConfig`

**Rewiring:** **[STATIC]** — FAQ content is hardcoded in the component. The `config?.business_id === 'era_systems'` check at the top can be removed (it's for the ERA marketing site).

---

### `/terms` — Terms (`src/pages/Terms.jsx`)
**Sections:** Legal sections with templated business identity.

**Imports:**
- `react-router-dom` → `Link`
- `@/components/vds/Navbar`, `Footer`
- `@/lib/useLegalContext` → `useLegalContext`
- `@/lib/BusinessConfigContext` → `useBusinessConfig`

**Rewiring:** **[STATIC]** — all legal text templated from config via `useLegalContext`. Remove the `EraTerms` conditional.

---

### `/privacy` — Privacy (`src/pages/Privacy.jsx`)
**Same structure as Terms.** Imports: `Navbar`, `Footer`, `useLegalContext`, `useBusinessConfig`.

### `/cookies` — Cookies (`src/pages/Cookies.jsx`)
**Same structure as Terms.** Imports: `Navbar`, `Footer`, `useLegalContext`, `useBusinessConfig`.

---

### `/pricing` — Pricing redirect (`src/pages/Pricing.jsx`)
**Purpose:** Redirects to `/book` (VDS) or `/#pricing` (ERA).

**Imports:** `react-router-dom` → `Navigate`, `@/lib/BusinessConfigContext`.

**Rewiring:** **[STATIC]** — can be replaced with a simple `<Navigate to="/book" />`.

---

## 6. Router (`src/App.jsx`)

On Lovable, recreate the route structure. The VDS public routes are:

```
/           → Home
/services    → Services
/book        → BookAppointment
/membership  → VdsGold
/gallery     → Gallery
/faq         → FAQ
/terms       → Terms
/privacy     → Privacy
/cookies     → Cookies
```

**Skip these routes** (they're ERA platform / portal pages, not part of the public VDS website):
- `/era-*`, `/onboarding`, `/admin*`, `/member-*`, `/specialist-*`, `/partner-*`, `/sso`, `/:code`

---

## Summary: What Needs Rewiring vs. What's Copy-Paste

### Copy-paste directly (no changes):
- `index.css` + `tailwind.config.js` (already bundled)
- All 7 booking sub-components
- `GoldShimmer`, `GoldParticles`, `GoldPromoCard`
- `Home`, `Services`, `VdsGold`, `Gallery`, `FAQ`, `Terms`, `Privacy`, `Cookies`
- `quoteCalc.js`, `featuredServices.js`, `partnerRef.js`, `useLegalContext.js`
- `pricing-engine.js` + `vds-config.json` (already bundled)

### Needs rewiring (SDK calls):
- `BusinessConfigContext.jsx` → replace `base44.functions.invoke('getBusinessConfig')` with importing `vds-config.json` directly
- `Navbar.jsx` → replace `base44.auth.isAuthenticated()` with Lovable auth
- `ReviewsCarousel.jsx` → replace `getGoogleReviews` with Lovable Edge Function or static reviews
- `BookAppointment.jsx` → replace 8 SDK calls (auth, vehicles, calendar, quotes, bookings) with Lovable equivalents

### Skip entirely (ERA platform machinery):
- All `/era-*` pages and components
- `TenantRouteGuard`, `FeatureGate`, `TenantMapping`
- `onboardingWizard`, `eraBilling`, `eraAccount`, `stripe-webhook`, `provisioningReview`
- All admin/specialist/partner portal pages
- `EraStaff`, `EraAccount`, `OnboardingSession` entities