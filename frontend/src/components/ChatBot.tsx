import { useState, useRef, useEffect } from 'react';
import { apiClient, type ChatMessage } from '../api/client';

interface ChatBotProps {
  activeImageId: string | null;
}

export const ChatBot = ({ activeImageId }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am SatQuery AI, your satellite imagery & remote-sensing assistant. How can I help you analyze your Earth-observation data today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: query };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Send message history excluding the initial greeting
      const apiHistory = newHistory.slice(1);
      const res = await apiClient.sendChatMessage(query, apiHistory, activeImageId);
      setMessages([...newHistory, { role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setMessages([
        ...newHistory,
        { role: 'assistant', content: `Sorry, an error occurred: ${e.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="chat-toggle">
        <button
          className="chat-toggle__btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="chat-drawer"
        >
          <span>💬</span>
          <span>{isOpen ? 'Close Copilot' : 'SatQuery Copilot'}</span>
        </button>
      </div>

      {/* Chat Drawer */}
      {isOpen && (
        <div id="chat-drawer" className="chat-drawer" role="region" aria-label="SatQuery AI Assistant">
          {/* Header */}
          <div className="chat-drawer__header">
            <div>
              <div className="chat-drawer__title">
                🛰️ SatQuery Copilot
              </div>
              <div className="chat-drawer__subtitle">
                Ollama Llama-3 Remote Sensing Agent
              </div>
            </div>
            {activeImageId && (
              <span className="badge badge--success">
                Linked: {activeImageId}
              </span>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="chat-suggestions">
            {['Explain SAR backscatter', 'Sentinel-2 bands', 'Change detection logic'].map((q) => (
              <button
                key={q}
                className="chat-suggestion-btn"
                onClick={() => handleSend(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`chat-bubble ${
                  m.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--assistant'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble--loading">
                SatQuery is reasoning…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="chat-footer">
            <input
              type="text"
              className="input chat-input"
              placeholder="Ask anything about satellite data…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={loading}
              aria-label="Message SatQuery Copilot"
            />
            <button
              className="btn btn--primary btn--sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};
