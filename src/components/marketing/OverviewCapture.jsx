import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from 'recharts';

// Authentic recreation of the real OverviewTab — emerald product theme.
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

const card = 'rounded-md p-3 bg-[#0C1614] border border-[#1A2A24]';

export default function OverviewCapture() {
  return (
    <div className="bg-[#060A09] flex min-h-[360px]">
      <div className="w-12 sm:w-14 bg-[#080F0D] border-r border-[#1A2A24] py-3 flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-sm bg-[#10B981]/20 border border-[#10B981]/40" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`w-6 h-1 rounded-full ${i === 0 ? 'bg-[#10B981]' : 'bg-[#1A2A24]'}`} />
        ))}
      </div>
      <div className="flex-1 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Inter'] font-bold text-[#DFEDE9] text-base">Overview</h3>
          <span className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#6B8A82]">AUG 21, 2026</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {KPIS.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
              className={card}
            >
              <p className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#6B8A82]">{k.label}</p>
              <p className="font-['Inter'] font-bold text-[#10B981] text-xl mt-1">{k.value}</p>
              <p className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359] mt-0.5">{k.delta}</p>
            </motion.div>
          ))}
        </div>
        <div className={card}>
          <p className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#10B981]/70 mb-2">CONTRACTOR PERFORMANCE · 30D</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={PERF} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#6B8A8280" fontSize={9} tickLine={false} axisLine={false} />
              <Bar dataKey="jobs" radius={[3, 3, 0, 0]}>
                {PERF.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#10B981' : '#0A5A45'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}