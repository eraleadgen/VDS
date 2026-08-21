// ERA Core v2.0 + VDS Mobile — Project Overview & Technical Architecture document.
// Admin-gated download. Generated server-side so the full architecture write-up is never
// shipped in the public client bundle. Author/owner: Noah Grove.
//
// POST /functions/projectOverviewDoc
// Admin-gated — requires an authenticated admin session.

export const DOC_FILENAME = 'ERA-Core-2.0-VDS-Mobile-Project-Overview.html';

function buildDocHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ERA Core v2.0 + VDS Mobile — Project Overview &amp; Technical Architecture</title>
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
  <h1 class="title">ERA Core v2.0 + VDS Mobile<br>Project Overview &amp; Technical Architecture</h1>
  <p class="subtitle">An in-depth record of the modular, event-driven business operating system and its first production vertical — the mobile auto-detailing platform VDS Mobile — including how the two layers connect and communicate.</p>
  <div class="author">Authored &amp; Built by <span>Noah Grove &amp; Shane Muenkel</span> — Owners of ERA &amp; VDS</div>
  <div class="meta">VERSION 1.1 &nbsp;·&nbsp; AUGUST 2026 &nbsp;·&nbsp; CONFIDENTIAL — INTERNAL PROJECT RECORD</div>
  <div class="badge">PROOF OF WORK</div>
