// Realistic mock analytics for the Admin Dashboard, used only in builder preview
// mode (src/lib/previewMode.js) so the Overview and Analytics tabs render fully
// populated for screenshots — without writing fake records into the live VDS
// database. Never active on a published production domain.

export const DEMO_METRICS = {
  metrics: {
    total_revenue: 84520,
    revenue_jobs: 127,
    total_contractors: 6,
    active_contractors: 4,
    todays_jobs: 3,
    upcoming_jobs: 18,
    completed_jobs: 142,
    cancelled_jobs: 7,
  },
  jobs_by_contractor: [
    { name: 'Marcus Reed', jobs: 38 },
    { name: 'Diego Santos', jobs: 31 },
    { name: 'Tyler Brooks', jobs: 27 },
    { name: 'Andre Wilkins', jobs: 22 },
    { name: 'Jordan Miles', jobs: 14 },
    { name: 'Caleb Nguyen', jobs: 10 },
  ],
};

export const DEMO_ANALYTICS = {
  avgLtv: 1240,
  revenueTrends: [
    { month: '2025-09', revenue: 4200 },
    { month: '2025-10', revenue: 5100 },
    { month: '2025-11', revenue: 4800 },
    { month: '2025-12', revenue: 6200 },
    { month: '2026-01', revenue: 5900 },
    { month: '2026-02', revenue: 6800 },
    { month: '2026-03', revenue: 7400 },
    { month: '2026-04', revenue: 7100 },
    { month: '2026-05', revenue: 8200 },
    { month: '2026-06', revenue: 8900 },
    { month: '2026-07', revenue: 8600 },
    { month: '2026-08', revenue: 9400 },
  ],
  customerBreakdown: { new: 68, repeat: 54 },
  serviceProfitability: [
    { label: 'Full Detail', revenue: 24800 },
    { label: 'Ceramic Coating', revenue: 18900 },
    { label: 'Paint Correction', revenue: 14200 },
    { label: 'Gold Membership', revenue: 8220 },
    { label: 'Exterior Detail', revenue: 9800 },
    { label: 'Interior Detail', revenue: 7600 },
  ],
  topCustomers: [
    { name: 'Sarah Whitfield', ltv: 4820, jobs: 9 },
    { name: 'Marcus Chen', ltv: 3950, jobs: 7 },
    { name: 'Priya Patel', ltv: 3120, jobs: 6 },
    { name: 'James Okafor', ltv: 2780, jobs: 5 },
    { name: 'Elena Rodriguez', ltv: 2410, jobs: 5 },
  ],
};