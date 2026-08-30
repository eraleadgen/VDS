# ERA Core — Multi-Tenant Architecture Extraction

> **Purpose:** A complete specification of the platform machinery that makes VDS a *client* of ERA Systems rather than the whole application. This documents the tenant isolation, hostname resolution, billing, onboarding, staff authorization, and feature-gating systems as they genuinely exist in the live codebase and database today (August 30, 2026).

---

## 1. TENANT ISOLATION: The `business_id` Scoping Pattern

### 1.1 The Core Pattern

Every operational entity in ERA Core carries a `business_id` field (string, default `"vds"`) that scopes the record to a single tenant. This field is the tenant boundary. RLS rules enforce that an authenticated user can only access records where `data.business_id` matches their own `user.data.business_id`.

The resolution helpers live in `base44/shared/tenantContext.ts`:

```typescript
// Resolution priority for authenticated endpoints:
//   1. Explicit business_id in the request body (internal function-to-function calls)
//   2. Authenticated user's User.business_id
//   3. Fallback 'vds' (single-tenant safety net)

const FALLBACK_BUSINESS_ID = 'vds';

// Reads User.business_id via the service role (auth.me() doesn't return custom fields reliably)
async function getUserBusinessId(base44, me) {
  const u = await base44.asServiceRole.entities.User.get(me.id);
  return (u && u.business_id) || FALLBACK_BUSINESS_ID;
}

// Stamps business_id on every create payload (never trusts the client to set it)
function stampCreate(data, bizId) {
  return { ...data, business_id: data.business_id || bizId };
}
```

### 1.2 Entities That Carry `business_id` (Tenant-Scoped)

| Entity | `business_id` Default | RLS Pattern | Notes |
|---|---|---|---|
| **BusinessConfig** | `"vds"` | `data.business_id` + `role: admin` | The tenant's configuration record itself. One active config per business_id. |
| **Job** | `"vds"` | `data.business_id` + (ownership OR customer match OR admin) | Central operational entity. |
| **Customer** | `"vds"` | `data.business_id` + (linked_user_id OR phone/email match OR admin) | CRM entity. |
| **MemberVehicle** | `"vds"` | `data.business_id` + (created_by_id OR admin) | |
| **Quote** | `"vds"` | `data.business_id` + (created_by_id OR customer match OR admin) | |
| **Invoice** | `"vds"` | `data.business_id` + (created_by_id OR customer_id match OR admin) | |
| **VehicleSubscription** | `"vds"` | `data.business_id` + (created_by_id OR customer_id match OR admin) | |
| **Appointment** | `"vds"` | `data.business_id` + (created_by_id OR customer match OR admin) | Deprecated mirror of Job. |
| **Contractor** | `"vds"` | `data.business_id` + (user_id OR linked_user_ids OR admin) | Specialist profiles. |
| **Partner** | `"vds"` | `data.business_id` + (linked_user_id OR admin) | |
| **PartnerReferral** | `"vds"` | `data.business_id` + admin only | |
| **CustomerJourney** | `"vds"` | `data.business_id` + (customer_id match OR admin) | |
| **SystemEventLog** | `"vds"` | `data.business_id` + admin only | Audit trail. |
| **ConversationHistory** | `"vds"` | `data.business_id` + admin only | SMS history. |
| **AILog** | `"vds"` | `data.business_id` + admin only | |
| **GoogleReview** | `"vds"` | `data.business_id` + admin only | Cached reviews. |
| **TenantMapping** | `"vds"` | `data.business_id` + admin only | Maps hostnames/phone numbers to tenants. |

### 1.3 Entities WITHOUT `business_id` (Ownership-Scoped or Special)

| Entity | RLS Pattern | Why No `business_id` |
|---|---|---|
| **EraAccount** | `created_by_id` OR `owner_user_id` | Exists *before* any tenant is provisioned. `business_id` is `null` until onboarding completes. Ownership-based because every tenant owner has role `admin`, so a business_id + admin check would be a cross-tenant hole. |
| **OnboardingSession** | `created_by_id` only | Same reason — the tenant doesn't exist yet. Strictly ownership-based, no admin bypass. |
| **EraStaff** | Deny-all (`role: 'era_staff'` — no user holds this role) | Cross-tenant staff allowlist. Only the service role can read/write. See §5. |
| **User** | Platform-managed | Built-in entity. `business_id` is a custom field stamped during onboarding. |

### 1.4 The Standard RLS Rule Structure

Every tenant-scoped entity uses the same `$and` pattern: business_id match AND (role/ownership condition). Example from **Job**:

