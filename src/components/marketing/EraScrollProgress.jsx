import { motion, useScroll, useSpring } from 'framer-motion';

// Scroll progress bar — a thin emerald line at the very top of the page that fills
// as the user scrolls. Technique #2 (Scrollytelling): gives a sense of progression
// and page length. Fixed at z-60 (above everything including nav).
export default function EraScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.3 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)',
        boxShadow: '0 0 8px rgba(16,185,129,0.5)',
      }}
    />
  );
}