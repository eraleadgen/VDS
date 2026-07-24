import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// Same logo asset used in the site navbar (top-left).
const LOGO_URL =
  'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';

// Full-screen branded page-transition overlay (~2s). On each route change the gold
// screen closes over the page (two panels meeting at center), the VDS logo fades in
// and stays centered & still, holds, then the panels open from the middle while the
// logo dissipates (fade) — revealing the next page. The gold is a richer, less blinding
// gold with a slow shimmer sweep reminiscent of the home "Reflection" shine. Skips the
// very first mount so a cold load isn't blocked.
//
// phase: 'cover' (gold closes + logo in) → 'open' (panels part + logo dissipates) → 'done'.
export default function VdsTransitionOverlay({ pathKey }) {
  const [phase, setPhase] = useState('done');
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    setPhase('cover');
    const t1 = setTimeout(() => setPhase('open'), 1000);
    const t2 = setTimeout(() => setPhase('done'), 2050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathKey]);

  if (phase === 'done') return null;
  const isOpen = phase === 'open';

  // Vertical gold gradient — identical on both halves so the center seam is invisible.
  const GOLD_GRADIENT =
    'linear-gradient(180deg, #2a1f08 0%, #5a4715 30%, #9a7820 48%, #C9921A 52%, #9a7820 58%, #5a4715 75%, #2a1f08 100%)';

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Left gold panel — slides in to cover, then parts back out to the left */}
      <motion.div
        aria-hidden
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? '-101%' : '0%' }}
        transition={{ duration: isOpen ? 1.05 : 0.45, ease: isOpen ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 h-full w-1/2"
        style={{ background: GOLD_GRADIENT }}
      />
      {/* Right gold panel — mirrors the left */}
      <motion.div
        aria-hidden
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? '101%' : '0%' }}
        transition={{ duration: isOpen ? 1.05 : 0.45, ease: isOpen ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1] }}
        className="absolute top-0 right-0 h-full w-1/2"
        style={{ background: GOLD_GRADIENT }}
      />

      {/* Slow shimmer sweep across the closed gold screen (like the home "Reflection" shine) */}
      {!isOpen && (
        <motion.div
          aria-hidden
          initial={{ x: '-45%' }}
          animate={{ x: '145%' }}
          transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
          className="absolute inset-y-0 w-1/2"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,253,224,0.06) 42%, rgba(255,253,224,0.16) 50%, rgba(255,253,224,0.06) 58%, transparent 100%)',
          }}
        />
      )}

      {/* Soft radial glow behind the logo */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 0 : 0.9 }}
        transition={{ duration: 0.45 }}
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 45% 50% at 50% 50%, rgba(245,225,122,0.20), transparent 70%)' }}
      />

      {/* VDS logo — stays centered & still; fades in, then dissipates (fade out) as the screen opens */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.img
          src={LOGO_URL}
          alt="VDS"
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 0 : 1 }}
          transition={{ duration: isOpen ? 0.8 : 0.45, ease: 'easeInOut' }}
          className="relative h-16 sm:h-20 w-auto object-contain select-none"
          style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.5))' }}
        />
      </div>
    </div>
  );
}