```json
{
  "read": {
    "$and": [
      { "data.business_id": "{{user.data.business_id}}" },
      {
        "$or": [
          { "created_by_id": "{{user.id}}" },
          { "data.customer_email": "{{user.email}}" },
          { "data.customer_phone": "{{user.data.phone}}" },
          { "user_condition": { "role": "admin" } }
        ]
      }
    ]
  }
}
```

The `$and` is critical: it ensures the business_id check is always applied. Without it, an `$or` with `role: admin` would let any tenant admin read any tenant's records. The business_id clause is always the first operand, making it a hard boundary that the `$or` conditions can only narrow within, never bypass.

**Write operations** (create/update/delete) follow the same `$and` pattern but are more restrictive — typically `business_id` + `role: admin` only, with create allowing `created_by_id` for self-service flows (booking, member vehicle creation).

### 1.5 The `asServiceRole` Escape Hatch and Its Guardrails

Backend functions use `base44.asServiceRole.entities.*` to bypass RLS for cross-tenant operations (webhooks, automations, hostname resolution). This is necessary but dangerous — the service role can read/write any record. The codebase enforces two guardrails:

1. **Explicit `business_id` filtering**: Every `asServiceRole` query includes `business_id` in the filter. The `tenantFilter()` helper enforces this.
2. **Cross-tenant rejection in webhooks**: The Stripe webhook explicitly checks and skips records from the wrong tenant:
   ```typescript
   // Tenant guard: asServiceRole bypasses RLS — skip cross-tenant vehicles.
   if (vehicle && vehicle.business_id && vehicle.business_id !== businessId) {
     console.error(`Vehicle ${vehicleId} belongs to a different tenant — skipping`);
     continue;
   }
   ```

---

## 2. HOSTNAME RESOLUTION: How a Domain Maps to a Tenant

### 2.1 The TenantMapping Entity

```json
{
  "business_id": "vds",          // The tenant this mapping resolves to
  "hostname": "vdsmobile.com",    // Lowercase, no port. Null for phone-number mappings.
  "twilio_number": "+14704128986", // E.164. Null for hostname-based mappings.
  "is_active": true               // Inactive mappings are skipped during resolution.
}
```

One record per hostname or phone number. Admin-managed (RLS: business_id + admin). A tenant typically has two mappings: their custom domain and their temp subdomain (`<slug>.eraleadgen.com`), plus optionally a Twilio number mapping.

### 2.2 The Resolution Problem (and Why It's Non-Obvious)

Base44's proxy rewrites the `Host` header to an internal dispatcher hostname (`base44-dispatcher-production.base44.workers.dev`), so `Host`, `x-forwarded-host` are useless for tenant resolution. The proxy injects `base44-api-url` with the original full URL (e.g. `https://eraleadgen.com`) — that's the reliable source.

```typescript
export function getRequestHostname(req) {
  const apiUrl = req.headers.get('base44-api-url') || '';
  if (apiUrl) {
    try { return new URL(apiUrl).hostname.toLowerCase().trim(); } catch {}
  }
  // Fallback to standard headers (works only outside the proxy)
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  return host.split(':')[0].toLowerCase().trim();
}
```

### 2.3 Three Resolution Paths (Public vs Authenticated vs Internal)

**Path 1 — Public/Unauthenticated endpoints** (submitBooking, saveQuote, webChat, getGoogleReviews, valerie, valerieTools, getBusinessConfig):

```typescript
// Resolves from the incoming request hostname via TenantMapping lookup
export async function resolveBusinessIdFromHost(base44, req) {
  const hostname = getRequestHostname(req);
  const mappings = await base44.asServiceRole.entities.TenantMapping.filter({
    hostname, is_active: true
  });
  if (mappings && mappings[0]) return mappings[0].business_id || FALLBACK_BUSINESS_ID;
  return FALLBACK_BUSINESS_ID; // Unmapped hostnames (preview, localhost) → 'vds'
}
```

For SMS-based functions (valerie), resolution is by Twilio destination number instead:
```typescript
export async function resolveBusinessIdFromTwilioNumber(base44, rawNumber) {
  const e164 = normalizeToE164(rawNumber);
  const mappings = await base44.asServiceRole.entities.TenantMapping.filter({
    twilio_number: e164, is_active: true
  });
  if (mappings && mappings[0]) return mappings[0].business_id;
  return FALLBACK_BUSINESS_ID;
}
```

**Path 2 — Authenticated endpoints** (admin portal, member dashboard, specialist portal):

```typescript
// Resolves from the authenticated user's User.business_id
async function getUserBusinessId(base44, me) {
  const u = await base44.asServiceRole.entities.User.get(me.id);
  return (u && u.business_id) || FALLBACK_BUSINESS_ID;
}
```

