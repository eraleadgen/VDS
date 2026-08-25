import { Users, CalendarRange, Clock, CheckCircle2, XCircle, DollarSign, Star, Crown, Play, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DEMO_OVERVIEW } from '@/lib/demoTenantData';

// Uses inline hex palette matching eraleadgen.com — no design-system token
// classes, so it renders identically on the era_systems tenant.

const PANEL = { background: '#0C1614', border: '1px solid #1A2A24', borderRadius: '8px' };

const ACTIVITY_ICONS = {
  check: { Icon: CheckCircle2, color: '#10B981' },
  quote: { Icon: FileText, color: '#D4AF37' },
  play: { Icon: Play, color: '#34D399' },
  star: { Icon: Star, color: '#D4AF37' },
  crown: { Icon: Crown, color: '#D4AF37' },
};

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="p-4" style={PANEL}>
      <Icon size={18} style={{ color: 'rgba(212,175,55,0.6)', marginBottom: '12px' }} />
      <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '24px', color: '#DFEDE9', lineHeight: 1 }}>{value}</p>
      <p style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#4A6359', marginTop: '6px' }}>{label}</p>
    </div>
  );
}

export default function DemoOverview() {
  const m = DEMO_OVERVIEW.metrics;
  const chartData = DEMO_OVERVIEW.jobs_by_contractor.map((j) => ({ name: j.name.split(' ')[0], jobs: j.jobs }));

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '24px', color: '#DFEDE9' }}>Overview</h1>
        <span style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: '#4A6359' }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Revenue hero */}
      <div className="p-5 flex items-center gap-4" style={{ ...PANEL, borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.03)' }}>
        <div className="w-11 h-11 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <DollarSign size={22} style={{ color: '#D4AF37' }} />
        </div>
        <div>
          <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '30px', color: '#D4AF37', lineHeight: 1 }}>${m.total_revenue.toLocaleString()}</p>
          <p style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: '#7A9A92', marginTop: '6px' }}>TOTAL REVENUE — {m.revenue_jobs} COMPLETED DETAILS</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart */}
        <div className="p-5" style={PANEL}>
          <h2 style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', marginBottom: '16px' }}>JOBS COMPLETED BY SPECIALIST</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#7A9A92" fontSize={11} tickLine={false} axisLine={{ stroke: '#1A2A24' }} />
              <YAxis allowDecimals={false} stroke="#7A9A92" fontSize={11} tickLine={false} axisLine={{ stroke: '#1A2A24' }} />
              <Tooltip contentStyle={{ background: '#0C1614', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, fontSize: 12, color: '#DFEDE9' }} cursor={{ fill: 'rgba(212,175,55,0.05)' }} />
              <Bar dataKey="jobs" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="p-5" style={PANEL}>
          <h2 style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', marginBottom: '16px' }}>RECENT ACTIVITY</h2>
          <div>
            {DEMO_OVERVIEW.recent_activity.map((a, i) => {
              const { Icon, color } = ACTIVITY_ICONS[a.icon] || ACTIVITY_ICONS.check;
              return (
                <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < DEMO_OVERVIEW.recent_activity.length - 1 ? '1px solid #1A2A24' : 'none' }}>
                  <Icon size={15} style={{ color }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#DFEDE9' }} className="truncate">{a.text}</p>
                  </div>
                  {a.amount && <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '13px', color: '#D4AF37' }} className="shrink-0">{a.amount}</span>}
                  <span style={{ fontFamily: "'JetBrains_Mono', monospace", fontSize: '11px', color: '#4A6359' }} className="shrink-0 w-12 text-right">{a.meta}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}