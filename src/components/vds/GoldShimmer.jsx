import { useEffect, useRef } from 'react';

export default function GoldShimmer({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let running = true;

    // Base gold gradient — always visible
    el.style.backgroundImage = 'linear-gradient(90deg, #A08020 0%, #D4AF37 30%, #F5E17A 50%, #D4AF37 70%, #A08020 100%)';
    el.style.backgroundSize = '200% auto';
    el.style.webkitBackgroundClip = 'text';
    el.style.webkitTextFillColor = 'transparent';
    el.style.backgroundClip = 'text';
    el.style.backgroundPosition = '0% center';

    const doShine = () => {
      if (!running) return;

      // Shine sweep: inject a bright white-gold highlight that sweeps left→right
      el.style.transition = 'none';
      el.style.backgroundImage =
        'linear-gradient(105deg, #A08020 0%, #D4AF37 20%, #D4AF37 38%, #FFFBE8 48%, #FFFFFF 52%, #FFFBE8 56%, #D4AF37 68%, #A08020 100%)';
      el.style.backgroundSize = '300% auto';
      el.style.backgroundPosition = '-100% center';

      requestAnimationFrame(() => {
        el.style.transition = 'background-position 0.9s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.backgroundPosition = '200% center';
      });

      // After sweep, settle back to base gold
      setTimeout(() => {
        if (!running) return;
        el.style.transition = 'background-position 0.6s ease';
        el.style.backgroundImage = 'linear-gradient(90deg, #A08020 0%, #D4AF37 30%, #F5E17A 50%, #D4AF37 70%, #A08020 100%)';
        el.style.backgroundSize = '200% auto';
        el.style.backgroundPosition = '0% center';

        // Repeat
        setTimeout(() => { if (running) doShine(); }, 3500);
      }, 950);
    };

    setTimeout(doShine, 800);
    return () => { running = false; };
  }, []);

  return (
    <span ref={ref} className={`inline-block ${className}`} style={{ color: '#D4AF37' }}>
      {children}
    </span>
  );
}