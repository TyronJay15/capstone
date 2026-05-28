import React, { useEffect, useRef, useState } from 'react';
import { getSession } from '../../services/auth';
import { getChatbotWelcome, getChatbotReply } from '../../services/chatbotEngine';
import { CHATBOT_QUICK_PROMPTS } from '../../data/chatbotKnowledge';
import './ChatbotWidget.css';

const ChatbotPanel = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', text: getChatbotWelcome() }]);
  const listRef = useRef(null);
  const { role } = getSession();

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    const reply = getChatbotReply(trimmed, { role });
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
    }, 120);
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={`chatbot-root ${open ? 'is-open' : ''}`}>
      {open ? (
        <div className="chatbot-panel" role="dialog" aria-label="Portal assistant">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-title">Portal Assistant</div>
              <div className="chatbot-subtitle">Enrollment & navigation help</div>
            </div>
            <button type="button" className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((msg, idx) => (
              <div key={`${idx}-${msg.text.slice(0, 12)}`} className={`chatbot-bubble chatbot-bubble-${msg.role}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chatbot-quick">
            {CHATBOT_QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="chatbot-quick-btn" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              aria-label="Chat message"
            />
            <button type="submit" className="chatbot-send">
              Send
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="chatbot-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
};

export default ChatbotPanel;
