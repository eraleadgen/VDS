import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const LOGO_URL =
  'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/02565e45_PhotoFeb16202682749PM-Picsart-BackgroundRemover.png';

// Full-screen branded page-transition overlay (~2s). On each route change the gold
// screen closes over the page (two panels meeting at center), the VDS logo shines in,
// holds, then opens from the middle (panels part) while the logo dissipates — revealing
// the next page. Skips the very first mount so a cold load isn't blocked by the overlay.
//
// phase: 'cover' (gold closes + logo in) → 'open' (panels part + logo dissipates) → 'done'.
export default function VdsTransitionOverlay({ pathKey }) {
  const [phase, setPhase] = useState('done');
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    setPhase('cover');
    const t1 = setTimeout(() => setPhase('open'), 950);
    const t2 = setTimeout(() => setPhase('done'), 2050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathKey]);

  if (phase === 'done') return null;

  const isOpen = phase === 'open';

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Left gold panel — slides in to cover, then parts back out to the left */}
      <motion.div
        aria-hidden
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? '-101%' : '0%' }}
        transition={{ duration: isOpen ? 1.05 : 0.45, ease: isOpen ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 h-full w-1/2"
        style={{ background: 'linear-gradient(115deg, #1a1407 0%, #6E5A1E 22%, #D4AF37 52%, #F5E17A 72%, #6E5A1E 100%)' }}
      />
      {/* Right gold panel — mirrors the left */}
      <motion.div
        aria-hidden
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? '101%' : '0%' }}
        transition={{ duration: isOpen ? 1.05 : 0.45, ease: isOpen ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1] }}
        className="absolute top-0 right-0 h-full w-1/2"
        style={{ background: 'linear-gradient(245deg, #1a1407 0%, #6E5A1E 22%, #D4AF37 52%, #F5E17A 72%, #6E5A1E 100%)' }}
      />

      {/* Center seam glow — hides the meeting line and frames the logo */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 0 : 0.85 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-48"
        style={{ background: 'radial-gradient(ellipse at center, rgba(245,225,122,0.55), transparent 70%)' }}
      />

      {/* Horizontal shine sweep while the screen is closed */}
      {!isOpen && (
        <motion.div
          aria-hidden
          initial={{ x: '-35%' }}
          animate={{ x: '135%' }}
          transition={{ duration: 1.3, ease: 'easeInOut', repeat: Infinity }}
          className="absolute inset-y-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,253,224,0.22), transparent)' }}
        />
      )}

      {/* VDS logo — shines in at center, then dissipates as the screen opens */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.82, filter: 'blur(14px)' }}
          animate={isOpen
            ? { opacity: 0, scale: 1.45, filter: 'blur(18px)' }
            : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: isOpen ? 0.95 : 0.5, ease: 'easeOut' }}
          className="relative flex items-center justify-center"
        >
          <div
            aria-hidden
            className="absolute w-[55vw] h-[55vw] max-w-[460px] max-h-[460px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.35), transparent 65%)' }}
          />
          <img
            src={LOGO_URL}
            alt="VDS"
            className="relative w-[42vw] max-w-[420px] h-auto object-contain select-none"
            style={{ mixBlendMode: 'screen' }}
            draggable={false}
          />
        </motion.div>
      </div>
    </div>
  );
}