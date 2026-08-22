import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowRight, CreditCard, Globe, Sparkles, LayoutDashboard, Users, CalendarRange, FileText, DollarSign, Route, Network, LineChart, Library, Palette, BarChart3, MessageSquare, Settings } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import EraPortalPlanTab from "@/components/era/EraPortalPlanTab";
import EraPortalBillingTab from "@/components/era/EraPortalBillingTab";
import EraPortalConnectionsTab from "@/components/era/EraPortalConnectionsTab";
import EraPortalOverviewTab from "@/components/era/EraPortalOverviewTab";
import EraPortalOpsTab from "@/components/era/EraPortalOpsTab";
import EraPortalLockedTab from "@/components/era/EraPortalLockedTab";

const invoke = (payload) => base44.functions.invoke('eraAccount', payload).then(r => r.data ?? r);

export default function EraPortal() {
  const [account, setAccount] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // ERA staff (allowlisted emails / EraStaff records) never see the paywall —
        // they belong at the cross-tenant ERA Admin Portal, not here. Check in parallel
        // with the account load so staff are redirected without waiting on billing.
        base44.functions.invoke('getEraStaffConsole', {})
          .then(() => { window.location.replace('/era-admin'); })
          .catch(() => {});

        const params = new URLSearchParams(window.location.search);
        const needsInit = params.get('init') === '1';
        // For Google OAuth users landing with ?init=1, create the EraAccount on first load.
        const action = needsInit ? 'create' : 'get';
        const res = await invoke({ action });
        if (res.success) {
          setAccount(res.account);
          // If provisioned, fetch the full summary (EraAccount + client BusinessConfig + site URL).
          if (res.account?.business_id) {
            const sum = await invoke({ action: 'get_provisioned_summary' });
            if (sum.success) setSummary(sum.summary);
          }
        }
      } catch (e) {
        setError(e.message || "Failed to load account");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetches the provisioned summary and updates parent state. Returns the fresh
  // summary so callers (the billing tab's poll loop) can inspect the real state
  // to confirm a webhook landed — not just trigger a blind refetch.
  const refreshSummary = async () => {
    try {
      const sum = await invoke({ action: 'get_provisioned_summary' });
      if (sum.success) { setSummary(sum.summary); return sum.summary; }
      return null;
    } catch (e) { return null; }
  };

  // Tier selection now starts the onboarding wizard immediately (before payment).
  // The wizard collects business info first; checkout happens after step 5.
  const handleChooseTier = (tier) => {
    navigate(`/onboarding?tier=${tier}`);
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

  // Paid but not provisioned — finalize provisioning (wizard already complete).
  if (account.setup_fee_paid && !account.business_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Payment confirmed</h1>
          <p className="text-muted-foreground mb-6">
            Your {account.current_plan_tier === 'foundation' ? 'Foundation' : 'Basic'} plan is active. Let's finish setting up your site.
          </p>
          <Link to="/onboarding?checkout=success">
            <Button size="lg">Complete setup <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  // Started onboarding but haven't paid — resume the wizard (data is preserved).
  if (!account.setup_fee_paid && !account.business_id && account.onboarding_session_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Continue your setup</h1>
          <p className="text-muted-foreground mb-6">
            You started setting up your business. Pick up where you left off.
          </p>
          <Link to={`/onboarding?session=${account.onboarding_session_id}`}>
            <Button size="lg">Resume onboarding <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not paid — show tier selection.
  if (!account.setup_fee_paid) {
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
                <span className="text-4xl font-bold">$199</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-sm text-muted-foreground mt-1">+ $750 one-time setup fee</p>
              </div>
              <ul className="space-y-2 mb-8 text-sm flex-1">
                <li>✓ Member portal</li>
                <li>✓ Specialist portal</li>
                <li>✓ CRM & job management</li>
                <li>✓ AI concierge</li>
              </ul>
              <Button onClick={() => handleChooseTier('basic')} className="w-full">
                Choose Basic
              </Button>
            </div>

            <div className="border border-primary rounded-lg p-8 flex flex-col relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Most popular
              </span>
              <h2 className="text-xl font-bold mb-2">Foundation</h2>
              <p className="text-muted-foreground text-sm mb-6">Advanced tools to grow and scale.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-sm text-muted-foreground mt-1">+ $1,200 one-time setup fee</p>
              </div>
              <ul className="space-y-2 mb-8 text-sm flex-1">
                <li>✓ Everything in Basic</li>
                <li>✓ Partner engine (referrals)</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
              </ul>
              <Button onClick={() => handleChooseTier('foundation')} className="w-full">
                Choose Foundation
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Provisioned: the ERA member portal ──
  // Same sidebar layout as the VDS admin portal, but the operational tabs are gated
  // two ways: (1) by plan tier — each module unlocks at a higher tier; (2) by the
  // 24-hour ERA provisioning review — ops stay locked until ERA staff audit and
  // approve the new tenant's website, domain, and integrations. Account-management
  // tabs (overview, plan, billing, connections) are always available.
  const TIER_RANK = { basic: 1, foundation: 2, growth: 3, enterprise: 4 };
  const TIER_NAME = { 1: 'Basic', 2: 'Foundation', 3: 'Growth', 4: 'Enterprise' };
  const reviewStatus = account?.provisioning_review_status || 'approved';
  const reviewApproved = reviewStatus === 'approved';
  const planTier = account?.current_plan_tier || summary?.business?.plan_tier || 'basic';
  const tierRank = TIER_RANK[planTier] || 1;
  const siteUrl = summary?.site_url;

  const OPS_TABS = [
    { key: 'specialists', label: 'SPECIALISTS', icon: Users, minTier: 2 },
    { key: 'jobs', label: 'JOBS', icon: CalendarRange, minTier: 1 },
    { key: 'quotes', label: 'QUOTES', icon: FileText, minTier: 1 },
    { key: 'invoices', label: 'INVOICES', icon: DollarSign, minTier: 1 },
    { key: 'journey', label: 'JOURNEY', icon: Route, minTier: 1 },
    { key: 'partners', label: 'PARTNERS', icon: Network, minTier: 4 },
    { key: 'users', label: 'USERS', icon: Users, minTier: 1 },
    { key: 'business', label: 'BUSINESS DEV', icon: LineChart, minTier: 4 },
    { key: 'resources', label: 'RESOURCES', icon: Library, minTier: 1 },
    { key: 'website', label: 'WEBSITE', icon: Palette, minTier: 1 },
    { key: 'analytics', label: 'ANALYTICS', icon: BarChart3, minTier: 4 },
    { key: 'messages', label: 'MESSAGES', icon: MessageSquare, minTier: 3 },
    { key: 'settings', label: 'SETTINGS', icon: Settings, minTier: 1 },
  ];

  const accountTabs = [
    { key: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { key: 'plan', label: 'PLAN & FEATURES', icon: Sparkles },
    { key: 'billing', label: 'BILLING', icon: CreditCard },
    { key: 'connections', label: 'WEBSITE & CONNECTIONS', icon: Globe },
  ];

  const opsNav = OPS_TABS.map((t) => {
    const tierLocked = tierRank < t.minTier;
    const reviewLocked = !tierLocked && !reviewApproved;
    return { ...t, locked: tierLocked || reviewLocked, tierLocked, reviewLocked, minTierName: TIER_NAME[t.minTier] };
  });

  const navItems = [...accountTabs, ...opsNav];
  const activeOps = OPS_TABS.find((t) => t.key === tab);

  return (
    <PortalShell
      title="ERA Member Portal"
      navItems={navItems}
      active={tab}
      onNavigate={setTab}
      userLabel={account.email}
      onLogout={() => base44.auth.logout('/era-login')}
    >
      {tab === 'overview' && (
        <EraPortalOverviewTab
          account={account}
          summary={summary}
          reviewStatus={reviewStatus}
          reviewDeadline={account?.review_deadline}
          siteUrl={siteUrl}
          planTier={planTier}
          onNavigate={setTab}
        />
      )}
      {tab === 'plan' && <EraPortalPlanTab summary={summary} onNavigate={setTab} />}
      {tab === 'billing' && <EraPortalBillingTab summary={summary} onRefresh={refreshSummary} />}
      {tab === 'connections' && <EraPortalConnectionsTab summary={summary} />}
      {activeOps && activeOps.locked && (
        <EraPortalLockedTab tab={activeOps} reviewDeadline={account?.review_deadline} onNavigate={setTab} />
      )}
      {activeOps && !activeOps.locked && <EraPortalOpsTab tab={activeOps} siteUrl={siteUrl} />}
    </PortalShell>
  );
}