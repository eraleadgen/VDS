// ERA Core 1.0 + VDS Mobile — Project Overview & Technical Architecture document.
// Admin-gated download. Generated server-side so the full architecture write-up is never
// shipped in the public client bundle. Author/owner: Noah Grove.
//
// POST /functions/projectOverviewDoc
// Public — no auth. Serves the document HTML for the shareable /project-overview route.

export const DOC_FILENAME = 'ERA-Core-1.0-VDS-Mobile-Project-Overview.html';

function buildDocHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ERA Core 1.0 + VDS Mobile — Project Overview &amp; Technical Architecture</title>
<style>
  :root { --gold:#D4AF37; --gold-light:#F5E17A; --obsidian:#0A0B0D; --asphalt:#14161A; --vapor:#E2E8F0; --muted:#94A3B8; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--obsidian); color:var(--vapor);
    font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    line-height:1.75; -webkit-font-smoothing:antialiased; }
  .mono { font-family:'Space Mono','Courier New',monospace; }
  .wrap { max-width:900px; margin:0 auto; padding:0 28px 80px; }
  header { text-align:center; padding:96px 28px 72px; border-bottom:1px solid rgba(212,175,55,0.15);
    background:radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 60%); }
  .brand { letter-spacing:5px; font-size:13px; font-weight:700; color:var(--gold); margin-bottom:18px; }
  .brand .sep { color:var(--muted); margin:0 10px; }
  h1.title { font-size:44px; line-height:1.15; font-weight:700; margin:0 0 14px; color:#fff; letter-spacing:-0.5px; }
  .subtitle { color:var(--muted); font-size:17px; max-width:600px; margin:0 auto; }
  .author { margin-top:22px; color:#fff; font-size:14px; font-weight:600; letter-spacing:1px; }
  .author span { color:var(--gold); }
  .meta { color:var(--muted); font-size:13px; margin-top:6px; font-family:'Space Mono',monospace; }
  .badge { display:inline-block; margin-top:22px; padding:6px 16px; border:1px solid var(--gold);
    border-radius:999px; color:var(--gold); font-size:12px; letter-spacing:2px; font-weight:700; }
  h2 { font-size:27px; font-weight:700; margin:60px 0 8px; color:#fff; letter-spacing:-0.3px;
    padding-bottom:12px; border-bottom:1px solid rgba(212,175,55,0.2); }
  h3 { font-size:20px; font-weight:600; margin:34px 0 10px; color:var(--gold-light); }
  h4 { font-size:14px; font-weight:700; margin:24px 0 6px; color:#fff; letter-spacing:0.5px; text-transform:uppercase; }
  p { color:#CBD5E1; font-size:16px; margin:0 0 16px; }
  ul, ol { color:#CBD5E1; font-size:16px; padding-left:22px; }
  li { margin:6px 0; }
  strong { color:#fff; }
  a { color:var(--gold); text-decoration:none; }
  code { background:rgba(212,175,55,0.12); color:var(--gold-light); padding:2px 6px; border-radius:4px; font-size:13px; }
  pre { background:var(--asphalt); border:1px solid rgba(212,175,55,0.15); border-radius:10px;
    padding:18px 20px; overflow-x:auto; font-size:13px; line-height:1.6; color:#E2E8F0; }
  pre code { background:none; padding:0; color:#E2E8F0; }
  table { width:100%; border-collapse:collapse; margin:18px 0; font-size:14px;
    background:var(--asphalt); border:1px solid rgba(212,175,55,0.12); border-radius:10px; overflow:hidden; }
  th { background:rgba(212,175,55,0.08); color:var(--gold); text-align:left; padding:12px 16px;
    font-weight:700; letter-spacing:0.5px; text-transform:uppercase; font-size:12px; border-bottom:1px solid rgba(212,175,55,0.2); }
  td { padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05); color:#CBD5E1; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .callout { background:var(--asphalt); border-left:3px solid var(--gold); border-radius:0 10px 10px 0;
    padding:18px 22px; margin:24px 0; }
  .callout .label { color:var(--gold); font-size:12px; letter-spacing:1.5px; font-weight:700; text-transform:uppercase; margin-bottom:6px; }
  .diagram { background:var(--asphalt); border:1px solid rgba(212,175,55,0.15); border-radius:12px;
    padding:28px; margin:24px 0; font-family:'Space Mono',monospace; font-size:12.5px; line-height:1.7;
    color:#CBD5E1; overflow-x:auto; white-space:pre; }
  .toc { background:var(--asphalt); border:1px solid rgba(212,175,55,0.12); border-radius:12px; padding:24px 30px; margin:40px 0; }
  .toc h4 { margin-top:0; }
  .toc ol { margin:0; padding-left:22px; }
  .toc li { margin:5px 0; }
  .toc a { color:#CBD5E1; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; margin:24px 0; }
  .card { background:var(--asphalt); border:1px solid rgba(212,175,55,0.15); border-radius:10px; padding:18px 20px; }
  .card .k { color:var(--gold); font-size:12px; letter-spacing:1px; font-weight:700; text-transform:uppercase; margin-bottom:6px; }
  .card .v { color:#fff; font-size:15px; font-weight:600; }
  .pillrow { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 6px; }
  .pill { background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.25); color:var(--gold-light);
    padding:5px 14px; border-radius:999px; font-size:13px; font-weight:600; }
  footer { text-align:center; padding:48px 28px; color:var(--muted); font-size:13px;
    border-top:1px solid rgba(212,175,55,0.1); margin-top:40px; }
  footer .gold { color:var(--gold); font-weight:700; letter-spacing:2px; }
  @media print {
    body { background:#fff; color:#111; }
    header { border-bottom:2px solid #D4AF37; background:#fff; padding:40px 0; }
    h1.title { color:#111; } .subtitle, p, li, td { color:#222; }
    h2, h3, strong { color:#111; } h3 { color:#A08020; }
    .callout, .diagram, pre, table, .card, .toc { background:#f7f7f7; border:1px solid #ddd; }
    th { background:#f0f0f0; color:#A08020; } code { background:#f0f0f0; color:#A08020; }
    footer { border-top:2px solid #D4AF37; }
  }
  @media (max-width:640px) { h1.title { font-size:30px; } .wrap { padding:0 18px 60px; } }
</style>
</head>
<body>
<header>
  <div class="brand">ERA SYSTEMS LLC <span class="sep">·</span> PROJECT ARCHIVE</div>
  <h1 class="title">ERA Core 1.0 + VDS Mobile<br>Project Overview &amp; Technical Architecture</h1>
  <p class="subtitle">An in-depth record of the modular, event-driven business operating system and its first production vertical — the mobile auto-detailing platform VDS Mobile — including how the two layers connect and communicate.</p>
  <div class="author">Authored &amp; Built by <span>Noah Grove &amp; Shane Muenkel</span> — Owners of ERA &amp; VDS</div>
  <div class="meta">VERSION 1.0 &nbsp;·&nbsp; JULY 2026 &nbsp;·&nbsp; CONFIDENTIAL — INTERNAL PROJECT RECORD</div>
  <div class="badge">PROOF OF WORK</div>
</header>
<div class="wrap">
  <div class="toc">
    <h4>Contents</h4>
    <ol>
      <li>Project Mission &amp; Scope</li>
      <li>What Is ERA Core 1.0?</li>
      <li>What Is VDS Mobile?</li>
      <li>How ERA Core &amp; VDS Mobile Connect &amp; Communicate</li>
      <li>System Architecture &amp; Technology Stack</li>
      <li>The Data Model (Entities)</li>
      <li>The Engines</li>
      <li>The Portals</li>
      <li>Integrations &amp; External Services</li>
      <li>Partner Network &amp; Incentive Attribution</li>
      <li>Security, Privacy &amp; Audit</li>
      <li>Build Accomplishments (Feature Inventory)</li>
      <li>Summary &amp; Attribution</li>
    </ol>
  </div>

  <h2>1 · Project Mission &amp; Scope</h2>
  <p>ERA Core 1.0 is a <strong>modular, event-driven business operating system</strong> for service-based companies, and <strong>VDS Mobile</strong> is its first production deployment — a mobile auto-detailing business operating out of metro Atlanta, GA. The project's mission was to build a single platform that could run one service business end-to-end <em>and</em> serve as a reusable foundation so future verticals (HVAC, roofing, plumbing, cleaning, etc.) could be launched by <strong>configuring</strong> the system rather than rebuilding it.</p>
  <p>Everything in the business — customers, vehicles, appointments, quotes, pricing, specialists, invoices, memberships, communications, partner referrals, and AI concierge conversations — runs through one database, one set of engines, and one audit trail. There is no synchronization drift between disconnected tools; ERA Core is the single source of truth.</p>
  <div class="callout"><div class="label">Scope of this document</div>This document is a complete, dated record of what was built: the architecture, the data model, every engine, every portal, every integration, and precisely how the generic ERA Core layer and the VDS-specific layer connect and communicate. It is intended as proof of the work completed.</div>

  <h2>2 · What Is ERA Core 1.0?</h2>
  <p>ERA Core is the <strong>engine</strong> — a vertical-agnostic platform providing the foundational capabilities any field-service business needs. It is deliberately separated from the specifics of any one industry.</p>
  <div class="cards">
    <div class="card"><div class="k">Event-Driven</div><div class="v">Every meaningful action raises a system event other modules react to — no monolithic logic.</div></div>
    <div class="card"><div class="k">Single Source of Truth</div><div class="v">All business data lives in one database. No sync, no drift, no duplicate records across tools.</div></div>
    <div class="card"><div class="k">Configuration Over Code</div><div class="v">Services, pricing, hours, scheduling rules, and feature flags are data — not hardcoded.</div></div>
    <div class="card"><div class="k">Multi-Tenant Ready</div><div class="v">Each business is isolated by a <code>business_id</code>, ready for many verticals on one engine.</div></div>
    <div class="card"><div class="k">Rules-Driven Comms</div><div class="v">Every SMS/email is evaluated by a central Communication Rules Engine before delivery.</div></div>
    <div class="card"><div class="k">Audit-First</div><div class="v">Every event and every suppressed message is recorded immutably to the SystemEventLog.</div></div>
  </div>

  <h2>3 · What Is VDS Mobile?</h2>
  <p>VDS Mobile is the <strong>first vertical</strong> deployed on ERA Core. It is a real, revenue-generating mobile detailing business. VDS does not add engine logic to the platform — it <strong>configures</strong> ERA Core and connects its own external services:</p>
  <table>
    <tr><th>ERA Core (generic)</th><th>VDS Mobile (configured)</th></tr>
    <tr><td>BusinessConfig</td><td>"VDS Mobile" — detailing service catalog, 4 vehicle classifications, 2 pricing groups, VDS Gold membership plans</td></tr>
    <tr><td>Customer</td><td>A car owner</td></tr>
    <tr><td>Job</td><td>A detailing appointment (Full Detail, Exterior Detail, Ceramic Coating Consultation, etc.)</td></tr>
    <tr><td>Quote</td><td>A custom quote built from vehicle + condition + selected services → computed price</td></tr>
    <tr><td>Contractor</td><td>A mobile detail specialist (independent contractor, self-scheduled availability)</td></tr>
    <tr><td>Classification</td><td>Coupe, Sedan, Mid-Size SUV, Truck / 3-Row SUV</td></tr>
    <tr><td>Condition multiplier</td><td>Light / Moderate / Heavy wear (affects price and estimated duration)</td></tr>
    <tr><td>Membership</td><td>VDS Gold — recurring monthly membership per vehicle, billed via Stripe</td></tr>
    <tr><td>AI Concierge</td><td>"Valerie" — SMS concierge for quotes, booking, and membership questions</td></tr>
    <tr><td>Vertical entities</td><td>MemberVehicle, VehicleSubscription, ServiceRecord</td></tr>
    <tr><td>Growth module</td><td>The VDS Partner Network — dealership salespeople &amp; strategic partners who refer clients</td></tr>
  </table>

  <h2>4 · How ERA Core &amp; VDS Mobile Connect &amp; Communicate</h2>
  <p>The connection between the two layers is best understood as a <strong>configuration relationship</strong>, not a code integration. VDS Mobile is a configuration layer that sits on top of ERA Core's engines and data model. They communicate through three mechanisms:</p>

  <h3>4.1 · The BusinessConfig Bridge</h3>
  <p>A single <code>BusinessConfig</code> record is the bridge between the generic engine and the VDS-specific reality. Every engine reads from it at runtime:</p>
  <ul>
    <li>The <strong>Pricing Engine</strong> reads the service catalog + condition multipliers to compute quotes.</li>
    <li>The <strong>Scheduling Engine</strong> reads business hours, buffers, and slot intervals.</li>
    <li>The <strong>Communication Rules Engine</strong> reads feature flags (e.g. <code>twilio_sms_enabled</code>).</li>
    <li>The <strong>AI Concierge</strong> (Valerie) is grounded in the live catalog so she always quotes current prices and services.</li>
    <li>Stripe product/price IDs for VDS Gold are referenced from <code>membership_plans</code>.</li>
  </ul>
  <p>Because all vertical behavior lives in this record, switching industries means populating a new <code>BusinessConfig</code> — not touching engine code.</p>

  <h3>4.2 · Event-Driven Communication</h3>
  <p>Modules never call each other directly in a brittle chain. Instead, every meaningful action raises an event logged to the <code>SystemEventLog</code>, and downstream behavior reacts:</p>
  <div class="diagram">Customer books (submitBooking)
        │
        ├─► Job created            ──► event: job_created
        ├─► Customer find-or-create ──► event: customer_created (if new)
        ├─► Partner attribution     ──► Customer.referred_by_partner_id tagged
        ├─► Google Calendar mirror  ──► event mirrored to shared calendar
        ├─► Auto-assign specialist  ──► event: job_assigned
        └─► Booking notifications   ──► Communication Rules Engine ──► SMS / email

Job completed &amp; invoice paid
        │
        ├─► onInvoicePaid (shared helper)
        │      ├─► Customer LTV + total_jobs updated
        │      ├─► Partner incentive credited ($30 / $100, idempotent)
        │      ├─► Quote auto-finalized
        │      └─► event: invoice_paid
        └─► Partner metrics refreshed in real time (portal subscription)</div>

  <h3>4.3 · Shared Modules &amp; the Service Role</h3>
  <p>Logic needed by more than one backend function lives in <strong>shared modules</strong> under <code>base44/shared/</code> — for example <code>invoicePaid.ts</code> (used by both the manual admin "mark paid" flow <em>and</em> the Stripe webhook), <code>customer.ts</code> (the canonical find-or-create helper), <code>partnerIncentive.ts</code>, and <code>gcal.ts</code> (Google Calendar). These shared modules run under the <strong>service role</strong>, which bypasses per-user Row-Level Security so server-side automation (webhooks, auto-assignment, reminders) can write the records it needs to.</p>
  <div class="callout"><div class="label">Key Insight</div>VDS Mobile adds no new engine logic. It configures BusinessConfig, registers its services and pricing, defines its vehicle classifications, connects its Stripe products, and brands its AI concierge. Scheduling, CRM, pricing, communications, audit, and partner attribution are all inherited from ERA Core.</div>

  <h2>5 · System Architecture &amp; Technology Stack</h2>
  <h3>5.1 · Frontend</h3>
  <ul>
    <li><strong>React + Vite</strong> single-page application with React Router.</li>
    <li><strong>Tailwind CSS</strong> + a custom design-token system (obsidian / gold / vapor) defined in <code>index.css</code> and mapped in <code>tailwind.config.js</code>.</li>
    <li><strong>shadcn/ui</strong> component primitives and <strong>lucide-react</strong> icons.</li>
    <li>TanStack Query for data fetching state; framer-motion for motion; recharts for analytics; react-leaflet for maps; three.js for 3D.</li>
    <li>Fully responsive (mobile + desktop) and publishable to iOS/Android from the same codebase.</li>
  </ul>
  <h3>5.2 · Backend</h3>
  <ul>
    <li><strong>Base44 Backend-as-a-Service</strong>: managed auth, database (entities), serverless functions, automations, and hosting.</li>
    <li>Backend functions live in <code>base44/functions/&lt;name&gt;/entry.ts</code> (Deno Deploy handlers) for external APIs and orchestration.</li>
    <li>Shared, reusable logic lives in <code>base44/shared/</code> so multiple functions import it instead of copying.</li>
    <li><strong>Automations</strong> run functions automatically on schedules, entity changes, or connector webhooks.</li>
  </ul>
  <h3>5.3 · External Integrations</h3>
  <ul>
    <li><strong>Stripe</strong> — VDS Gold recurring subscriptions + one-time service invoices (live mode).</li>
    <li><strong>Google Calendar</strong> — booking mirrors via an authorized OAuth connector (supports webhooks).</li>
    <li><strong>Twilio</strong> — SMS delivery (gated behind A2P 10DLC registration; feature-flagged off until approved).</li>
    <li><strong>OpenAI</strong> — powers the Valerie AI concierge.</li>
  </ul>

  <h2>6 · The Data Model (Entities)</h2>
  <p>ERA Core is organized around a central <strong>Job</strong> hub. Everything relates back to a Job.</p>
  <div class="diagram">            +------------------+
             |  BusinessConfig  |  <- configuration layer (per vertical)
             +--------+---------+
                      | drives every engine at runtime
          +-----------+-----------+
          v           v           v
    +----------+ +----------+ +--------------+
    | Customer | |   Job    | |  Contractor  |
    |  (CRM)   |--> (Hub)   |<--| (Specialist) |
    +----+-----+ +----+-----+ +--------------+
         |            |
         |            +--> Quote        (draft pricing → Job)
         |            +--> Invoice      (payment for the Job)
         |            +--> Photos       (before / after)
         |            +--> SystemEventLog (immutable audit)
         |
         +--> CustomerJourney      (relationship timeline)
         +--> ConversationHistory  (AI concierge transcripts)

   VDS vertical entities:  MemberVehicle · VehicleSubscription · ServiceRecord
   Growth module:           Partner · PartnerReferral</div>
  <h3>Entity Roles</h3>
  <table>
    <tr><th>Entity</th><th>Role in the system</th></tr>
    <tr><td><strong>BusinessConfig</strong></td><td>Single source of truth for how this business operates — service catalog, pricing rules, hours, scheduling rules, classifications, membership plans, partner incentives, feature flags, branding. The vertical's configuration layer.</td></tr>
    <tr><td><strong>Customer</strong></td><td>The CRM entity. Holds profile, contact preferences, consent flags, lifetime revenue, total jobs, referral source, review status, and the partner who referred them (<code>referred_by_partner_id</code>).</td></tr>
    <tr><td><strong>Job</strong></td><td>The operational hub. Every service creates a Job linking customer, vehicle, specialist, schedule, quote, invoice, and photos. Carries a lifecycle status + a specialist workflow status + consultation status.</td></tr>
    <tr><td><strong>Quote</strong></td><td>A draft pricing configuration from the Pricing Engine. Converts into a Job once booked.</td></tr>
    <tr><td><strong>Contractor</strong></td><td>Independent specialist profile. Sets own weekly availability, blocked dates, skills, and service areas. Supports shared profiles (multiple linked users). No clock-in or timesheets.</td></tr>
    <tr><td><strong>Invoice</strong></td><td>Payment record for a completed Job. Supports cash, card, check, and Stripe.</td></tr>
    <tr><td><strong>MemberVehicle</strong></td><td>(VDS) A customer's vehicle — classification independent of pricing group, with paint-protection info and Gold enrollment flag.</td></tr>
    <tr><td><strong>VehicleSubscription</strong></td><td>(VDS) An active VDS Gold membership per vehicle, linked to a shared Stripe subscription with per-vehicle line items so one vehicle can be canceled independently.</td></tr>
    <tr><td><strong>Partner</strong></td><td>Growth module — a dealership salesperson or strategic partner who refers clients. Tracks referrals, conversions, revenue, incentive earnings, and service-type generation.</td></tr>
    <tr><td><strong>PartnerReferral</strong></td><td>A single referral event. Created on booking via a partner link; attributed (with incentive) when the linked job's invoice is paid or a Gold signup completes — idempotent via the <code>attributed</code> flag.</td></tr>
    <tr><td><strong>CustomerJourney</strong></td><td>Auto-generated, immutable timeline of every customer interaction — tells the story of the relationship.</td></tr>
    <tr><td><strong>SystemEventLog</strong></td><td>Immutable audit trail of every platform event and every suppressed communication (with reason).</td></tr>
    <tr><td><strong>ConversationHistory</strong></td><td>Transcript history for the Valerie AI concierge, keyed by customer phone.</td></tr>
    <tr><td><strong>ServiceRecord</strong></td><td>(VDS) Per-vehicle service history log.</td></tr>
  </table>

  <h2>7 · The Engines</h2>
  <h3>Pricing Engine</h3>
  <ul>
    <li>Reads entirely from BusinessConfig — no hardcoded prices.</li>
    <li>Computes quotes from: service × classification × condition multiplier × add-ons, minus any paint-protection discount.</li>
    <li>Condition affects both price (multiplier) and duration (added minutes).</li>
    <li>Always recomputed server-side; client-supplied prices are discarded to prevent forgery.</li>
  </ul>
  <h3>Scheduling Engine</h3>
  <ul>
    <li>Checks availability against business hours, booking buffers, minimum notice, slot intervals, and max bookings/day.</li>
    <li>Auto-assigns the best-fit specialist by skill, weekly availability, blocked dates, service area, and workload.</li>
    <li>Mirrors bookings to Google Calendar while the database remains the source of truth — preventing double-booking at both the calendar and specialist level.</li>
  </ul>
  <h3>Communication Rules Engine</h3>
  <p>Every outbound SMS/email is evaluated before delivery:</p>
  <div class="pillrow">
    <span class="pill">Consent flag set?</span>
    <span class="pill">SMS feature flag on?</span>
    <span class="pill">Duplicate guard</span>
    <span class="pill">Promotion opt-out</span>
    <span class="pill">Review opt-out</span>
  </div>
  <p>If any rule blocks a message it is suppressed and logged (with the reason) to the SystemEventLog — never silently dropped. When SMS is suppressed, reminders fall back to email automatically.</p>
  <h3>AI Concierge — "Valerie"</h3>
  <ul>
    <li>SMS-based assistant that answers questions, generates quotes, books appointments, and checks membership status.</li>
    <li>Grounded in the live BusinessConfig catalog and the customer's own history.</li>
    <li>All actions logged to the SystemEventLog and ConversationHistory.</li>
  </ul>
  <h3>Payments &amp; Memberships</h3>
  <ul>
    <li>One-time services tracked via Invoices (cash/card/check) and optionally paid via Stripe one-time invoices.</li>
    <li>Recurring VDS Gold memberships billed through Stripe subscriptions; the webhook provisions per-vehicle access only after validating against BusinessConfig.</li>
  </ul>

  <h2>8 · The Portals</h2>
  <table>
    <tr><th>Portal</th><th>Who uses it</th><th>What it does</th></tr>
    <tr><td><strong>Member Portal</strong></td><td>Car owners</td><td>Vehicle garage, VDS Gold enrollment &amp; management, appointment booking, service history, account &amp; consent settings.</td></tr>
    <tr><td><strong>Specialist Portal</strong></td><td>Independent detailers</td><td>Job board with full lifecycle (Assigned → Driving → Arrived → In Progress → Quality Check → Completed → Photos), availability editor, profile, consultation-status controls, completion &amp; photo upload.</td></tr>
    <tr><td><strong>Partner Portal</strong></td><td>Dealership salespeople &amp; strategic partners</td><td>Overview of referral metrics &amp; incentive earnings, referral link/QR, Resource Center (welcome packet + vehicle care guide).</td></tr>
    <tr><td><strong>Admin Dashboard</strong></td><td>ERA Systems administrators</td><td>Overview &amp; revenue metrics, appointments, jobs, quotes, invoices (incl. "Charge via Stripe"), contractors, partners, business-dev analytics, client directory / journey, messages, and migration tools.</td></tr>
  </table>

  <h2>9 · Integrations &amp; External Services</h2>
  <h3>Stripe (live mode)</h3>
  <ul>
    <li>VDS Gold recurring subscriptions — one Stripe product, per-pricing-group Price IDs ($250 sedan/coupe, $300 truck/SUV per month).</li>
    <li>One-time service invoices for detailing jobs (ceramic coating, paint correction, etc.) with "Charge via Stripe" admin flow.</li>
    <li>Webhook provisions memberships and marks invoices paid, running the shared partner-incentive attribution automatically.</li>
  </ul>
  <h3>Google Calendar</h3>
  <ul>
    <li>Authorized OAuth connector; bookings mirror to a shared calendar with full client/vehicle/service context.</li>
    <li>Supports webhooks; the database remains the source of truth so the calendar can never create phantom bookings.</li>
  </ul>
  <h3>Twilio (SMS)</h3>
  <ul>
    <li>A2P 10DLC campaign registration in progress; SMS delivery is feature-flagged off until approved.</li>
    <li>While off, all customer-facing notifications fall back to email — consent and audit still enforced.</li>
  </ul>
  <h3>OpenAI (Valerie)</h3>
  <ul>
    <li>Powers the SMS concierge with tool-calling for quotes, booking, and membership lookups, grounded in BusinessConfig.</li>
  </ul>

  <h2>10 · Partner Network &amp; Incentive Attribution</h2>
  <p>The VDS Partner Network is ERA Core's reusable growth module. Each partner gets a vanity referral link (<code>domain/CODE</code>). The referral code is captured and persisted (localStorage) so it survives navigation — including clicks to VDS Gold — and still attributes a later signup.</p>
  <div class="diagram">Partner link (domain/CODE)
      │
      ├─► /book?ref=CODE  ─► submitBooking
      │       ├─► Customer.referred_by_partner_id tagged (first touch)
      │       ├─► Customer.referral_source = "Partner Referral"
      │       └─► PartnerReferral created (status: referred)
      │
      └─► VDS Gold signup  ─► createGoldCheckoutSession (carries partner code)
              └─► Stripe checkout.session.completed
                     └─► creditPartnerGoldSignup (shared)
                            ├─► find-or-create Customer
                            ├─► tag partner (first touch)
                            └─► credit $30 initial_detail incentive (one-time per client)

Invoice paid (detail OR coating)
    └─► onInvoicePaid (shared, idempotent)
           ├─► $30 initial_detail  — one-time per client (detail OR Gold, whichever first)
           └─► $100 per ceramic coating / paint correction job (add-ons like ceramic sealant earn nothing)</div>
  <p>Incentive rules (configured in BusinessConfig, not code):</p>
  <ul>
    <li><strong>$30</strong> — a referred client's first completed job (a detail <em>or</em> a VDS Gold signup). One-time per client, idempotent.</li>
    <li><strong>$100</strong> — each ceramic coating or paint correction job that converts. Add-ons (e.g. ceramic sealant) earn no referral reward.</li>
  </ul>
  <p>Attribution is keyed off the Customer's <code>referred_by_partner_id</code>, set the first time a client books via a partner link — so a partner is correctly credited when a coating <em>consultation</em> converts to a later <em>purchase</em>, even months later.</p>

  <h2>11 · Security, Privacy &amp; Audit</h2>
  <ul>
    <li><strong>Row-Level Security (RLS)</strong> on every entity — customers only see their own data; specialists see only their jobs; partners see only their profile; admins manage everything.</li>
    <li><strong>Consent-first</strong>: no SMS or email is sent without an explicit consent flag; suppressed messages are logged with a reason.</li>
    <li><strong>Immutable audit</strong>: every event and every suppressed communication is written to the SystemEventLog.</li>
    <li><strong>Server-side pricing</strong>: quotes are always recomputed from BusinessConfig — customers cannot forge a price.</li>
    <li><strong>Ownership-verified actions</strong>: appointment changes require verified identity, never a guessable email/phone alone.</li>
    <li><strong>Admin-gated documentation</strong>: architecture documents (like this one) are generated server-side and never shipped in the public client bundle.</li>
  </ul>

  <h2>12 · Build Accomplishments (Feature Inventory)</h2>
  <div class="pillrow">
    <span class="pill">Dynamic pricing engine</span>
    <span class="pill">Booking &amp; quote flow</span>
    <span class="pill">Job-centric workflow</span>
    <span class="pill">Specialist auto-assignment</span>
    <span class="pill">Google Calendar mirroring</span>
    <span class="pill">Communication Rules Engine</span>
    <span class="pill">AI concierge (Valerie)</span>
    <span class="pill">VDS Gold memberships (Stripe)</span>
    <span class="pill">Per-vehicle subscriptions</span>
    <span class="pill">Partner Network + incentives</span>
    <span class="pill">Referral link persistence</span>
    <span class="pill">Client journey timeline</span>
    <span class="pill">System event audit log</span>
    <span class="pill">Member / Specialist / Partner / Admin portals</span>
    <span class="pill">Resource Center (care guides + welcome packets)</span>
    <span class="pill">Ceramic-coating aftercare docs</span>
    <span class="pill">Stripe one-time invoices</span>
    <span class="pill">Automated reminders &amp; review requests</span>
  </div>

  <h2>13 · Summary &amp; Attribution</h2>
  <p>ERA Core 1.0 is the engine. VDS Mobile is the proof it works for one vertical. The two layers connect through a single BusinessConfig configuration record, communicate through an event-driven architecture and shared service-role modules, and inherit ~90% of their capability from the generic platform. Onboarding a future vertical is a matter of configuration, not a rebuild.</p>
  <ul>
    <li>One platform, many verticals.</li>
    <li>Configure, don't rebuild.</li>
    <li>Every action audited, every customer communication consent-checked.</li>
    <li>AI concierge, scheduling, pricing, payments, and partner growth — built in.</li>
  </ul>
  <div class="callout"><div class="label">Project Record</div>This document is a complete, dated record of the ERA Core 1.0 + VDS Mobile platform as built. It is intended as proof of the work completed and as an architectural reference for future verticals.</div>
</div>
<footer>
  <div class="gold">ERA SYSTEMS LLC</div>
  <p>Authored &amp; built by <strong>Noah Grove &amp; Shane Muenkel</strong> — Owners of ERA &amp; VDS · ERA Core 1.0 · VDS Mobile · July 2026.<br>Confidential — internal project record. For a tailored vertical-onboarding walkthrough, contact your ERA partner.</p>
</footer>
</body>
</html>`;
}

Deno.serve(async () => {
  try {
    return Response.json({
      success: true,
      html: buildDocHtml(),
      filename: DOC_FILENAME,
    });
  } catch (error) {
    console.error('projectOverviewDoc error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});