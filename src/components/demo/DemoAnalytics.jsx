import { DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { DEMO_ANALYTICS } from '@/lib/demoTenantData';

// Uses inline hex palette matching eraleadgen.com — no design-system token
// classes, so it renders identically on the era_systems tenant.

const PANEL = { background: '#0C1614', border: '1px solid #1A2A24', borderRadius: '8px' };

const formatMonth = (key) => {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const formatMonthFull = (key) => {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function DemoAnalytics() {
  const trends = DEMO_ANALYTICS.revenueTrends;
  const rangeLabel = `${formatMonthFull(trends[0].month)} – ${formatMonthFull(trends[trends.length - 1].month)}`;
  const revenueData = trends.map((d) => ({ month: formatMonth(d.month), revenue: d.revenue }));
  const breakdownData = [
    { name: 'New', value: DEMO_ANALYTICS.customerBreakdown.new },
    { name: 'Repeat', value: DEMO_ANALYTICS.customerBreakdown.repeat },
  ];
  const serviceData = DEMO_ANALYTICS.serviceProfitability.map((s) => ({ name: s.label, revenue: s.revenue }));

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '24px', color: '#DFEDE9' }}>Analytics</h1>
        <span style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: '#4A6359' }}>BUSINESS INTELLIGENCE</span>
      </div>

      {/* Revenue Trends */}
      <div className="p-5" style={PANEL}>
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)' }}>REVENUE TRENDS — LAST 12 MONTHS</h2>
          <span style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', color: '#4A6359' }}>{rangeLabel}</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="demoRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#7A9A92" fontSize={11} tickLine={false} axisLine={{ stroke: '#1A2A24' }} />
            <YAxis stroke="#7A9A92" fontSize={11} tickLine={false} axisLine={{ stroke: '#1A2A24' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: '#0C1614', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, fontSize: 12, color: '#DFEDE9' }} cursor={{ fill: 'rgba(212,175,55,0.05)' }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#demoRevGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer LTV */}
        <div className="p-5" style={PANEL}>
          <h2 style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', marginBottom: '16px' }}>CUSTOMER LIFETIME VALUE</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-11 h-11 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <DollarSign size={22} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '30px', color: '#D4AF37', lineHeight: 1 }}>${DEMO_ANALYTICS.avgLtv.toLocaleString()}</p>
              <p style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: '#7A9A92', marginTop: '6px' }}>AVERAGE LTV PER CUSTOMER</p>
            </div>
          </div>
          <div>
            {DEMO_ANALYTICS.topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < DEMO_ANALYTICS.topCustomers.length - 1 ? '1px solid #1A2A24' : 'none' }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '12px', color: 'rgba(212,175,55,0.5)', width: '20px' }}>{i + 1}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#DFEDE9' }}>{c.name}</span>
                </div>
                <div className="text-right">
                  <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '13px', color: '#D4AF37' }}>${c.ltv.toLocaleString()}</span>
                  <span style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', color: '#4A6359', marginLeft: '8px' }}>{c.jobs} jobs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Repeat vs New */}
          <div className="p-5" style={PANEL}>
            <h2 style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', marginBottom: '16px' }}>NEW vs. REPEAT CUSTOMERS</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={breakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    <Cell fill="#D4AF37" />
                    <Cell fill="#475569" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-[3px]" style={{ background: '#D4AF37' }}></div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#DFEDE9' }}>New — {DEMO_ANALYTICS.customerBreakdown.new}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-[3px]" style={{ background: '#475569' }}></div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#DFEDE9' }}>Repeat — {DEMO_ANALYTICS.customerBreakdown.repeat}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Profitability */}
          <div className="p-5" style={PANEL}>
            <h2 style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', marginBottom: '16px' }}>SERVICE-TYPE PROFITABILITY</h2>
            <ResponsiveContainer width="100%" height={Math.max(160, serviceData.length * 40)}>
              <BarChart data={serviceData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke="#7A9A92" fontSize={11} tickLine={false} axisLine={{ stroke: '#1A2A24' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="#7A9A92" fontSize={11} tickLine={false} axisLine={{ stroke: '#1A2A24' }} width={100} />
                <Tooltip contentStyle={{ background: '#0C1614', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, fontSize: 12, color: '#DFEDE9' }} cursor={{ fill: 'rgba(212,175,55,0.05)' }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}