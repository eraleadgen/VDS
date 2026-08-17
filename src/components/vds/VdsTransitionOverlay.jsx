import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GoldParticles from '@/components/vds/GoldParticles';
import { useBusinessConfig } from '@/lib/BusinessConfigContext';

// Full-screen branded page-transition overlay that replaces the loading circle. A solid
// black field covers the screen; a rotating gold loading ring sits behind the VDS logo
// while the app readies. The overlay stays closed until ready — auth loaded AND the
// destination page has no visible loading spinner (`.animate-spin`) — plus a short branded
// hold. Then a single circular opening grows outward from the center (around the logo /
// loading ring) to reveal the page, while the logo evaporates (fade + scale up + blur).
//
// Entering a transition is REVERSED: on navigation the overlay first CLOSES (the reveal
// circle shrinks back to the center, black sweeps in) and only then OPENS to the new page.
// A max wait guarantees the overlay always opens.
//
//   authLoaded: true once auth + public settings have loaded (passed from AuthenticatedApp)
//   pathKey:    location.pathname — re-triggers the close→open cycle on every route change
//
// phase: 'hold' (closed, waiting to open) → 'opening' (reveal) → 'done' (unmounted);
//        on nav: 'closing' (circle shrinks to center) → 'hold' → 'opening' → 'done'.
export default function VdsTransitionOverlay({ pathKey, authLoaded, onCloseComplete }) {
  const config = useBusinessConfig();
  const configLoaded = !!config;
  const logoUrl = config?.logo_url || '';
  const shortName = config?.business_short_name || config?.business_name || '';
  const onCloseCompleteRef = useRef(onCloseComplete);
  useEffect(() => { onCloseCompleteRef.current = onCloseComplete; }, [onCloseComplete]);
  const [phase, setPhase] = useState('hold');
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : { w: 1280, h: 800 }
  );
  const startRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const prevPath = useRef(pathKey);

  // On route change, start the CLOSE (reverse) phase so the overlay closes over the current
  // view before opening to the new page. Runs synchronously during render so the overlay
  // begins closing in the same commit.
  if (prevPath.current !== pathKey) {
    prevPath.current = pathKey;
    startRef.current = performance.now();
    setPhase('closing');
  }

  // Track viewport size so the reveal circle stays round on any screen.
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // closing -> hold: once the close animation finishes the overlay is fully closed; hand off
  // to the hold/opening logic (which waits for the page to be ready).
  useEffect(() => {
    if (phase !== 'closing') return;
    const t = setTimeout(() => { setPhase('hold'); onCloseCompleteRef.current?.(); }, 0.65 * 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // hold -> opening: wait until authLoaded and the page has no loading spinner, with a min
  // branded hold and a max fallback so the overlay never gets stuck closed.
  useEffect(() => {
    if (phase !== 'hold') return;
    if (!authLoaded) return;
    let cancelled = false;
    let clearChecks = 0;
    const MIN_HOLD = 650;
    const MAX_WAIT = 3000;
    const openNow = () => { if (!cancelled) setPhase('opening'); };
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

  // opening -> done
  useEffect(() => {
    if (phase !== 'opening') return;
    const t = setTimeout(() => setPhase('done'), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;
  const isOpen = phase === 'opening';

  // Reveal circle: grows outward from the center of the screen (around the VDS logo /
  // loading ring) until the whole page is uncovered. Implemented as an SVG mask — white
  // keeps the black field, the black circle erases it (reveals the page). On navigation it
  // first shrinks back to center (close) before growing again (open).
  const { w, h } = size;
  const maxR = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
  const partEase = [0.7, 0, 0.3, 1];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Black field, erased by the single growing/shrinking reveal circle */}
      <svg className="absolute inset-0" width={w} height={h} aria-hidden>
        <defs>
          <mask id="vdsPinchReveal">
            <rect x={0} y={0} width={w} height={h} fill="white" />
            <motion.circle
              cx={w / 2} cy={h / 2}
              initial={{ r: phase === 'closing' ? maxR : 0 }}
              animate={{ r: phase === 'opening' ? maxR : 0 }}
              transition={{ duration: phase === 'opening' ? 0.95 : phase === 'closing' ? 0.65 : 0, ease: phase === 'opening' ? partEase : 'easeInOut' }}
              fill="black"
            />
          </mask>
        </defs>
        <rect x={0} y={0} width={w} height={h} fill="rgb(var(--obsidian))" mask="url(#vdsPinchReveal)" />
      </svg>

      {/* Gold-flake particles — only render after the tenant config has loaded so the
          default VDS gold palette never flashes on a non-VDS tenant. Masked out of the
          ring's interior so that stays pure black. Fades out quickly on open. */}
      {configLoaded && (
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
      )}

      {/* Logo centered inside a perfectly-centered 200px rotating loading ring. The
          ring uses a neutral color until the tenant config loads (avoiding a VDS gold
          flash on non-VDS tenants), then switches to the tenant's brand accent. On open
          the logo evaporates (fade + scale up + blur) and the ring fades out. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center w-[200px] h-[200px]">
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full vds-spin"
            style={{
              border: `2px solid ${configLoaded ? 'rgb(var(--gold) / 0.12)' : 'rgba(255,255,255,0.08)'}`,
              borderTopColor: configLoaded ? 'rgb(var(--gold))' : 'rgba(255,255,255,0.6)',
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === 'opening' ? 0 : 1 }}
            transition={{ duration: phase === 'opening' ? 0.95 : 0, ease: 'easeOut' }}
          />
          {configLoaded && (logoUrl ? (
            <motion.img
              src={logoUrl}
              alt={shortName}
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'opening' ? 0 : 1, filter: `drop-shadow(0 4px 24px rgba(0,0,0,0.6)) blur(${phase === 'opening' ? 14 : 0}px)` }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: phase === 'opening' ? 0.05 : 0 }}
              className="relative max-w-[140px] max-h-[140px] w-auto h-auto object-contain select-none"
            />
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'opening' ? 0 : 1, filter: `blur(${phase === 'opening' ? 14 : 0}px)` }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: phase === 'opening' ? 0.05 : 0 }}
              className="relative text-3xl font-grotesk font-bold tracking-widest select-none"
              style={{ color: 'rgb(var(--gold))' }}
            >
              {shortName.slice(0, 4).toUpperCase()}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}