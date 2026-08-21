import { motion } from 'framer-motion';

const JOBS = [
  { id: 'VDS-2026-0142', vehicle: '2024 Porsche 911 Carrera S', service: 'Ceramic Coating', specialist: 'Marcus', time: 'Today · 10:00', badge: 'IN PROGRESS', live: true },
  { id: 'VDS-2026-0141', vehicle: '2023 Tesla Model S Plaid', service: 'Full Detail', specialist: 'Diana', time: 'Today · 13:30', badge: 'ASSIGNED', live: false },
  { id: 'VDS-2026-0140', vehicle: '2022 Ford F-150 Raptor', service: 'Paint Correction', specialist: 'Tyler', time: 'Tomorrow · 09:00', badge: 'SCHEDULED', live: false },
  { id: 'VDS-2026-0139', vehicle: '2021 BMW M4 Competition', service: 'Full Detail', specialist: 'Sofia', time: 'Tomorrow · 14:00', badge: 'SCHEDULED', live: false },
];

export default function JobsCapture() {
  return (
    <div className="bg-[#060A09] p-4 sm:p-5 min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-['Inter'] font-bold text-[#DFEDE9] text-base">Jobs</h3>
        <span className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#6B8A82]">7 ACTIVE · 18 COMPLETED · 30D</span>
      </div>
      <div className="space-y-2">
        {JOBS.map((j, i) => (
          <motion.div
            key={j.id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="rounded-md p-3 flex items-center gap-3 bg-[#0C1614] border border-[#1A2A24]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#6B8A82]">{j.id}</span>
                <span className={`font-['JetBrains_Mono'] text-[8px] tracking-widest px-1.5 py-0.5 rounded ${j.live ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#1A2A24] text-[#6B8A82]'}`}>{j.badge}</span>
              </div>
              <p className="font-['Inter'] text-[#DFEDE9] text-sm truncate">{j.vehicle}</p>
              <p className="font-['JetBrains_Mono'] text-[10px] text-[#4A6359] mt-0.5">{j.service} · {j.time}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="w-7 h-7 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center font-['JetBrains_Mono'] text-[10px] text-[#10B981] mx-auto">{j.specialist[0]}</div>
              <p className="font-['JetBrains_Mono'] text-[9px] text-[#4A6359] mt-1">{j.specialist}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}