When an authenticated user's `business_id` differs from the hostname-resolved `business_id`, the system **logs the mismatch but allows the request** (log-and-allow), proceeding with the user's own business_id (priority 2 over 3):
```typescript
export async function logTenantMismatch(base44, userBusinessId, hostBusinessId, context) {
  if (userBusinessId === hostBusinessId) return;
  await base44.asServiceRole.entities.SystemEventLog.create({
    business_id: userBusinessId,
    event_type: 'tenant_mismatch',
    description: `Authenticated user (tenant ${userBusinessId}) accessed a different tenant's domain (resolved ${hostBusinessId})`,
    suppression_reason: 'tenant_mismatch_log_and_allow',
  });
}
```

**Path 3 — Internal function-to-function calls** (scheduler, automations):

```typescript
// Internal callers pass business_id in the body; fall back to 'vds'
export function getInternalBusinessId(body = {}) {
  if (body.business_id && typeof body.business_id === 'string') return body.business_id;
  return FALLBACK_BUSINESS_ID;
}
```

The universal resolver handles both authenticated and internal:
```typescript
export async function getCallerBusinessId(base44, body = {}) {
  if (body.business_id) return body.business_id;           // Priority 1: explicit
  const me = await base44.auth.me().catch(() => null);
  if (me && me.id) return await getUserBusinessId(base44, me); // Priority 2: user
  return FALLBACK_BUSINESS_ID;                               // Priority 3: fallback
}
```

### 2.4 The Preview Host Guard

The `getBusinessConfig` function supports a `?tenant=` dev override for testing, but only on preview hosts — a client-supplied parameter can never hijack tenant resolution on a real mapped domain:

```typescript
export function isPreviewHost(hostname) {
  return hostname.endsWith('.base44.app')
      || hostname.endsWith('.base44.com')
      || hostname === 'localhost'
      || hostname.endsWith('.localhost');
}
// On a real mapped domain, ?tenant= is ignored and the hostname resolves the tenant.
```

### 2.5 Frontend Tenant Isolation: TenantRouteGuard

On the frontend, `src/components/TenantRouteGuard.jsx` prevents the ERA Systems marketing tenant (`business_id: 'era_systems'`) from rendering any client-business template (gallery, specialist portal, member dashboard, booking, etc.). Only an explicit allowlist of routes is reachable under that tenant; everything else redirects to `/`. For every other tenant (vds and all future provisioned tenants), the guard is a pure pass-through.

---

## 3. EraAccount AND BILLING: The Webhook-Gated Flag Flow

### 3.1 EraAccount: The Pre-Tenant Billing Layer

`EraAccount` is the SaaS billing record for an ERA Systems account holder on eraleadgen.com. It exists **before** any tenant/business is provisioned — `business_id` is `null` until onboarding completes. This is what distinguishes an intentional ERA SaaS signup from a genuinely orphaned tenant user in the `account/entry.ts` safety net.

Key fields:
- `owner_user_id` — the Base44 User ID (sole owner)
- `business_id` — `null` until provisioning; set by the provisioning flow, NOT the webhook
- `stripe_customer_id`, `stripe_subscription_id` — set by the webhook on first checkout
- `setup_fee_paid` — `true` once the one-time setup fee is paid (the hard gate for provisioning)
- `current_plan_tier` — mirror of BusinessConfig.plan_tier; updated by webhook only
- `ad_management_enabled` — mirror of BusinessConfig.ad_management_enabled; updated by webhook only
- `last_stripe_event_id` — idempotency guard against Stripe redelivery
- `provisioning_review_status` — 24-hour ERA staff review gate

### 3.2 The Checkout Flow

**`createEraCheckoutSession`** creates a Stripe Checkout session with:
- The tier's monthly recurring price + one-time setup fee as line items
- `metadata.era_product_type = 'era_saas'` — this is how the webhook identifies ERA SaaS events vs VDS Gold events
- `metadata.owner_user_id`, `metadata.era_tier` — stamped on both the checkout session and the subscription
- `success_url` includes `{CHECKOUT_SESSION_ID}` so the onboarding wizard can read it
- Guards: rejects if the user has no EraAccount, if `business_id` is already set (already provisioned), or if `setup_fee_paid` is already true

### 3.3 The Webhook Handler: Where Flags Actually Change

The `stripe-webhook` function routes events by `metadata.era_product_type`:

```typescript
if (session.metadata?.era_product_type === 'era_saas') {
  await handleEraSaaSEvent(base44, stripe, event);
  return Response.json({ received: true });
}
```

`handleEraSaaSEvent` (in `base44/shared/eraWebhook.ts`) handles three event types:

**`checkout.session.completed`** — initial purchase:
```typescript
await base44.asServiceRole.entities.EraAccount.update(account.id, {
  stripe_customer_id: session.customer,
  stripe_subscription_id: subId,
  subscription_status: 'active',
  current_plan_tier: eraTier,      // tier from checkout metadata
  setup_fee_paid: true,            // THE hard gate for provisioning
  last_stripe_event_id: eventId,   // idempotency
});
```

**`customer.subscription.updated`** — tier change or add-on toggle. This is the critical one. The write order is deliberate:

```typescript
// Write BusinessConfig FIRST (authoritative gate) — only if tenant exists.
if (account.business_id && tier) {
  const cfg = await base44.asServiceRole.entities.BusinessConfig.filter({...});
  if (cfg) {
    await base44.asServiceRole.entities.BusinessConfig.update(cfg.id, {
      plan_tier: tier,
      ad_management_enabled,
      subscription_status: newStatus,
    });
  }
}

