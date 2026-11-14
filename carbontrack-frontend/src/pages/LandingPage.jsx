import React, { useState, useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import StepsSlideshow from '../components/landing/StepsSlideshow';
import ScrollStorySection from '../components/landing/ScrollStorySection';
import LiveAnalyticsSection from '../components/landing/LiveAnalyticsSection';
import CategoryExplorer from '../components/landing/CategoryExplorer';
import FeaturesShowcase from '../components/landing/FeaturesShowcase';
import AIShowcase from '../components/landing/AIShowcase';
import CommunityShowcase from '../components/landing/CommunityShowcase';
import LandingFooter from '../components/landing/LandingFooter';
import '../styles/landing.css';

/**
 * CarbonTrack 2.0 – Premium 3D Animated Landing Page
 *
 * Implements:
 * 1. Cinematic 3D Living Earth Hero with rotating globe, atmosphere glow, and surface-attached trees.
 * 2. Tree-growing animation tied to scroll progress and environmental story milestones.
 * 3. GSAP ScrollTrigger 5-stage interactive narrative.
 * 4. Live Carbon Footprint Analytics with Recharts responsive graphs.
 * 5. Interactive Carbon Footprint Explorer for 6 core emission categories.
 * 6. High-impact Feature Showcase with interactive simulations.
 * 7. CarbonTrack AI Assistant chat showcase.
 * 8. Achievements, Certified Leaf Medals & Dual Leaderboard Showcase.
 * 9. Responsive glassmorphic navigation and transparent footer.
 */
export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        // Map top 35% of the page scroll directly to 0 -> 1 tree growth & Earth transformation
        const heroStoryRange = Math.min(window.scrollY / (window.innerHeight * 1.8), 1.0);
        setScrollProgress(heroStoryRange);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStageChange = (stageIndex) => {
    // Staggered tree growth milestone based on active narrative stage
    const stageFractions = [0.1, 0.35, 0.6, 0.85, 1.0];
    const targetFraction = stageFractions[stageIndex] ?? 0.5;
    setScrollProgress((prev) => Math.max(prev, targetFraction));
  };

  const handleExploreClick = () => {
    const section = document.getElementById('how-it-works') || document.getElementById('story');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-root">
      {/* 1. Header & Glass Navigation */}
      <LandingNavbar />

      {/* 2. Hero Section – Celestial Orbital Stage */}
      <HeroSection
        scrollProgress={scrollProgress}
        onExploreClick={handleExploreClick}
      />

      {/* 3. Interactive Steps Slideshow */}
      <StepsSlideshow />

      {/* 4. Scroll-Driven Earth Story */}
      <ScrollStorySection onStageChange={handleStageChange} />

      {/* 4. Live Carbon Footprint Analytics */}
      <LiveAnalyticsSection />

      {/* 5. Interactive Carbon Footprint Explorer */}
      <CategoryExplorer />

      {/* 6. Comprehensive Features Showcase */}
      <FeaturesShowcase />

      {/* 7. CarbonTrack AI Assistant Showcase */}
      <AIShowcase />

      {/* 8. Achievements, Leaf Medals & Community Showcase */}
      <CommunityShowcase />

      {/* 9. Premium Landing Footer */}
      <LandingFooter />
    </div>
  );
}
