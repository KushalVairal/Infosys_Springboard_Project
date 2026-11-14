import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Bot, Leaf, MessageCircle, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import './ChatAssistant.css';

const suggestions = [
  'What are my total emissions?',
  'What is my biggest emission source?',
  'Suggest ways to reduce my footprint',
  'Where can I view my goals?'
];

const CATEGORY_LABELS = {
  TRANSPORT: 'Transport',
  ELECTRICITY: 'Electricity',
  FOOD: 'Food',
  SHOPPING: 'Shopping',
  OTHER: 'Other'
};

const categorySuggestions = {
  TRANSPORT: 'For transport, try replacing short car trips with walking, cycling, public transport, or rail.',
  ELECTRICITY: 'For electricity, switch off idle devices, use efficient lighting, and reduce heating or cooling where practical.',
  FOOD: 'For food, try more plant-forward meals and reduce food waste.',
  SHOPPING: 'For shopping, buy only what you need, choose durable or second-hand items, and reuse or recycle where possible.',
  OTHER: 'Review your recent activity logs and look for a practical lower-emission alternative for the largest items.'
};

const formatCategory = (category) =>
  CATEGORY_LABELS[category] || category.charAt(0) + category.slice(1).toLowerCase();

const formatActivityType = (type) =>
  (type || 'Unknown').toLowerCase().split('_').map((word) =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

const formatEmissions = (kg, preferredUnit) => {
  if (preferredUnit === 'TONNES_CO2E') {
    return `${(kg / 1000).toFixed(3)} tonnes CO₂e`;
  }
  return `${kg.toFixed(2)} kg CO₂e`;
};

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getDateRange(text) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (/\btoday\b/.test(text)) return dateKey(today);

  if (/\b(this|current) week\b/.test(text)) {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return dateKey(start);
  }
  if (/\b(this|current) month\b/.test(text)) {
    return dateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  }
  if (/\b(last|past) 7 days\b/.test(text)) {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return dateKey(start);
  }
  return null;
}

function getActivitySummary(activities, message, preferredUnit) {
  const text = message.toLowerCase();
  const dateFrom = getDateRange(text);
  const records = dateFrom
    ? activities.filter((activity) => activity.logDate >= dateFrom)
    : activities;

  if (records.length === 0) {
    return {
      text: dateFrom
        ? `You have no activities recorded for that period, so there are no emissions to total yet.`
        : 'You have no activities recorded yet, so I can’t calculate your footprint. Log an activity to get started.',
      action: { label: 'Log an activity', to: '/activities' }
    };
  }

  const categoryTotals = new Map();
  const typeTotals = new Map();
  const total = records.reduce((sum, activity) => {
    const emissions = Number(activity.co2eKg) || 0;
    const category = (activity.category || 'OTHER').toUpperCase();
    const type = activity.activityType || 'Unknown';
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + emissions);
    const typeSummary = typeTotals.get(type) || { total: 0, count: 0 };
    typeSummary.total += emissions;
    typeSummary.count += 1;
    typeTotals.set(type, typeSummary);
    return sum + emissions;
  }, 0);

  const period = dateFrom
    ? ` since ${new Date(`${dateFrom}T00:00:00`).toLocaleDateString()}`
    : '';
  const rankedCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  const isRankingQuery = /\b(biggest|highest|top|main|largest|most|least|source|contribut|breakdown)\b/.test(text);

  if (isRankingQuery) {
    const leaders = rankedCategories.slice(0, 3)
      .map(([category, value], index) => `${index + 1}. ${formatCategory(category)} — ${formatEmissions(value, preferredUnit)}`)
      .join('\n');
    const biggestShare = total > 0
      ? ` (${((rankedCategories[0][1] / total) * 100).toFixed(0)}% of the total)`
      : '';
    const topTypes = [...typeTotals.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3)
      .map(([type, value]) => `${formatActivityType(type)} — ${formatEmissions(value.total, preferredUnit)}`)
      .join('\n');
    return {
      text: `Your top recorded emission categories${period}:\n${leaders}\n\n${formatCategory(rankedCategories[0][0])} is your largest source${biggestShare}.\n\nTop activity types:\n${topTypes}`,
      action: { label: 'Explore Analytics', to: '/analytics' }
    };
  }

  return {
    text: `Your total recorded emissions${period} are ${formatEmissions(total, preferredUnit)} across ${records.length} ${records.length === 1 ? 'activity' : 'activities'}.`,
    action: { label: 'View your footprint', to: '/dashboard' }
  };
}

