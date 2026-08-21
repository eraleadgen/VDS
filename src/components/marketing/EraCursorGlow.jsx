import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

// Cursor-following spotlight — a soft emerald glow that trails the mouse cursor.
// Technique #12 (Microinteractions) + #26 (Hover Effects): adds an "alive" feeling
// across the entire page without distracting from content. Uses mix-blend-mode
// screen so it adds light on dark backgrounds. Fixed at z-30 (above content, below nav).
export default function EraCursorGlow() {
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const sx = useSpring(x, { stiffness: 120, damping: 25, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 120, damping: 25, mass: 0.5 });

  useEffect(() => {
    const handle = (e) => {
      x.set(e.clientX - 300);
      y.set(e.clientY - 300);
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none z-30 w-[600px] h-[600px] rounded-full hidden md:block"
      style={{
        x: sx,
        y: sy,
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 55%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}