import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from 'recharts';

// Authentic recreation of the real OverviewTab — same dark obsidian + gold
// product theme, same KPI cards + contractor-performance bar chart. Numbers
// are representative, not a specific customer's real data.
const KPIS = [
  { label: 'MONTHLY REVENUE', value: '$24,380', delta: '+18% vs Jul' },
  { label: 'ACTIVE JOBS', value: '7', delta: '3 today' },
  { label: 'SPECIALISTS', value: '4', delta: 'all active' },
  { label: 'COMPLETED · 30D', value: '18', delta: '+4' },
];

const PERF = [
  { name: 'Marcus', jobs: 12 },
  { name: 'Diana', jobs: 9 },
  { name: 'Tyler', jobs: 6 },
  { name: 'Sofia', jobs: 4 },
];

export default function OverviewCapture() {
  return (
    <div className="bg-obsidian flex min-h-[360px]">
      <div className="w-12 sm:w-14 bg-[#08090A] border-r border-vapor/10 py-3 flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-sm bg-gold/20 border border-gold/40" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-6 h-1 rounded-full ${i === 0 ? 'bg-gold' : 'bg-vapor/15'}`} />
        ))}
      </div>
      <div className="flex-1 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-grotesk font-bold text-vapor text-base">Overview</h3>
          <span className="font-mono-tech text-[10px] tracking-widest text-vapor/40">AUG 21, 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {KPIS.map((k) => (
            <div key={k.label} className="glass-panel rounded-sm p-3">
              <p className="font-mono-tech text-[9px] tracking-widest text-vapor/40">{k.label}</p>
              <p className="font-grotesk font-bold text-gold text-xl mt-1">{k.value}</p>
              <p className="font-mono-tech text-[9px] text-vapor/50 mt-0.5">{k.delta}</p>
            </div>
          ))}
        </div>
        <div className="glass-panel rounded-sm p-3">
          <p className="font-mono-tech text-[9px] tracking-widest text-gold/70 mb-2">CONTRACTOR PERFORMANCE · 30D</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={PERF} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#E2E8F080" fontSize={9} tickLine={false} axisLine={false} />
              <Bar dataKey="jobs" radius={[3, 3, 0, 0]}>
                {PERF.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#D4AF37' : '#8A7A3A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}