async function getReply(message, preferredUnit) {
  const text = message.toLowerCase();
  const wantsPersonalData = /\b(emission|footprint|carbon|co2|co₂|performer|leaderboard|ranking|rank)\b/.test(text);
  const wantsSuggestion = /\b(suggest|suggestion|reduce|lower|improve|tip|advice|save)\b/.test(text);
  const isCommunityRanking = /\b(leaderboard|ranking|rank|top performers|other users|community)\b/.test(text);

  if (isCommunityRanking) {
    let personalSummary = '';
    try {
      const activities = await api.activities.getMyActivities();
      const typedTotals = new Map();
      (Array.isArray(activities) ? activities : []).forEach((activity) => {
        const type = activity.activityType || 'Unknown';
        const summary = typedTotals.get(type) || { total: 0, count: 0 };
        summary.total += Number(activity.co2eKg) || 0;
        summary.count += 1;
        typedTotals.set(type, summary);
      });
      const lowest = [...typedTotals.entries()]
        .map(([type, value]) => ({ type, average: value.total / value.count }))
        .sort((a, b) => a.average - b.average)[0];
      personalSummary = lowest
        ? ` Your lowest-emission activity type in your own logs is ${formatActivityType(lowest.type)} at an average of ${formatEmissions(lowest.average, preferredUnit)} per logged activity.`
        : ' Log activities to see your personal low-emission activity patterns.';
    } catch (error) {
      return { text: `I couldn’t load your activity data: ${error?.message || 'Please try again.'}` };
    }
    return {
      text: `CarbonTrack doesn’t currently provide a community leaderboard or rankings.${personalSummary}`,
      action: { label: 'View your activity logs', to: '/activities' }
    };
  }

  if (wantsSuggestion) {
    try {
      const activities = await api.activities.getMyActivities();
      if (Array.isArray(activities) && activities.length > 0) {
        const totals = new Map();
        activities.forEach((activity) => {
          const category = (activity.category || 'OTHER').toUpperCase();
          totals.set(category, (totals.get(category) || 0) + (Number(activity.co2eKg) || 0));
        });
        const [category, emissions] = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
        return {
          text: `Your biggest recorded source is ${formatCategory(category)} at ${formatEmissions(emissions, preferredUnit)}. ${categorySuggestions[category] || categorySuggestions.OTHER}`,
          action: { label: 'Review your Analytics', to: '/analytics' }
        };
      }
      return {
        text: 'You haven’t logged activities yet, so I can’t tailor advice to your footprint. Start by logging activities; meanwhile, walking or cycling for short trips, reducing home energy use, and choosing plant-forward meals are practical places to begin.',
        action: { label: 'Log an activity', to: '/activities' }
      };
    } catch (error) {
      return { text: `I couldn’t load your activity data to tailor suggestions: ${error?.message || 'Please try again.'}` };
    }
  }

  if (wantsPersonalData) {
    try {
      const activities = await api.activities.getMyActivities();
      return getActivitySummary(Array.isArray(activities) ? activities : [], text, preferredUnit);
    } catch (error) {
      return { text: `I couldn’t load your activity data: ${error?.message || 'Please try again.'}` };
    }
  }

  if (/log|activit|record/.test(text)) {
    return {
      text: 'Open Activity Tracking, then choose Add Activity. Pick a category, enter the activity and amount, and save it to update your footprint.',
      action: { label: 'Open Activity Tracking', to: '/activities' }
    };
  }
  if (/analytic|chart|breakdown|trend/.test(text)) {
    return {
      text: 'Analytics breaks down your recorded emissions by category and over time. Use it to spot the areas with the most impact.',
      action: { label: 'View Analytics', to: '/analytics' }
    };
  }
  if (/goal|target/.test(text)) {
    return {
      text: 'You can create and track sustainability targets from Sustainability Goals.',
      action: { label: 'Open Sustainability Goals', to: '/goals' }
    };
  }
  if (/profile|account|unit|setting/.test(text)) {
    return {
      text: 'Your profile and preferred CO₂e measurement unit are available in Profile & Settings.',
      action: { label: 'Open Profile & Settings', to: '/profile' }
    };
  }
  if (/dashboard|footprint|summary/.test(text)) {
    return {
      text: 'Your Dashboard gives you a quick overview of your tracked footprint and recent activity.',
      action: { label: 'Open Dashboard', to: '/dashboard' }
    };
  }
  if (/help|what can|support/.test(text)) {
    return {
      text: 'Ask about your total emissions, biggest emission sources, low-emission activities, tailored reduction ideas, or where to find a feature. I can also help navigate Dashboard, Activity Tracking, Analytics, Goals, and Profile.'
    };
  }

  return {
    text: 'I can answer questions about your emissions and top sources, suggest ways to reduce your footprint, and help you navigate CarbonTrack. Try “What are my total emissions?” or “Where can I manage my goals?”'
  };
}

