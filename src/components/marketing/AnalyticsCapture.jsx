import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Authentic recreation of the real AnalyticsTab — 12-month revenue area chart,
// average LTV, and new-vs-repeat breakdown. Representative data.
const TREND = [
  { m: 'Sep', r: 14200 }, { m: 'Oct', r: 16800 }, { m: 'Nov', r: 15100 }, { m: 'Dec', r: 19300 },
  { m: 'Jan', r: 21400 }, { m: 'Feb', r: 20100 }, { m: 'Mar', r: 23800 }, { m: 'Apr', r: 22500 },
  { m: 'May', r: 24100 }, { m: 'Jun', r: 26800 }, { m: 'Jul', r: 25200 }, { m: 'Aug', r: 28400 },
];

export default function AnalyticsCapture() {
  return (
    <div className="bg-obsidian p-4 sm:p-5 min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-grotesk font-bold text-vapor text-base">Analytics</h3>
        <span className="font-mono-tech text-[10px] tracking-widest text-vapor/40">REVENUE · LAST 12 MONTHS</span>
      </div>
      <div className="glass-panel rounded-sm p-3 mb-3">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={TREND} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="eraAg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" stroke="#E2E8F080" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#E2E8F080" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip contentStyle={{ background: '#14161A', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 4, fontSize: 11 }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Area type="monotone" dataKey="r" stroke="#D4AF37" strokeWidth={2} fill="url(#eraAg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-panel rounded-sm p-3">
          <p className="font-mono-tech text-[9px] tracking-widest text-gold/70">AVG LTV / CUSTOMER</p>
          <p className="font-grotesk font-bold text-gold text-2xl mt-1">$1,840</p>
          <p className="font-mono-tech text-[9px] text-vapor/40 mt-0.5">across 4 jobs avg</p>
        </div>
        <div className="glass-panel rounded-sm p-3 flex items-center gap-3">
          <ResponsiveContainer width={58} height={58}>
            <PieChart>
              <Pie data={[{ name: 'New', v: 62 }, { name: 'Repeat', v: 38 }]} dataKey="v" innerRadius={15} outerRadius={27} paddingAngle={2}>
                <Cell fill="#D4AF37" />
                <Cell fill="#475569" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="font-mono-tech text-[9px] text-vapor/60 space-y-1">
            <p><span className="text-gold">●</span> New — 62%</p>
            <p><span className="text-slate-500">●</span> Repeat — 38%</p>
          </div>
        </div>
      </div>
    </div>
  );
}