// Write EraAccount SECOND (billing mirror).
await base44.asServiceRole.entities.EraAccount.update(account.id, {
  subscription_status: newStatus,
  current_plan_tier: tier,
  ad_management_enabled: account.business_id ? ad_management_enabled : undefined,
  last_stripe_event_id: eventId,
});
```

BusinessConfig is written first because it's the authoritative gate the live site reads. If the EraAccount write fails after BusinessConfig succeeds, the webhook returns 500 → Stripe redelivers. The client never sees a half-applied upgrade because the authoritative gate is written before the mirror.

**`customer.subscription.deleted`** — cancellation:
- Marks `subscription_status = 'canceled'` on both EraAccount and BusinessConfig
- Sets a 7-day `grace_until` on BusinessConfig so features stay live briefly
- Does NOT change `plan_tier` — no data deletion, no tier downgrade. The tenant keeps their config and data; the portal shows "canceled" and can prompt re-subscription.

### 3.4 The Self-Service Billing Actions (What the Frontend CAN Do)

`eraBilling` provides three actions for provisioned account holders. Critically, **none of these change any flag directly** — they only modify the Stripe subscription, then return a "submitted" message. The actual flag flip happens in the webhook.

**`change_tier`**:
```typescript
// Swap the tier price item on the subscription (Stripe prorates automatically)
await stripe.subscriptions.update(account.stripe_subscription_id, {
  items: [{ id: tierItem.id, price: newPriceId }],
  proration_behavior: 'create_prorations',
  metadata: { ...sub.metadata, era_tier: newTier },
});
return Response.json({
  success: true,
  message: `Plan change to ${newTier} submitted. Your features will update once Stripe confirms.`,
});
```

**`toggle_ad_management`**:
```typescript
// Add or remove the ad_management line item (prorated)
if (enable && !adItem) {
  await stripe.subscriptions.update(account.stripe_subscription_id, {
    items: [{ price: prices.ad_management_monthly, quantity: 1 }],
    proration_behavior: 'create_prorations',
  });
} else if (!enable && adItem) {
  await stripe.subscriptions.update(account.stripe_subscription_id, {
    items: [{ id: adItem.id, quantity: 0 }],  // remove by setting quantity 0
    proration_behavior: 'create_prorations',
  });
}
return Response.json({
  success: true,
  message: `Ad Management ${enable ? 'added' : 'removed'}. Your dashboard will update once Stripe confirms.`,
});
```

**`portal_session`** — Stripe Customer Portal for invoice history.

### 3.5 How Tier + Add-On Are Resolved from the Subscription

`resolveEraSubscriptionState` (in `base44/shared/eraPricing.ts`) inspects the subscription's expanded line items and maps each price ID to its role:

```typescript
const PRICE_MAP = {
  [ERA_PRICES.basic_monthly]:         { role: 'tier', tier: 'basic' },
  [ERA_PRICES.foundation_monthly]:   { role: 'tier', tier: 'foundation' },
  [ERA_PRICES.ad_management_monthly]:{ role: 'addon', addon: 'ad_management' },
  // ... test prices too
};

