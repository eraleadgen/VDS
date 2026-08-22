// onboardingWizard — multi-step onboarding wizard backend for new tenant signup.
// Actions:
//   - init:        Create a new OnboardingSession from a Stripe checkout session ID.
//                  Verifies the checkout session, extracts plan_tier + user_id, generates
//                  a business_id slug, and returns the session for the frontend to load.
//   - save_step:   Persist one step's form data into wizard_data (merge), advance current_step.
//                  Allows pause/resume — the frontend calls this after each step.
//   - finalize:    Transform accumulated wizard_data into a complete BusinessConfig,
//                  create a TenantMapping (subdomain), stamp the owner's User.business_id,
//                  and mark the session completed.
//
// Auth: the authenticated user who owns the OnboardingSession (created_by_id match).
// No SCHEDULER_TOKEN — this is a user-facing flow, not an internal automation.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { hasFeature } from '../../shared/planFeatures.ts';

// ── Slug generation ────────────────────────────────────────────────────
// Converts a business name to a URL-safe slug suitable for business_id and subdomain.
// "Bob's Auto Spa" → "bobs-autospa". Uniqueness is checked against existing BusinessConfig
// and OnboardingSession records; a numeric suffix is appended on collision.
function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'new-business';
}

async function uniqueSlug(base44, base) {
  let candidate = base;
  let suffix = 1;
  // Check both BusinessConfig (finalized tenants) and in-progress OnboardingSessions.
  while (true) {
    const [configs, sessions] = await Promise.all([
      base44.asServiceRole.entities.BusinessConfig.filter({ business_id: candidate }).catch(() => []),
      base44.asServiceRole.entities.OnboardingSession.filter({ business_id: candidate, status: 'in_progress' }).catch(() => []),
    ]);
    if (!(configs && configs.length) && !(sessions && sessions.length)) return candidate;
    suffix++;
    candidate = `${base}-${suffix}`;
  }
}

// Temp website domain: <legal-business-name-slug>.eraleadgen.com
// Used until the tenant connects a custom domain. Slug derived from the legal
// business name (falls back to brand business name), uniqueness-checked against
// existing TenantMapping hostnames so two same-named tenants never collide.
function tempSubdomainSlug(data, businessId) {
  const b = (data && data.business_basics) || {};
  const name = b.legal_name || b.business_name || businessId;
  return slugify(name);
}

async function uniqueTempDomain(base44, data, businessId) {
  const base = tempSubdomainSlug(data, businessId);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const host = `${candidate}.eraleadgen.com`;
    const mappings = await base44.asServiceRole.entities.TenantMapping.filter({ hostname: host }).catch(() => []);
    if (!mappings || !mappings.length) return host;
    if (mappings[0].business_id === businessId) return host; // idempotent re-provision
    suffix++;
    candidate = `${base}-${suffix}`;
  }
}

