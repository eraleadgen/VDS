// ─────────────────────────────────────────────────────────────────────
// Interactive demo tenant data for eraleadgen.com.
//
// This is a STATIC, FROZEN object literal — the entire "demo tenant" lives
// in memory. No backend function is ever called, no entity is ever read or
// written, and no SDK call exists anywhere in the demo code path. Read-only
// is enforced structurally: there is no create/update/delete to guard.
//
// All names, phones, emails, addresses, and revenue figures are FICTIONAL.
// "Apex Detail Co." is a clearly-labeled demo tenant (business_id: demo_era,
// reserved in onboardingWizard's RESERVED_SLUGS). No real VDS customer data
// appears here.
// ─────────────────────────────────────────────────────────────────────

export const DEMO_TENANT = {
  business_id: 'demo_era',
  business_name: 'Apex Detail Co.',
  plan_tier: 'foundation',
  service_area: 'Charlotte, NC',
  running_since: 'January 2025',
  tagline: 'Premium mobile detailing, booked and dispatched automatically.',
};

// ── Overview screen data ──────────────────────────────────────────────
export const DEMO_OVERVIEW = {
  metrics: {
    total_revenue: 47820,
    revenue_jobs: 142,
    total_contractors: 4,
    active_contractors: 3,
    todays_jobs: 3,
    upcoming_jobs: 11,
    completed_jobs: 138,
    cancelled_jobs: 7,
  },
  jobs_by_contractor: [
    { name: 'Marcus Reed', jobs: 48 },
    { name: 'Diana Cole', jobs: 41 },
    { name: 'Theo Vance', jobs: 32 },
    { name: 'Lena Park', jobs: 17 },
  ],
  recent_activity: [
    { icon: 'check', text: 'Marcus Reed completed Full Detail for Daniel R.', meta: '2h ago', amount: '$284' },
    { icon: 'quote', text: 'New quote requested by Sarah K. — Ceramic Coating', meta: '4h ago', amount: '$1,200' },
    { icon: 'play', text: 'Diana Cole marked Ceramic Coating as in progress', meta: '5h ago', amount: '' },
    { icon: 'star', text: 'Review submitted by Aaron M. — 5 stars', meta: '1d ago', amount: '' },
    { icon: 'crown', text: 'Gold Membership started by Jeremy W.', meta: '1d ago', amount: '$250/mo' },
    { icon: 'check', text: 'Theo Vance completed Interior Detail for Priya S.', meta: '2d ago', amount: '$189' },
  ],
};

// ── Analytics screen data ─────────────────────────────────────────────
export const DEMO_ANALYTICS = {
  revenueTrends: [
    { month: '2025-01', revenue: 2100 },
    { month: '2025-02', revenue: 2800 },
    { month: '2025-03', revenue: 3400 },
    { month: '2025-04', revenue: 3900 },
    { month: '2025-05', revenue: 4400 },
    { month: '2025-06', revenue: 4800 },
    { month: '2025-07', revenue: 5200 },
    { month: '2025-08', revenue: 5100 },
    { month: '2025-09', revenue: 5400 },
    { month: '2025-10', revenue: 5300 },
    { month: '2025-11', revenue: 5600 },
    { month: '2025-12', revenue: 4820 },
  ],
  customerBreakdown: { new: 87, repeat: 54 },
  avgLtv: 342,
  topCustomers: [
    { name: 'Daniel Romero', ltv: 3260, jobs: 4 },
    { name: 'Sarah Kim', ltv: 2480, jobs: 3 },
    { name: 'Aaron Mitchell', ltv: 1890, jobs: 3 },
    { name: 'Priya Sharma', ltv: 1640, jobs: 2 },
    { name: 'Jeremy Walsh', ltv: 1420, jobs: 2 },
  ],
  serviceProfitability: [
    { label: 'Full Detail', revenue: 18420 },
    { label: 'Ceramic Coating', revenue: 14400 },
    { label: 'Interior Detail', revenue: 8260 },
    { label: 'Paint Correction', revenue: 5400 },
    { label: 'Gold Membership', revenue: 1340 },
  ],
};