export function resolveEraSubscriptionState(subscription) {
  const items = subscription.items?.data || [];
  let tier = null;
  let ad_management_enabled = false;
  for (const item of items) {
    const meta = PRICE_MAP[item.price?.id];
    if (!meta) continue;
    if (meta.role === 'tier') tier = meta.tier;
    if (meta.role === 'addon' && meta.addon === 'ad_management') ad_management_enabled = true;
  }
  return { tier, ad_management_enabled };
}
```

### 3.6 Summary: The Gating Discipline

| Action | Who Triggers It | What Changes Immediately | What Changes on Webhook Confirmation |
|---|---|---|---|
| Initial checkout | User clicks "Subscribe" | Nothing in the database | EraAccount stamped (setup_fee_paid, tier, stripe IDs) |
| Change tier | User clicks "Upgrade" in portal | Stripe subscription item price swapped | BusinessConfig.plan_tier + EraAccount.current_plan_tier |
| Toggle Ad Management | User clicks toggle in portal | Stripe subscription line item added/removed | BusinessConfig.ad_management_enabled + EraAccount.ad_management_enabled |
| Cancel | User cancels in Stripe portal | Stripe subscription canceled | BusinessConfig.subscription_status='canceled' + grace_until set; EraAccount.subscription_status='canceled' |

**The frontend never changes `plan_tier` or `ad_management_enabled` directly.** Every flag flip is gated to webhook confirmation. The billing function returns "submitted, wait for confirmation" and the portal UI shows the old state until the webhook lands.

---

## 4. THE ONBOARDING WIZARD: Register → Info → Payment → Provisioning

### 4.1 The Full Sequence

```
1. Register (EraRegister page)
   ├─ Email/password or Google OAuth
   ├─ OTP verification (platform flow)
   └─ eraAccount { action: 'create' } → idempotently creates EraAccount
      (owner_user_id, email, business_id=null, setup_fee_paid=false)

2. Pick a tier (EraPortal page)
   └─ Redirects to /onboarding?tier=basic or /onboarding?tier=foundation

3. Wizard init (onboardingWizard { action: 'init', plan_tier })
   ├─ Creates OnboardingSession (business_id=placeholder slug, owner_user_id, plan_tier)
   ├─ Stamps EraAccount.onboarding_session_id
   └─ Returns session with default wizard_data scaffold

4. Steps 1-5 (user fills out business info, saves after each step)
   ├─ Step 1: Business Basics (legal name, EIN, phone, address, hours, service cities)
   ├─ Step 2: Branding (logo, tagline, colors, dictionary)
   ├─ Step 3: Service Catalog (classifications, pricing groups, services, memberships)
   ├─ Step 4: Team & Scheduling (scheduling rules, specialists — Foundation only)
   └─ Step 5: Integrations (Google Calendar connectivity confirmation)
   Each step: onboardingWizard { action: 'save_step', step_data, step_number }
   → merges into wizard_data, advances current_step

5. Review (OnboardingReview component)
   └─ Shows summary of all wizard data before checkout

6. Stripe checkout (createEraCheckoutSession)
   ├─ Verifies EraAccount exists, not provisioned, setup_fee not paid
   ├─ Creates Stripe Checkout (monthly tier price + one-time setup fee)
   ├─ Stamps OnboardingSession.stripe_checkout_session_id
   └─ Redirects to Stripe Checkout URL

7. Payment confirmation (?checkout=success)
   ├─ Webhook stamps EraAccount.setup_fee_paid=true (happens async)
   └─ ConfirmingPayment component polls eraAccount { action: 'get' }
      until setup_fee_paid === true, then triggers provisioning

8. Provisioning (onboardingWizard { action: 'provision' })
   ├─ HARD PAYMENT GATE (see §4.2)
   ├─ provisionTenant:
   │   ├─ Regenerates business_id slug from real business name
   │   ├─ Creates BusinessConfig from wizard_data
   │   ├─ Creates TenantMapping (temp subdomain → business_id)
   │   ├─ Stamps User.business_id + role='admin'
   │   ├─ Creates Contractor entities (Foundation tier only)
   │   └─ Marks OnboardingSession completed
   ├─ Confirms Google Calendar connector
   ├─ Stamps EraAccount.provisioning_review_status='pending_review'
   ├─ Emails ERA staff a comprehensive business info packet
   └─ Returns step-by-step result for the loading screen

9. 24-hour ERA review window
   ├─ EraAccount.provisioning_review_status = 'pending_review'
   ├─ ERA staff can approve/reject from /era-admin
   └─ Auto-approves after 24h deadline (provisioningReview automation)
```

### 4.2 The Hard Payment Gate (Before Any Resource Is Created)

The `provision` action is the single point where real resources get created. Payment must be confirmed by **two independent sources** before `provisionTenant` runs:

```typescript
// Source 1: EraAccount.setup_fee_paid === true (webhook stamped it)
const eraAccount = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: me.id });
if (!eraAccount || !eraAccount.setup_fee_paid) {
  return Response.json({ error: 'Payment not confirmed. Please complete checkout before provisioning.' }, { status: 402 });
}

