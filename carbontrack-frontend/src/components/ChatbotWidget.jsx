import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import api from '../api/client';

const suggestedPrompts = [
  'How can I reduce my carbon footprint?',
  'Explain renewable energy in simple terms',
  'Suggest some sustainable habits'
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const conversationEndRef = useRef(null);
  const inputRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: 'user', content }];
    const requestMessages = nextMessages.slice(-20);
    const requestId = ++requestIdRef.current;
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const response = await api.assistant.chat(requestMessages);
      if (requestId === requestIdRef.current) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: response.message }
        ]);
      }
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setError(requestError.message || 'Unable to reach the AI assistant.');
      }
    } finally {
      if (requestId === requestIdRef.current) setIsSending(false);
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
    setIsSending(false);
    inputRef.current?.focus();
  }

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <section className="chatbot-panel" aria-label="AI assistant">
          <header className="chatbot-header">
            <div className="chatbot-heading">
              <span className="chatbot-avatar"><Sparkles size={18} /></span>
              <div>
                <h2>AI assistant</h2>
                <p>Ask me anything</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button type="button" className="chatbot-new-chat" onClick={startNewChat}>
                New chat
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

          <div className="chatbot-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chatbot-welcome">
                <span className="chatbot-welcome-icon"><Bot size={25} /></span>
                <h3>Hi! How can I help?</h3>
                <p>Ask a question to get started.</p>
                <div className="chatbot-suggestions">
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
                  {message.content}
                </div>
              ))
            )}
            {isSending && (
              <div className="chatbot-message assistant chatbot-typing" role="status">
                <span /><span /><span />
                <span className="sr-only">AI assistant is responding</span>
              </div>
            )}
            {error && <p className="chatbot-error" role="alert">{error}</p>}
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
              placeholder="Message..."
              aria-label="Message"
              maxLength={4000}
              rows={1}
              disabled={isSending}
            />
            <button type="submit" aria-label="Send message" disabled={!input.trim() || isSending}>
              <Send size={17} />
            </button>
            <span className="chatbot-disclaimer">AI can make mistakes. Check important information.</span>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatbot-launcher"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={23} /> : <Sparkles size={23} />}
      </button>
    </div>
  );
}
