import { Users, CalendarRange, Clock, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="glass-panel border border-vapor/10 rounded-sm p-4">
      <Icon size={18} className="text-gold/60 mb-3" />
      <p className="text-2xl font-grotesk font-bold text-vapor">{value}</p>
      <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mt-1">{label}</p>
    </div>
  );
}

export default function OverviewTab({ metrics, loading }) {
  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  }
  const m = metrics?.metrics || {};
  const data = (metrics?.jobs_by_contractor || []).map(j => ({ name: (j.name || '').split(' ')[0], jobs: j.jobs }));

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
        <Stat icon={Users} label="SPECIALISTS" value={m.total_contractors} />
        <Stat icon={Users} label="ACTIVE" value={m.active_contractors} />
        <Stat icon={Clock} label="TODAY'S JOBS" value={m.todays_jobs} />
        <Stat icon={CalendarRange} label="UPCOMING" value={m.upcoming_jobs} />
        <Stat icon={CheckCircle2} label="COMPLETED" value={m.completed_jobs} />
        <Stat icon={XCircle} label="CANCELLED" value={m.cancelled_jobs} />
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