// Source 2: Stripe checkout session payment_status === 'paid' (direct API verification)
if (!session.stripe_checkout_session_id) {
  return Response.json({ error: 'No checkout session on this onboarding session.' }, { status: 402 });
}
const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.stripe_checkout_session_id}`, {
  headers: { Authorization: `Bearer ${stripeKey}` },
});
const stripeSession = await stripeRes.json();
if (stripeSession.payment_status !== 'paid') {
  return Response.json({ error: `Payment not complete (status: ${stripeSession.payment_status}).` }, { status: 402 });
}

// ── Payment confirmed — provision the tenant ──
const { config, subdomain } = await provisionTenant(base44, session);
```

If either check fails, the function returns 402 and creates nothing. This preserves the "nothing real gets created until Stripe confirms payment" discipline — the backend never trusts the frontend's sequencing.

### 4.3 Idempotency

`provisionTenant` is idempotent — safe to call multiple times (e.g. after a page refresh mid-provision):
- BusinessConfig: checks if one already exists for the business_id before creating
- TenantMapping: checks if one already exists for the hostname before creating
- Contractors: checks by email before creating
- OnboardingSession: marks completed only if not already

The 24-hour review stamp is also guarded:
```typescript
const cur = ea.provisioning_review_status;
if (cur !== 'approved' && cur !== 'pending_review') {
  // Only stamp if not already approved or pending (prevents re-spam on refresh)
  await base44.asServiceRole.entities.EraAccount.update(ea.id, {
    provisioning_review_status: 'pending_review',
    review_deadline: deadline,
  });
}
```

### 4.4 The 24-Hour ERA Provisioning Review

After provisioning, the tenant enters a review window:
- `EraAccount.provisioning_review_status = 'pending_review'`
- `review_deadline` = now + 24 hours
- ERA staff receive an email with the complete business info packet
- ERA staff can approve or reject from `/era-admin` (via `provisioningReview` function, guarded by `assertEraStaff`)
- A scheduled automation (`provisioningReview { action: 'auto_approve_past_deadline' }`) auto-approves any account still pending past the deadline, so a tenant is never blocked indefinitely
- Defaults to `'approved'` so already-provisioned tenants are not retroactively locked out — only newly provisioned tenants enter the review window

---

## 5. ERA-CONSOLE: The EraStaff Permission Mechanism

### 5.1 The Structural Separation

ERA staff authorization is **structurally** separate from any tenant's admin role, not just conventionally. This is enforced at three levels:

**Level 1 — Separate Entity**: `EraStaff` is a distinct entity from `User`. A tenant admin cannot self-grant ERA staff access because `base44.auth.updateMe()` cannot touch the `EraStaff` entity — it only updates the `User` record.

**Level 2 — Deny-All RLS**: The `EraStaff` entity has RLS rules that deny ALL app-user operations:

```json
{
  "rls": {
    "read":  { "user_condition": { "role": "era_staff" } },
    "create":{ "user_condition": { "role": "era_staff" } },
    "update":{ "user_condition": { "role": "era_staff" } },
    "delete":{ "user_condition": { "role": "era_staff" } }
  }
}
```

No user holds `role: 'era_staff'` (the platform only assigns 'admin' or 'user'), so every app-user operation on `EraStaff` is rejected. Only the service role (`base44.asServiceRole`) can read or write these records.

**Level 3 — Why Not Just Check role='admin'?**: Every tenant owner has `role: 'admin'`. A role check would let any customer into the ERA Staff Console. And ERA staff need not belong to any tenant, so `business_id` can't be used either. The authorization is based solely on `user_id` membership in the `EraStaff` allowlist.

### 5.2 The `assertEraStaff` Function

```typescript
export async function assertEraStaff(base44) {
  const user = await base44.auth.me();
  if (!user) return { authorized: false, status: 401 };

  // Email-based allowlist: grants access without requiring a seeded EraStaff record.
  // These users get access immediately upon login, even before an EraStaff record is seeded.
  const emailAllowed = user.email && ERA_STAFF_EMAIL_ALLOWLIST.includes(user.email.toLowerCase());

  // EraStaff record check via service role (bypasses deny-all RLS)
  let staff = [];
  try {
    staff = await base44.asServiceRole.entities.EraStaff.filter({ user_id: user.id });
  } catch (e) {
    if (emailAllowed) return { authorized: true, user, staff: { name: user.email, email: user.email } };
    return { authorized: false, status: 403, user, staff: null };
  }

  if (staff && staff.length) return { authorized: true, status: 200, user, staff: staff[0] };
  if (emailAllowed) return { authorized: true, status: 200, user, staff: { name: user.email, email: user.email } };
  return { authorized: false, status: 403, user, staff: null };
}
```

