import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/auth';
import { Send, Zap, Pill, FileText, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/AIChat.css';

const QUICK_ACTIONS = [
  { icon: <Pill size={14} />, label: 'Medication Info', prompt: 'Tell me about common medication interactions.' },
  { icon: <FileText size={14} />, label: 'Analyze Reports', prompt: 'Can you analyze my latest medical report summary?' },
  { icon: <Activity size={14} />, label: 'Health Tips', prompt: 'Give me 3 general daily health tips.' },
  { icon: <Zap size={14} />, label: 'Emergency Info', prompt: 'What information is shown on my emergency QR code?' },
];

function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await aiService.getChatHistory();
      if (response.data && response.data.length > 0) {
        setMessages(response.data);
      } else {
        setMessages([{
          sender: 'ai',
          text: 'Hello! I\'m your AI health assistant. I can help analyze your reports, suggest medications, or answer health questions. How can I help you today?',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error("Failed to load chat history", error);
    }
  };

  const handleSend = async (manualInput = null) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim()) return;

    const userMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat(textToSend);
      const aiMessage = {
        sender: 'ai',
        text: response.data.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        sender: 'ai',
        text: 'Sorry, I encountered an error connecting to the server. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-chat-container">
      {/* Header handled by parent modal usually, but we keep structure clean */}

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${msg.sender}`}
            >
              <div className="message-content">
                <strong>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</strong>
                <p>{msg.text}</p>
              </div>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="message ai loading-indicator"
          >
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length < 3 && !loading && (
        <div className="quick-actions">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              className="chip"
              onClick={() => handleSend(action.prompt)}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input local-glass">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about health..."
          rows="1"
        />
        <button
          onClick={() => handleSend()}
          className="send-btn"
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default AIChat;