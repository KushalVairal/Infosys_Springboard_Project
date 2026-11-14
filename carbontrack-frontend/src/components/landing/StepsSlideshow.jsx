import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  Zap,
  Activity,
  Target,
  Bot,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './StepsSlideshow.css';

const SLIDES = [
  {
    step: '01',
    title: 'Create Your Account',
    tagline: 'Simple, Secure & Private',
    description:
      'Register with email or sign in instantly with Google. Choose your display name, configure notification preferences, and select your preferred emission measurement units (kg or Tonnes CO₂e).',
    icon: UserCheck,
    color: '#2A9D8F',
    badge: 'Step 1 of 6',
    previewType: 'account',
    highlights: [
      'Encrypted JWT authentication with auto session restore',
      'Google OAuth 2.0 single sign-on support',
      'Custom Blobatar avatar studio integration'
    ]
  },
  {
    step: '02',
    title: 'Log Everyday Activities',
    tagline: 'Transport, Electricity, Food & Shopping',
    description:
      'Log commutes, kilowatt-hours, meals, and purchases. Our calculation engine verifies activity factors against real DEFRA/EPA standards to determine your exact CO₂e footprint.',
    icon: Activity,
    color: '#668F63',
    badge: 'Step 2 of 6',
    previewType: 'activities',
    highlights: [
      '4 core categories: Transport, Electricity, Food & Shopping',
      'Validated calculation formulas matching scientific factors',
      'One-click quick-log presets for frequent habits'
    ]
  },
  {
    step: '03',
    title: 'Track Your Footprint',
    tagline: 'Automated Real-Time Visual Analytics',
    description:
      'Watch your personal footprint transform into interactive dashboards. Inspect daily fluctuations, weekly rollups, category breakdowns, and long-term emission trends.',
    icon: Zap,
    color: '#F59E0B',
    badge: 'Step 3 of 6',
    previewType: 'footprint',
    highlights: [
      'Interactive Daily, Weekly & Monthly timeline rollups',
      'Sortable category sector impact rankings (Analytics 12)',
      'Monthly activity consistency heatmap matrix (Analytics 11)'
    ]
  },
  {
    step: '04',
    title: 'Set Sustainability Goals',
    tagline: 'Target Budgets & Daily Guidance',
    description:
      'Create monthly or custom reduction goals. Receive dynamic daily budget guidance, projection graphs, and tearable ticket confirmations when completing milestones.',
    icon: Target,
    color: '#E06D53',
    badge: 'Step 4 of 6',
    previewType: 'goals',
    highlights: [
      'Category-scoped and overall emission target budgets',
      'Live daily remaining budget burn-rate projections',
      'Interactive tearable stub confirmation on deletion'
    ]
  },
  {
    step: '05',
    title: 'Get AI Recommendations',
    tagline: 'Intelligent Climate Copilot',
    description:
      'Receive tailored reduction suggestions generated from your real activity data. Ask CarbonTrack Climate AI for actionable tips, alternative commutes, and energy-saving checklists.',
    icon: Bot,
    color: '#3A86C8',
    badge: 'Step 5 of 6',
    previewType: 'ai',
    highlights: [
      'Automated personalized weekly tips from verified logs',
      'Contextual AI assistant chat embedded in dashboard',
      'Actionable savings estimates in kg CO₂e'
    ]
  },
  {
    step: '06',
    title: 'Celebrate Real Progress',
    tagline: 'Badges, Leaf Medals & Leaderboards',
    description:
      'Unlock verified achievement badges, claim exclusive Gold, Silver & Bronze Leaf awards on community or organisation leaderboards, and download high-res shareable achievement cards.',
    icon: Trophy,
    color: '#D9822B',
    badge: 'Step 6 of 6',
    previewType: 'celebration',
    highlights: [
      'Certified Gold, Silver & Bronze Leaf podium awards',
      'Downloadable high-DPI social achievement cards',
      'Dual Community and Private Organisation Leaderboards'
    ]
  }
];

const slideMotionVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.98,
    rotateY: dir > 0 ? 2 : -2
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      x: { type: 'spring', stiffness: 280, damping: 28 },
      opacity: { duration: 0.35 },
      scale: { duration: 0.35 },
      rotateY: { duration: 0.35 },
      staggerChildren: 0.07,
      delayChildren: 0.05
    }
  },
  exit: (dir) => ({
    x: dir > 0 ? -50 : 50,
    opacity: 0,
    scale: 0.98,
    rotateY: dir > 0 ? -2 : 2,
    transition: {
      x: { type: 'spring', stiffness: 280, damping: 28 },
      opacity: { duration: 0.25 }
    }
  })
};

const itemMotionVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' }
  }
};

export default function StepsSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goToSlide = useCallback((nextIdx, newDir) => {
    setDirection(newDir !== undefined ? newDir : nextIdx > currentSlide ? 1 : -1);
    setCurrentSlide(nextIdx);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Autoplay timer with 5.5s interval
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [isPlaying, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    setIsPlaying(false);
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const slide = SLIDES[currentSlide];
  const IconComponent = slide.icon;

  return (
    <section
      className="steps-slideshow-section"
      id="how-it-works"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Steps to use CarbonTrack"
    >
      <div className="landing-container">
        {/* Section Heading */}
        <div className="slideshow-header">
          <span className="slideshow-eyebrow">
            <Sparkles size={14} color="var(--forest-primary, #2e7d32)" />
            <span>HOW CARBONTRACK WORKS</span>
          </span>
          <h2 className="slideshow-title">6 Steps to Climate Action</h2>
          <p className="slideshow-subtitle">
            Follow the complete workflow from daily tracking to verified carbon reductions.
          </p>
        </div>

        {/* Main Slideshow Frame with 3D Depth */}
        <div className="slideshow-card">
          <div className="slideshow-card-wrapper" style={{ perspective: '1100px' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide.step}
                custom={direction}
                variants={slideMotionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="slideshow-card-inner"
              >
                {/* Left Content Column */}
                <div className="slide-content-col">
                  <motion.div variants={itemMotionVariants} className="slide-top-meta">
                    <span
                      className="slide-step-pill"
                      style={{ borderColor: slide.color, color: slide.color }}
                    >
                      {slide.badge}
                    </span>
                    <span className="slide-tagline">{slide.tagline}</span>
                  </motion.div>

                  <motion.h3 variants={itemMotionVariants} className="slide-heading">
                    {slide.title}
                  </motion.h3>

                  <motion.p variants={itemMotionVariants} className="slide-desc">
                    {slide.description}
                  </motion.p>

                  <motion.div variants={itemMotionVariants} className="slide-highlights-list">
                    {slide.highlights.map((item, idx) => (
                      <div key={idx} className="highlight-item">
                        <CheckCircle2
                          size={16}
                          className="highlight-icon"
                          style={{ color: slide.color }}
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div variants={itemMotionVariants} className="slide-action-row">
                    <Link to="/register" className="btn btn-primary btn-sm">
                      <span>Start with Step {currentSlide + 1}</span>
                      <ArrowRight size={15} />
                    </Link>
                  </motion.div>
                </div>

                {/* Right Interactive Visual Preview Column */}
                <motion.div variants={itemMotionVariants} className="slide-visual-col">
                  <div className="slide-preview-frame">
                    <div className="slide-preview-header">
                      <div className="preview-dots">
                        <span className="dot dot-red" />
                        <span className="dot dot-yellow" />
                        <span className="dot dot-green" />
                      </div>
                      <span className="preview-window-title">CarbonTrack 2.0 · {slide.title}</span>
                    </div>

                    <div className="slide-preview-body">
                      <div
                        className="preview-feature-badge"
                        style={{ background: `${slide.color}1A`, color: slide.color }}
                      >
                        <IconComponent size={28} />
                      </div>

                      {slide.previewType === 'account' && (
                        <div className="preview-mockup-account">
                          <div className="mockup-avatar-row">
                            <div className="mockup-avatar" style={{ background: slide.color }}>
                              CT
                            </div>
                            <div>
                              <strong>Welcome to CarbonTrack</strong>
                              <small>sowndarya@example.com · Verified</small>
                            </div>
                          </div>
                          <div className="mockup-unit-toggle">
                            <span>Preferred Unit:</span>
                            <strong>kg CO₂e (Default)</strong>
                          </div>
                        </div>
                      )}

                      {slide.previewType === 'activities' && (
                        <div className="preview-mockup-activities">
                          <div className="mockup-activity-row">
                            <span>🚗 32 km Commute</span>
                            <strong>5.4 kg CO₂e</strong>
                          </div>
                          <div className="mockup-activity-row">
                            <span>⚡ 18 kWh Grid Energy</span>
                            <strong>7.2 kg CO₂e</strong>
                          </div>
                          <div className="mockup-activity-row">
                            <span>🥗 Plant-Based Lunch</span>
                            <strong>0.8 kg CO₂e</strong>
                          </div>
                        </div>
                      )}

                      {slide.previewType === 'footprint' && (
                        <div className="preview-mockup-footprint">
                          <div className="footprint-stat-row">
                            <span>This Month's Total</span>
                            <strong>142.8 kg CO₂e</strong>
                          </div>
                          <div className="footprint-bars-mini">
                            <div className="f-bar-wrap">
                              <span>Trans</span>
                              <div className="f-bar f-trans" style={{ width: '70%' }} />
                            </div>
                            <div className="f-bar-wrap">
                              <span>Elec</span>
                              <div className="f-bar f-elec" style={{ width: '45%' }} />
                            </div>
                            <div className="f-bar-wrap">
                              <span>Food</span>
                              <div className="f-bar f-food" style={{ width: '30%' }} />
                            </div>
                            <div className="f-bar-wrap">
                              <span>Shop</span>
                              <div className="f-bar f-shop" style={{ width: '20%' }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {slide.previewType === 'goals' && (
                        <div className="preview-mockup-goals">
                          <div className="goals-target-badge">
                            <span>Target: 120 kg CO₂e</span>
                            <strong className="text-emerald">64% on track</strong>
                          </div>
                          <div className="goal-meter-track">
                            <div className="goal-meter-fill" style={{ width: '64%' }} />
                          </div>
                          <small className="goal-advice">Remaining allowance: 43.2 kg CO₂e</small>
                        </div>
                      )}

                      {slide.previewType === 'ai' && (
                        <div className="preview-mockup-ai">
                          <div className="mockup-ai-bubble user">
                            <span>How can I trim my transport footprint?</span>
                          </div>
                          <div className="mockup-ai-bubble bot">
                            <span>
                              Switching 2 weekly office commutes to the train will save ~14.2 kg
                              CO₂e this week!
                            </span>
                          </div>
                        </div>
                      )}

                      {slide.previewType === 'celebration' && (
                        <div className="preview-mockup-celebration">
                          <div className="medal-glow-pill">
                            <Trophy size={36} color="#D9822B" />
                            <div>
                              <strong>Gold Leaf Milestone</strong>
                              <small>Rank #1 · Community Leaderboard</small>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slideshow Bottom Navigation Controls Bar */}
          <div className="slideshow-controls-bar">
            {/* Play/Pause Button */}
            <button
              type="button"
              className="slideshow-ctrl-btn"
              onClick={() => setIsPlaying((prev) => !prev)}
              title={isPlaying ? 'Pause auto-play' : 'Resume auto-play'}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Pagination Indicators with Animated Pill Indicator */}
            <div className="slideshow-dots-group" role="tablist" aria-label="Slides">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.step}
                  type="button"
                  role="tab"
                  aria-selected={currentSlide === idx}
                  className={`slideshow-dot ${currentSlide === idx ? 'active' : ''}`}
                  onClick={() => goToSlide(idx)}
                  title={`Go to step ${s.step}: ${s.title}`}
                  aria-label={`Go to slide ${idx + 1}`}
                >
                  {currentSlide === idx ? (
                    <motion.span
                      layoutId="active-slideshow-indicator"
                      className="dot-inner active-motion"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  ) : (
                    <span className="dot-inner" />
                  )}
                </button>
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <div className="slideshow-arrows-group">
              <button
                type="button"
                className="slideshow-arrow-btn"
                onClick={prevSlide}
                title="Previous step"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="slideshow-step-counter">
                {currentSlide + 1} / {SLIDES.length}
              </span>
              <button
                type="button"
                className="slideshow-arrow-btn"
                onClick={nextSlide}
                title="Next step"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
