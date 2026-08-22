import { useEffect, useRef } from 'react';

export default function GoldParticles({ count = 55, palette }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width, height;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Derive particle palette from the tenant's brand CSS variables.
    const styles = window.getComputedStyle(document.documentElement);
    const rgbToHex = (rgb) => {
      const parts = (rgb || '').trim().split(/\s+/);
      if (parts.length < 3) return null;
      return '#' + parts.slice(0, 3).map((p) => parseInt(p).toString(16).padStart(2, '0')).join('');
    };
    const goldHex = rgbToHex(styles.getPropertyValue('--gold')) || '#D4AF37';
    // Lighten the brand accent for particle visibility against dark backgrounds
    const lighten = (hex, amt) => {
      const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amt);
      const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amt);
      const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amt);
      return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    };
    let GOLDS;
    if (palette) {
      GOLDS = palette;
    } else {
      const goldLightHex = lighten(goldHex, 70);
      GOLDS = [goldHex, goldLightHex, goldHex, goldLightHex, goldHex, goldLightHex];
    }

    // Create flakes
    const flakes = Array.from({ length: count }, () => {
      const size = Math.random() * 2.5 + 0.8;
      return {
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 900),
        size,
        color: GOLDS[Math.floor(Math.random() * GOLDS.length)],
        alpha: Math.random() * 0.55 + 0.15,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.003 + 0.001),
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: Math.random() * 0.4 + 0.1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        // shape: 0 = rhombus, 1 = elongated rhombus, 2 = tiny square
        shape: Math.floor(Math.random() * 3),
        scaleX: Math.random() * 0.5 + 0.6,
        scaleY: Math.random() * 0.5 + 0.6,
      };
    });

    const drawFlake = (f) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      ctx.scale(f.scaleX, f.scaleY);
      ctx.globalAlpha = f.alpha;

      // Slight glow
      ctx.shadowColor = f.color;
      ctx.shadowBlur = f.size * 8;

      ctx.fillStyle = f.color;
      ctx.beginPath();

      // Circle
      ctx.arc(0, 0, f.size, 0, Math.PI * 2);

      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (const f of flakes) {
        // Move
        f.x += f.speedX;
        f.y += f.speedY;
        f.rotation += f.rotSpeed;
        f.alpha += f.alphaDir;

        // Bounce alpha
        if (f.alpha > 0.7 || f.alpha < 0.08) f.alphaDir *= -1;

        // Wrap around
        if (f.y > height + 20) { f.y = -20; f.x = Math.random() * width; }
        if (f.x > width + 20) f.x = -20;
        if (f.x < -20) f.x = width + 20;

        drawFlake(f);
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}