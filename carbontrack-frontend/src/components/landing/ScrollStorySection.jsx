import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flame, Eye, Compass, TrendingDown, Sprout } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STORY_STAGES = [
  {
    id: 1,
    step: '01',
    icon: Flame,
    title: 'Every Day Creates Emissions',
    subtitle: 'From morning commutes to home energy and meals',
    desc: 'The average person generates between 12 to 24 kg of CO₂e every single day. Most of these emissions remain invisible—hidden in power grids, vehicle combustion, food supply chains, and consumer goods.',
    statNumber: '14.2 kg',
    statLabel: 'Typical daily personal CO₂e',
    tip: 'Recognizing where emissions originate is the foundational step toward real reduction.'
  },
  {
    id: 2,
    step: '02',
    icon: Eye,
    title: 'Understand Your Carbon Footprint',
    subtitle: 'Scientific calculations powered by verified emission factors',
    desc: 'CarbonTrack replaces vague guesswork with scientific accounting. Every activity you log is multiplied against rigorous research emission factors (e.g. 0.192 kg CO₂e/km for petrol vehicles, 0.708 kg/kWh for grid power).',
    statNumber: '100% Verified',
    statLabel: 'Transparent factor database',
    tip: 'Tamper-proof activity logs allow you to measure reductions with mathematical certainty.'
  },
  {
    id: 3,
    step: '03',
    icon: Compass,
    title: 'Identify High-Emission Activities',
    subtitle: 'Pinpoint the exact categories driving your footprint',
    desc: 'Detailed category breakdown algorithms isolate your emission hotspots across Transport, Electricity, Food, and Shopping. Interactive comparisons reveal whether your commute or energy consumption is driving monthly peaks.',
    statNumber: '4 Core Domains',
    statLabel: 'Transport, Electricity, Food, Shopping',
    tip: 'Knowing your highest emission category lets you focus efforts where they save the most carbon.'
  },
  {
    id: 4,
    step: '04',
    icon: TrendingDown,
    title: 'Make Smarter Daily Choices',
    subtitle: 'Category-specific goals with real-time progress indicators',
    desc: 'Set ambitious, achievable reduction targets. CarbonTrack provides tailored recommendations—like switching one car commute to transit or cycling, lowering thermostat settings, or adopting plant-based meals—saving hundreds of kg CO₂e annually.',
    statNumber: '↓ 28%',
    statLabel: 'Average user reduction in 90 days',
    tip: 'Actionable recommendations connect directly to tracked goals for instant accountability.'
  },
  {
    id: 5,
    step: '05',
    icon: Sprout,
    title: 'Small Actions Cultivate a Greener Earth',
    subtitle: 'Collective impact, milestones, and sustainable habits',
    desc: 'When individuals and organizations log activities and achieve milestones, our collective environmental impact scales exponentially. Earn Gold, Silver, and Bronze leaf medals, track team contributions, and watch the living Earth flourish.',
    statNumber: '50+ kg',
    statLabel: 'Milestone badge achievements',
    tip: 'Consistent, sustained personal choices create a measurable, lasting global difference.'
  }
];

export default function ScrollStorySection({ onStageChange }) {
  const sectionRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.story-card-item');

      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top 70%',
          end: 'bottom 40%',
          onEnter: () => {
            setActiveStage(i);
            onStageChange?.(i / (STORY_STAGES.length - 1));
          },
          onEnterBack: () => {
            setActiveStage(i);
            onStageChange?.(i / (STORY_STAGES.length - 1));
          }
        });
      });
    }, el);

    return () => ctx.revert();
  }, [onStageChange]);

  const scrollToStage = (index) => {
    const cards = document.querySelectorAll('.story-card-item');
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className="landing-story-section" id="story" ref={sectionRef}>
      <div className="landing-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <span className="section-eyebrow">The Path from Awareness to Impact</span>
          <h2 className="section-title">How CarbonTrack Works</h2>
          <p className="section-description">
            Scroll to follow how daily mindfulness transforms personal footprints into a healthier, thriving planet.
          </p>
        </div>

        {/* Stage Progress Pills Nav - Scrollable on mobile */}
        <div className="story-nav-sticky">
          <div className="story-nav-pills-row">
            {STORY_STAGES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`story-pill-btn ${activeStage === idx ? 'active' : ''}`}
                onClick={() => scrollToStage(idx)}
              >
                <span className="pill-step">{s.step}</span>
                <span className="pill-title">{s.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Story Stages Vertical Feed */}
        <div className="story-feed-container">
          <div className="story-timeline-rail" />

          {STORY_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isCurrent = activeStage === index;
            return (
              <div
                key={stage.id}
                className={`story-card-item ${isCurrent ? 'stage-current' : ''}`}
              >
                <div className="stage-marker">
                  <div className="marker-dot">
                    <Icon size={16} />
                  </div>
                </div>

                <div className="stage-content-card">
                  <div className="stage-header-row">
                    <span className="stage-badge">STAGE {stage.step}</span>
                    <span className="stage-sub-badge">{stage.subtitle}</span>
                  </div>

                  <h3 className="stage-title">{stage.title}</h3>
                  <p className="stage-desc">{stage.desc}</p>

                  <div className="stage-stats-row">
                    <div className="stage-stat-block">
                      <div className="stat-number">{stage.statNumber}</div>
                      <div className="stat-label">{stage.statLabel}</div>
                    </div>

                    <div className="stage-tip-block">
                      <strong className="tip-label">Eco Impact Insight</strong>
                      <p className="tip-quote">{stage.tip}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
