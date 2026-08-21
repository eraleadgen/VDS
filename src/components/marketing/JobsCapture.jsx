// Authentic recreation of the real Jobs board — job cards with status badges,
// vehicle info, specialist chip, and time. Representative data.
const JOBS = [
  { id: 'VDS-2026-0142', vehicle: '2024 Porsche 911 Carrera S', service: 'Ceramic Coating', specialist: 'Marcus', time: 'Today · 10:00', badge: 'IN PROGRESS', gold: true },
  { id: 'VDS-2026-0141', vehicle: '2023 Tesla Model S Plaid', service: 'Full Detail', specialist: 'Diana', time: 'Today · 13:30', badge: 'ASSIGNED', gold: false },
  { id: 'VDS-2026-0140', vehicle: '2022 Ford F-150 Raptor', service: 'Paint Correction', specialist: 'Tyler', time: 'Tomorrow · 09:00', badge: 'SCHEDULED', gold: false },
  { id: 'VDS-2026-0139', vehicle: '2021 BMW M4 Competition', service: 'Full Detail', specialist: 'Sofia', time: 'Tomorrow · 14:00', badge: 'SCHEDULED', gold: false },
];

export default function JobsCapture() {
  return (
    <div className="bg-obsidian p-4 sm:p-5 min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-grotesk font-bold text-vapor text-base">Jobs</h3>
        <span className="font-mono-tech text-[10px] tracking-widest text-vapor/40">7 ACTIVE · 18 COMPLETED · 30D</span>
      </div>
      <div className="space-y-2">
        {JOBS.map((j) => (
          <div key={j.id} className="glass-panel rounded-sm p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono-tech text-[10px] text-vapor/50">{j.id}</span>
                <span className={`font-mono-tech text-[8px] tracking-widest px-1.5 py-0.5 rounded ${j.gold ? 'bg-gold/15 text-gold' : 'bg-vapor/10 text-vapor/60'}`}>{j.badge}</span>
              </div>
              <p className="font-grotesk text-vapor text-sm truncate">{j.vehicle}</p>
              <p className="font-mono-tech text-[10px] text-vapor/40 mt-0.5">{j.service} · {j.time}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center font-mono-tech text-[10px] text-gold mx-auto">{j.specialist[0]}</div>
              <p className="font-mono-tech text-[9px] text-vapor/40 mt-1">{j.specialist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}