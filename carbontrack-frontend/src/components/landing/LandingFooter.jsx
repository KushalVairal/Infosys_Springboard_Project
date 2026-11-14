import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUp } from 'lucide-react';
import { LeafIcon } from '../NatureIcons';

export default function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer-premium">
      <div className="landing-container footer-main-content">
        {/* Brand & Mission Column */}
        <div className="footer-col brand-col">
          <div className="footer-brand-header">
            <div className="brand-leaf-bubble">
              <LeafIcon size={18} color="#ffffff" />
            </div>
            <span className="brand-title">
              Carbon<span className="brand-highlight">Track</span>
            </span>
          </div>

          <p className="footer-mission-text">
            CarbonTrack empowers individuals, households, and organizations to quantify their daily carbon footprint with scientific precision, discover actionable reductions, and build lasting climate habits.
          </p>

          <div className="footer-scientific-badge">
            <ShieldCheck size={16} color="var(--forest-primary, #2e7d32)" />
            <span>Calculations powered by verified IPCC & DEFRA emission factors</span>
          </div>
        </div>

        {/* Quick Nav: Platform Features */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Platform Features</h4>
          <ul className="footer-link-list">
            <li><Link to="/register">Activity Tracking Engine</Link></li>
            <li><Link to="/register">Category Sustainability Goals</Link></li>
            <li><Link to="/register">Personalised Recommendations</Link></li>
            <li><Link to="/register">CarbonTrack AI Advisor</Link></li>
            <li><Link to="/register">Community & Org Leaderboards</Link></li>
            <li><Link to="/register">Certified Leaf Medals</Link></li>
          </ul>
        </div>

        {/* Quick Nav: Account & Access */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Account & Access</h4>
          <ul className="footer-link-list">
            <li><Link to="/login">Sign In to Dashboard</Link></li>
            <li><Link to="/register">Create Free Account</Link></li>
            <li><Link to="/forgot-password">Forgot Password / Reset</Link></li>
            <li><Link to="/reset-password">Enter Verification Code</Link></li>
          </ul>
        </div>

        {/* Quick Nav: Scientific Rigor & Principles */}
        <div className="footer-col">
          <h4 className="footer-col-heading">Our Principles</h4>
          <p className="footer-principles-text">
            Zero Greenwashing. Tamper-Proof Timestamps. 100% Personal Data Privacy: We never monetize personal habits or sell user data.
          </p>
          <div className="back-to-top-box">
            <button
              type="button"
              className="back-to-top-btn"
              onClick={scrollToTop}
              title="Return to top"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="footer-bottom-bar">
        <div className="landing-container bottom-bar-inner">
          <p className="copyright-text">
            © {new Date().getFullYear()} CarbonTrack. All rights reserved. Personal & Organizational Carbon Accounting.
          </p>

          <div className="bottom-meta-links">
            <span>Verified Emission Database</span>
            <span className="dot-divider">·</span>
            <span>GDPR & Privacy Aligned</span>
            <span className="dot-divider">·</span>
            <span>Spring Boot + React Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
