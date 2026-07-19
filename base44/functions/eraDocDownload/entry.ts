// ERA Core Onboarding Guide — admin-gated download.
// The guide HTML is generated server-side and returned only to authenticated
// admin users. This prevents the restricted architectural documentation from
// being shipped in the public client bundle (CWE-200 / OWASP A01).
//
// POST /functions/eraDocDownload
// Auth: requires an authenticated admin session (base44.auth.me().role === 'admin').

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';

export const GUIDE_FILENAME = 'ERA-Core-Onboarding-Guide.html';

function buildGuideHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ERA Core — System Overview &amp; Vertical Onboarding Guide</title>
<style>
  :root { --gold:#D4AF37; --gold-light:#F5E17A; --obsidian:#0A0B0D; --asphalt:#14161A; --vapor:#E2E8F0; --muted:#94A3B8; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--obsidian); color:var(--vapor);
    font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    line-height:1.7; -webkit-font-smoothing:antialiased; }
  .mono { font-family:'Space Mono','Courier New',monospace; }
  .wrap { max-width:860px; margin:0 auto; padding:0 28px 80px; }
  header { text-align:center; padding:90px 28px 70px; border-bottom:1px solid rgba(212,175,55,0.15);
    background:radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 60%); }
  .brand { letter-spacing:5px; font-size:13px; font-weight:700; color:var(--gold); margin-bottom:18px; }
  .brand .sep { color:var(--muted); margin:0 10px; }
  h1.title { font-size:46px; line-height:1.15; font-weight:700; margin:0 0 14px; color:#fff; letter-spacing:-0.5px; }
  .subtitle { color:var(--muted); font-size:17px; max-width:560px; margin:0 auto; }
  .badge { display:inline-block; margin-top:24px; padding:6px 16px; border:1px solid var(--gold);
    border-radius:999px; color:var(--gold); font-size:12px; letter-spacing:2px; font-weight:700; }
  h2 { font-size:28px; font-weight:700; margin:64px 0 8px; color:#fff; letter-spacing:-0.3px;
    padding-bottom:12px; border-bottom:1px solid rgba(212,175,55,0.2); }
  h3 { font-size:20px; font-weight:600; margin:36px 0 10px; color:var(--gold-light); }
  h4 { font-size:15px; font-weight:700; margin:26px 0 6px; color:#fff; letter-spacing:0.5px; text-transform:uppercase; }
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
    padding:28px; margin:24px 0; font-family:'Space Mono',monospace; font-size:13px; line-height:1.7;
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
  @media (max-width:640px) { h1.title { font-size:32px; } .wrap { padding:0 18px 60px; } }
</style>
</head>
<body>
<header>
  <div class="brand">ERA SYSTEMS LLC <span class="sep">·</span> VDS MOBILE</div>
  <h1 class="title">ERA Core — System Overview<br>&amp; Vertical Onboarding Guide</h1>
  <p class="subtitle">A modular, event-driven business operating system for service-based companies — and how a new vertical connects to it.</p>
  <div class="badge">VERSION 1.0</div>
</header>
<div class="wrap">
  <div class="toc">
    <h4>Contents</h4>
    <ol>
      <li>What Is ERA Core?</li>
      <li>Core Architectural Principles</li>
      <li>The ERA Core Data Model</li>
      <li>The Engines</li>
      <li>How VDS Mobile Connects</li>
      <li>Onboarding a New Vertical</li>
      <li>What Changes vs. What Stays</li>
      <li>Compliance, Audit &amp; Trust</li>
      <li>Summary</li>
    </ol>
  </div>

  <h2>1 · What Is ERA Core?</h2>
  <p>ERA Core is a <strong>modular, event-driven business operating system</strong> for service-based companies. It provides the foundational platform — data model, scheduling, CRM, pricing, communications, payments, and AI automation — that any field-service business can run on.</p>
  <p>ERA Core is <strong>vertical-agnostic by design</strong>. A single business (for example, <em>VDS Mobile</em>, a mobile auto-detailing company) is simply one <strong>configuration layer</strong> deployed on top of the same engine. Onboarding a new vertical — HVAC, Roofing, Landscaping, Plumbing, Cleaning — does <strong>not</strong> require rebuilding the platform. It requires configuring it.</p>

  <h2>2 · Core Architectural Principles</h2>
  <div class="cards">
    <div class="card"><div class="k">Event-Driven</div><div class="v">Every action raises a system event that other modules react to — no monolithic logic.</div></div>
    <div class="card"><div class="k">Single Source of Truth</div><div class="v">All business data lives in one database — no sync drift between tools.</div></div>
    <div class="card"><div class="k">Configuration Over Code</div><div class="v">Services, pricing, hours, and flags are data — not hardcoded.</div></div>
    <div class="card"><div class="k">Multi-Tenant Ready</div><div class="v">Each business is isolated by a business_id.</div></div>
    <div class="card"><div class="k">Rules-Driven Comms</div><div class="v">All SMS/email pass through a central Communication Rules Engine.</div></div>
    <div class="card"><div class="k">Audit-First</div><div class="v">Every event and suppressed message is recorded immutably.</div></div>
  </div>

  <h2>3 · The ERA Core Data Model</h2>
  <p>ERA Core is organized around a central <strong>Job</strong> hub. Everything in the business relates back to a Job.</p>
  <div class="diagram">                     +------------------+
                     |  BusinessConfig  |  <- configuration layer (per vertical)
                     +--------+---------+
                              | drives
              +---------------+---------------+
              v               v               v
        +----------+   +----------+   +--------------+
        | Customer |   |   Job    |   |  Contractor  |
        |  (CRM)   |-->| (Hub)    |<--| (Specialist) |
        +----+-----+   +----+-----+   +--------------+
             |               |
             |               +--> Quote       (draft pricing -> Job)
             |               +--> Invoice     (payment for the Job)
             |               +--> Photos      (before / after)
             |               +--> SystemEventLog (audit trail)
             |
             +--> CustomerJourney      (relationship timeline)
             +--> ConversationHistory  (AI concierge transcripts)</div>
  <h3>Entity Roles</h3>
  <table>
    <tr><th>Entity</th><th>Role in ERA Core</th></tr>
    <tr><td><strong>BusinessConfig</strong></td><td>The single source of truth for how this business operates — service catalog, pricing rules, hours, scheduling rules, classifications, membership plans, feature flags, branding. This is the vertical's configuration layer.</td></tr>
    <tr><td><strong>Customer</strong></td><td>The CRM entity. Holds profile, contact preferences, consent, lifetime value, and review status.</td></tr>
    <tr><td><strong>Job</strong></td><td>The operational hub. Every service performed creates a Job — linking customer, asset, specialist, schedule, quote, invoice, and photos.</td></tr>
    <tr><td><strong>Quote</strong></td><td>A draft pricing configuration from the Pricing Engine. Converts into a Job once approved.</td></tr>
    <tr><td><strong>Contractor</strong></td><td>The independent specialist/technician profile. Sets own availability and service areas — no clock-in or timesheets.</td></tr>
    <tr><td><strong>Invoice</strong></td><td>Payment record for a completed Job. Supports cash, card, check, and Stripe.</td></tr>
    <tr><td><strong>CustomerJourney</strong></td><td>Auto-generated, immutable timeline of every customer interaction.</td></tr>
    <tr><td><strong>SystemEventLog</strong></td><td>Immutable audit trail of every platform event and every suppressed communication.</td></tr>
    <tr><td><strong>ConversationHistory</strong></td><td>Transcript history for the AI concierge, keyed by customer phone.</td></tr>
  </table>
  <div class="callout"><div class="label">Note</div>Vertical-specific entities (e.g., VDS Mobile's MemberVehicle and VehicleSubscription) sit alongside the core. They are owned by the vertical's configuration, not by ERA Core itself.</div>

  <h2>4 · The Engines</h2>
  <p>ERA Core ships with a set of reusable engines that power every vertical.</p>
  <h3>Pricing Engine</h3>
  <ul>
    <li>Reads entirely from BusinessConfig — no hardcoded prices.</li>
    <li>Computes quotes from: service x classification x condition multiplier x add-ons.</li>
    <li>Condition can affect both price (multiplier) and duration (added minutes).</li>
    <li>Always computed server-side; client-supplied prices are discarded to prevent fraud.</li>
  </ul>
  <h3>Scheduling Engine</h3>
  <ul>
    <li>Checks availability against business hours, buffers, minimum notice, and max bookings/day.</li>
    <li>Auto-assigns the best-fit specialist by skill, weekly availability, blocked dates, service area, and workload.</li>
    <li>Mirrors bookings to a shared calendar while the database remains the source of truth.</li>
    <li>Prevents double-booking at both the calendar and specialist level.</li>
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
  <p>If any rule blocks the message, it is suppressed and logged (with the reason) to the SystemEventLog — never silently dropped. When SMS is suppressed, reminders fall back to email automatically.</p>
  <h3>AI Concierge</h3>
  <ul>
    <li>SMS-based AI assistant that answers questions, generates quotes, books appointments, and checks membership status.</li>
    <li>Grounded in the live BusinessConfig catalog and the customer's own history.</li>
    <li>Escalates complex or sensitive requests to a human specialist.</li>
    <li>All actions logged to the SystemEventLog and ConversationHistory.</li>
  </ul>
  <h3>Payments &amp; Memberships</h3>
  <ul>
    <li>One-time services billed offline (cash/card/check) and tracked via Invoices.</li>
    <li>Recurring memberships billed through Stripe subscriptions.</li>
    <li>Webhooks provision membership access only after validating against BusinessConfig — preventing unauthorized premium features.</li>
  </ul>

  <h2>5 · How VDS Mobile Connects to ERA Core</h2>
  <p>VDS Mobile is the first vertical deployed on ERA Core. It demonstrates how a specific business maps onto the generic engine.</p>
  <table>
    <tr><th>ERA Core (generic)</th><th>VDS Mobile (configured)</th></tr>
    <tr><td>BusinessConfig</td><td>"VDS Mobile" — detailing services, 4 vehicle classifications, 2 pricing groups, VDS Gold membership</td></tr>
    <tr><td>Customer</td><td>A car owner</td></tr>
    <tr><td>Job</td><td>A detailing appointment (Full Detail, Exterior Detail, etc.)</td></tr>
    <tr><td>Quote</td><td>A custom detailing quote (vehicle + condition + services -> price)</td></tr>
    <tr><td>Contractor</td><td>A mobile detail specialist</td></tr>
    <tr><td>Classification</td><td>Coupe, Sedan, Mid-Size SUV, Truck / 3-Row SUV</td></tr>
    <tr><td>Condition multiplier</td><td>Light / Moderate / Heavy wear (affects price + duration)</td></tr>
    <tr><td>Membership</td><td>VDS Gold (recurring monthly, per-vehicle, via Stripe)</td></tr>
    <tr><td>AI Concierge</td><td>"Valerie" — SMS concierge for quotes &amp; booking</td></tr>
    <tr><td>Vertical entities</td><td>MemberVehicle, VehicleSubscription, ServiceRecord</td></tr>
  </table>
  <div class="callout"><div class="label">Key Insight</div>VDS Mobile adds no new engine logic. It configures BusinessConfig, registers its services and pricing, defines its vehicle classifications, and connects its Stripe products. Everything else — scheduling, CRM, pricing, communications, audit — is inherited from ERA Core.</div>

  <h2>6 · Onboarding a New Vertical (HVAC or Roofing)</h2>
  <p>This is the exact path a new partner takes. Notice that no engine code changes are required.</p>
  <h4>Step 1 — Configure BusinessConfig</h4>
  <pre><code>{
  "business_id": "acme-hvac",
  "business_name": "Acme HVAC",
  "timezone": "America/New_York",
  "business_hours": [ /* Mon-Fri 8-18, Sat 9-14, Sun closed */ ],
  "scheduling_rules": {
    "booking_buffer_hours": 2,
    "min_notice_hours": 24,
    "slot_interval_minutes": 120,
    "max_bookings_per_day": 6
  }
}</code></pre>
  <h4>Step 2 — Define the Service Catalog</h4>
  <table>
    <tr><th>VDS Mobile</th><th>HVAC</th><th>Roofing</th></tr>
    <tr><td>Full Detail</td><td>AC Tune-Up</td><td>Roof Inspection</td></tr>
    <tr><td>Exterior Detail</td><td>System Diagnostics</td><td>Shingle Repair</td></tr>
    <tr><td>Ceramic Coating</td><td>Full System Install</td><td>Full Roof Replacement</td></tr>
  </table>
  <p>Each service stores tiers (price + duration) keyed by the relevant classification.</p>
  <h4>Step 3 — Define Classifications &amp; Pricing Groups</h4>
  <ul>
    <li>HVAC: residential_split, commercial_rooftop, mini_split, heat_pump</li>
    <li>Roofing: asphalt_shingle, metal, tile, flat_commercial</li>
  </ul>
  <h4>Step 4 — Define Condition / Complexity Multipliers</h4>
  <p>VDS uses Light / Moderate / Heavy wear. A vertical can rename this concept:</p>
  <ul>
    <li>HVAC: routine / dirty_filters / neglected_system</li>
    <li>Roofing: minor / moderate / severe damage</li>
  </ul>
  <p>Each multiplier carries a price multiplier and a duration_add_minutes so estimates scale realistically.</p>
  <h4>Step 5 — Register Specialists</h4>
  <p>Create Contractor profiles for each technician. They set their own weekly availability, blocked dates, skills, and service areas. The scheduling engine handles the rest.</p>
  <h4>Step 6 — Connect Payments</h4>
  <ul>
    <li>One-time work -> tracked via Invoices (cash/card/check).</li>
    <li>Recurring plans (e.g., an HVAC "Comfort Club") -> Stripe subscription products, referenced from BusinessConfig.</li>
  </ul>
  <h4>Step 7 — Brand the AI Concierge</h4>
  <p>Give the concierge a name and persona for the vertical (VDS calls theirs "Valerie"). The system prompt is built from BusinessConfig, so the same engine speaks the new vertical's language automatically.</p>
  <h4>Step 8 — Go Live</h4>
  <p>Once BusinessConfig is populated and specialists are registered, the vertical inherits:</p>
  <div class="pillrow">
    <span class="pill">Pricing &amp; booking page</span>
    <span class="pill">Member / customer portal</span>
    <span class="pill">Specialist portal</span>
    <span class="pill">Admin dashboard</span>
    <span class="pill">Automated reminders</span>
    <span class="pill">Review requests</span>
    <span class="pill">AI concierge</span>
  </div>

  <h2>7 · What Changes vs. What Stays</h2>
  <table>
    <tr><th></th><th>Stays the Same (ERA Core)</th><th>Changes Per Vertical (BusinessConfig)</th></tr>
    <tr><td><strong>Data model</strong></td><td>Customer, Job, Quote, Invoice, Contractor, CustomerJourney, SystemEventLog</td><td>Classifications, pricing groups, services, condition labels</td></tr>
    <tr><td><strong>Engines</strong></td><td>Pricing, Scheduling, Communication Rules, AI Concierge, Payments</td><td>Service catalog, hours, buffers, skill names</td></tr>
    <tr><td><strong>Portals</strong></td><td>Admin, Specialist, Member/Customer layouts</td><td>Branding, labels, vertical-specific entities</td></tr>
    <tr><td><strong>Comms</strong></td><td>Consent enforcement, suppression logging, email fallback</td><td>Message copy, concierge persona, review link</td></tr>
  </table>
  <div class="callout"><div class="label">Ratio</div>Roughly 90% inherited / 10% configured. This is what makes onboarding a new vertical a matter of days, not months.</div>

  <h2>8 · Compliance, Audit &amp; Trust</h2>
  <ul>
    <li>Consent-first: No SMS or email is sent without an explicit consent flag on the customer record.</li>
    <li>Immutable audit: Every event and every suppressed message is written to the SystemEventLog with a reason.</li>
    <li>Customer journey: Administrators get a full, human-readable relationship timeline per customer.</li>
    <li>Server-side pricing: Quotes are always recomputed server-side from BusinessConfig — customers cannot forge a price.</li>
    <li>Ownership-verified actions: Appointment changes require verified identity — never a guessable email or phone alone.</li>
  </ul>

  <h2>9 · Summary</h2>
  <p>ERA Core is the engine. VDS Mobile is proof it works for one vertical. Your business — HVAC, Roofing, or any field service — is the next configuration layer on the same proven foundation:</p>
  <ul>
    <li>One platform, many verticals.</li>
    <li>Configure, don't rebuild.</li>
    <li>Every action audited, every customer communication consent-checked.</li>
    <li>AI concierge, scheduling, pricing, and payments built in.</li>
  </ul>
</div>
<footer>
  <div class="gold">ERA SYSTEMS LLC</div>
  <p>Prepared by the ERA Systems LLC team. For a tailored onboarding walkthrough for your vertical, contact your ERA partner.</p>
</footer>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Server-side admin verification — the only trust boundary for this document.
    // Client-side role checks are not relied upon (CWE-601 / OWASP A01).
    let me;
    try {
      me = await base44.auth.me();
    } catch {
      me = null;
    }
    if (!me || me.role !== 'admin') {
      return Response.json({ error: 'Admin access required.' }, { status: 403 });
    }

    return Response.json({
      success: true,
      html: buildGuideHtml(),
      filename: GUIDE_FILENAME,
    });
  } catch (error) {
    console.error('eraDocDownload error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});