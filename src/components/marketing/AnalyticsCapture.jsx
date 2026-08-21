import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TREND = [
  { m: 'Sep', r: 14200 }, { m: 'Oct', r: 16800 }, { m: 'Nov', r: 15100 }, { m: 'Dec', r: 19300 },
  { m: 'Jan', r: 21400 }, { m: 'Feb', r: 20100 }, { m: 'Mar', r: 23800 }, { m: 'Apr', r: 22500 },
  { m: 'May', r: 24100 }, { m: 'Jun', r: 26800 }, { m: 'Jul', r: 25200 }, { m: 'Aug', r: 28400 },
];

const card = 'rounded-md p-3 bg-[#0C1614] border border-[#1A2A24]';

export default function AnalyticsCapture() {
  return (
    <div className="bg-[#060A09] p-4 sm:p-5 min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-['Inter'] font-bold text-[#DFEDE9] text-base">Analytics</h3>
        <span className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#6B8A82]">REVENUE · LAST 12 MONTHS</span>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`${card} mb-3`}
      >
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={TREND} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="eraEmeraldAg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" stroke="#6B8A8280" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#6B8A8280" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip contentStyle={{ background: '#0C1614', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 4, fontSize: 11 }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Area type="monotone" dataKey="r" stroke="#10B981" strokeWidth={2} fill="url(#eraEmeraldAg)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className={card}>
          <p className="font-['JetBrains_Mono'] text-[9px] tracking-widest text-[#10B981]/70">AVG LTV / CUSTOMER</p>
          <p className="font-['Inter'] font-bold text-[#10B981] text-2xl mt-1">$1,840</p>
          <p className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359] mt-0.5">across 4 jobs avg</p>
        </div>
        <div className={`${card} flex items-center gap-3`}>
          <ResponsiveContainer width={58} height={58}>
            <PieChart>
              <Pie data={[{ name: 'New', v: 62 }, { name: 'Repeat', v: 38 }]} dataKey="v" innerRadius={15} outerRadius={27} paddingAngle={2}>
                <Cell fill="#10B981" />
                <Cell fill="#1A2A24" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="font-['JetBrains_Mono'] text-[9px] text-[#7A9A92] space-y-1">
            <p><span className="text-[#10B981]">●</span> New — 62%</p>
            <p><span className="text-[#4A6359]">●</span> Repeat — 38%</p>
          </div>
        </div>
      </div>
    </div>
  );
}