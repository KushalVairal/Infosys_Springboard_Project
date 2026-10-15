import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { LeafIcon, EcoSproutIcon } from '../components/NatureIcons';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Car, Utensils, ShoppingBag } from 'lucide-react';
import api from '../api/client';

export default function LandingPage() {
  const [backendStatus, setBackendStatus] = useState('Checking...');

  useEffect(() => {
    api.health()
      .then((res) => setBackendStatus(res?.status === 'UP' ? 'Connected & Healthy' : 'Degraded'))
      .catch(() => setBackendStatus('Backend unreachable (Start Spring Boot on 8080)'));
  }, []);

  const features = [
    {
      icon: <Car size={24} color="#244B35" />,
      title: 'Transport Footprint',
      desc: 'Track car, train, flight, bus, and zero-emission walking or cycling routes with precise calculation.'
    },
    {
      icon: <Zap size={24} color="#244B35" />,
      title: 'Electricity & Energy',
      desc: 'Log residential kWh power and LPG cooking consumption against grid emission benchmarks.'
    },
    {
      icon: <Utensils size={24} color="#244B35" />,
      title: 'Dietary Impact',
      desc: 'Understand the carbon differential between vegetarian, non-vegetarian, and beef-intensive meals.'
    },
    {
      icon: <ShoppingBag size={24} color="#244B35" />,
      title: 'Goods & Waste',
      desc: 'Account for clothing purchases, electronic acquisitions, and household waste generation.'
    }
  ];

  return (
    <div className="landing-page-wrapper">
      <Navbar />

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="hero-backdrop-glow" />
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-badge">
              <LeafIcon size={16} color="#244B35" />
              <span>Sustainable Living Reimagined</span>
            </div>

            <h1 className="hero-title">
              Track your carbon footprint with <span className="highlight-text">clarity and calm</span>.
            </h1>

            <p className="hero-subtitle">
              CarbonTrack connects your everyday choices—from morning commutes to household energy—with verified emission factors to help you make informed, climate-conscious decisions.
            </p>

            <div className="hero-cta-group">
              <Link to="/register" className="btn btn-primary btn-lg">
                <span>Start Tracking Now</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In to Dashboard
              </Link>
            </div>

            <div className="hero-system-status">
              <div className="status-indicator-dot" />
              <span>Backend REST API: <strong>{backendStatus}</strong></span>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="hero-visual-card">
            <div className="preview-card-header">
              <div className="preview-card-title">
                <EcoSproutIcon size={20} color="#244B35" />
                <span>Live Footprint Overview</span>
              </div>
              <span className="preview-tag">Nature Dashboard</span>
            </div>

            <div className="preview-stats-grid">
              <div className="preview-stat-box">
                <span className="stat-label">Monthly Total</span>
                <span className="stat-number">142.8 <small>kg CO₂e</small></span>
                <span className="stat-trend positive">↓ 14% vs last month</span>
              </div>
              <div className="preview-stat-box">
                <span className="stat-label">Top Category</span>
                <span className="stat-number">Transport</span>
                <span className="stat-trend neutral">68.4 kg logged</span>
              </div>
            </div>

            <div className="preview-bars">
              <div className="preview-bar-row">
                <span className="bar-category">Transport (km)</span>
                <div className="bar-track">
                  <div className="bar-fill fill-transport" style={{ width: '65%' }} />
                </div>
                <span className="bar-val">68.4 kg</span>
              </div>
              <div className="preview-bar-row">
                <span className="bar-category">Electricity (kWh)</span>
                <div className="bar-track">
                  <div className="bar-fill fill-electricity" style={{ width: '45%' }} />
                </div>
                <span className="bar-val">42.0 kg</span>
              </div>
              <div className="preview-bar-row">
                <span className="bar-category">Food (meals)</span>
                <div className="bar-track">
                  <div className="bar-fill fill-food" style={{ width: '30%' }} />
                </div>
                <span className="bar-val">24.5 kg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="landing-features-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">Comprehensive Coverage</span>
            <h2 className="section-title">Built around real everyday human activities</h2>
            <p className="section-description">
              Our emission engine matches your activity category, quantity, and date against our database of verified emission factors.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-bubble">{f.icon}</div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="landing-transparency-section">
        <div className="landing-container">
          <div className="transparency-card">
            <div className="transparency-content">
              <div className="transparency-badge">
                <ShieldCheck size={18} color="#244B35" />
                <span>Science-Backed Transparency</span>
              </div>
              <h2>Honest Data & Scientific Integrity</h2>
              <p>
                CarbonTrack uses real database-driven emission factors. We believe climate accountability requires honesty: test factors are clearly labeled, calculations are reproducible, and your personal data remains strictly private.
              </p>
              <ul className="transparency-checklist">
                <li><CheckCircle2 size={16} color="#668F63" /> Standardized kg CO₂e units with unit conversion preferences</li>
                <li><CheckCircle2 size={16} color="#668F63" /> Full activity history with tamper-proof timestamps</li>
                <li><CheckCircle2 size={16} color="#668F63" /> Secure JWT authentication and Spring Security authorization</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-left">
            <div className="footer-brand">
              <LeafIcon size={20} color="#244B35" />
              <span>CarbonTrack</span>
            </div>
            <p className="footer-tagline">Personal & Organizational Carbon Accounting Platform</p>
          </div>
          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/forgot-password">Reset Password</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
