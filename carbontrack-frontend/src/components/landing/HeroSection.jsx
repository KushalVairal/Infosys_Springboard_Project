import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Activity, Compass, ChevronDown } from 'lucide-react';
import { LeafIcon, EcoSproutIcon } from '../NatureIcons';
import api from '../../api/client';
import StarBorder from '../animations/StarBorder';
import OrbitalPlanetVisual from './OrbitalPlanetVisual';

export default function HeroSection({ onExploreClick }) {
  const [backendStatus, setBackendStatus] = useState('Checking health...');
  const [isHealthy, setIsHealthy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.health()
      .then((res) => {
        if (!isMounted) return;
        if (res?.status === 'UP') {
          setBackendStatus('Engine Connected & Healthy');
          setIsHealthy(true);
        } else {
          setBackendStatus('System Active');
          setIsHealthy(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setBackendStatus('Local Calculation Engine');
        setIsHealthy(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="landing-hero-cinematic" id="hero">
      <div className="hero-atmosphere-radial" />

      <div className="landing-container hero-grid">
        {/* Left Column: Hero Copy & Actions */}
        <div className="hero-text-block">
          {/* Initiative Badge */}
          <div className="hero-eyebrow-pill">
            <span className="eyebrow-dot" />
            <LeafIcon size={15} color="var(--forest-primary, #2e7d32)" />
            <span>The Living Planet Initiative</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-main-title">
            Every Action <br />
            <span className="gradient-text-forest">Shapes Our Planet.</span>
          </h1>

          {/* Subheading */}
          <p className="hero-lead-description">
            Understand your carbon footprint, track everyday activities and make
            informed choices for a greener future.
          </p>

          {/* Action CTAs */}
          <div className="hero-cta-button-row">
            <StarBorder
              as={Link}
              to="/register"
              className="btn btn-primary btn-lg hero-btn-pulse"
              duration={4}
              stars={1}
              trailLength={0.3}
              thickness={1}
              radius={12}
              glow={0.6}
              hover="lap"
              clickPulse={true}
            >
              <span>Start Tracking Now</span>
              <ArrowRight size={18} />
            </StarBorder>

            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={onExploreClick}
            >
              <Compass size={18} />
              <span>Explore CarbonTrack</span>
            </button>
          </div>

          {/* System Health Status */}
          <div className="hero-status-bar" title="Live status from /api/health">
            <span className={`status-pulse-dot ${isHealthy ? 'healthy' : 'fallback'}`} />
            <span className="status-label">Emission Engine:</span>
            <strong className="status-value">{backendStatus}</strong>
          </div>

          {/* Feature Badges */}
          <div className="hero-feature-chips">
            <div className="chip-item">
              <ShieldCheck size={14} className="chip-icon" />
              <span>Verified Emission Factors</span>
            </div>
            <div className="chip-item">
              <Activity size={14} className="chip-icon" />
              <span>Real-Time Goal Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Celestial Orbital Planet Stage */}
        <div className="hero-visual-card-wrap">
          <OrbitalPlanetVisual />
        </div>
      </div>

      {/* Scroll Down Cue */}
      <div className="hero-scroll-invitation" onClick={onExploreClick} role="button" tabIndex={0}>
        <span>Discover The Environmental Journey</span>
        <ChevronDown size={18} className="scroll-arrow-anim" />
      </div>
    </section>
  );
}