Authorization = a record exists in the `EraStaff` allowlist with `user_id === me.id`, OR the user's email is in the hardcoded `ERA_STAFF_EMAIL_ALLOWLIST` (currently `noahgrove3@gmail.com` and `shanemuenkel@gmail.com`). The check runs via the service role so it bypasses `EraStaff`'s deny-all RLS — it is the authoritative check and cannot be spoofed by the caller.

### 5.3 Functions Guarded by `assertEraStaff`

| Function | Purpose |
|---|---|
| `getEraStaffConsole` | Returns all tenant BusinessConfigs with billing health (cross-tenant read via service role) |
| `eraAdmin` | Master admin: get_clients, get_client, update_client, get_overview |
| `provisioningReview` | approve/reject actions (the auto-approve action runs without a user from a scheduled automation) |

Every access is audited to `SystemEventLog` under a platform-level `business_id: 'era_systems'`.

### 5.4 Route Structure

- `/era-console` — deprecated, immediately redirects to `/era-admin`
- `/era-admin` — the full ERA Staff Portal (`EraAdminPortal` page), which pings `getEraStaffConsole` on load to verify authorization before rendering. Shows "Access Restricted" if the user is not ERA staff.
- Both routes are in the `TenantRouteGuard` allowlist so ERA staff can reach them from the `era_systems` tenant.

---

## 6. PLAN_TIER FEATURE GATING: The Actual Mechanism + VDS Live State

### 6.1 The Feature Matrix

Defined in `base44/shared/planFeatures.ts` (backend) and mirrored in `src/lib/planFeatures.js` (frontend). Same logic, kept in sync manually.

```typescript
const TIER_RANK = { basic: 0, foundation: 1, growth: 2, enterprise: 3 };

const FEATURE_MIN_TIER = {
  // Basic+
  website:              'basic',
  ai_chat_widget:        'basic',
  core_engines:         'basic',
  booking:              'basic',
  payments:             'basic',
  admin_dashboard:      'basic',
  self_serve_domain:    'basic',
  email_automations:     'basic',
  // Foundation+
  member_portal:        'foundation',
  specialist_portal:     'foundation',
  // Growth+
  sms_automations:      'growth',
  ai_sms_agent:         'growth',
  ai_voice_agent:       'growth',
  // Enterprise+
  partner_engine:       'enterprise',
  advanced_analytics:   'enterprise',
};

export function hasFeature(planTier, feature) {
  const minTier = FEATURE_MIN_TIER[feature];
  if (!minTier) return false;
  return (TIER_RANK[planTier] || 0) >= (TIER_RANK[minTier] || 0);
}
```

**Ad Management** is NOT a tier-gated feature — it's a paid add-on on any tier:
```typescript
export function hasAdManagement(planTier, adManagementEnabled) {
  return planTier === 'enterprise' || adManagementEnabled === true;
}
// Enterprise includes it; any other tier needs the flag = true (set by webhook when the add-on line item is on the subscription)
```

### 6.2 How Gating Is Enforced

**Backend** — functions call `checkFeature` before performing the gated action:
```typescript
export async function checkFeature(base44, businessId, feature) {
  const cfg = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id, is_active: true });
  if (!cfg) return { ok: false, reason: 'no_config' };
  if (!hasFeature(cfg.plan_tier || 'basic', feature)) return { ok: false, reason: 'feature_not_enabled', cfg };
  return { ok: true, cfg };
}
```

**Frontend** — the `FeatureGate` component wraps route elements:
```jsx
// src/components/FeatureGate.jsx
export default function FeatureGate({ feature, children }) {
  const { hasFeature } = usePlanFeatures();
  if (!hasFeature(feature)) return <PageNotFound />;
  return children;
}
```

Used in `src/App.jsx` to gate routes:
```jsx
<Route path="/member-dashboard" element={<FeatureGate feature="member_portal"><MemberDashboard /></FeatureGate>} />
<Route path="/specialist-portal" element={<FeatureGate feature="specialist_portal"><SpecialistPortal /></FeatureGate>} />
<Route path="/partner-portal" element={<FeatureGate feature="partner_engine"><PartnerPortal /></FeatureGate>} />
```

The `usePlanFeatures` hook reads `plan_tier` and `ad_management_enabled` from the `BusinessConfigContext` (hostname-resolved config), defaulting to `'basic'` while loading.

### 6.3 The Automation Settings Layer

Separate from tier gating, `BusinessConfig.automation_settings` provides per-automation on/off toggles. These are gated by tier in addition to the toggle:

