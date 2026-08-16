import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export default function EraPortal() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const needsInit = params.get('init') === '1';
        // For Google OAuth users landing with ?init=1, create the EraAccount on first load.
        const action = needsInit ? 'create' : 'get';
        const res = await base44.functions.invoke('eraAccount', { action });
        const data = res?.data || res;
        if (data.success) {
          setAccount(data.account);
        }
      } catch (e) {
        setError(e.message || "Failed to load account");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCheckout = async (tier) => {
    setError("");
    // Iframe check: Stripe checkout doesn't work from within an iframe.
    if (window.self !== window.top) {
      alert("Checkout works only from the published app. Please open this page in a new tab.");
      return;
    }
    setCheckingOut(tier);
    try {
      // Use test mode unless we're on the production ERA domain.
      const isLive = window.location.hostname.includes('eraleadgen.com');
      const res = await base44.functions.invoke('createEraCheckoutSession', { tier, mode: isLive ? 'live' : 'test' });
      const data = res?.data || res;
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
        setCheckingOut(null);
      }
    } catch (e) {
      setError(e.message || "Checkout failed");
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No ERA account found.</p>
          <Link to="/era-register">
            <Button>Create your account</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Already provisioned — go to dashboard (Phase D).
  if (account.business_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Your business is live</h1>
          <p className="text-muted-foreground mb-6">Your ERA account is fully provisioned.</p>
          <Link to="/">
            <Button>Go to dashboard <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  // Paid but not provisioned — continue to onboarding.
  if (account.setup_fee_paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Payment confirmed</h1>
          <p className="text-muted-foreground mb-6">
            Your {account.current_plan_tier === 'foundation' ? 'Foundation' : 'Basic'} plan is active. Let's set up your business.
          </p>
          <Link to="/onboarding">
            <Button size="lg">Start onboarding <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not paid — show tier selection.
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Choose your plan</h1>
        <p className="text-muted-foreground text-center mb-12">Start your business on ERA Systems</p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-8 flex flex-col">
            <h2 className="text-xl font-bold mb-2">Basic</h2>
            <p className="text-muted-foreground text-sm mb-6">Everything you need to launch your service business.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$150</span>
              <span className="text-muted-foreground">/month</span>
              <p className="text-sm text-muted-foreground mt-1">+ $500 one-time setup fee</p>
            </div>
            <ul className="space-y-2 mb-8 text-sm flex-1">
              <li>✓ Member portal</li>
              <li>✓ Specialist portal</li>
              <li>✓ CRM & job management</li>
              <li>✓ AI concierge</li>
            </ul>
            <Button onClick={() => handleCheckout('basic')} disabled={checkingOut !== null} className="w-full">
              {checkingOut === 'basic' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</>
              ) : (
                "Choose Basic"
              )}
            </Button>
          </div>

          <div className="border border-primary rounded-lg p-8 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
              Most popular
            </span>
            <h2 className="text-xl font-bold mb-2">Foundation</h2>
            <p className="text-muted-foreground text-sm mb-6">Advanced tools to grow and scale.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$400</span>
              <span className="text-muted-foreground">/month</span>
              <p className="text-sm text-muted-foreground mt-1">+ $900 one-time setup fee</p>
            </div>
            <ul className="space-y-2 mb-8 text-sm flex-1">
              <li>✓ Everything in Basic</li>
              <li>✓ Partner engine (referrals)</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
            </ul>
            <Button onClick={() => handleCheckout('foundation')} disabled={checkingOut !== null} className="w-full">
              {checkingOut === 'foundation' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting...</>
              ) : (
                "Choose Foundation"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}