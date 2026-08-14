import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import Step1BusinessBasics from '@/components/onboarding/Step1BusinessBasics';
import Step2Branding from '@/components/onboarding/Step2Branding';
import Step3ServiceCatalog from '@/components/onboarding/Step3ServiceCatalog';
import Step4TeamScheduling from '@/components/onboarding/Step4TeamScheduling';
import Step5Integrations from '@/components/onboarding/Step5Integrations';
import ProvisioningScreen from '@/components/onboarding/ProvisioningScreen';

const STEPS = [
  { num: 1, label: 'Business Basics', key: 'business_basics', Component: Step1BusinessBasics },
  { num: 2, label: 'Branding', key: 'branding', Component: Step2Branding },
  { num: 3, label: 'Service Catalog', key: 'service_catalog', Component: Step3ServiceCatalog },
  { num: 4, label: 'Team & Scheduling', key: 'team_scheduling', Component: Step4TeamScheduling },
  { num: 5, label: 'Integrations', key: 'integrations', Component: Step5Integrations },
];

export default function OnboardingWizard() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(null);
  const [provisioning, setProvisioning] = useState(false);

  useEffect(() => {
    (async () => {
      if (!sessionId) {
        setError('No onboarding session provided. Please complete a tier purchase first.');
        setLoading(false);
        return;
      }
      try {
        let r = await base44.functions.invoke('onboardingWizard', { action: 'get', session_id: sessionId });
        let s = r?.data?.session;
        if (!s) {
          r = await base44.functions.invoke('onboardingWizard', { action: 'init', stripe_checkout_session_id: sessionId });
          s = r?.data?.session;
        }
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
    })();
  }, [sessionId]);

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
        // Step 5 saved — show the auto-provisioning loading screen.
        setProvisioning(true);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [currentStep, session]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

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
        onComplete={(result) => {
          setCompleted({ subdomain: result.subdomain, businessName: result.business_name });
          setProvisioning(false);
        }}
      />
    );
  }

  if (completed) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-gold" />
          </div>
          <h1 className="text-2xl font-grotesk font-bold text-vapor mb-2">You're all set!</h1>
          <p className="text-vapor/60 mb-1">Your business is now live at</p>
          <p className="text-gold font-mono-tech text-lg mb-6">{completed.subdomain}</p>
          <a href={`https://${completed.subdomain}`} className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-obsidian font-grotesk font-bold rounded-sm hover:bg-gold-light transition-colors">
            Visit Your Site <ChevronRight size={18} />
          </a>
        </div>
      </div>
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