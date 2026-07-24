import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GoldParticles from '@/components/vds/GoldParticles';

// Same logo asset used in the site navbar (top-left).
const LOGO_URL =
  'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';

// Full-screen branded page-transition overlay (~2s). On each route change two black
// panels close together down the middle (over a gold-flake particle field), the VDS logo
// fades in and stays centered & still, holds, then the two halves open from the center
// while the logo fades out — revealing the next page. Skips the very first mount so a cold
// load isn't blocked.
//
// phase: 'cover' (panels close + logo in) → 'open' (panels part + logo out) → 'done'.
export default function VdsTransitionOverlay({ pathKey }) {
  const [phase, setPhase] = useState('done');
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    setPhase('cover');
    const t1 = setTimeout(() => setPhase('open'), 1050);
    const t2 = setTimeout(() => setPhase('done'), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathKey]);

  if (phase === 'done') return null;
  const isOpen = phase === 'open';

  const panelTransition = {
    duration: isOpen ? 1.0 : 0.5,
    ease: isOpen ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1],
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Left black panel with gold-flake particles — slides in to cover, then parts back out left */}
      <motion.div
        aria-hidden
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? '-101%' : '0%' }}
        transition={panelTransition}
        className="absolute top-0 left-0 h-full w-1/2 overflow-hidden"
        style={{ background: '#0A0B0D' }}
      >
        <GoldParticles count={32} />
      </motion.div>

      {/* Right black panel — mirrors the left */}
      <motion.div
        aria-hidden
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? '101%' : '0%' }}
        transition={panelTransition}
        className="absolute top-0 right-0 h-full w-1/2 overflow-hidden"
        style={{ background: '#0A0B0D' }}
      >
        <GoldParticles count={32} />
      </motion.div>

      {/* Soft gold glow behind the logo on the black field */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 0 : 0.85 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 55% at 50% 50%, rgba(212,175,55,0.16), transparent 70%)' }}
      />

      {/* VDS logo — stays centered & still; fades in, then fades out as the screen opens */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.img
          src={LOGO_URL}
          alt="VDS"
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 0 : 1 }}
          transition={{ duration: isOpen ? 0.85 : 0.55, ease: 'easeInOut', delay: isOpen ? 0.1 : 0.4 }}
          className="relative h-72 sm:h-80 lg:h-96 w-auto max-w-[92vw] object-contain select-none"
          style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.6))' }}
        />
      </div>
    </div>
  );
}