// ── Default wizard_data scaffold ───────────────────────────────────────
// Pre-fills sensible defaults so the wizard starts with a valid (if minimal) config.
function defaultWizardData(planTier) {
  return {
    // Step 1: Business Basics
    business_basics: {
      legal_name: '',
      business_name: '',
      business_phone: '',
      business_email: '',
      business_address: '',
      address_locality: '',
      address_region: '',
      address_country: 'US',
      legal_jurisdiction: '',
      service_areas: [],
      timezone: 'America/New_York',
      currency: 'USD',
      business_hours: [
        { day: 'mon', open: '09:00', close: '17:00', closed: false },
        { day: 'tue', open: '09:00', close: '17:00', closed: false },
        { day: 'wed', open: '09:00', close: '17:00', closed: false },
        { day: 'thu', open: '09:00', close: '17:00', closed: false },
        { day: 'fri', open: '09:00', close: '17:00', closed: false },
        { day: 'sat', open: '09:00', close: '17:00', closed: true },
        { day: 'sun', open: '09:00', close: '17:00', closed: true },
      ],
    },
    // Step 2: Branding
    branding: {
      logo_url: '',
      tagline: '',
      business_short_name: '',
      brand_colors: {
        primary: '#D4AF37',
        secondary: '#14161A',
        background: '#0A0B0D',
        surface: '#14161A',
        text: '#E2E8F0',
      },
      dictionary: {
        item_noun: 'Vehicle',
        item_plural: 'Vehicles',
        item_category_noun: 'Classification',
        item_category_label: 'Vehicle Classification',
        service_noun: 'Detail',
        service_verb: 'detail',
      },
    },
    // Step 3: Service Catalog & Pricing
    service_catalog: {
      vehicle_classifications: [
        { key: 'sedan', label: 'Sedan' },
        { key: 'coupe', label: 'Coupe' },
        { key: 'mid_size_suv', label: 'Mid-Size SUV' },
        { key: 'truck_3_row_suv', label: 'Truck / 3-Row SUV' },
      ],
      pricing_groups: [
        { key: 'sedan_coupe', label: 'Sedan/Coupe', stripe_price_id: '' },
        { key: 'truck_suv', label: 'Truck/SUV', stripe_price_id: '' },
      ],
      classification_to_pricing_group: {
        coupe: 'sedan_coupe',
        sedan: 'sedan_coupe',
        hatchback: 'sedan_coupe',
        mid_size_suv: 'truck_suv',
        truck_3_row_suv: 'truck_suv',
        other: 'sedan_coupe',
      },
      condition_multipliers: [
        { key: 'light', label: 'Light', multiplier: 1.0, duration_add_minutes: 0 },
        { key: 'moderate', label: 'Moderate', multiplier: 1.3, duration_add_minutes: 30 },
        { key: 'heavy', label: 'Heavy', multiplier: 1.6, duration_add_minutes: 60 },
      ],
      services: [],
      offer_memberships: false,
      membership_plans: [],
    },
    // Step 4: Team & Scheduling
    team_scheduling: {
      scheduling_rules: {
        booking_buffer_hours: 24,
        min_notice_hours: 24,
        cancellation_hours: 48,
        slot_interval_minutes: 60,
        max_bookings_per_day: 4,
      },
      technicians: [],
      specialists: [],
    },
    // Step 5: Integrations
    integrations: {
      stripe_connected: false,
      google_calendar_connected: false,
    },
  };
}

// ── Build BusinessConfig from wizard_data ─────────────────────────────
function buildBusinessConfig(businessId, planTier, data, tempDomain) {
  const b = data.business_basics || {};
  const br = data.branding || {};
  const sc = data.service_catalog || {};
  const ts = data.team_scheduling || {};
  const site = tempDomain || `${businessId}.eraleadgen.com`;

  // vehicle_types (legacy) derived from vehicle_classifications
  const vehicleTypes = (sc.vehicle_classifications || []).map((v) => ({ key: v.key, label: v.label }));

  return {
    business_id: businessId,
    is_active: true,
    business_name: b.business_name || 'New Business',
    business_short_name: br.business_short_name || b.business_name || 'New Business',
    legal_name: b.legal_name || b.business_name || '',
    legal_jurisdiction: b.legal_jurisdiction || '',
    logo_url: br.logo_url || '',
    tagline: br.tagline || '',
    brand_colors: br.brand_colors || {},
    business_phone: b.business_phone || '',
    business_email: b.business_email || '',
    business_address: b.business_address || '',
    address_locality: b.address_locality || '',
    address_region: b.address_region || '',
    address_country: b.address_country || 'US',
    service_areas: b.service_areas || [],
    timezone: b.timezone || 'America/New_York',
    currency: b.currency || 'USD',
    business_hours: b.business_hours || [],
    scheduling_rules: ts.scheduling_rules || {},
    pricing_rules: { condition_multipliers: sc.condition_multipliers || [] },
    vehicle_classifications: sc.vehicle_classifications || [],
    pricing_groups: sc.pricing_groups || [],
    classification_to_pricing_group: sc.classification_to_pricing_group || {},
    vehicle_types: vehicleTypes,
    feature_flags: {
      twilio_sms_enabled: false,
      gold_checkout_enabled: !!(sc.offer_memberships && sc.membership_plans && sc.membership_plans.length),
      instant_quote_enabled: true,
      review_requests_enabled: true,
      web_chat_enabled: true,
    },
    plan_tier: planTier,
    ad_management_enabled: false,
    services: sc.services || [],
    featured_services: [],
    membership_plans: sc.offer_memberships ? (sc.membership_plans || []) : [],
    technicians: ts.technicians || [],
    referral_program: { enabled: false, credit_amount: 0, incentives: {} },
    website_links: {
      booking_url: `https://${site}/book`,
      gold_signup_url: sc.offer_memberships ? `https://${site}/membership-signup` : '',
      gallery_url: `https://${site}/gallery`,
      google_review_url: '',
    },
    social_links: {},
    seo: [],
    faq: [],
    dictionary: br.dictionary || {},
    concierge: {
      name: 'Assistant',
      persona: 'Helpful and professional.',
      business_summary: `Online concierge for ${b.business_name || 'our business'}.`,
      greeting: `Hi! How can I help you today?`,
    },
  };
}

