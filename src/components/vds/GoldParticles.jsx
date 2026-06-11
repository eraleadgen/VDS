import { useEffect, useRef } from 'react';

export default function GoldParticles({ count = 55 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width, height;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Gold color palette
    const GOLDS = ['#D4AF37', '#F5E17A', '#C9A028', '#E8CC60', '#B8860B', '#FFD700'];

    // Create flakes
    const flakes = Array.from({ length: count }, () => {
      const size = Math.random() * 7 + 2;
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
      ctx.shadowBlur = f.size * 1.5;

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