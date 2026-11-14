import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';
import { LeafIcon } from '../NatureIcons';
import StarBorder from '../animations/StarBorder';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function LandingNavbar() {
  const { toggleTheme, isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);

      const sections = ['hero', 'how-it-works', 'story', 'analytics', 'categories', 'features', 'ai-assistant', 'community'];
      const scrollPos = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`landing-header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="landing-container landing-navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="landing-brand-link" onClick={() => scrollTo('hero')}>
          <div className="brand-leaf-bubble">
            <LeafIcon size={19} color="#ffffff" />
          </div>
          <span className="brand-title">
            Carbon<span className="brand-highlight">Track</span>
          </span>
          <span className="brand-tag">v2.0</span>
        </Link>

        {/* Desktop Navigation Links (Hidden on tablet & mobile) */}
        <nav className="landing-nav-links" aria-label="Main landing navigation">
          <button
            type="button"
            className={`nav-link-btn ${activeSection === 'how-it-works' || activeSection === 'story' ? 'active' : ''}`}
            onClick={() => scrollTo('how-it-works')}
          >
            How It Works
          </button>

          <button
            type="button"
            className={`nav-link-btn ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => scrollTo('analytics')}
          >
            Analytics & Data
          </button>

          <button
            type="button"
            className={`nav-link-btn ${activeSection === 'categories' ? 'active' : ''}`}
            onClick={() => scrollTo('categories')}
          >
            Emission Domains
          </button>

          <button
            type="button"
            className={`nav-link-btn ${activeSection === 'features' ? 'active' : ''}`}
            onClick={() => scrollTo('features')}
          >
            Features
          </button>

          <button
            type="button"
            className={`nav-link-btn ${activeSection === 'ai-assistant' ? 'active' : ''}`}
            onClick={() => scrollTo('ai-assistant')}
          >
            AI Assistant
          </button>

          <button
            type="button"
            className={`nav-link-btn ${activeSection === 'community' ? 'active' : ''}`}
            onClick={() => scrollTo('community')}
          >
            Community
          </button>
        </nav>

        {/* Action Controls & Theme Toggle */}
        <div className="landing-header-actions">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-pill"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            title={isDark ? 'Light Theme' : 'Dark Theme'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Desktop Authentication CTAs (Hidden on mobile < 768px, shown in drawer) */}
          <div className="desktop-auth-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm nav-cta-btn">
                <span>Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm nav-login-btn">
                  Sign In
                </Link>
                <StarBorder
                  as={Link}
                  to="/register"
                  className="btn btn-primary btn-sm nav-cta-btn"
                  duration={4}
                  stars={1}
                  trailLength={0.3}
                  thickness={1}
                  radius={10}
                  glow={0.6}
                  hover="lap"
                  clickPulse={true}
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </StarBorder>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-nav-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <nav className="mobile-nav-list">
            <button type="button" onClick={() => scrollTo('story')}>How It Works</button>
            <button type="button" onClick={() => scrollTo('analytics')}>Analytics & Data</button>
            <button type="button" onClick={() => scrollTo('categories')}>Emission Domains</button>
            <button type="button" onClick={() => scrollTo('features')}>Features</button>
            <button type="button" onClick={() => scrollTo('ai-assistant')}>CarbonTrack AI</button>
            <button type="button" onClick={() => scrollTo('community')}>Community & Medals</button>
          </nav>

          <div className="mobile-menu-footer">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                Go to Dashboard
              </Link>
            ) : (
              <div className="mobile-auth-btns">
                <Link to="/login" className="btn btn-secondary btn-block" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
