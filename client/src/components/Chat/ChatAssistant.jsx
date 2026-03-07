import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiMinimize2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import ChatMessage from './ChatMessage';
import api from '../../services/api';

export default function ChatAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Setup WebSocket
  useEffect(() => {
    if (!user || !isOpen) return;

    const token = localStorage.getItem('accessToken');
    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.on('chat:response', (data) => {
      setIsTyping(false);
      setSessionId(data.sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        products: data.products,
      }]);
    });

    socket.on('chat:typing', () => setIsTyping(true));
    socket.on('chat:error', () => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    });

    return () => { socket.disconnect(); };
  }, [user, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:message', { message: userMessage, sessionId });
      setIsTyping(true);
    } else {
      // REST fallback
      setIsTyping(true);
      try {
        const { data } = await api.post('/chat/message', { message: userMessage, sessionId });
        setSessionId(data.data.sessionId);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.message,
          products: data.data.products,
        }]);
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I need you to sign in first to chat!' }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-10 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-brand-700 transition-colors"
          >
            <FiMessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-10 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold">ShopAI Fashion Assistant</h3>
                <p className="text-xs text-brand-100">AI-powered style recommendations</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded transition-colors">
                  <FiMinimize2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded transition-colors">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <FiMessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Hi! I'm your AI fashion assistant.</p>
                  <p className="text-xs mt-1">Ask me for outfit suggestions, style tips, or product recommendations!</p>
                  <div className="mt-4 space-y-2">
                    {['Suggest a casual outfit under ₹5000', 'What to wear for a wedding?', 'Best running shoes on Amazon'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="block w-full text-left text-xs bg-gray-50 hover:bg-brand-50 text-gray-600 hover:text-brand-600 px-3 py-2 rounded-lg transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}

              {isTyping && (
                <div className="flex gap-1 px-4 py-3 bg-gray-100 rounded-2xl w-fit">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 px-4 py-3 shrink-0">
              {!user ? (
                <p className="text-center text-sm text-gray-500">
                  <a href="/login" className="text-brand-600 hover:underline">Sign in</a> to chat with the AI assistant
                </p>
              ) : (
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about fashion..."
                    rows={1}
                    className="flex-1 input-field resize-none text-sm py-2.5"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping}
                    className="btn-primary px-3"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
