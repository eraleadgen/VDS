import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GoldParticles from '@/components/vds/GoldParticles';

// Same logo asset used in the site navbar (top-left).
const LOGO_URL =
  'https://media.base44.com/images/public/6a191df337222815cd0b1f5e/6a27779cd_1773368635248-a065bd31-ddf6-4b1c-87dc-3a6080dc60f8.png';

// Full-screen branded page-transition overlay that replaces the loading circle. A solid
// black field covers the screen; a rotating gold loading ring sits behind the VDS logo
// while the app readies. The overlay covers instantly on every route change and stays
// closed until ready — auth loaded AND the destination page has no visible loading spinner
// (`.animate-spin`) — plus a short branded hold. Then the black is "pinched" open from the
// center of each side: two openings grow from the middle of the left edge and the middle of
// the right edge and expand until the page is revealed, while the logo evaporates
// (fade + scale up + blur). A max wait guarantees the overlay always opens.
//
//   authLoaded: true once auth + public settings have loaded (passed from AuthenticatedApp)
//   pathKey:    location.pathname — re-covers on every route change
//
// phase: 'cover' (black field closed) → 'open' (pinch reveal + logo evaporates) → 'done'.
export default function VdsTransitionOverlay({ pathKey, authLoaded }) {
  const [phase, setPhase] = useState('cover');
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : { w: 1280, h: 800 }
  );
  const startRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const prevPath = useRef(pathKey);

  // Re-cover SYNCHRONOUSLY during render on route change, so the overlay covers the new page
  // in the same commit — no flash of the page loading underneath before it covers.
  if (prevPath.current !== pathKey) {
    prevPath.current = pathKey;
    startRef.current = performance.now();
    setPhase('cover');
  }

  // Track viewport size so the pinch circles stay round on any screen.
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  if (phase === 'done') return null;
  const isOpen = phase === 'open';

  // Pinch reveal: a single circular opening grows outward from the center of the screen
  // (around the VDS logo / loading ring) until the whole page is uncovered. Implemented as
  // an SVG mask — white keeps the black field, the black circle erases it (reveals the
  // page). Keyed by pathKey so it remounts already closed on every navigation.
  const { w, h } = size;
  const maxR = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
  const partEase = [0.7, 0, 0.3, 1];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Black field, erased by the two growing pinch circles */}
      <svg key={`reveal-${pathKey}`} className="absolute inset-0" width={w} height={h} aria-hidden>
        <defs>
          <mask id="vdsPinchReveal">
            <rect x={0} y={0} width={w} height={h} fill="white" />
            <motion.circle
              cx={w / 2} cy={h / 2}
              initial={{ r: 0 }}
              animate={{ r: isOpen ? maxR : 0 }}
              transition={{ duration: 0.95, ease: partEase }}
              fill="black"
            />
          </mask>
        </defs>
        <rect x={0} y={0} width={w} height={h} fill="#0A0B0D" mask="url(#vdsPinchReveal)" />
      </svg>

      {/* Gold-flake particles — only OUTSIDE the loading ring. Masked out of the ring's
          interior so that stays pure black. Fades out quickly on open. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          maskImage: 'radial-gradient(circle at 50% 50%, transparent 0, transparent 100px, #000 101px)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent 0, transparent 100px, #000 101px)',
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <GoldParticles count={32} />
      </motion.div>

      {/* VDS logo centered inside a perfectly-centered 200px rotating gold loading ring.
          The ring's interior shows the black field (no particles inside). On open the logo
          evaporates (fade + scale up + blur) and the ring fades out. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center w-[200px] h-[200px]">
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 0 : 1, rotate: 360 }}
            transition={{
              opacity: { duration: 0.4, ease: 'easeOut' },
              rotate: { duration: 1.1, ease: 'linear', repeat: Infinity },
            }}
          />
          <motion.img
            src={LOGO_URL}
            alt="VDS"
            draggable={false}
            initial={{ opacity: 0, scale: 1, filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.6)) blur(0px)' }}
            animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 1.18 : 1, filter: `drop-shadow(0 4px 24px rgba(0,0,0,0.6)) blur(${isOpen ? 14 : 0}px)` }}
            transition={{ duration: isOpen ? 1.05 : 0.55, ease: 'easeOut', delay: isOpen ? 0.05 : 0.4 }}
            className="relative max-w-[140px] max-h-[140px] w-auto h-auto object-contain select-none"
          />
        </div>
      </div>
    </div>
  );
}