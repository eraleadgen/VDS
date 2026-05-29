import { useEffect, useRef } from 'react';

export default function GoldShimmer({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let running = true;

    const doShimmer = () => {
      if (!running) return;
      el.style.backgroundImage = 'linear-gradient(90deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A08020 100%)';
      el.style.backgroundSize = '200% auto';
      el.style.webkitBackgroundClip = 'text';
      el.style.webkitTextFillColor = 'transparent';
      el.style.backgroundClip = 'text';
      el.style.backgroundPosition = '-200% center';
      el.style.transition = 'none';

      requestAnimationFrame(() => {
        el.style.transition = 'background-position 1.5s ease';
        el.style.backgroundPosition = '200% center';
      });

      setTimeout(() => {
        if (running) setTimeout(doShimmer, 4000);
      }, 1500);
    };

    setTimeout(doShimmer, 1000);
    return () => { running = false; };
  }, []);

  return (
    <span ref={ref} className={`inline-block ${className}`} style={{ color: '#D4AF37' }}>
      {children}
    </span>
  );
}