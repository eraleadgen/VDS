import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, AlertCircle, Globe, CreditCard, Calendar, Rocket } from 'lucide-react';

const PROVISION_STEPS = [
  { key: 'config', label: 'Finalizing business configuration', icon: Globe, description: 'Writing your services, pricing, hours, and branding' },
  { key: 'stripe', label: 'Confirming Stripe authorization', icon: CreditCard, description: 'Verifying your payment account is active' },
  { key: 'calendar', label: 'Confirming Google Calendar authorization', icon: Calendar, description: 'Verifying appointment sync is ready' },
  { key: 'domain', label: 'Activating your domain', icon: Rocket, description: 'Making your site live at your subdomain' },
];

export default function ProvisioningScreen({ sessionId, onComplete }) {
  const [animStep, setAnimStep] = useState(0);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('provisioning');
  const completedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      // Staggered visual animation — reveals each step over ~2.8s total.
      const animPromises = [];
      for (let i = 0; i < PROVISION_STEPS.length; i++) {
        animPromises.push(new Promise((resolve) => setTimeout(() => {
          if (active) setAnimStep(i + 1);
          resolve();
        }, (i + 1) * 700)));
      }

      // Fire the backend provision call in parallel with the animation.
      const provisionPromise = base44.functions.invoke('onboardingWizard', {
        action: 'provision',
        session_id: sessionId,
      }).then((r) => r?.data).catch((e) => ({ error: e.message }));

      // Wait for both the animation and the backend to finish.
      const [, provResult] = await Promise.all([Promise.all(animPromises), provisionPromise]);
      if (!active) return;

      setResult(provResult);

      if (provResult?.error) {
        setPhase('error');
      } else {
        setPhase('done');
        // Show the "all done" state for a beat, then notify the parent.
        await new Promise((r) => setTimeout(r, 1200));
        if (active && !completedRef.current) {
          completedRef.current = true;
          onComplete(provResult);
        }
      }
    };
    run();
    return () => { active = false; };
  }, [sessionId, onComplete]);

  const getStepStatus = (index) => {
    if (phase === 'done' && result?.steps) {
      const stepResult = result.steps[PROVISION_STEPS[index].key];
      return stepResult?.status === 'complete' ? 'done' : 'failed';
    }
    if (phase === 'error') {
      const stepResult = result?.steps?.[PROVISION_STEPS[index].key];
      if (stepResult?.status === 'failed') return 'failed';
      if (animStep > index) return 'done';
      return 'pending';
    }
    // During provisioning: steps before animStep are done, current is working.
    if (animStep > index) return 'done';
    if (animStep === index) return 'working';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-obsidian px-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          {phase === 'done' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-gold" />
              </div>
              <h1 className="text-2xl font-grotesk font-bold text-vapor mb-1">Your site is live!</h1>
              <p className="text-vapor/50 text-sm">{result?.business_name} is now online</p>
            </>
          ) : phase === 'error' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-grotesk font-bold text-vapor mb-1">Provisioning failed</h1>
              <p className="text-red-400/70 text-sm">{result?.error || 'An unexpected error occurred'}</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <Loader2 size={32} className="text-gold animate-spin" />
              </div>
              <h1 className="text-2xl font-grotesk font-bold text-vapor mb-1">Provisioning your site</h1>
              <p className="text-vapor/50 text-sm">This will only take a few seconds…</p>
            </>
          )}
        </div>

        <div className="space-y-3">
          {PROVISION_STEPS.map((step, i) => {
            const status = getStepStatus(i);
            const Icon = step.icon;
            return (
              <div key={step.key} className={`flex items-start gap-3 p-3 rounded-sm border transition-colors ${status === 'done' ? 'border-gold/20 bg-gold/5' : status === 'working' ? 'border-gold/40 bg-gold/10' : status === 'failed' ? 'border-red-500/30 bg-red-500/5' : 'border-vapor/10 bg-asphalt/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${status === 'done' ? 'bg-gold/20' : status === 'working' ? 'bg-gold/20' : status === 'failed' ? 'bg-red-500/20' : 'bg-vapor/5'}`}>
                  {status === 'done' ? <Check size={16} className="text-gold" /> : status === 'working' ? <Loader2 size={16} className="text-gold animate-spin" /> : status === 'failed' ? <AlertCircle size={16} className="text-red-400" /> : <Icon size={16} className="text-vapor/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-grotesk font-medium ${status === 'pending' ? 'text-vapor/40' : 'text-vapor'}`}>{step.label}</p>
                  <p className="text-vapor/40 text-xs">{step.description}</p>
                  {status === 'failed' && result?.steps?.[step.key]?.error && (
                    <p className="text-red-400/60 text-xs mt-1">{result.steps[step.key].error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {phase === 'error' && (
          <div className="mt-6 text-center">
            <button onClick={() => window.location.reload()} className="text-gold text-sm font-grotesk hover:text-gold-light">Retry provisioning</button>
          </div>
        )}
      </div>
    </div>
  );
}