import React, { useState } from 'react';
import { Bot, User, Sparkles, Send, ShieldCheck, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const DEMO_CONVERSATIONS = {
  spike: {
    question: 'Why did my emissions spike by 24% this week?',
    summary: 'Analyzing your activity logs for the last 7 days against your verified baseline:',
    steps: [
      {
        num: 1,
        title: 'Interstate Highway Drive',
        detail: 'Recorded 140 km on Wednesday in a petrol vehicle.',
        stat: '+23.9 kg CO₂e'
      },
      {
        num: 2,
        title: 'Extended Air Conditioning',
        detail: 'Logged an extra 4 hours during Thursday\'s heatwave.',
        stat: '+4.9 kg CO₂e'
      }
    ],
    conclusion: 'Together, these 2 activities represent 76% of this week\'s net footprint. Would you like to create a 10-day recovery goal to offset this surge?'
  },
  commute: {
    question: 'How do I cut transport emissions without buying an electric vehicle?',
    summary: 'Here are the 3 highest-leverage actions grounded in DEFRA 2024 emission factors:',
    steps: [
      {
        num: 1,
        title: 'Carpool Twice Weekly',
        detail: 'Halves individual per-mile impact on regular commutes.',
        stat: 'Saves ~18 kg CO₂e/mo'
      },
      {
        num: 2,
        title: 'Tire Pressure & Moderate Speed (65 mph)',
        detail: 'Improves internal combustion engine efficiency by 7–10%.',
        stat: 'Saves ~6 kg CO₂e/mo'
      },
      {
        num: 3,
        title: 'Bundle Weekend Errands',
        detail: 'Eliminates cold engine starts and redundant ignition cycles.',
        stat: 'Saves ~8 kg CO₂e/mo'
      }
    ],
    conclusion: 'Adopting these 3 habits alone reduces monthly transport footprint by up to 32 kg CO₂e.'
  },
  home: {
    question: 'Give me a 3-step home energy reduction checklist.',
    summary: 'Here is your high-impact household energy reduction checklist:',
    steps: [
      {
        num: 1,
        title: 'Thermostat Calibration',
        detail: 'Adjust heating down by 1°C or AC up by 1°C.',
        stat: 'Cuts HVAC load ~8%'
      },
      {
        num: 2,
        title: 'Cold-Water Laundry',
        detail: '85% of laundry electricity goes strictly toward water heating.',
        stat: 'Saves ~12 kWh/mo'
      },
      {
        num: 3,
        title: 'Eliminate Vampire Draw',
        detail: 'Use smart power strips on entertainment and desktop docks.',
        stat: 'Saves 15–25 kWh/mo'
      }
    ],
    conclusion: 'Small residential adjustments yield immediate utility bill and carbon savings.'
  },
  flight: {
    question: 'How does high-speed rail compare to short-haul domestic flights?',
    summary: 'Direct comparison based on verified per-passenger-km emission factors:',
    steps: [
      {
        num: 1,
        title: 'Domestic Short-Haul Flight',
        detail: 'High fuel burn during takeoff and climb phases.',
        stat: '0.246 kg CO₂e / km'
      },
      {
        num: 2,
        title: 'Electric Intercity Rail',
        detail: 'Powered by regional electric grid infrastructure.',
        stat: '0.028 kg CO₂e / km'
      }
    ],
    conclusion: 'Choosing intercity rail over short-haul aviation eliminates 88.6% of travel emissions for identical destinations.'
  }
};

export default function AIShowcase() {
  const [activeKey, setActiveKey] = useState('spike');
  const [isTyping, setIsTyping] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customReply, setCustomReply] = useState(null);
  const navigate = useNavigate();

  const activeChat = DEMO_CONVERSATIONS[activeKey];

  const handleSelectPrompt = (key) => {
    if (key === activeKey && !customReply) return;
    setCustomReply(null);
    setIsTyping(true);
    setActiveKey(key);
    setTimeout(() => setIsTyping(false), 320);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) {
      navigate('/login');
      return;
    }

    const query = customInput.trim();
    setCustomInput('');
    setIsTyping(true);
    setCustomReply(null);

    setTimeout(() => {
      setIsTyping(false);
      setCustomReply({
        question: query,
        summary: `Great question regarding "${query}"!`,
        steps: [
          {
            num: 1,
            title: 'Personalized Footprint Grounding',
            detail: 'CarbonTrack AI analyzes your logged Transport, Energy, Food, and Shopping records to calculate exact savings.',
            stat: 'DEFRA Grounded'
          }
        ],
        conclusion: 'Sign in to your free CarbonTrack account to enable automated footprint diagnostics, custom reduction goals, and anomaly alerts!'
      });
    }, 450);
  };

  const currentDisplay = customReply || activeChat;

  return (
    <section className="landing-ai-section" id="ai-assistant">
      <div className="landing-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <span className="section-eyebrow">Intelligent Climate Copilot</span>
          <h2 className="section-title">Meet CarbonTrack AI</h2>
          <p className="section-description">
            Your personal sustainability advisor. Analyze footprint anomalies, receive personalized reduction tips, and turn intentions into tangible results.
          </p>
        </div>

        {/* AI Interactive Chat Window */}
        <div className="ai-showcase-window">
          {/* Window Header */}
          <div className="ai-window-header">
            <div className="ai-bot-identity">
              <span className="ai-avatar-bubble">
                <Bot size={18} color="#ffffff" />
              </span>
              <div>
                <strong className="ai-bot-name">CarbonTrack Climate AI</strong>
                <span className="ai-bot-status">
                  <span className="online-indicator" /> Active · Grounded in GHG Protocol & DEFRA 2024
                </span>
              </div>
            </div>

            <div className="ai-window-actions">
              <span className="ai-badge-pill" title="Strict scientific calculation engine">
                <ShieldCheck size={13} color="var(--forest-primary, #2e7d32)" />
                <span>Zero Hallucinations · Fact-Checked</span>
              </span>
            </div>
          </div>

          {/* Quick Prompt Selectors */}
          <div className="ai-prompts-bar">
            <span className="prompts-label">Try asking:</span>
            <div className="prompt-chips-scroll">
              <button
                type="button"
                className={`prompt-chip ${activeKey === 'spike' && !customReply ? 'active' : ''}`}
                onClick={() => handleSelectPrompt('spike')}
              >
                "Why did my emissions spike?"
              </button>
              <button
                type="button"
                className={`prompt-chip ${activeKey === 'commute' && !customReply ? 'active' : ''}`}
                onClick={() => handleSelectPrompt('commute')}
              >
                "Cut commute emissions without an EV"
              </button>
              <button
                type="button"
                className={`prompt-chip ${activeKey === 'home' && !customReply ? 'active' : ''}`}
                onClick={() => handleSelectPrompt('home')}
              >
                "Home energy reduction checklist"
              </button>
              <button
                type="button"
                className={`prompt-chip ${activeKey === 'flight' && !customReply ? 'active' : ''}`}
                onClick={() => handleSelectPrompt('flight')}
              >
                "Flight vs train impact"
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="ai-messages-container">
            {/* User Message */}
            <div className="chat-bubble-row user-row">
              <div className="chat-avatar user-avatar">
                <User size={16} />
              </div>
              <div className="chat-bubble user-bubble">
                <p>{currentDisplay.question}</p>
              </div>
            </div>

            {/* AI Assistant Message */}
            <div className="chat-bubble-row ai-row">
              <div className="chat-avatar ai-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-bubble ai-bubble">
                {isTyping ? (
                  <div className="ai-typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <div className="ai-structured-response">
                    <p className="ai-summary-lead">{currentDisplay.summary}</p>
                    
                    {currentDisplay.steps && currentDisplay.steps.length > 0 && (
                      <div className="ai-steps-stack">
                        {currentDisplay.steps.map((st) => (
                          <div key={st.num} className="ai-step-card">
                            <span className="ai-step-index">{st.num}</span>
                            <div className="ai-step-body">
                              <div className="ai-step-top">
                                <strong className="ai-step-title">{st.title}</strong>
                                <span className="ai-step-stat-badge">{st.stat}</span>
                              </div>
                              <p className="ai-step-detail">{st.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="ai-conclusion-text">{currentDisplay.conclusion}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Input Form */}
          <form className="ai-input-bar" onSubmit={handleCustomSubmit}>
            <div className="ai-input-wrapper">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ask CarbonTrack AI anything about cutting your footprint..."
                className="ai-mock-input"
                aria-label="Ask CarbonTrack AI input"
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-sm ai-ask-btn">
              <span>Ask AI</span>
              <Send size={14} />
            </button>
          </form>

          {/* Sub-bar Prompt Cue */}
          <div className="ai-bottom-cue">
            <Zap size={12} className="cue-icon" />
            <span>
              Sign in to unlock personalized footprint anamoly detection, goal suggestions & team analytics.
            </span>
            <Link to="/login" className="cue-link">Sign In →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
