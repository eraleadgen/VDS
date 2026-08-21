import { motion } from 'framer-motion';

// Abstract animated background: smooth glowing emerald lines flowing
// across a dark gradient. Replaces the static grid pattern on the ERA home page.
const LINES = [
  { d: 'M-100,300 C200,200 400,400 700,300 S1100,200 1300,350', delay: 0, dur: 18, opacity: 0.28, w: 1.5 },
  { d: 'M-100,150 C300,250 500,100 800,200 S1100,300 1300,200', delay: 2, dur: 22, opacity: 0.22, w: 1.2 },
  { d: 'M-100,500 C200,400 600,550 900,450 S1100,400 1300,500', delay: 4, dur: 20, opacity: 0.18, w: 1 },
  { d: 'M-100,650 C300,600 500,700 800,620 S1100,580 1300,650', delay: 1, dur: 25, opacity: 0.2, w: 1.5 },
  { d: 'M-100,100 C400,50 600,200 900,100 S1100,50 1300,120', delay: 3, dur: 19, opacity: 0.15, w: 1 },
  { d: 'M-100,400 C400,350 600,480 1000,380 S1200,350 1300,420', delay: 5, dur: 23, opacity: 0.16, w: 1.3 },
];

export default function EraAnimatedBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient — solid black with a subtle emerald radial wash */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, #0a1612 0%, #060A09 70%)'
      }} />

      {/* Flowing glowing lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="eraLineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {LINES.map((line, i) => (
          <motion.path
            key={i}
            d={line.d}
            fill="none"
            stroke="#10B981"
            strokeWidth={line.w}
            filter="url(#eraLineGlow)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, line.opacity, line.opacity * 0.5, line.opacity, 0],
              x: [0, 30, -20, 0],
            }}
            transition={{
              duration: line.dur,
              delay: line.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      {/* Subtle floating orbs for depth */}
      <motion.div
        className="absolute top-[8%] left-[12%] w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[8%] right-[8%] w-[360px] h-[360px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
        animate={{ x: [0, -30, 0], y: [0, 40, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
    </div>
  );
}