export default function ChatAssistant() {
  const { preferredUnit } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      from: 'assistant',
      text: 'Hi! I’m your CarbonTrack guide. What would you like help with?'
    }
  ]);
  const nextId = useRef(1);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (value) => {
    const text = value.trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);
    setMessages((current) => [...current, { id: nextId.current++, from: 'user', text }]);
    try {
      const reply = await getReply(text, preferredUnit);
      setMessages((current) => [...current, { id: nextId.current++, from: 'assistant', ...reply }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: nextId.current++,
        from: 'assistant',
        text: `I couldn’t answer that right now: ${error?.message || 'Please try again.'}`
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-assistant">
      {isOpen && (
        <section
          id="chat-panel"
          className="chat-panel"
          role="dialog"
          aria-labelledby="chat-title"
          aria-modal="false"
        >
          <header className="chat-header">
            <span className="chat-avatar"><Leaf size={19} /></span>
            <div className="chat-heading">
              <h2 id="chat-title">CarbonTrack Guide</h2>
              <span>Here to help you stay on track</span>
            </div>
            <button
              type="button"
              className="chat-close"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={19} />
            </button>
          </header>

          <div className="chat-messages" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message-row ${message.from}`}>
                {message.from === 'assistant' && (
                  <span className="chat-message-avatar"><Bot size={15} /></span>
                )}
                <div className="chat-message-content">
                  <p className="chat-message">{message.text}</p>
                  {message.action && (
                    <Link
                      className="chat-action-link"
                      to={message.action.to}
                      onClick={() => setIsOpen(false)}
                    >
                      {message.action.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="chat-message-row assistant" role="status">
                <span className="chat-message-avatar"><Bot size={15} /></span>
                <p className="chat-message">Checking your activity data...</p>
              </div>
            )}
            {messages.length === 1 && (
              <div className="chat-suggestions" aria-label="Suggested questions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="chat-suggestion"
                    disabled={isSending}
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <label className="chat-input-label" htmlFor="chat-input">Message the CarbonTrack guide</label>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              autoComplete="off"
              disabled={isSending}
            />
            <button type="submit" className="chat-send" aria-label="Send message" disabled={isSending || !input.trim()}>
              <ArrowUp size={18} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`chat-launcher ${isOpen ? 'is-open' : ''}`}
        aria-label={isOpen ? 'Close CarbonTrack guide' : 'Open CarbonTrack guide'}
        aria-expanded={isOpen}
        aria-controls="chat-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={23} /> : <MessageCircle size={23} />}
      </button>
    </div>
  );
}
