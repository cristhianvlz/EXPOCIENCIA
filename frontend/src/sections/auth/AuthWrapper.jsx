import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';

// project imports
import AuthCard from './AuthCard';

// ==============================|| AUTHENTICATION - WRAPPER ||============================== //

function ConstellationCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;
    let particles = [];

    const LINK_DIST = 120;
    const PARTICLE_SPEED = 0.25;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      particles = [];
      const count = Math.max(60, Math.floor((canvas.width * canvas.height) / 10000));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = PARTICLE_SPEED * (0.4 + Math.random() * 0.6);
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 0.4 + Math.random() * 1.2,
          base: 0.15 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
          freq: 0.008 + Math.random() * 0.012,
        });
      }
    }

    let tick = 0;
    function draw() {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        else if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        else if (p.y > canvas.height) p.y = 0;

        const alpha = p.base + 0.2 * Math.sin(tick * p.freq + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 200, 230, ${alpha})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length - 1; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const t = 1 - Math.sqrt(d2) / LINK_DIST;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,140,210,${0.12 * t * t})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();

    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  );
}

export default function AuthWrapper({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060c18',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ConstellationCanvas />

      {/* Nebulosas oscuras sutiles */}
      <Box sx={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(15,40,90,0.45) 0%, transparent 65%)',
        animation: 'drift1 22s ease-in-out infinite',
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-15%', right: '-8%',
        width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,30,70,0.40) 0%, transparent 65%)',
        animation: 'drift2 28s ease-in-out infinite',
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute', top: '35%', left: '40%',
        width: 450, height: 450, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,50,100,0.20) 0%, transparent 65%)',
        animation: 'drift1 18s ease-in-out infinite reverse',
        zIndex: 0,
      }} />

      {/* Formulario centrado */}
      <Box sx={{ width: '100%', maxWidth: 420, px: 2, position: 'relative', zIndex: 1 }}>
        <AuthCard>{children}</AuthCard>
      </Box>

      <style>{`
        @keyframes drift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(30px,-20px) scale(1.05); }
          66%      { transform: translate(-20px,25px) scale(0.97); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-35px,20px) scale(1.06); }
          75%      { transform: translate(25px,-30px) scale(0.96); }
        }
      `}</style>
    </Box>
  );
}

AuthWrapper.propTypes = { children: PropTypes.node };
