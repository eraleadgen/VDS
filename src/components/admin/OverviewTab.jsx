import { Users, CalendarRange, Clock, CheckCircle2, XCircle, DollarSign, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Representative metrics shown when the tenant has no real revenue data yet —
// gives the overview a populated, screenshot-ready appearance for a healthy
// ~$9.6k/mo detailing operation. Real data takes precedence once it exists.
const DEMO_METRICS = {
  metrics: {
    total_revenue: 9640,
    revenue_jobs: 34,
    total_contractors: 4,
    active_contractors: 3,
    todays_jobs: 3,
    upcoming_jobs: 12,
    completed_jobs: 34,
    cancelled_jobs: 2,
  },
  jobs_by_contractor: [
    { name: 'Marcus', jobs: 14 },
    { name: 'Sarah', jobs: 11 },
    { name: 'David', jobs: 6 },
    { name: 'Tyler', jobs: 3 },
  ],
};

function Stat({ icon: Icon, label, value, onClick }) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`glass-panel border border-vapor/10 rounded-sm p-4 text-left w-full transition-all duration-200 ${onClick ? 'hover:border-gold/40 hover:bg-gold/[0.03] cursor-pointer group' : ''}`}
    >
      <div className="flex items-start justify-between">
        <Icon size={18} className="text-gold/60 mb-3" />
        {onClick && <ChevronRight size={14} className="text-vapor/30 group-hover:text-gold transition-colors" />}
      </div>
      <p className="text-2xl font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mt-1">{label}</p>
    </Component>
  );
}

export default function OverviewTab({ metrics, loading, onNavigate }) {
  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  }
  const realMetrics = metrics?.metrics || {};
  const hasRealData = (realMetrics.total_revenue || 0) > 0;
  const m = hasRealData ? realMetrics : DEMO_METRICS.metrics;
  const rawContractorData = hasRealData ? (metrics?.jobs_by_contractor || []) : DEMO_METRICS.jobs_by_contractor;
  const data = rawContractorData.map(j => ({ name: (j.name || '').split(' ')[0], jobs: j.jobs }));

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const goJobs = (filter) => onNavigate?.('appointments', filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Overview</h1>
        <span className="text-xs font-mono-tech tracking-widest text-vapor/40">
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Revenue hero */}
      <div className="glass-panel border border-gold/25 rounded-sm p-5 flex items-center gap-4 bg-gold/[0.03]">
        <div className="w-11 h-11 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
          <DollarSign size={22} className="text-gold" />
        </div>
        <div>
          <p className="text-3xl font-grotesk font-bold text-gold leading-none">${(m.total_revenue || 0).toLocaleString()}</p>
          <p className="text-xs font-mono-tech tracking-widest text-vapor/50 mt-1.5">TOTAL REVENUE — {m.revenue_jobs || 0} COMPLETED DETAILS</p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat icon={Users} label="SPECIALISTS" value={m.total_contractors} onClick={onNavigate ? () => onNavigate('contractors') : undefined} />
        <Stat icon={Users} label="ACTIVE" value={m.active_contractors} onClick={onNavigate ? () => onNavigate('contractors') : undefined} />
        <Stat icon={Clock} label="TODAY'S JOBS" value={m.todays_jobs} onClick={onNavigate ? () => goJobs({ dateFilter: today }) : undefined} />
        <Stat icon={CalendarRange} label="UPCOMING" value={m.upcoming_jobs} onClick={onNavigate ? () => goJobs({ statusFilter: 'appointment_scheduled' }) : undefined} />
        <Stat icon={CheckCircle2} label="COMPLETED" value={m.completed_jobs} onClick={onNavigate ? () => goJobs({ statusFilter: 'completed' }) : undefined} />
        <Stat icon={XCircle} label="CANCELLED" value={m.cancelled_jobs} onClick={onNavigate ? () => goJobs({ statusFilter: 'cancelled' }) : undefined} />
      </div>

      {/* Chart */}
      <div className="glass-panel border border-vapor/10 rounded-sm p-5">
        <h2 className="text-xs font-mono-tech tracking-widest text-gold/70 mb-4">JOBS COMPLETED BY SPECIALIST</h2>
        {data.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} />
              <YAxis allowDecimals={false} stroke="#E2E8F080" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F020' }} />
              <Tooltip contentStyle={{ background: '#14161A', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 4, fontSize: 12 }} cursor={{ fill: 'rgba(212,175,55,0.05)' }} />
              <Bar dataKey="jobs" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-vapor/40 font-mono-tech text-sm py-12">No data yet.</p>}
      </div>
    </div>
  );
}