import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GoldParticles from '@/components/vds/GoldParticles';

// Same logo asset used in the site navbar (top-left).
const LOGO_URL =
  'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';

// Full-screen branded page-transition overlay that replaces the loading circle. Two black
// panels close together down the middle (over a gold-flake particle field), the VDS logo
// fades in and stays centered & still, and the overlay stays closed until the app is
// ready — auth loaded AND the destination page has no visible loading spinner (`.animate-spin`)
// — plus a short branded hold. Then the two halves open from the middle while the logo fades
// out, revealing the finished page. A max wait guarantees the overlay always opens.
//
//   authLoaded: true once auth + public settings have loaded (passed from AuthenticatedApp)
//   pathKey:    location.pathname — re-covers on every route change
//
// phase: 'cover' (panels closed) → 'open' (panels part + logo out) → 'done' (unmounted).
export default function VdsTransitionOverlay({ pathKey, authLoaded }) {
  const [phase, setPhase] = useState('cover');
  const startRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const bootRef = useRef(true);

  // (re)cover on every new route target
  useEffect(() => {
    setPhase('cover');
    startRef.current = performance.now();
  }, [pathKey]);

  // cover -> open: wait until authLoaded and the page has no loading spinner, with a min
  // branded hold and a max fallback so the overlay never gets stuck closed.
  useEffect(() => {
    if (phase !== 'cover') return;
    if (!authLoaded) return;
    let cancelled = false;
    let clearChecks = 0;
    const MIN_HOLD = 650;
    const MAX_WAIT = 3000;
    const openNow = () => { if (!cancelled) setPhase('open'); };
    const maxTimer = setTimeout(openNow, MAX_WAIT);
    const tick = () => {
      if (cancelled) return;
      const spinner = document.querySelector('.animate-spin');
      const elapsed = performance.now() - startRef.current;
      if (!spinner) clearChecks += 1; else clearChecks = 0;
      if (clearChecks >= 2 && elapsed >= MIN_HOLD) { openNow(); return; }
      setTimeout(tick, 120);
    };
    tick();
    return () => { cancelled = true; clearTimeout(maxTimer); };
  }, [phase, authLoaded, pathKey]);

  // open -> done
  useEffect(() => {
    if (phase !== 'open') return;
    const t = setTimeout(() => setPhase('done'), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // After the first render, allow the panels to slide in on subsequent covers.
  useEffect(() => { bootRef.current = false; }, []);

  if (phase === 'done') return null;
  const isOpen = phase === 'open';

  // On a cold boot start already covered (no slide-in revealing the boot spinner);
  // on later navigations the panels sweep in from the edges.
  const leftInitial = bootRef.current ? '0%' : '-100%';
  const rightInitial = bootRef.current ? '0%' : '100%';

  const panelTransition = {
    duration: isOpen ? 1.0 : 0.5,
    ease: isOpen ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1],
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Left black panel with gold-flake particles — slides in to cover, then parts back out left */}
      <motion.div
        aria-hidden
        initial={{ x: leftInitial }}
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
        initial={{ x: rightInitial }}
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