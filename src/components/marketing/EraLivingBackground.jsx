import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo } from 'react';

// "Living Mesh" — a multi-layer animated background with no grid pattern.
// Combines morphing gradient blobs (emerald + gold), floating dual-color
// particles, mouse-reactive parallax depth, and film-grain noise over a
// multi-shade black base for a premium, interactive feel.

// Gold accent palette tuned to sit alongside the emerald ERA greens.
const GOLD = '212, 175, 55';
const GOLD_LIGHT = '232, 197, 71';
const EMERALD = '16, 185, 129';
const EMERALD_LIGHT = '52, 211, 153';

export default function EraLivingBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sx = useSpring(mouseX, { stiffness: 30, damping: 28 });
  const sy = useSpring(mouseY, { stiffness: 30, damping: 28 });

  // Parallax: each blob shifts a different amount for layered depth.
  const blob1X = useTransform(sx, [-0.5, 0.5], [-40, 40]);
  const blob1Y = useTransform(sy, [-0.5, 0.5], [-28, 28]);
  const blob2X = useTransform(sx, [-0.5, 0.5], [32, -32]);
  const blob2Y = useTransform(sy, [-0.5, 0.5], [24, -24]);
  const blob3X = useTransform(sx, [-0.5, 0.5], [-24, 24]);
  const blob3Y = useTransform(sy, [-0.5, 0.5], [28, -28]);
  const blob4X = useTransform(sx, [-0.5, 0.5], [20, -20]);
  const blob4Y = useTransform(sy, [-0.5, 0.5], [-22, 22]);

  // Dual-color floating particles — mix of emerald and gold.
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2.5,
        duration: 20 + Math.random() * 28,
        delay: -Math.random() * 40,
        opacity: 0.1 + Math.random() * 0.28,
        gold: Math.random() > 0.55,
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
      {/* Base — deepest black */}
      <div className="absolute inset-0 bg-[#050807]" />

      {/* Layered black wash for depth — slightly lighter charcoal toward center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 30%, #0C1310 0%, #080D0B 45%, #050807 100%)',
        }}
      />

      {/* Gradient mesh — four morphing blobs (emerald + gold) that drift, scale, and pulse */}
      <motion.div
        style={{ x: blob1X, y: blob1Y }}
        className="absolute top-[-14%] left-[2%] w-[680px] h-[680px] era-mesh-blob"
        animate={{ scale: [1, 1.18, 0.9, 1], opacity: [0.45, 0.7, 0.38, 0.45] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: `radial-gradient(circle, rgba(${EMERALD},0.13) 0%, transparent 70%)` }}
        />
      </motion.div>

      <motion.div
        style={{ x: blob2X, y: blob2Y }}
        className="absolute top-[22%] right-[1%] w-[560px] h-[560px] era-mesh-blob"
        animate={{ scale: [1, 0.82, 1.22, 1], opacity: [0.35, 0.6, 0.28, 0.35] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: `radial-gradient(circle, rgba(${GOLD},0.08) 0%, transparent 70%)` }}
        />
      </motion.div>

      <motion.div
        style={{ x: blob3X, y: blob3Y }}
        className="absolute bottom-[-10%] left-[24%] w-[620px] h-[620px] era-mesh-blob"
        animate={{ scale: [1, 1.28, 0.86, 1], opacity: [0.28, 0.52, 0.32, 0.28] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: `radial-gradient(circle, rgba(${EMERALD_LIGHT},0.08) 0%, transparent 70%)` }}
        />
      </motion.div>

      <motion.div
        style={{ x: blob4X, y: blob4Y }}
        className="absolute top-[45%] left-[8%] w-[480px] h-[480px] era-mesh-blob"
        animate={{ scale: [1, 1.15, 0.9, 1], opacity: [0.2, 0.42, 0.22, 0.2] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: `radial-gradient(circle, rgba(${GOLD_LIGHT},0.06) 0%, transparent 70%)` }}
        />
      </motion.div>

      {/* Gold trim — a very subtle warm edge glow along the top */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${GOLD},0.25) 30%, rgba(${GOLD_LIGHT},0.4) 50%, rgba(${GOLD},0.25) 70%, transparent 100%)`,
        }}
      />

      {/* Floating particle field — slow upward drift with organic fade */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.gold ? `rgba(${GOLD},0.55)` : `rgba(${EMERALD},0.5)`,
            boxShadow: p.gold
              ? `0 0 5px rgba(${GOLD},0.35)`
              : `0 0 4px rgba(${EMERALD},0.3)`,
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