// ── Main handler ───────────────────────────────────────────────────────
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Auth: all actions require an authenticated user.
    const me = await base44.auth.me();
    if (!me || !me.id) return Response.json({ error: 'Authentication required.' }, { status: 401 });

    // ── init: create OnboardingSession ────────────────────────────────
    // Two entry paths:
    //   A) Pre-payment (new flow): { plan_tier } — creates the session before
    //      checkout so the user fills out business info first. Checks for an
    //      existing in-progress session and resumes it (prevents duplicates).
    //   B) Post-checkout (legacy): { stripe_checkout_session_id } — verifies
    //      the Stripe session and creates from its metadata. Retained for
    //      backward compatibility; the new flow uses path A.
    if (action === 'init') {
      const { stripe_checkout_session_id, plan_tier: directTier } = body;

      // Path A: pre-payment init from selected tier (no Stripe session yet).
      if (directTier && !stripe_checkout_session_id) {
        if (directTier !== 'basic' && directTier !== 'foundation') {
          return Response.json({ error: 'Invalid plan_tier.' }, { status: 400 });
        }
        // Resume: return an existing in-progress session instead of duplicating.
        const existing = await base44.asServiceRole.entities.OnboardingSession.filter(
          { owner_user_id: me.id, status: 'in_progress' }
        ).catch(() => []);
        if (existing && existing.length) {
          // Update the tier if the user picked a different one this time.
          if (existing[0].plan_tier !== directTier) {
            const updated = await base44.asServiceRole.entities.OnboardingSession.update(existing[0].id, { plan_tier: directTier });
            return Response.json({ session: updated });
          }
          return Response.json({ session: existing[0] });
        }
        // Create a new session. business_id slug from the user's name as a placeholder;
        // provisionTenant regenerates it from the real business name (Step 1 data).
        const businessId = await uniqueSlug(base44, slugify(me.full_name || 'new-business'));
        const sessionRecord = await base44.asServiceRole.entities.OnboardingSession.create({
          business_id: businessId,
          owner_user_id: me.id,
          plan_tier: directTier,
          stripe_checkout_session_id: null,
          current_step: 1,
          wizard_data: defaultWizardData(directTier),
          status: 'in_progress',
        });
        // Stamp EraAccount so the portal can link to the wizard for resume.
        const eraAccounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: me.id }).catch(() => []);
        if (eraAccounts && eraAccounts[0]) {
          await base44.asServiceRole.entities.EraAccount.update(eraAccounts[0].id, {
            onboarding_session_id: sessionRecord.id,
          }).catch((e) => console.error('EraAccount stamp failed:', e.message));
        }
        return Response.json({ session: sessionRecord });
      }

      // Path B: legacy post-checkout init (requires a Stripe session ID).
      if (!stripe_checkout_session_id) return Response.json({ error: 'stripe_checkout_session_id is required.' }, { status: 400 });
      // Stripe checkout session IDs match a strict format (e.g. cs_live_... or cs_test_...).
      // Reject anything else to prevent path traversal / SSRF into other Stripe API endpoints.
      if (!/^(cs_live_|cs_test_)[A-Za-z0-9]{1,}$/.test(stripe_checkout_session_id)) {
        return Response.json({ error: 'Invalid checkout session ID.' }, { status: 400 });
      }

      // Verify the Stripe checkout session and extract plan_tier + user_id from metadata.
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) return Response.json({ error: 'Stripe not configured.' }, { status: 500 });

      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripe_checkout_session_id}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      if (!stripeRes.ok) {
        const err = await stripeRes.json().catch(() => ({}));
        return Response.json({ error: `Stripe session lookup failed: ${err.error?.message || stripeRes.statusText}` }, { status: 400 });
      }
      const session = await stripeRes.json();

      // Verify this checkout session belongs to this app.
      if (session.metadata?.base44_app_id !== Deno.env.get('BASE44_APP_ID')) {
        return Response.json({ error: 'Checkout session does not belong to this app.' }, { status: 403 });
      }

      const planTier = session.metadata?.era_tier || session.metadata?.plan_tier;
      if (!planTier || (planTier !== 'basic' && planTier !== 'foundation')) {
        return Response.json({ error: 'Invalid or missing plan_tier in checkout metadata.' }, { status: 400 });
      }

      // The user who initiated the checkout must be the authenticated user.
      const checkoutUserId = session.metadata?.owner_user_id || session.metadata?.user_id;
      if (checkoutUserId && checkoutUserId !== me.id) {
        return Response.json({ error: 'Checkout session belongs to a different user.' }, { status: 403 });
      }

      // Check if an OnboardingSession already exists for this checkout session.
      const existing = await base44.asServiceRole.entities.OnboardingSession.filter(
        { stripe_checkout_session_id, owner_user_id: me.id }
      ).catch(() => []);
      if (existing && existing.length) {
        return Response.json({ session: existing[0] });
      }

      // Generate a unique business_id slug (from metadata business_name if available, else placeholder).
      const businessNameHint = session.metadata?.business_name || 'new-business';
      const businessId = await uniqueSlug(base44, slugify(businessNameHint));

      const sessionRecord = await base44.asServiceRole.entities.OnboardingSession.create({
        business_id: businessId,
        owner_user_id: me.id,
        plan_tier: planTier,
        stripe_checkout_session_id,
        current_step: 1,
        wizard_data: defaultWizardData(planTier),
        status: 'in_progress',
      });

      // Stamp EraAccount with the onboarding session ID so the portal can link to the wizard.
      const eraAccounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: me.id }).catch(() => []);
      if (eraAccounts && eraAccounts[0]) {
        await base44.asServiceRole.entities.EraAccount.update(eraAccounts[0].id, {
          onboarding_session_id: sessionRecord.id,
        }).catch((e) => console.error('EraAccount stamp failed:', e.message));
      }

      return Response.json({ session: sessionRecord });
    }

    // ── save_step: persist one step's data ──────────────────────────────
    if (action === 'save_step') {
      const { session_id, step_data, step_number } = body;
      if (!session_id) return Response.json({ error: 'session_id is required.' }, { status: 400 });

      // Load the session — verify ownership.
      const session = await base44.asServiceRole.entities.OnboardingSession.get(session_id).catch(() => null);
      if (!session) return Response.json({ error: 'Onboarding session not found.' }, { status: 404 });
      if (session.owner_user_id !== me.id) {
        return Response.json({ error: 'Not authorized to modify this session.' }, { status: 403 });
      }
      if (session.status === 'completed') {
        return Response.json({ error: 'This onboarding session is already completed.' }, { status: 400 });
      }

      // Merge step_data into wizard_data (shallow merge at the step key level).
      const wizardData = session.wizard_data || {};
      const stepKey = Object.keys(step_data || {})[0];
      if (stepKey) {
        wizardData[stepKey] = { ...(wizardData[stepKey] || {}), ...step_data[stepKey] };
      }

      const updated = await base44.asServiceRole.entities.OnboardingSession.update(session_id, {
        wizard_data: wizardData,
        current_step: Math.max(session.current_step || 1, step_number || 1),
      });

      return Response.json({ session: updated });
    }

    // ── get: load a session for resume ──────────────────────────────────
    if (action === 'get') {
      const { session_id } = body;
      if (!session_id) return Response.json({ error: 'session_id is required.' }, { status: 400 });

      const session = await base44.asServiceRole.entities.OnboardingSession.get(session_id).catch(() => null);
      if (!session) return Response.json({ error: 'Onboarding session not found.' }, { status: 404 });
      if (session.owner_user_id !== me.id) {
        return Response.json({ error: 'Not authorized.' }, { status: 403 });
      }
      return Response.json({ session });
    }

    // ── provisionTenant helper ───────────────────────────────────────────
    // Core provisioning logic shared by finalize and provision actions.
    // Creates BusinessConfig, TenantMapping, stamps User, creates Contractors.
    // Idempotent — safe to call multiple times (e.g. after a page refresh mid-provision).
    async function provisionTenant(base44, session) {
      // Regenerate business_id from the actual business name (Step 1 data) if available.
      // The init action used a placeholder slug; now that we have the real name, update it
      // so the subdomain matches the business name.
      const businessName = session.wizard_data?.business_basics?.business_name;
      let businessId = session.business_id;
      if (businessName) {
        const newSlug = await uniqueSlug(base44, slugify(businessName));
        if (newSlug !== businessId) {
          await base44.asServiceRole.entities.OnboardingSession.update(session.id, { business_id: newSlug }).catch(() => {});
          businessId = newSlug;
        }
      }
      const planTier = session.plan_tier;
      const data = session.wizard_data || {};

      // Temp website domain: <legal-name-slug>.eraleadgen.com (until a custom domain is connected).
      const subdomain = await uniqueTempDomain(base44, data, businessId);

      // 1. Create BusinessConfig (idempotent — skip if already exists).
      const existingConfigs = await base44.asServiceRole.entities.BusinessConfig.filter({ business_id: businessId }).catch(() => []);
      let config = existingConfigs && existingConfigs[0];
      if (!config) {
        const configPayload = buildBusinessConfig(businessId, planTier, data, subdomain);
        config = await base44.asServiceRole.entities.BusinessConfig.create(configPayload);
      }

      // 2. Create TenantMapping (temp subdomain → business_id), idempotent.
      const existingMappings = await base44.asServiceRole.entities.TenantMapping.filter({ business_id: businessId, hostname: subdomain }).catch(() => []);
      if (!existingMappings || !existingMappings.length) {
        await base44.asServiceRole.entities.TenantMapping.create({
          business_id: businessId,
          hostname: subdomain,
          is_active: true,
        });
      }

      // 3. Stamp the owner's User record with business_id + admin role.
      await base44.asServiceRole.entities.User.update(session.owner_user_id, {
        business_id: businessId,
        role: 'admin',
      });

      // 4. Create Contractor entities for Foundation tier (idempotent by email).
      if (planTier === 'foundation' && data.team_scheduling?.specialists?.length) {
        for (const spec of data.team_scheduling.specialists) {
          const emailKey = spec.email || `no-email-${Date.now()}`;
          const existingContractors = await base44.asServiceRole.entities.Contractor.filter({ business_id: businessId, email: emailKey }).catch(() => []);
          if (!existingContractors || !existingContractors.length) {
            await base44.asServiceRole.entities.Contractor.create({
              business_id: businessId,
              name: spec.name,
              phone: spec.phone || '',
              email: spec.email || '',
              skills: spec.skills || [],
              weekly_availability: spec.weekly_availability || [],
              service_areas: spec.service_areas || {},
              status: 'active',
              is_enabled: true,
            }).catch((e) => console.error('Contractor create failed:', e.message));
          }
        }
      }

      // 5. Mark the session completed.
      const completed = await base44.asServiceRole.entities.OnboardingSession.update(session.id, {
        status: 'completed',
        completed_business_config_id: config.id,
        subdomain,
      });

      return { config, subdomain, completed };
    }

    // ── finalize: create BusinessConfig + TenantMapping + stamp User ─────
    if (action === 'finalize') {
      const { session_id } = body;
      if (!session_id) return Response.json({ error: 'session_id is required.' }, { status: 400 });

      const session = await base44.asServiceRole.entities.OnboardingSession.get(session_id).catch(() => null);
      if (!session) return Response.json({ error: 'Onboarding session not found.' }, { status: 404 });
      if (session.owner_user_id !== me.id) {
        return Response.json({ error: 'Not authorized.' }, { status: 403 });
      }
      if (session.status === 'completed') {
        return Response.json({ error: 'Already completed.', business_config_id: session.completed_business_config_id }, { status: 400 });
      }

      const { config, subdomain, completed } = await provisionTenant(base44, session);
      return Response.json({ session: completed, business_config_id: config.id, subdomain });
    }

    // ── provision: finalize + confirm Stripe + confirm Google Calendar ────
    // Runs the full auto-provisioning pipeline and confirms external integrations.
    // Returns a step-by-step result so the frontend loading screen can show exactly
    // what was completed. Idempotent — safe to retry after a refresh.
    // No carrier/Twilio step: Basic and Foundation tiers don't include the AI SMS/voice
    // agent, so there is no "pending carrier approval" wait — everything is live on completion.
    if (action === 'provision') {
      const { session_id } = body;
      if (!session_id) return Response.json({ error: 'session_id is required.' }, { status: 400 });

      const session = await base44.asServiceRole.entities.OnboardingSession.get(session_id).catch(() => null);
      if (!session) return Response.json({ error: 'Onboarding session not found.' }, { status: 404 });
      if (session.owner_user_id !== me.id) {
        return Response.json({ error: 'Not authorized.' }, { status: 403 });
      }

      // ── Hard payment gate (BEFORE any real resource is created) ──────────
      // This is the single point where real resources get created. Payment must
      // be confirmed by two independent sources before provisionTenant runs:
      //   1. EraAccount.setup_fee_paid === true  (webhook stamped it)
      //   2. Stripe checkout session payment_status === 'paid'  (direct API)
      // If either fails, return an error and create nothing. This preserves the
      // "nothing real gets created until Stripe confirms payment" discipline —
      // the backend never trusts the frontend's sequencing.
      const eraAccounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: me.id }).catch(() => []);
      const eraAccount = eraAccounts && eraAccounts[0];
      if (!eraAccount || !eraAccount.setup_fee_paid) {
        return Response.json({ error: 'Payment not confirmed. Please complete checkout before provisioning.' }, { status: 402 });
      }
      if (!session.stripe_checkout_session_id) {
        return Response.json({ error: 'No checkout session on this onboarding session. Please complete checkout first.' }, { status: 402 });
      }
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
          return Response.json({ error: 'Stripe API key not configured.' }, { status: 500 });
        }
        const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.stripe_checkout_session_id}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        if (!stripeRes.ok) {
          return Response.json({ error: 'Unable to verify payment with Stripe.' }, { status: 402 });
        }
        const stripeSession = await stripeRes.json();
        if (stripeSession.payment_status !== 'paid') {
          return Response.json({ error: `Payment not complete (status: ${stripeSession.payment_status}).` }, { status: 402 });
        }
      } catch (e) {
        return Response.json({ error: `Payment verification failed: ${e.message}` }, { status: 500 });
      }

      // ── Payment confirmed — provision the tenant ──────────────────────
      // Steps 1 + 4: Finalize config + activate domain (provisionTenant does both).
      const { config, subdomain } = await provisionTenant(base44, session);

      // Step 2: Stripe confirmation (already verified above — report as complete).
      const stripeStatus = 'complete';
      const stripeError = '';

      // Step 3: Confirm Google Calendar authorization (shared platform connector).
      let calendarStatus = 'complete';
      let calendarError = '';
      try {
        await base44.asServiceRole.connectors.getConnection('googlecalendar');
      } catch (e) {
        calendarStatus = 'failed';
        calendarError = 'Google Calendar connector not authorized';
      }

      // ── 24-hour ERA provisioning review ───────────────────────────────
      // Stamp the EraAccount as pending review with a 24h deadline, then email
      // ERA staff a compiled review packet (website, domain, integrations, audit
      // checklist) so they can audit the new tenant before operations unlock.
      // Guarded so a re-provision (page refresh) doesn't reset an already-approved
      // tenant or re-spam the review email.
      try {
        const eraAccounts2 = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: me.id }).catch(() => []);
        const ea = eraAccounts2 && eraAccounts2[0];
        if (ea) {
          const cur = ea.provisioning_review_status;
          if (cur !== 'approved' && cur !== 'pending_review') {
            const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await base44.asServiceRole.entities.EraAccount.update(ea.id, {
              provisioning_review_status: 'pending_review',
              review_deadline: deadline,
              reviewed_at: null,
              reviewed_by: null,
              review_notes: '',
            }).catch((e: any) => console.error('EraAccount review stamp failed:', e.message));

            const reviewInfo = {
              business_name: config.business_name,
              business_id: config.business_id,
              plan_tier: session.plan_tier,
              subdomain,
              custom_domain: config.custom_domain || '(none — temp subdomain)',
              domain_status: config.domain_status || 'none',
              email_mode: config.email_mode || 'shared',
              email_domain_status: config.email_domain_status || 'shared',
              calendar_status,
              owner_email: ea.email || me.email,
            };
            const staff = await base44.asServiceRole.entities.EraStaff.list().catch(() => []);
            const recipients = (staff && staff.length ? staff : []).map((s: any) => s.email).filter(Boolean);
            for (const emailAddr of recipients) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: emailAddr,
                subject: `New ERA Core tenant ready for review: ${reviewInfo.business_name}`,
                body: [
                  'A new ERA Core tenant finished provisioning and is pending your 24-hour review.',
                  '',
                  `Business: ${reviewInfo.business_name} (${reviewInfo.business_id})`,
                  `Plan: ${reviewInfo.plan_tier}`,
                  `Owner: ${reviewInfo.owner_email}`,
                  '',
                  `Website: https://${reviewInfo.subdomain}`,
                  `Custom domain: ${reviewInfo.custom_domain} (status: ${reviewInfo.domain_status})`,
                  `Email mode: ${reviewInfo.email_mode} (status: ${reviewInfo.email_domain_status})`,
                  `Google Calendar: ${reviewInfo.calendar_status}`,
                  '',
                  'Audit checklist:',
                  '  [ ] Website loads and branding is correct',
                  '  [ ] Custom domain DNS configured (or temp subdomain is acceptable)',
                  '  [ ] Email sending domain verified (if custom mode)',
                  '  [ ] Google Calendar integration connected',
                  '  [ ] Services, pricing, and specialists configured',
                  '  [ ] Booking flow tested end-to-end',
                  '',
                  'Review and approve in the ERA Admin Portal -> Clients.',
                  "The tenant's operational tools stay locked until you approve (or until the 24h window auto-approves).",
                ].join('\n'),
              }).catch((e: any) => console.error('Review email failed:', e.message));
            }
          }
        }
      } catch (e) {
        console.error('Review setup failed:', e.message);
      }

      return Response.json({
        business_config_id: config.id,
        subdomain,
        business_name: config.business_name,
        steps: {
          config: { status: 'complete' },
          stripe: { status: stripeStatus, error: stripeError },
          calendar: { status: calendarStatus, error: calendarError },
          domain: { status: 'complete' },
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('onboardingWizard error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}