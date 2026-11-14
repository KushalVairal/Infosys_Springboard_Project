import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  Tag,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

const suggestedPrompts = [
  'Analyze my top emission sources this month',
  'How can I reduce home electricity consumption?',
  'What are low-carbon alternatives to car trips?',
  'Help me set an achievable weekly sustainability goal',
  'Explain how diet affects my carbon footprint'
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeContext, setActiveContext] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const conversationEndRef = useRef(null);
  const inputRef = useRef(null);
  const requestIdRef = useRef(0);
  const panelRef = useRef(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Close chatbot on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target)) {
        const toggleBtn = document.querySelector('.chatbot-launcher, .chatbot-toggle-button');
        if (toggleBtn && toggleBtn.contains(e.target)) return;
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Listen for external trigger to ask AI (e.g. from Recommendations page)
  useEffect(() => {
    const handleAskAiEvent = (e) => {
      const { recommendation, initialMessage } = e.detail || {};
      setIsOpen(true);
      if (recommendation) {
        setActiveContext({
          title: recommendation.title,
          category: recommendation.category,
          observation: recommendation.observation,
          action: recommendation.actionDescription,
          savings: recommendation.estimatedSavingsKg
        });
      }
      if (initialMessage) {
        sendMessage(initialMessage, recommendation ? `Recommendation: "${recommendation.title}" (Category: ${recommendation.category}). Observation: ${recommendation.observation}` : null);
      }
    };

    window.addEventListener('carbontrack:ask-ai', handleAskAiEvent);
    return () => window.removeEventListener('carbontrack:ask-ai', handleAskAiEvent);
  }, []);

  async function sendMessage(text = input, overrideContext = null) {
    const content = text.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: 'user', content }];
    const requestMessages = nextMessages.slice(-20);
    const requestId = ++requestIdRef.current;

    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    const contextToSend = overrideContext || (activeContext ? `Context: Recommendation "${activeContext.title}" [Category: ${activeContext.category}]. Observation: ${activeContext.observation}. Action: ${activeContext.action}` : null);

    try {
      const response = await api.assistant.chat(requestMessages, contextToSend);
      if (requestId === requestIdRef.current) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: response.message }
        ]);
      }
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        const msg = requestError.message || 'Unable to reach the AI sustainability advisor.';
        setError(msg);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSending(false);
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function startNewChat() {
    requestIdRef.current += 1;
    setMessages([]);
    setError('');
    setInput('');
    setActiveContext(null);
    setIsSending(false);
    inputRef.current?.focus();
  }

  function copyMessage(text, idx) {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <section
          ref={panelRef}
          className={`chatbot-panel ${isExpanded ? 'is-expanded' : ''}`}
          aria-label="CarbonTrack AI Advisor"
        >
          <header className="chatbot-header">
            <div className="chatbot-heading">
              <span className="chatbot-avatar">
                <Sparkles size={18} />
              </span>
              <div>
                <h2>CarbonTrack AI Advisor</h2>
                <p>Personalised Sustainability Intelligence</p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-icon-button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse to standard view' : 'Expand panel'}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                className="chatbot-new-chat"
                onClick={startNewChat}
                title="Start a new conversation"
              >
                <RotateCcw size={13} style={{ marginRight: '0.25rem' }} />
                New
              </button>

              <button
                type="button"
                className="chatbot-icon-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
              >
                <X size={19} />
              </button>
            </div>
          </header>

          {/* Active Context Banner */}
          {activeContext && (
            <div className="chatbot-context-banner">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={13} />
                <strong>Context:</strong> {activeContext.title} ({activeContext.category})
              </span>
              <button
                type="button"
                onClick={() => setActiveContext(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                title="Clear topic context"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="chatbot-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chatbot-welcome">
                <span className="chatbot-welcome-icon">
                  <Bot size={26} />
                </span>
                <h3>Hello! How can I help today?</h3>
                <p>
                  I analyze your verified activity data to explain recommendations, compare alternative low-emission habits, and help set realistic category targets.
                </p>

                <div className="chatbot-suggestions">
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', marginBottom: '0.2rem' }}>
                    Suggested Questions:
                  </span>
                  {suggestedPrompts.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={isSending}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  className={`chatbot-message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <div className="chatbot-message-body">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} style={{ margin: '0.25rem 0' }}>{line}</p>
                    ))}
                  </div>

                  {message.role === 'assistant' && (
                    <button
                      type="button"
                      className="chatbot-copy-btn"
                      onClick={() => copyMessage(message.content, index)}
                      title="Copy response"
                    >
                      {copiedIndex === index ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="chatbot-message assistant chatbot-typing" role="status">
                <span /><span /><span />
                <span className="sr-only">AI advisor is analyzing your request...</span>
              </div>
            )}

            {error && (
              <div className="chatbot-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>

          <form className="chatbot-composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              id="chatbot-message"
              name="message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about recommendations, habits, or emission goals..."
              aria-label="Message"
              maxLength={4000}
              rows={1}
              disabled={isSending}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isSending}
            >
              <Send size={17} />
            </button>
            <span className="chatbot-disclaimer">
              CarbonTrack AI is grounded in your verified logs. Check key targets and goals.
            </span>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatbot-launcher"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close AI advisor' : 'Open AI advisor'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={23} /> : <Sparkles size={23} />}
      </button>
    </div>
  );
}
