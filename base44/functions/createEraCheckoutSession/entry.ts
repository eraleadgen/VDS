import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@17.0.0';
import { ERA_PRICES, ERA_PRICES_TEST } from '../../shared/eraPricing.ts';

// ERA SaaS checkout session creator. Called when an ERA account holder picks Basic or
// Foundation on the ERA portal. Creates a Stripe checkout with the tier's monthly
// recurring price + one-time setup fee. The webhook stamps EraAccount on completion.
//
// Test mode: uses STRIPE_TEST_SECRET_KEY and ERA_PRICES_TEST (test cards only, no real
// charges). Live mode: uses STRIPE_SECRET_KEY and ERA_PRICES (real charges).
//
// The success_url includes {CHECKOUT_SESSION_ID} so the onboarding wizard can read the
// actual checkout session ID from the URL (not the subscription ID).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier, mode, onboarding_session_id } = await req.json();
    if (!tier || !['basic', 'foundation'].includes(tier)) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const isTest = mode === 'test';
    const stripeKey = isTest ? Deno.env.get('STRIPE_TEST_SECRET_KEY') : Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return Response.json({ error: 'Stripe key not configured' }, { status: 500 });
    const stripe = new Stripe(stripeKey);

    // Verify the user has an EraAccount and hasn't been provisioned or paid yet.
    const accounts = await base44.asServiceRole.entities.EraAccount.filter({ owner_user_id: user.id });
    const account = accounts && accounts[0];
    if (!account) return Response.json({ error: 'No ERA account found. Please register first.' }, { status: 404 });
    if (account.business_id) return Response.json({ error: 'Account already provisioned.' }, { status: 400 });
    if (account.setup_fee_paid) return Response.json({ error: 'Setup fee already paid. Continue to onboarding.' }, { status: 400 });

    // Select prices based on tier and mode.
    const prices = isTest ? ERA_PRICES_TEST : ERA_PRICES;
    const monthlyPrice = tier === 'foundation' ? prices.foundation_monthly : prices.basic_monthly;
    const setupPrice = tier === 'foundation' ? prices.foundation_setup : prices.basic_setup;

    // Create or reuse Stripe customer.
    const customers = await stripe.customers.list({ email: user.email });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          base44_user_id: user.id,
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          era_product_type: 'era_saas',
        },
      });
      customerId = customer.id;
    }

    // Derive the base URL from the request origin (trusted-host check, same pattern
    // as createGoldCheckoutSession — never trust a client-supplied URL directly).
    const origin = (req.headers.get('origin') || '').toLowerCase();
    let baseUrl = '';
    try {
      const host = new URL(origin).host;
      if (host.endsWith('.base44.app') || host.endsWith('.base44.com') || host === 'localhost' || host.endsWith('.localhost') || host.includes('eraleadgen')) {
        baseUrl = origin;
      }
    } catch {}
    if (!baseUrl) return Response.json({ error: 'Unable to determine redirect URL.' }, { status: 400 });

    // Stamp the Stripe checkout session ID back onto the OnboardingSession so
    // the provision action can verify payment against it. The session already
    // exists (created pre-payment by the wizard's init action).
    let onboardingSession = null;
    if (onboarding_session_id) {
      const sessions = await base44.asServiceRole.entities.OnboardingSession.filter({ id: onboarding_session_id, owner_user_id: user.id }).catch(() => []);
      onboardingSession = sessions && sessions[0];
    }

    // cancel_url returns to the wizard (not era-portal) so the user retries
    // checkout without losing their already-entered business info. All wizard
    // data is preserved in the OnboardingSession — canceling doesn't touch it.
    const cancelUrl = onboardingSession
      ? `${baseUrl}/onboarding?session=${onboardingSession.id}`
      : `${baseUrl}/era-portal`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        { price: monthlyPrice, quantity: 1 },
        { price: setupPrice, quantity: 1 },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        era_product_type: 'era_saas',
        owner_user_id: user.id,
        era_tier: tier,
      },
      subscription_data: {
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          era_product_type: 'era_saas',
          owner_user_id: user.id,
          era_tier: tier,
        },
      },
    });

    // Stamp the checkout session ID onto the OnboardingSession so provision can
    // verify payment against it after the webhook stamps EraAccount.setup_fee_paid.
    if (onboardingSession) {
      await base44.asServiceRole.entities.OnboardingSession.update(onboardingSession.id, {
        stripe_checkout_session_id: session.id,
      }).catch((e) => console.error('OnboardingSession stamp failed:', e.message));
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createEraCheckoutSession error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});