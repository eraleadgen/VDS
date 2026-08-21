import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo } from 'react';

// "Living Mesh" — a multi-layer animated background combining techniques from
// SVGator's 31 Website Animation Examples:
//   #6  Ambient Background Motion  → morphing gradient blobs + floating particles
//   #18 Animated Gradient Effects  → slow-drifting, pulsing radial gradients
//   #20 Background Animations      → dot grid + noise texture for depth
//   #17 Liquid Motion Effects      → particles that drift and fade organically
//   #7  Line Animation             → refined comet trails with glowing heads
//   #2  Scrollytelling / Parallax   → mouse-reactive depth shift on all layers
//
// All layers are fixed behind the content (z-0). The hero section is transparent
// so this shows through; other sections have their own opaque backgrounds with
// the cursor glow floating on top.

const TRAILS = [
  { top: '12%', angle: 6,  delay: 0,   dur: 3.5, len: 180, op: 0.75, gap: 7 },
  { top: '32%', angle: -5, delay: 4.5, dur: 4,   len: 140, op: 0.55, gap: 9 },
  { top: '55%', angle: 8,  delay: 9,   dur: 3.8, len: 160, op: 0.65, gap: 8 },
  { top: '75%', angle: -7, delay: 13,  dur: 4.2, len: 120, op: 0.45, gap: 10 },
  { top: '22%', angle: 10, delay: 16,  dur: 3.6, len: 150, op: 0.6,  gap: 9 },
];

export default function EraLivingBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 35, damping: 25 });
  const sy = useSpring(mouseY, { stiffness: 35, damping: 25 });

  // Parallax: each blob shifts a different amount for layered depth.
  const blob1X = useTransform(sx, [-0.5, 0.5], [-30, 30]);
  const blob1Y = useTransform(sy, [-0.5, 0.5], [-20, 20]);
  const blob2X = useTransform(sx, [-0.5, 0.5], [25, -25]);
  const blob2Y = useTransform(sy, [-0.5, 0.5], [18, -18]);
  const blob3X = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const blob3Y = useTransform(sy, [-0.5, 0.5], [22, -22]);

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2.5,
        duration: 18 + Math.random() * 24,
        delay: -Math.random() * 35,
        opacity: 0.12 + Math.random() * 0.3,
      })),
    []
  );

  useEffect(() => {
    const handle = (e) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base */}
      <div className="absolute inset-0 bg-[#060A09]" />

      {/* Dot grid — fades out towards edges (vignette mask) */}
      <div
        className="absolute inset-0 era-dot-grid"
        style={{
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 35%, black 20%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 35%, black 20%, transparent 75%)',
        }}
      />

      {/* Gradient mesh — three morphing blobs that drift, scale, and pulse */}
      <motion.div
        style={{ x: blob1X, y: blob1Y }}
        className="absolute top-[-12%] left-[3%] w-[620px] h-[620px] era-mesh-blob"
        animate={{ scale: [1, 1.15, 0.92, 1], opacity: [0.5, 0.75, 0.4, 0.5] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)' }}
        />
      </motion.div>

      <motion.div
        style={{ x: blob2X, y: blob2Y }}
        className="absolute top-[28%] right-[2%] w-[520px] h-[520px] era-mesh-blob"
        animate={{ scale: [1, 0.85, 1.2, 1], opacity: [0.4, 0.65, 0.3, 0.4] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.11) 0%, transparent 70%)' }}
        />
      </motion.div>

      <motion.div
        style={{ x: blob3X, y: blob3Y }}
        className="absolute bottom-[-8%] left-[28%] w-[580px] h-[580px] era-mesh-blob"
        animate={{ scale: [1, 1.25, 0.88, 1], opacity: [0.3, 0.55, 0.35, 0.3] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)' }}
        />
      </motion.div>

      {/* Refined light trails — comet streaks with glowing heads */}
      {TRAILS.map((t, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute"
          style={{
            top: t.top,
            width: `${t.len}px`,
            height: '1.5px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.15) 25%, rgba(52,211,153,0.55) 75%, rgba(110,231,183,0.9) 100%)',
            rotate: `${t.angle}deg`,
            filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))',
            borderRadius: '999px',
          }}
          initial={{ x: '-25vw', opacity: 0 }}
          animate={{ x: '130vw', opacity: [0, t.op, t.op, 0] }}
          transition={{
            duration: t.dur,
            delay: t.delay,
            repeat: Infinity,
            repeatDelay: t.gap,
            ease: 'easeIn',
            opacity: { duration: t.dur, times: [0, 0.1, 0.9, 1] },
          }}
        >
          {/* Comet head — bright dot at the leading edge */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#6EE7B7]"
            style={{ boxShadow: '0 0 8px 2px rgba(110,231,183,0.7)' }}
          />
        </motion.div>
      ))}

      {/* Floating particle field — slow upward drift with organic fade */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'rgba(16,185,129,0.5)',
            boxShadow: '0 0 4px rgba(16,185,129,0.3)',
          }}
          initial={{ y: '105vh', opacity: 0 }}
          animate={{ y: '-10vh', opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            opacity: { times: [0, 0.1, 0.9, 1] },
          }}
        />
      ))}

      {/* Noise texture — film grain for a premium, non-digital feel */}
      <div className="absolute inset-0 era-noise" />
    </div>
  );
}