| Toggle | Tier Gate | Behavior |
|---|---|---|
| `welcome_email` | email_automations (Basic+) | Welcome email to new members |
| `reminder_email` | email_automations (Basic+) | 24h + 1h appointment reminder emails; fallback for 1h when SMS can't fire |
| `review_request_email` | email_automations (Basic+) | Post-detail review request email; fallback when SMS can't fire |
| `reminder_sms` | sms_automations (Growth+) | 1h appointment reminder SMS; falls back to email when off or tier unavailable |
| `review_request_sms` | sms_automations (Growth+) | Post-detail review request SMS; falls back to email when off or tier unavailable |

A toggle is inert when the tier doesn't permit the channel. Booking confirmations are NOT here — they're always-on within the channel tier (no per-message toggle).

### 6.4 CRITICAL: VDS's Current Live State (Verified from Database)

**Verified August 30, 2026** by reading the live VDS BusinessConfig record directly from the database:

```json
{
  "business_id": "vds",
  "business_name": "VDS Mobile",
  "plan_tier": "enterprise",
  "ad_management_enabled": true,
  "subscription_status": "active",
  "grace_until": null,
  "feature_flags": {
    "web_chat_enabled": true,
    "instant_quote_enabled": true,
    "gold_checkout_enabled": true,
    "twilio_sms_enabled": true
  },
  "automation_settings": {
    "reminder_email": true,
    "review_request_email": true,
    "reminder_sms": true,
    "welcome_email": true,
    "review_request_sms": true
  }
}
```

**The `ai_voice_sms_addon_enabled` flag does NOT exist.** It is not in the live VDS BusinessConfig record, not in the BusinessConfig entity schema, not in `planFeatures.ts`, not in `planFeatures.js`, not in `eraPricing.ts`, and not in `eraWebhook.ts`. The complete list of top-level keys on the live VDS config (47 keys) does not include any variant of this flag.

### 6.5 What This Means

VDS's AI SMS and AI voice capabilities are currently gated **purely by the tier hierarchy**: `plan_tier: "enterprise"` (rank 3) satisfies the `ai_sms_agent` and `ai_voice_agent` minimum tier of `growth` (rank 2). There is no independent add-on toggle for AI SMS/voice. The only add-on that exists is `ad_management_enabled` (the $500/mo Ad Management line item).

The newer independent `ai_voice_sms_addon_enabled` flag — where AI SMS/voice would be a paid add-on on any tier rather than included at Growth+ — **has not been built or applied**. It does not exist in the schema, the code, or the live data. If this design was discussed or planned, it was not shipped. VDS currently gets AI SMS/voice because it's on Enterprise, not because of an independent flag.

The only Stripe add-on product that exists is `Ad Management` (`prod_V4vqH4UlHUsVpF`, `price_1U4lzF2MUlDjgwKfzgw32g3O`). There is no AI SMS/voice add-on product or price in `eraPricing.ts`.

---

## 7. SUMMARY: The Platform Machinery vs. VDS's Business Data

| Layer | What It Does | Where It Lives |
|---|---|---|
| **Tenant Isolation** | `business_id` field + `$and` RLS on every operational entity | Entity schemas + `tenantContext.ts` |
| **Hostname Resolution** | `TenantMapping` lookup via `base44-api-url` header | `tenantContext.ts` + `TenantMapping` entity |
| **EraAccount** | Pre-tenant billing record, ownership-scoped | `EraAccount` entity + `eraAccount` function |
| **Checkout** | Creates Stripe session with ERA SaaS metadata | `createEraCheckoutSession` function |
| **Webhook** | The ONLY place flags change; writes BusinessConfig first, EraAccount second | `stripe-webhook` + `eraWebhook.ts` |
| **Billing Self-Service** | Modifies Stripe subscription only; never touches flags | `eraBilling` function |
| **Onboarding** | Register → wizard → checkout → hard payment gate → provision | `onboardingWizard` function + `OnboardingWizard.jsx` |
| **ERA Staff Auth** | `EraStaff` allowlist + deny-all RLS + `assertEraStaff` | `EraStaff` entity + `eraStaffAuth.ts` |
| **Feature Gating** | `hasFeature(planTier, feature)` tier hierarchy | `planFeatures.ts` / `planFeatures.js` + `FeatureGate.jsx` |
| **VDS Live State** | `plan_tier: enterprise`, `ad_management_enabled: true`, no `ai_voice_sms_addon_enabled` flag | Live database |

VDS is a **client** of this platform machinery: it has a `BusinessConfig` record with `business_id: "vds"`, a `TenantMapping` for its domain, and its features are gated by its `plan_tier: "enterprise"`. The platform machinery (EraAccount, webhook-gated billing, onboarding wizard, ERA Staff Console, the tier hierarchy) is what makes ERA Systems the SaaS provider and VDS a tenant — and that machinery is what would need to be rebuilt on any new platform to preserve the multi-tenant model.