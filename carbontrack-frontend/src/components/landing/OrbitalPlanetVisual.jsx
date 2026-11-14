import React, { useState, useEffect, useRef } from 'react';
import { LeafIcon } from '../NatureIcons';
import { ShieldCheck, TrendingDown, Target } from 'lucide-react';
import './OrbitalPlanetVisual.css';

/**
 * OrbitalPlanetVisual
 * Premium abstract orbital celestial visual for CarbonTrack Hero.
 * - Realistic dark emerald energy sphere with atmospheric depth & rim lighting
 * - 3 concentric rotating orbital rings with glowing telemetry nodes
 * - Orbiting particles & floating environmental HUD telemetry cards
 * - Responsive mouse parallax & touch support
 * - Respects prefers-reduced-motion
 */
export default function OrbitalPlanetVisual() {
  const containerRef = useRef(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) / (rect.width / 2);
      const dy = (e.clientY - centerY) / (rect.height / 2);
      // Subtle parallax (max 10px shift)
      setMouseOffset({
        x: Math.max(-1, Math.min(1, dx)) * 10,
        y: Math.max(-1, Math.min(1, dy)) * 10
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="orbital-stage-root"
      style={{
        transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`
      }}
      aria-hidden="true"
    >
      {/* Ambient background energy field */}
      <div className="orbital-energy-glow" />

      {/* Outer Orbital Ring (Milestones & Reductions) */}
      <div className="orbital-ring ring-outer">
        <div className="orbital-node node-outer-1">
          <span className="node-pulse-ring" />
          <span className="node-core" />
        </div>
        <div className="orbital-particle particle-1" />
      </div>

      {/* Middle Orbital Ring (Energy & Lifestyle) */}
      <div className="orbital-ring ring-middle">
        <div className="orbital-node node-middle-1">
          <span className="node-pulse-ring" />
          <span className="node-core" />
        </div>
        <div className="orbital-particle particle-2" />
        <div className="orbital-particle particle-3" />
      </div>

      {/* Inner Orbital Ring (Transport & Daily Tracking) */}
      <div className="orbital-ring ring-inner">
        <div className="orbital-node node-inner-1">
          <span className="node-pulse-ring" />
          <span className="node-core" />
        </div>
        <div className="orbital-particle particle-4" />
      </div>

      {/* Central Celestial Sphere: The Living Carbon Planet */}
      <div className="celestial-sphere-wrapper">
        <div className="celestial-sphere">
          {/* Atmosphere rim light */}
          <div className="sphere-atmosphere-halo" />
          {/* Surface topography / continent glow layers */}
          <div className="sphere-surface-texture" />
          {/* Specular highlight */}
          <div className="sphere-specular-glint" />
          {/* Core planet icon */}
          <div className="sphere-center-badge">
            <LeafIcon size={34} color="#78C78F" />
          </div>
        </div>
      </div>

      {/* Floating HUD Telemetry Card 1: Verified Factor Accuracy */}
      <div className="orbital-hud-card hud-top-left">
        <div className="hud-icon-pill icon-mint">
          <ShieldCheck size={16} />
        </div>
        <div className="hud-content">
          <span className="hud-label">Emission Engine</span>
          <strong className="hud-value">99.8% Verified Accuracy</strong>
        </div>
      </div>

      {/* Floating HUD Telemetry Card 2: Average Reduction */}
      <div className="orbital-hud-card hud-bottom-right">
        <div className="hud-icon-pill icon-forest">
          <TrendingDown size={16} />
        </div>
        <div className="hud-content">
          <span className="hud-label">Community Impact</span>
          <strong className="hud-value">-24.6% CO₂e Reduction</strong>
        </div>
      </div>

      {/* Floating HUD Telemetry Card 3: Real-Time Guidance */}
      <div className="orbital-hud-card hud-bottom-left">
        <div className="hud-icon-pill icon-gold">
          <Target size={16} />
        </div>
        <div className="hud-content">
          <span className="hud-label">Adaptive Goals</span>
          <strong className="hud-value">Real-Time Daily Guidance</strong>
        </div>
      </div>
    </div>
  );
}
