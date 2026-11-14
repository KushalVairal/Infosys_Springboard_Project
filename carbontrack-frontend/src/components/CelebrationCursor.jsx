import React, { useEffect, useRef } from 'react';

/**
 * CarbonTrack Palette for Confetti Particles:
 * - Forest Green, Emerald, Vibrant Mint, Soft Gold, Crisp White
 */
const CONFETTI_COLORS = [
  '#244B35', // Forest green
  '#2E8540', // Emerald green
  '#10B981', // Mint emerald
  '#6EE7B7', // Soft mint
  '#F59E0B', // Soft gold
  '#D9822B', // Amber gold
  '#FFFFFF', // Pure white
];

/**
 * Trigger a celebration confetti explosion anywhere on the screen.
 * Dispatches a lightweight custom event captured by the active CelebrationCursor canvas.
 */
export function triggerCelebrationConfetti({
  x = window.innerWidth / 2,
  y = window.innerHeight * 0.35,
  count = 90
} = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('carbontrack-confetti-burst', {
        detail: { x, y, count }
      })
    );
  }
}

/**
 * Custom Celebration Cursor Component
 * - 100% Free & Open (No Pro license required)
 * - Uses single lightweight HTML Canvas API + requestAnimationFrame
 * - Emits gentle tumbling paper confetti on cursor movement
 * - Large burst on mouse click
 * - Supports custom trigger for achievement / leaderboard podium celebrations
 * - Respects prefers-reduced-motion & touch-only devices
 * - Zero interference with buttons, scrolling, forms or text selection (pointer-events: none)
 */
export default function CelebrationCursor({ enabled = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // 1. Check Reduced Motion preference
    const mediaReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaReducedMotion.matches) return;

    // 2. Check Pointer Fine (disable on touch-only devices)
    const mediaFinePointer = window.matchMedia('(pointer: fine)');
    if (!mediaFinePointer.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Particle pool
    const particles = [];
    const MAX_PARTICLES = 320;

    let mouseX = -100;
    let mouseY = -100;
    let lastMoveTime = 0;
    let isMoving = false;

    // Particle Class
    class Particle {
      constructor(x, y, isBurst = false) {
        this.reset(x, y, isBurst);
      }

      reset(x, y, isBurst = false) {
        this.x = x;
        this.y = y;
        this.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        this.shape = Math.random() > 0.3 ? 'rect' : 'circle';

        // Particle dimensions
        this.size = 5 + Math.random() * 6;
        this.width = this.size;
        this.height = this.shape === 'rect' ? this.size * (1.2 + Math.random() * 0.8) : this.size;

        if (isBurst) {
          // Radial explosive velocity
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.5 + Math.random() * 7;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed - 2.5; // slight upward bias
        } else {
          // Gentle cursor spill velocity
          this.vx = (Math.random() - 0.5) * 2.2;
          this.vy = -0.5 - Math.random() * 2.0; // floats slightly up then falls
        }

        this.gravity = 0.12 + Math.random() * 0.08;
        this.drag = 0.985;

        // 3D paper rotation & flip
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 12;
        this.flipAngle = Math.random() * Math.PI * 2;
        this.flipSpeed = 0.08 + Math.random() * 0.12;

        this.opacity = 1.0;
        this.decay = 0.008 + Math.random() * 0.012;
        this.alive = true;
      }

      update() {
        this.vx *= this.drag;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        this.rotation += this.rotationSpeed;
        this.flipAngle += this.flipSpeed;
        this.opacity -= this.decay;

        if (this.opacity <= 0 || this.y > height + 20) {
          this.alive = false;
        }
      }

      draw(c) {
        if (!this.alive || this.opacity <= 0) return;

        c.save();
        c.translate(this.x, this.y);
        c.rotate((this.rotation * Math.PI) / 180);
        // 3D paper flip effect
        const scaleY = Math.cos(this.flipAngle);
        c.scale(1, scaleY);
        c.globalAlpha = Math.max(0, this.opacity);
        c.fillStyle = this.color;

        if (this.shape === 'circle') {
          c.beginPath();
          c.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          c.fill();
        } else {
          c.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        c.restore();
      }
    }

    function addParticles(x, y, count = 2, isBurst = false) {
      for (let i = 0; i < count; i++) {
        if (particles.length < MAX_PARTICLES) {
          particles.push(new Particle(x, y, isBurst));
        } else {
          // Recycle dead particle
          const dead = particles.find((p) => !p.alive);
          if (dead) {
            dead.reset(x, y, isBurst);
          }
        }
      }
    }

    // Pointer move listener
    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMoveTime = performance.now();
      isMoving = true;

      // Small gentle confetti drip on movement (1-2 particles every few pixels)
      addParticles(mouseX + (Math.random() - 0.5) * 6, mouseY + (Math.random() - 0.5) * 6, 2, false);
    };

    // Pointer click listener (larger burst around cursor)
    const onMouseDown = (e) => {
      // Don't burst if clicking outside viewport
      if (e.clientX < 0 || e.clientY < 0) return;
      addParticles(e.clientX, e.clientY, 26, true);
    };

    // Custom celebration event listener (for modal/badge unlock)
    const onCelebrationBurst = (e) => {
      const { x = width / 2, y = height * 0.35, count = 90 } = e.detail || {};
      addParticles(x, y, count, true);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('carbontrack-confetti-burst', onCelebrationBurst);

    // Initial celebratory burst upon activation
    addParticles(width / 2, height * 0.38, 70, true);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Idle check: stop moving after 150ms of stillness
      if (performance.now() - lastMoveTime > 150) {
        isMoving = false;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (!p.alive) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('carbontrack-confetti-burst', onCelebrationBurst);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
      aria-hidden="true"
    />
  );
}

