import { motion } from 'framer-motion';

// Neon shooting-star background: bright green streaks flying across a dark
// gradient like shooting stars, with occasional lightning flashes and
// subtle depth orbs. Replaces the static grid pattern on the ERA home page.

const STARS = [
  { top: '12%', angle: 12, delay: 0,   dur: 2.2, len: 160, w: 2,   op: 0.9,  gap: 4 },
  { top: '28%', angle: -8, delay: 3.2, dur: 2.6, len: 110, w: 1.5, op: 0.7,  gap: 5 },
  { top: '45%', angle: 15, delay: 1.5, dur: 2.4, len: 140, w: 2,   op: 0.85, gap: 6 },
  { top: '62%', angle: -6, delay: 5,   dur: 2.8, len: 100, w: 1.5, op: 0.6,  gap: 4.5 },
  { top: '78%', angle: 10, delay: 7,   dur: 2.5, len: 130, w: 2,   op: 0.75, gap: 5.5 },
  { top: '88%', angle: -10,delay: 8.5, dur: 3,   len: 90,  w: 1,   op: 0.5,  gap: 7 },
  { top: '20%', angle: 8,  delay: 10,  dur: 2.3, len: 120, w: 1.5, op: 0.7,  gap: 5 },
  { top: '52%', angle: -12,delay: 12,  dur: 2.7, len: 150, w: 2,   op: 0.8,  gap: 6 },
];

const FLASHES = [
  { top: '20%', left: '30%', delay: 4,  gap: 11 },
  { top: '60%', left: '70%', delay: 9,  gap: 13 },
  { top: '40%', left: '50%', delay: 14, gap: 15 },
];

export default function EraAnimatedBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient — solid black with a subtle emerald radial wash */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 30%, #0a1612 0%, #060A09 70%)'
      }} />

      {/* Neon shooting stars */}
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: s.top,
            width: `${s.len}px`,
            height: `${s.w}px`,
            background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.3) 30%, rgba(52,211,153,0.9) 75%, #6EE7B7 100%)',
            rotate: `${s.angle}deg`,
            filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.9)) drop-shadow(0 0 16px rgba(16,185,129,0.4))',
            borderRadius: '999px',
          }}
          initial={{ x: '-25vw', opacity: 0 }}
          animate={{ x: '130vw', opacity: [0, s.op, s.op, 0] }}
          transition={{
            duration: s.dur,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: s.gap,
            ease: 'easeIn',
            opacity: { duration: s.dur, times: [0, 0.15, 0.85, 1] },
          }}
        />
      ))}

      {/* Lightning flashes — brief green illumination bursts */}
      {FLASHES.map((f, i) => (
        <motion.div
          key={`flash-${i}`}
          className="absolute rounded-full"
          style={{
            top: f.top,
            left: f.left,
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 60%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0, 0.4, 0] }}
          transition={{
            duration: 0.18,
            delay: f.delay,
            repeat: Infinity,
            repeatDelay: f.gap,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Subtle depth orbs */}
      <motion.div
        className="absolute top-[8%] left-[12%] w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[8%] right-[8%] w-[360px] h-[360px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)' }}
        animate={{ x: [0, -30, 0], y: [0, 40, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
    </div>
  );
}