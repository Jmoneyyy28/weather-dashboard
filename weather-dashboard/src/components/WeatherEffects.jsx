import { useEffect, useRef } from 'react';

function rand(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * Full-viewport canvas weather effects, driven by { type, intensity }.
 * One rAF loop, DPR capped, pauses when tab hidden, static frame for
 * prefers-reduced-motion. intensity is 0..1 (data-driven rain/snow density).
 */
export default function WeatherEffects({ effect }) {
  const ref = useRef(null);
  const { type, intensity } = effect;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // ---- particle state ----
    const drops =
      type === 'rain' || type === 'storm'
        ? Array.from({ length: Math.round(80 + intensity * 140) }, () => ({
            x: rand(-100, w + 100),
            y: rand(-h, h),
            len: rand(10, 24),
            speed: rand(540, 1080),
            alpha: rand(0.1, 0.35),
          }))
        : [];
    const flakes =
      type === 'snow'
        ? Array.from({ length: Math.round(60 + intensity * 120) }, () => ({
            x: rand(0, w),
            y: rand(-h, h),
            r: rand(1, 3.5),
            speed: rand(30, 110),
            phase: rand(0, Math.PI * 2),
            alpha: rand(0.4, 0.9),
          }))
        : [];
    const stars =
      type === 'clear-night'
        ? Array.from({ length: 130 }, () => ({
            x: rand(0, w),
            y: rand(0, h),
            r: rand(0.4, 1.6),
            phase: rand(0, Math.PI * 2),
            speed: rand(0.5, 2),
          }))
        : [];
    const motes =
      type === 'clear-day'
        ? Array.from({ length: 26 }, () => ({
            x: rand(0, w),
            y: rand(0, h),
            r: rand(1, 2.5),
            speed: rand(8, 26),
            alpha: rand(0.15, 0.4),
          }))
        : [];
    const blobs =
      type === 'clouds'
        ? Array.from({ length: 6 }, (_, i) => ({
            x: rand(0, w),
            y: rand(0, h * 0.8),
            rx: rand(180, 380),
            speed: rand(8, 30) * (i % 2 === 0 ? 1 : -1),
            alpha: rand(0.08, 0.18),
          }))
        : [];
    const bands =
      type === 'fog'
        ? Array.from({ length: 5 }, (_, i) => ({
            y: (h / 5) * i + rand(-30, 30),
            thick: rand(90, 200),
            speed: rand(6, 18) * (i % 2 === 0 ? 1 : -1),
            offset: rand(0, w),
            alpha: rand(0.05, 0.12),
          }))
        : [];

    let sunAngle = 0;
    let flash = 0;
    let nextFlash = rand(4000, 8000);
    let lastFlash = 0;

    function draw(t, dt) {
      const s = dt / 1000;
      ctx.clearRect(0, 0, w, h);

      if (type === 'rain' || type === 'storm') {
        ctx.lineWidth = 1.2;
        for (const d of drops) {
          d.y += d.speed * s;
          d.x -= d.speed * 0.12 * s;
          if (d.y > h + 30) {
            d.y = rand(-60, -10);
            d.x = rand(-100, w + 100);
          }
          ctx.strokeStyle = `rgba(174, 194, 255, ${d.alpha})`;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.len * 0.18, d.y + d.len);
          ctx.stroke();
        }
        if (type === 'storm') {
          if (t - lastFlash > nextFlash) {
            flash = 1;
            lastFlash = t;
            nextFlash = rand(4000, 8000);
          }
          flash = Math.max(0, flash - dt / 700);
          if (flash > 0) {
            ctx.fillStyle = `rgba(190, 170, 255, ${(flash * 0.1).toFixed(3)})`;
            ctx.fillRect(0, 0, w, h);
          }
        }
      } else if (type === 'snow') {
        for (const f of flakes) {
          f.y += f.speed * s;
          f.phase += s * 1.5;
          f.x += Math.sin(f.phase) * 24 * s;
          if (f.y > h + 10) {
            f.y = rand(-20, -5);
            f.x = rand(0, w);
          }
          ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'clear-day') {
        // Phone-aware geometry: disc, rays (2.2R) and glow stay fully
        // on-screen with a margin. Fixed 0.82w clipped past the right edge
        // on narrow viewports and hid behind the stacked hero tile.
        const R = Math.max(30, Math.min(w, h) * 0.06);
        const sx = w - R * 2.8;
        const sy = R * 2.6;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 4);
        glow.addColorStop(0, 'rgba(255, 214, 140, 0.55)');
        glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx - R * 4, sy - R * 4, R * 8, R * 8);
        ctx.fillStyle = 'rgba(255, 226, 160, 0.95)';
        ctx.beginPath();
        ctx.arc(sx, sy, R, 0, Math.PI * 2);
        ctx.fill();
        sunAngle += s * 0.05;
        ctx.strokeStyle = 'rgba(255, 220, 150, 0.5)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
          const a = sunAngle + (i * Math.PI) / 6;
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * R * 1.5, sy + Math.sin(a) * R * 1.5);
          ctx.lineTo(sx + Math.cos(a) * R * 2.2, sy + Math.sin(a) * R * 2.2);
          ctx.stroke();
        }
        for (const m of motes) {
          m.y -= m.speed * s;
          if (m.y < -10) {
            m.y = h + 10;
            m.x = rand(0, w);
          }
          ctx.fillStyle = `rgba(255, 230, 170, ${m.alpha})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'clear-night') {
        const MR = Math.max(18, Math.min(w, h) * 0.045);
        const MG = MR * 5;
        const mx = MG + 12;
        const my = MG + 12;
        const moon = ctx.createRadialGradient(mx, my, 0, mx, my, MG);
        moon.addColorStop(0, 'rgba(210, 220, 255, 0.35)');
        moon.addColorStop(1, 'rgba(210, 220, 255, 0)');
        ctx.fillStyle = moon;
        ctx.fillRect(mx - MG, my - MG, MG * 2, MG * 2);
        ctx.fillStyle = 'rgba(225, 232, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(mx, my, MR, 0, Math.PI * 2);
        ctx.fill();
        for (const st of stars) {
          const a = 0.25 + 0.65 * Math.abs(Math.sin((t / 1000) * st.speed + st.phase));
          ctx.fillStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'clouds') {
        for (const b of blobs) {
          b.x += b.speed * s;
          if (b.x - b.rx > w) b.x = -b.rx;
          if (b.x + b.rx < 0) b.x = w + b.rx;
          const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.rx);
          g.addColorStop(0, `rgba(150, 170, 200, ${b.alpha})`);
          g.addColorStop(1, 'rgba(150, 170, 200, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, b.rx, b.rx * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'fog') {
        for (const band of bands) {
          band.offset += band.speed * s;
          if (band.offset > w) band.offset = -w;
          if (band.offset < -w) band.offset = w;
          const g = ctx.createLinearGradient(0, band.y - band.thick / 2, 0, band.y + band.thick / 2);
          g.addColorStop(0, 'rgba(180, 195, 190, 0)');
          g.addColorStop(0.5, `rgba(180, 195, 190, ${band.alpha})`);
          g.addColorStop(1, 'rgba(180, 195, 190, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(band.offset - 100, band.y - band.thick / 2, w + 200, band.thick);
        }
      }
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      draw(1200, 0);
      return () => window.removeEventListener('resize', resize);
    }

    let last = performance.now();
    function frame(now) {
      if (document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(now - last, 50);
      last = now;
      draw(now, dt);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [type, intensity]);

  return <canvas className="fx" ref={ref} aria-hidden="true" />;
}