</header>
<div class="wrap">
  <div class="toc">
    <h4>Contents</h4>
    <ol>
      <li>Project Mission &amp; Scope</li>
      <li>Why ERA Core Was Built</li>
      <li>How ERA Core Was Built</li>
      <li>What Is ERA Core v2.0?</li>
      <li>What Is VDS Mobile?</li>
      <li>How ERA Core &amp; VDS Mobile Connect &amp; Communicate</li>
      <li>Tier Pricing &amp; Feature Gating</li>
      <li>System Architecture &amp; Technology Stack</li>
      <li>The Data Model (Entities)</li>
      <li>The Engines</li>
      <li>The Portals</li>
      <li>The UI Layer &amp; Design System</li>
      <li>Integrations &amp; External Services</li>
      <li>Partner Network &amp; Incentive Attribution</li>
      <li>Security, Privacy &amp; Audit</li>
      <li>Build Accomplishments (Feature Inventory)</li>
      <li>Summary &amp; Attribution</li>
    </ol>
  </div>

  <h2>1 · Project Mission &amp; Scope</h2>
  <p>ERA Core v2.0 is a <strong>modular, event-driven business operating system</strong> for service-based companies, and <strong>VDS Mobile</strong> is its first production deployment — a mobile auto-detailing business operating out of metro Atlanta, GA. The project's mission was to build a single platform that could run one service business end-to-end <em>and</em> serve as a reusable foundation so future verticals (HVAC, roofing, plumbing, cleaning, etc.) could be launched by <strong>configuring</strong> the system rather than rebuilding it.</p>
  <p>Everything in the business — customers, vehicles, appointments, quotes, pricing, specialists, invoices, memberships, communications, partner referrals, and AI concierge conversations — runs through one database, one set of engines, and one audit trail. There is no synchronization drift between disconnected tools; ERA Core is the single source of truth.</p>
  <div class="callout"><div class="label">Scope of this document</div>This document is a complete, dated record of what was built: the architecture, the data model, every engine, every portal, every integration, and precisely how the generic ERA Core layer and the VDS-specific layer connect and communicate. It is intended as proof of the work completed.</div>

  <h2>2 · Why ERA Core Was Built</h2>
  <p>Service businesses — mobile detailers, HVAC companies, roofers, plumbers — share a universal problem: they run on <strong>disconnected tools</strong>. A typical shop juggles a booking calendar in one app, a CRM in another, invoicing in a third, SMS blasts from a phone, and a spreadsheet for partner referrals. Every tool has its own database, its own login, and its own version of the truth. When a customer moves through the funnel — quote, booking, service, payment, review — the data is manually copy-pasted between systems. Things fall through the cracks. Partners don't get credited. Reminders don't fire. The business owner becomes the integration layer.</p>
  <p>ERA Core was built to solve this at the root. Instead of bolting tools together, the entire business — customers, jobs, scheduling, pricing, communications, payments, partners, and AI — runs on <strong>one database, one set of engines, and one audit trail</strong>. There is no synchronization drift because there is nothing to synchronize.</p>
  <div class="callout"><div class="label">The core insight</div>A service business is not a collection of features — it is a <strong>sequence of events</strong>. A customer is created, a quote is requested, a job is assigned, a service is completed, an invoice is paid, a review is requested. If the platform models those events and lets modules react to them, every downstream behavior — reminders, partner attribution, journey timelines, analytics — falls out naturally, without brittle integrations.</div>
  <h3>2.1 · Why event-driven?</h3>
  <p>Because a service business <em>is</em> a series of events. Every meaningful action — a booking, a completion, a payment — is logged immutably to the <code>SystemEventLog</code>. Downstream modules react to those events instead of being called in a rigid chain. This means a new capability (say, a future "milestone celebration" email) can be added by subscribing to existing events — no rewrite of the booking flow, no risk to the payment flow.</p>
  <h3>2.2 · Why configuration over code?</h3>
  <p>Because every service business is 80% identical and 20% unique. The 80% — scheduling, CRM, invoicing, consent, audit — is the engine. The 20% — service names, pricing, vehicle classifications, terminology, brand colors — is <code>BusinessConfig</code>. A new vertical is a configuration exercise, not a rebuild. VDS Mobile proved this: it added zero engine logic. It configured a <code>BusinessConfig</code> record, connected its Stripe products, and branded its AI concierge.</p>
  <h3>2.3 · Why prove it with a real business first?</h3>
  <p>Because a platform built in a vacuum is a mockup. ERA Core's first tenant — VDS Mobile Detailing — is a <strong>real, revenue-generating business</strong> operating in Metro Atlanta. Every engine, every portal, and every integration has been pressure-tested by real customers, real payments, and real scheduling conflicts. The platform is not a prototype that might work; it is a product that <em>does</em> work, and this document is proof of that work.</p>

  <h2>3 · How ERA Core Was Built</h2>
  <p>ERA Core was built in a deliberate sequence: <strong>engines first, portals second, vertical configuration third</strong>. This ordering ensured the business logic was sound before any UI was built on top of it, and that the UI was always driven by real data — never mocked.</p>
  <h3>3.1 · Build Sequence</h3>
  <table>
    <tr><th>Phase</th><th>What was built</th><th>Why this order</th></tr>
    <tr><td><strong>1 · Data Model</strong></td><td>The entity schema — Customer, Job, Quote, Contractor, Invoice, BusinessConfig, and the audit/journey entities.</td><td>You cannot build engines without knowing what they operate on. The Job-centric model was defined first so every engine had a clear target.</td></tr>
    <tr><td><strong>2 · Engines</strong></td><td>Pricing Engine, Scheduling Engine, Communication Rules Engine, and the shared modules (<code>customer.ts</code>, <code>invoicePaid.ts</code>, <code>partnerIncentive.ts</code>, <code>gcal.ts</code>).</td><td>Engines are the business logic. They were built and tested as backend functions before any portal consumed them, so the logic was provably correct independent of UI.</td></tr>
    <tr><td><strong>3 · Portals</strong></td><td>Member Portal, Specialist Portal, Partner Portal, and Admin Dashboard — each consuming the engines via the SDK.</td><td>With engines proven, portals became thin presentation layers. A portal bug could never corrupt business logic because the logic lived behind the API.</td></tr>
    <tr><td><strong>4 · Vertical Configuration</strong></td><td>VDS Mobile's <code>BusinessConfig</code> — service catalog, pricing, vehicle classifications, membership plans, Stripe product IDs, concierge persona.</td><td>Configuration last proved the platform was truly vertical-agnostic. If VDS had required engine changes, the architecture would have failed its own thesis.</td></tr>
    <tr><td><strong>5 · Integrations</strong></td><td>Stripe (live), Google Calendar (OAuth), Twilio (SMS), OpenAI (Valerie).</td><td>External services were connected after the core was stable, so each integration was a clean add-on to a working system — not a dependency the system was built around.</td></tr>
  </table>
  <h3>3.2 · Key Architecture Decisions</h3>
  <ul>
    <li><strong>Single source of truth.</strong> One database, one <code>BusinessConfig</code>, one audit log. No sync, no drift. This was the foundational decision — everything else follows from it.</li>
    <li><strong>Row-Level Security (RLS) on every entity.</strong> Isolation is enforced at the database layer, not in application code. A customer can only see their own data; a specialist only their jobs; a partner only their profile. Admins manage their tenant. Cross-tenant access is impossible by construction.</li>
    <li><strong>The service role for automation.</strong> Server-side automation (webhooks, auto-assignment, reminders) runs under a service role that bypasses per-user RLS. This lets the Stripe webhook provision a membership or the auto-assigner create a Job without a human session — while every action is still audited.</li>
    <li><strong>Shared modules, not copied code.</strong> Logic used by more than one function lives in <code>base44/shared/</code>. <code>invoicePaid.ts</code> is used by both the admin "mark paid" button <em>and</em> the Stripe webhook — one code path, one audit trail, no drift.</li>
    <li><strong>Server-side pricing.</strong> Quotes are always recomputed from <code>BusinessConfig</code> on the server. Client-supplied prices are discarded. A customer cannot forge a quote.</li>
    <li><strong>Consent-first communications.</strong> No message goes out without a consent flag check. Suppressed messages are logged with a reason — never silently dropped.</li>
  </ul>
  <h3>3.3 · Technology Choices</h3>
  <ul>
    <li><strong>Base44 Backend-as-a-Service</strong> was chosen so the team could focus on business logic, not infrastructure. Managed auth, database, serverless functions, automations, and hosting eliminated months of plumbing.</li>
    <li><strong>React + Vite + Tailwind</strong> for the frontend — fast, modern, and publishable to iOS/Android from one codebase.</li>
    <li><strong>Deno Deploy serverless functions</strong> for external API orchestration — Stripe webhooks, Google Calendar, Twilio, OpenAI.</li>
    <li><strong>framer-motion</strong> for motion design; <strong>recharts</strong> for analytics; <strong>react-leaflet</strong> for maps; <strong>three.js</strong> for 3D.</li>
  </ul>

  <h2>4 · What Is ERA Core v2.0?</h2>
  <p>ERA Core is the <strong>engine</strong> — a vertical-agnostic platform providing the foundational capabilities any field-service business needs. It is deliberately separated from the specifics of any one industry.</p>
  <div class="cards">
    <div class="card"><div class="k">Event-Driven</div><div class="v">Every meaningful action raises a system event other modules react to — no monolithic logic.</div></div>
    <div class="card"><div class="k">Single Source of Truth</div><div class="v">All business data lives in one database. No sync, no drift, no duplicate records across tools.</div></div>
    <div class="card"><div class="k">Configuration Over Code</div><div class="v">Services, pricing, hours, scheduling rules, and feature flags are data — not hardcoded.</div></div>
    <div class="card"><div class="k">Multi-Tenant Ready</div><div class="v">Each business is isolated by a <code>business_id</code>, ready for many verticals on one engine.</div></div>
    <div class="card"><div class="k">Rules-Driven Comms</div><div class="v">Every SMS/email is evaluated by a central Communication Rules Engine before delivery.</div></div>
    <div class="card"><div class="k">Audit-First</div><div class="v">Every event and every suppressed message is recorded immutably to the SystemEventLog.</div></div>
  </div>

  <h2>5 · What Is VDS Mobile?</h2>
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

  <h2>6 · How ERA Core &amp; VDS Mobile Connect &amp; Communicate</h2>
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

  <h2>7 · Tier Pricing &amp; Feature Gating</h2>
  <p>ERA Core is sold as a SaaS platform to service businesses. Each tier unlocks more capability — from a branded website and booking flow at Basic, to AI agents and advanced analytics at Enterprise. Feature gating is enforced at two layers: the <strong>plan tier</strong> (checked via <code>planFeatures</code>) and the per-automation <strong>feature flags</strong> in <code>BusinessConfig</code>.</p>
  <h3>7.1 · The Tiers</h3>
  <table>
    <tr><th>Tier</th><th>Monthly</th><th>Setup Fee</th><th>Best For</th></tr>
    <tr><td><strong>Basic</strong></td><td>$199/mo</td><td>$750 one-time</td><td>Launch — branded website, booking, scheduling, payments, admin dashboard.</td></tr>
    <tr><td><strong>Foundation</strong></td><td>$499/mo</td><td>$1,200 one-time</td><td>Grow — adds member portal, specialist portal, simple automations (reminders, welcome emails).</td></tr>
    <tr><td><strong>Growth</strong></td><td>TBD</td><td>TBD</td><td>Scale — adds AI SMS agent, AI voice agent, advanced customer engagement.</td></tr>
    <tr><td><strong>Enterprise</strong></td><td>TBD</td><td>TBD</td><td>Full platform — partner/referral engine, advanced analytics, unlimited scale.</td></tr>
  </table>
  <h3>7.2 · Ad Management Add-On</h3>
  <p>A $500/month add-on available on every tier. When enabled, it unlocks the in-platform Google Ads management flow so a tenant can create, fund, and manage real ad campaigns that promote their published site — without leaving ERA Core.</p>
  <h3>7.3 · Feature Matrix by Tier</h3>
  <table>
    <tr><th>Feature</th><th>Basic</th><th>Foundation</th><th>Growth</th><th>Enterprise</th></tr>
    <tr><td>Branded website &amp; AI chat widget</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Core engines (communication, workflow, CRM)</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Booking &amp; scheduling</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Payments (Stripe)</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Admin dashboard</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Self-serve domain, email &amp; phone</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Customer member portal</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Specialist / employee portal</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>Simple automations (reminders, welcome)</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
    <tr><td>AI SMS agent</td><td>—</td><td>—</td><td>✓</td><td>✓</td></tr>
    <tr><td>AI voice agent</td><td>—</td><td>—</td><td>✓</td><td>✓</td></tr>
    <tr><td>Partner / referral engine</td><td>—</td><td>—</td><td>—</td><td>✓</td></tr>
    <tr><td>Advanced analytics &amp; reporting</td><td>—</td><td>—</td><td>—</td><td>✓</td></tr>
    <tr><td>Ad Management</td><td>add-on</td><td>add-on</td><td>add-on</td><td>included</td></tr>
  </table>
  <h3>7.4 · How Gating Works</h3>
  <p>Feature access is checked at two levels:</p>
  <ul>
    <li><strong>Plan tier gate</strong> — The <code>planFeatures</code> module maps each tier to a set of boolean capabilities (e.g. <code>email_automations</code>, <code>sms_automations</code>, <code>member_portal</code>, <code>specialist_portal</code>, <code>partner_engine</code>, <code>ai_sms_agent</code>). The frontend <code>FeatureGate</code> component wraps any route or UI element and hides it if the current tier doesn't permit the feature.</li>
    <li><strong>Per-automation feature flags</strong> — Within the tier ceiling, <code>BusinessConfig.feature_flags</code> and <code>automation_settings</code> provide granular on/off toggles. For example, <code>twilio_sms_enabled</code> gates SMS delivery independently of the tier; individual automation toggles (<code>welcome_email</code>, <code>reminder_sms</code>, etc.) let a tenant disable a specific automation without losing the tier.</li>
  </ul>
  <div class="callout"><div class="label">Subscription enforcement</div>The Stripe webhook writes <code>plan_tier</code>, <code>subscription_status</code>, <code>ad_management_enabled</code>, and <code>setup_fee_paid</code> to both <code>BusinessConfig</code> (the authoritative gate the tenant site reads) and <code>EraAccount</code> (the billing mirror the account portal reads) — atomically, on confirmation only. A tier change never comes from a UI button; it comes from Stripe.</div>

  <h2>8 · System Architecture &amp; Technology Stack</h2>
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

  <h2>9 · The Data Model (Entities)</h2>
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

  <h2>10 · The Engines</h2>
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

  <h2>11 · The Portals</h2>
  <table>
    <tr><th>Portal</th><th>Who uses it</th><th>What it does</th></tr>
    <tr><td><strong>Member Portal</strong></td><td>Car owners</td><td>Vehicle garage, VDS Gold enrollment &amp; management, appointment booking, service history, account &amp; consent settings.</td></tr>
    <tr><td><strong>Specialist Portal</strong></td><td>Independent detailers</td><td>Job board with full lifecycle (Assigned → Driving → Arrived → In Progress → Quality Check → Completed → Photos), availability editor, profile, consultation-status controls, completion &amp; photo upload.</td></tr>
    <tr><td><strong>Partner Portal</strong></td><td>Dealership salespeople &amp; strategic partners</td><td>Overview of referral metrics &amp; incentive earnings, referral link/QR, Resource Center (welcome packet + vehicle care guide).</td></tr>
    <tr><td><strong>Admin Dashboard</strong></td><td>ERA Systems administrators</td><td>Overview &amp; revenue metrics, appointments, jobs, quotes, invoices (incl. "Charge via Stripe"), contractors, partners, business-dev analytics, client directory / journey, messages, and migration tools.</td></tr>
  </table>

  <h2>12 · The UI Layer &amp; Design System</h2>
  <p>The UI is what makes ERA Core feel <strong>alive</strong>. It is not a skin over the engines — it is the primary way users experience the platform. Every portal, every flow, and every animation was designed to make a complex, event-driven system feel simple, fast, and inevitable.</p>
  <h3>12.1 · Design Token System</h3>
  <p>The entire UI is driven by CSS custom properties defined in <code>index.css</code> and mapped to Tailwind classes in <code>tailwind.config.js</code>. This is the white-label theming engine: a tenant's <code>BusinessConfig.brand_colors</code> are injected as CSS variables at runtime, and every component — from buttons to charts to the loading screen — picks up the tenant's theme automatically.</p>
  <div class="cards">
    <div class="card"><div class="k">VDS Theme</div><div class="v">Obsidian black + metallic gold — the detailing brand.</div></div>
    <div class="card"><div class="k">ERA Marketing</div><div class="v">Deep black + emerald green — the platform brand.</div></div>
    <div class="card"><div class="k">Custom Tenants</div><div class="v">Any brand colors via BusinessConfig — injected at runtime.</div></div>
  </div>
  <h3>12.2 · Component Architecture</h3>
  <ul>
    <li><strong>shadcn/ui</strong> primitives for forms, dialogs, tables, and navigation — accessible, composable, and consistent.</li>
    <li><strong>lucide-react</strong> for icons — only icons that exist, never a broken import.</li>
    <li><strong>framer-motion</strong> for motion — page transitions, scroll reveals, hover lifts, and the branded loading overlay.</li>
    <li><strong>Custom components</strong> for domain-specific UI: <code>VehicleCard</code>, <code>JobCard</code>, <code>AppointmentCard</code>, <code>ChatWidget</code>, <code>BookingCalendar</code>, <code>ServicePicker</code>, <code>ConditionSelector</code>.</li>
  </ul>
  <h3>12.3 · The Portal System</h3>
  <p>Every portal shares a common shell pattern — a persistent sidebar (desktop) / dropdown (mobile), a branded header, and a content area that swaps tabs without a full page reload. The <code>PortalShell</code> component wraps the member, specialist, and partner portals; the <code>EraAdminShell</code> wraps the ERA staff admin portal. This gives users a consistent navigation mental model across every role.</p>
  <table>
    <tr><th>Portal</th><th>Key UI Flows</th></tr>
    <tr><td><strong>Member Portal</strong></td><td>Vehicle garage → VDS Gold enrollment → appointment booking (service picker → condition selector → calendar → confirmation) → service history → account settings.</td></tr>
    <tr><td><strong>Specialist Portal</strong></td><td>Job board (assigned → accepted → driving → arrived → in progress → quality check → completed) → availability editor → completion modal with photo upload.</td></tr>
    <tr><td><strong>Partner Portal</strong></td><td>Overview metrics → referral link/QR → referrals list → resource center (welcome packet + care guides).</td></tr>
    <tr><td><strong>Admin Dashboard</strong></td><td>Overview KPIs → appointments calendar → jobs board → quotes → invoices (with "Charge via Stripe") → contractors → partners → business-dev analytics → client journey → messages → settings → website designer.</td></tr>
    <tr><td><strong>ERA Admin Portal</strong></td><td>Cross-tenant overview → client list → client detail (business info, plan tier, domain status, live site preview) — staff-only.</td></tr>
  </table>
  <h3>12.4 · The Branded Transition Overlay</h3>
  <p>Every in-app navigation triggers a branded full-screen transition: the overlay closes (a circular wipe shrinks to center), the page swaps under the cover, and the overlay opens (the circle grows outward) to reveal the new page. The overlay is <strong>tenant-specific</strong> — VDS gets gold-flake particles and a rotating gold ring; ERA Systems gets a custom logo loading video; other tenants get a clean branded ring in their own brand color. This makes the platform feel premium and alive, not like a static web form.</p>
  <h3>12.5 · Real-Time Updates</h3>
  <p>Key lists — jobs, appointments, partner metrics — subscribe to entity changes via the SDK's <code>subscribe()</code> method. When a job is assigned, the specialist's board updates instantly without a refresh. When an invoice is paid, the admin dashboard updates in real time. This is what makes ERA Core feel like a <strong>living system</strong>, not a page-reload app.</p>
  <h3>12.6 · Responsive &amp; Native-Ready</h3>
  <p>Every portal is built mobile-first with Tailwind responsive breakpoints and is publishable to iOS/Android from the same React codebase. The specialist portal — used in the field on a phone — is optimized for touch: large tap targets, swipe-friendly job cards, and a camera-integrated photo upload flow.</p>
  <h3>12.7 · The Chat Widget</h3>
  <p>A floating, glassmorphism chat widget on the public site connects customers directly to Valerie (the AI concierge). It can generate quotes, check availability, and book appointments — all grounded in the live <code>BusinessConfig</code> catalog. The widget is the first touchpoint for many customers and is designed to feel like texting a knowledgeable concierge, not filling out a form.</p>

  <h2>13 · Integrations &amp; External Services</h2>
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

  <h2>14 · Partner Network &amp; Incentive Attribution</h2>
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

  <h2>15 · Security, Privacy &amp; Audit</h2>
  <ul>
    <li><strong>Row-Level Security (RLS)</strong> on every entity — customers only see their own data; specialists see only their jobs; partners see only their profile; admins manage everything.</li>
    <li><strong>Consent-first</strong>: no SMS or email is sent without an explicit consent flag; suppressed messages are logged with a reason.</li>
    <li><strong>Immutable audit</strong>: every event and every suppressed communication is written to the SystemEventLog.</li>
    <li><strong>Server-side pricing</strong>: quotes are always recomputed from BusinessConfig — customers cannot forge a price.</li>
    <li><strong>Ownership-verified actions</strong>: appointment changes require verified identity, never a guessable email/phone alone.</li>
    <li><strong>Admin-gated documentation</strong>: architecture documents (like this one) are generated server-side and never shipped in the public client bundle.</li>
  </ul>

  <h2>16 · Build Accomplishments (Feature Inventory)</h2>
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

  <h2>17 · Summary &amp; Attribution</h2>
  <p>ERA Core v2.0 is the engine. VDS Mobile is the proof it works for one vertical. The two layers connect through a single BusinessConfig configuration record, communicate through an event-driven architecture and shared service-role modules, and inherit ~90% of their capability from the generic platform. Onboarding a future vertical is a matter of configuration, not a rebuild.</p>
  <ul>
    <li>One platform, many verticals.</li>
    <li>Configure, don't rebuild.</li>
    <li>Every action audited, every customer communication consent-checked.</li>
    <li>AI concierge, scheduling, pricing, payments, and partner growth — built in.</li>
  </ul>
  <div class="callout"><div class="label">Project Record</div>This document is a complete, dated record of the ERA Core v2.0 + VDS Mobile platform as built. It is intended as proof of the work completed and as an architectural reference for future verticals.</div>
</div>
<footer>
  <div class="gold">ERA SYSTEMS LLC</div>
  <p>Authored &amp; built by <strong>Noah Grove &amp; Shane Muenkel</strong> — Owners of ERA &amp; VDS · ERA Core v2.0 · VDS Mobile · July 2026.<br>Confidential — internal project record. For a tailored vertical-onboarding walkthrough, contact your ERA partner.</p>
</footer>
</body>
</html>`;
}

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Unauthorized.' }, { status: 403 });
    }

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