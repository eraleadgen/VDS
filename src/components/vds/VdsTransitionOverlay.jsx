import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import GoldParticles from '@/components/vds/GoldParticles';

// Same logo asset used in the site navbar (top-left).
const LOGO_URL =
  'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';

// Full-screen branded page-transition overlay that replaces the loading circle. Two black
// halves meet along a smooth sine-wave seam down the middle (the line ripples every frame,
// giving the "wave"). The overlay covers the screen instantly on every route change and
// stays closed until the app is ready — auth loaded AND the destination page has no visible
// loading spinner (`.animate-spin`) — plus a short branded hold. Then the two halves part
// outward along the wavy line while the VDS logo evaporates (fade + scale up + blur),
// revealing the finished page. A max wait guarantees the overlay always opens.
//
//   authLoaded: true once auth + public settings have loaded (passed from AuthenticatedApp)
//   pathKey:    location.pathname — re-covers on every route change
//
// phase: 'cover' (halves together) → 'open' (halves part + logo evaporates) → 'done' (unmounted).
export default function VdsTransitionOverlay({ pathKey, authLoaded }) {
  const [phase, setPhase] = useState('cover');
  const [wavePhase, setWavePhase] = useState(0);
  const startRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const prevPath = useRef(pathKey);

  // Re-cover SYNCHRONOUSLY during render on route change, so the overlay covers the new page
  // in the same commit — no flash of the page loading underneath before it covers.
  if (prevPath.current !== pathKey) {
    prevPath.current = pathKey;
    startRef.current = performance.now();
    setPhase('cover');
  }

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
  }, [phase, authLoaded]);

  // open -> done
  useEffect(() => {
    if (phase !== 'open') return;
    const t = setTimeout(() => setPhase('done'), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // Advance the wavy seam phase every frame so the smooth split line ripples like a wave.
  useAnimationFrame((t) => setWavePhase((t / 1000) * 1.4));

  if (phase === 'done') return null;
  const isOpen = phase === 'open';

  // Smooth wavy seam down the middle. Two black halves share this exact sine polyline, so
  // they tile the screen with no gap/overlap. Each half lives on its own full-screen SVG
  // inside a motion.div so the part uses a reliable CSS % translate (not an SVG transform).
  const A = 2.6;  // seam amplitude (viewBox units)
  const F = 2;    // full waves down the screen
  const N = 24;   // seam samples
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * 100;
    const x = 50 + A * Math.sin((y / 100) * Math.PI * 2 * F + wavePhase);
    pts.push(`${x.toFixed(3)},${y.toFixed(3)}`);
  }
  const leftPath = `M0,0 L${pts.join(' L')} L0,100 Z`;
  const rightPath = `M100,0 L${pts.join(' L')} L100,100 Z`;

  const partEase = [0.7, 0, 0.3, 1];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Left black half — draws everything left of the wavy seam; slides out left on open.
          Keyed by pathKey so it remounts already covering on every navigation (no sweep-in). */}
      <motion.div
        key={`L-${pathKey}`}
        aria-hidden
        className="absolute inset-0"
        initial={{ x: '0%' }}
        animate={{ x: isOpen ? '-102%' : '0%' }}
        transition={{ duration: 0.95, ease: partEase }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={leftPath} fill="#0A0B0D" />
        </svg>
      </motion.div>

      {/* Right black half — mirrors the left, slides out right on open */}
      <motion.div
        key={`R-${pathKey}`}
        aria-hidden
        className="absolute inset-0"
        initial={{ x: '0%' }}
        animate={{ x: isOpen ? '102%' : '0%' }}
        transition={{ duration: 0.95, ease: partEase }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={rightPath} fill="#0A0B0D" />
        </svg>
      </motion.div>

      {/* Gold-flake particle field over the black — fades out quickly as the halves part so
          no flakes linger over the revealed page */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
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

      {/* VDS logo — fades in, then evaporates (fade + scale up + blur) as the screen opens */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.img
          src={LOGO_URL}
          alt="VDS"
          draggable={false}
          initial={{ opacity: 0, scale: 1, filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.6)) blur(0px)' }}
          animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 1.18 : 1, filter: `drop-shadow(0 4px 24px rgba(0,0,0,0.6)) blur(${isOpen ? 14 : 0}px)` }}
          transition={{ duration: isOpen ? 1.05 : 0.55, ease: 'easeOut', delay: isOpen ? 0.05 : 0.4 }}
          className="relative h-72 sm:h-80 lg:h-96 w-auto max-w-[92vw] object-contain select-none"
        />
      </div>
    </div>
  );
}