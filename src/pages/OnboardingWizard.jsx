import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Check, ChevronLeft, Loader2 } from 'lucide-react';
import Step1BusinessBasics from '@/components/onboarding/Step1BusinessBasics';
import Step2Branding from '@/components/onboarding/Step2Branding';
import Step3ServiceCatalog from '@/components/onboarding/Step3ServiceCatalog';
import Step4TeamScheduling from '@/components/onboarding/Step4TeamScheduling';
import Step5Integrations from '@/components/onboarding/Step5Integrations';
import ProvisioningScreen from '@/components/onboarding/ProvisioningScreen';
import ConfirmingPayment from '@/components/onboarding/ConfirmingPayment';

const STEPS = [
  { num: 1, label: 'Business Basics', key: 'business_basics', Component: Step1BusinessBasics },
  { num: 2, label: 'Branding', key: 'branding', Component: Step2Branding },
  { num: 3, label: 'Service Catalog', key: 'service_catalog', Component: Step3ServiceCatalog },
  { num: 4, label: 'Team & Scheduling', key: 'team_scheduling', Component: Step4TeamScheduling },
  { num: 5, label: 'Integrations', key: 'integrations', Component: Step5Integrations },
];

export default function OnboardingWizard() {
  const [searchParams] = useSearchParams();
  const checkout = searchParams.get('checkout');
  const resumeSessionId = searchParams.get('session');

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  const initFromTier = useCallback(async (tier) => {
    try {
      const r = await base44.functions.invoke('onboardingWizard', {
        action: 'init',
        plan_tier: tier,
      });
      const s = r?.data?.session;
      if (s) {
        setSession(s);
        setCurrentStep(s.current_step || 1);
      } else {
        setError(r?.data?.error || 'Failed to start onboarding.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeSession = useCallback(async (sid) => {
    try {
      const r = await base44.functions.invoke('onboardingWizard', { action: 'get', session_id: sid });
      const s = r?.data?.session;
      if (s) {
        setSession(s);
        setCurrentStep(s.current_step || 1);
      } else {
        setError(r?.data?.error || 'Failed to load onboarding session.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      // Resume flow: ?session=<onboarding_session_id>
      if (resumeSessionId) {
        await resumeSession(resumeSessionId);
        return;
      }

      // Post-checkout: ?checkout=success — confirm payment landed, then provision.
      // Load the existing session (created pre-payment) so it's ready for provisioning.
      if (checkout === 'success') {
        try {
          const r = await base44.functions.invoke('eraAccount', { action: 'get' });
          const data = r?.data || r;
          if (data.success && data.account?.onboarding_session_id) {
            const sessRes = await base44.functions.invoke('onboardingWizard', { action: 'get', session_id: data.account.onboarding_session_id });
            if (sessRes?.data?.session) setSession(sessRes.data.session);
          }
        } catch (e) { /* session loaded after confirming if this fails */ }
        setConfirming(true);
        setLoading(false);
        return;
      }

      // Pre-payment: ?tier=<basic|foundation> — start the wizard before checkout.
      const tier = searchParams.get('tier');
      if (tier) {
        await initFromTier(tier);
        return;
      }

      // No params: try to resume from EraAccount's onboarding_session_id.
      try {
        const r = await base44.functions.invoke('eraAccount', { action: 'get' });
        const data = r?.data || r;
        if (data.success && data.account?.onboarding_session_id) {
          await resumeSession(data.account.onboarding_session_id);
          return;
        }
        // No session — send them to the portal to pick a tier.
        window.location.href = '/era-portal';
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConfirmed = useCallback(() => {
    // Payment confirmed by webhook — go straight to provisioning (no init needed;
    // the OnboardingSession already exists from the pre-payment wizard flow).
    setConfirming(false);
    setProvisioning(true);
  }, []);

  // Step 5 complete — redirect to Stripe checkout. Payment happens AFTER the wizard
  // collects all business info, BEFORE provisioning. The OnboardingSession is stamped
  // with the checkout session ID so the provision action can verify payment against it.
  const startCheckout = useCallback(async () => {
    if (!session) return;
    if (window.self !== window.top) {
      setError('Checkout works only from the published app. Please open this page in a new tab.');
      return;
    }
    setSaving(true);
    try {
      const isLive = window.location.hostname.includes('eraleadgen.com');
      const res = await base44.functions.invoke('createEraCheckoutSession', {
        tier: session.plan_tier,
        mode: isLive ? 'live' : 'test',
        onboarding_session_id: session.id,
      });
      const data = res?.data || res;
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (e) {
      setError(e.message || 'Checkout failed');
    } finally {
      setSaving(false);
    }
  }, [session]);

  const handleNext = useCallback(async (stepData) => {
    if (!session) return;
    const step = STEPS.find((s) => s.num === currentStep);
    if (!step) return;
    setSaving(true);
    try {
      const r = await base44.functions.invoke('onboardingWizard', {
        action: 'save_step',
        session_id: session.id,
        step_number: currentStep,
        step_data: { [step.key]: stepData },
      });
      if (r?.data?.session) setSession(r.data.session);

      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        // Step 5 saved — redirect to Stripe checkout (payment before provisioning).
        await startCheckout();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [currentStep, session, startCheckout]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  if (confirming) {
    return <ConfirmingPayment onConfirmed={handleConfirmed} />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian px-6">
        <div className="max-w-md text-center">
          <p className="text-red-400 font-mono-tech text-sm mb-4">{error}</p>
          <p className="text-vapor/50 text-sm">If you believe this is an error, please contact support.</p>
        </div>
      </div>
    );
  }

  if (provisioning) {
    return (
      <ProvisioningScreen
        sessionId={session.id}
        onComplete={() => {
          // Provisioning complete — redirect to the ERA account portal, which shows
          // the active plan, features, and a link to the client's live site via SSO.
          window.location.href = '/era-portal';
        }}
      />
    );
  }

  if (!session) return null;

  const step = STEPS.find((s) => s.num === currentStep);
  const StepComponent = step.Component;
  const stepData = session.wizard_data?.[step.key] || {};

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header with progress */}
      <div className="glass-header sticky top-0 z-50 px-4 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-grotesk font-bold text-gold">ERA</span>
            <span className="text-xs font-mono-tech tracking-widest text-vapor/40 hidden sm:inline">ONBOARDING</span>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono-tech font-bold transition-colors ${s.num < currentStep ? 'bg-gold text-obsidian' : s.num === currentStep ? 'bg-gold/20 border border-gold text-gold' : 'bg-asphalt border border-vapor/10 text-vapor/30'}`}>
                  {s.num < currentStep ? <Check size={14} /> : s.num}
                </div>
                {s.num < 5 && <div className={`w-6 h-px ${s.num < currentStep ? 'bg-gold' : 'bg-vapor/10'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-xs font-mono-tech tracking-widest text-gold/60 mb-1">STEP {currentStep} OF 5</p>
          <h1 className="text-2xl font-grotesk font-bold text-vapor">{step.label}</h1>
        </div>

        <StepComponent
          data={stepData}
          planTier={session.plan_tier}
          onNext={handleNext}
          onBack={handleBack}
          saving={saving}
          isFirst={currentStep === 1}
          isLast={currentStep === 5}
        />
      </div>
    </div>
  );
}