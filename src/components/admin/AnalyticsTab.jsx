import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign } from 'lucide-react';
import { isPreviewMode } from '@/lib/previewMode';
import { DEMO_ANALYTICS } from '@/lib/demoAnalytics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export default function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isPreviewMode()) { setData(DEMO_ANALYTICS); setLoading(false); return; }
    (async () => {
      try {
        const r = await base44.functions.invoke('getAdvancedAnalytics', {});
        setData(r?.data ?? r);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  }
  if (error) {
    return <div className="text-center py-20 text-red-400 font-mono-tech text-sm">{error}</div>;
  }
  if (!data) return null;

  const formatMonth = (key) => {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1);
    return d.toLocaleDateString('en-US', { month: 'short' });
  };

  const revenueData = (data.revenueTrends || []).map((d) => ({ month: formatMonth(d.month), revenue: d.revenue }));
  const breakdownData = [
    { name: 'New', value: data.customerBreakdown?.new || 0 },
    { name: 'Repeat', value: data.customerBreakdown?.repeat || 0 },
  ];
  const serviceData = (data.serviceProfitability || []).map((s) => ({ name: s.label, revenue: s.revenue }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Analytics</h1>
        <span className="text-xs font-mono-tech tracking-widest text-vapor/40">BUSINESS INTELLIGENCE</span>
      </div>

      {/* Revenue Trends */}
      <div className="glass-panel border border-vapor/10 rounded-sm p-5">
        <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">REVENUE TRENDS — LAST 12 MONTHS</h2>
        {revenueData.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} />
              <YAxis stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#14161A', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 4, fontSize: 12 }} cursor={{ fill: 'rgba(212,175,55,0.05)' }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-vapor/40 font-mono-tech text-sm py-12">No revenue data yet.</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer LTV */}
        <div className="glass-panel border border-vapor/10 rounded-sm p-5">
          <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">CUSTOMER LIFETIME VALUE</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-11 h-11 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <DollarSign size={22} className="text-gold" />
            </div>
            <div>
              <p className="text-3xl font-grotesk font-bold text-gold leading-none">${(data.avgLtv || 0).toLocaleString()}</p>
              <p className="text-xs font-mono-tech tracking-widest text-vapor/50 mt-1.5">AVERAGE LTV PER CUSTOMER</p>
            </div>
          </div>
          <div className="space-y-1">
            {(data.topCustomers || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-vapor/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono-tech text-gold/50 w-5">{i + 1}</span>
                  <span className="text-sm text-vapor font-grotesk">{c.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gold font-grotesk font-bold">${c.ltv.toLocaleString()}</span>
                  <span className="text-xs text-vapor/40 font-mono-tech ml-2">{c.jobs} jobs</span>
                </div>
              </div>
            ))}
            {(!data.topCustomers || data.topCustomers.length === 0) && <p className="text-center text-vapor/40 font-mono-tech text-sm py-6">No customer data yet.</p>}
          </div>
        </div>

        <div className="space-y-4">
          {/* Repeat vs New */}
          <div className="glass-panel border border-vapor/10 rounded-sm p-5">
            <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">NEW vs. REPEAT CUSTOMERS</h2>
            {breakdownData.some((d) => d.value > 0) ? (
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
                    <div className="w-3 h-3 rounded-sm bg-gold"></div>
                    <span className="text-sm text-vapor font-grotesk">New — {data.customerBreakdown?.new || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-slate-600"></div>
                    <span className="text-sm text-vapor font-grotesk">Repeat — {data.customerBreakdown?.repeat || 0}</span>
                  </div>
                </div>
              </div>
            ) : <p className="text-center text-vapor/40 font-mono-tech text-sm py-8">No customer data yet.</p>}
          </div>

          {/* Service Profitability */}
          <div className="glass-panel border border-vapor/10 rounded-sm p-5">
            <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">SERVICE-TYPE PROFITABILITY</h2>
            {serviceData.length ? (
              <ResponsiveContainer width="100%" height={Math.max(160, serviceData.length * 40)}>
                <BarChart data={serviceData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} width={100} />
                  <Tooltip contentStyle={{ background: '#14161A', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 4, fontSize: 12 }} cursor={{ fill: 'rgba(212,175,55,0.05)' }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-vapor/40 font-mono-tech text-sm py-8">No service data yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}