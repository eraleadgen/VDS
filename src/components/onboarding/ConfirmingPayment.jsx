import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Polling state shown after Stripe checkout redirect. The success_url can reach the
// browser before the webhook has stamped EraAccount.setup_fee_paid. Rather than treating
// the first check as final, we poll EraAccount a few times over ~15s before concluding
// the payment hasn't landed. On confirmation, calls onConfirmed() to proceed to the wizard.

const POLL_INTERVAL = 1500; // 1.5s between polls
const MAX_POLLS = 10; // ~15s total before timeout

export default function ConfirmingPayment({ onConfirmed }) {
  const [status, setStatus] = useState('polling'); // 'polling' | 'confirmed' | 'timeout'
  const [retryKey, setRetryKey] = useState(0);
  const pollCount = useRef(0);

  useEffect(() => {
    pollCount.current = 0;
    let active = true;

    const poll = async () => {
      pollCount.current++;
      try {
        const res = await base44.functions.invoke('eraAccount', { action: 'get' });
        const data = res?.data || res;
        if (data.success && data.account?.setup_fee_paid) {
          if (active) {
            setStatus('confirmed');
            setTimeout(() => onConfirmed(), 1000);
          }
          return;
        }
      } catch (e) {
        // EraAccount might not exist yet — keep polling.
      }

      if (pollCount.current >= MAX_POLLS) {
        if (active) setStatus('timeout');
        return;
      }

      setTimeout(poll, POLL_INTERVAL);
    };

    setStatus('polling');
    const timer = setTimeout(poll, POLL_INTERVAL);

    return () => { active = false; clearTimeout(timer); };
  }, [retryKey]);

  if (status === 'confirmed') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-gold" />
          </div>
          <h1 className="text-2xl font-grotesk font-bold text-vapor mb-2">Payment confirmed</h1>
          <p className="text-vapor/50 text-sm font-mono-tech">Setting up your onboarding...</p>
        </div>
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-obsidian px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-gold/60" />
          </div>
          <h1 className="text-xl font-grotesk font-bold text-vapor mb-2">Still confirming your payment</h1>
          <p className="text-vapor/50 text-sm mb-6">
            We haven't received confirmation from our payment processor yet. This can take a few moments.
          </p>
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className="px-6 py-3 bg-gold text-obsidian font-grotesk font-bold rounded-sm hover:bg-gold-light transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
      <div className="text-center">
        <Loader2 className="w-10 h-10 mx-auto mb-6 text-gold animate-spin" />
        <h1 className="text-xl font-grotesk font-bold text-vapor mb-2">Confirming your payment...</h1>
        <p className="text-vapor/40 text-sm font-mono-tech">This will only take a moment</p>
      </div>
    </div>
  );
}