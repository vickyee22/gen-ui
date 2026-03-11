/**
 * ChatChannel - Chat widget integration
 * Conversational interface with embedded GenUI components
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, X, Minus, Sparkles } from 'lucide-react';

export function ChatChannel({ children, query, onQueryChange, onSubmit, onSuggestionClick, suggestions, isProcessing, brandName = 'FutureTel' }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: `Hi! I'm your ${brandName} assistant. How can I help you today?`,
            timestamp: new Date()
        }
    ]);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, children]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Add user message
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: query,
            timestamp: new Date()
        }]);

        // Trigger parent submit
        onSubmit(e);
    };

    // Add/replace GenUI response when children changes
    useEffect(() => {
        if (children && !isProcessing) {
            setMessages(prev => {
                const withoutGenUI = prev.filter(m => m.type !== 'genui');
                return [...withoutGenUI, {
                    id: Date.now(),
                    type: 'genui',
                    timestamp: new Date()
                }];
            });
        }
    }, [children, isProcessing]);

    if (isMinimized) {
        return (
            <motion.div
                className="chat-minimized"
                onClick={() => setIsMinimized(false)}
                whileHover={{ scale: 1.05 }}
            >
                <Bot size={28} />
                <span className="chat-badge">1</span>
            </motion.div>
        );
    }

    return (
        <div className="chat-channel">
            {/* Chat Header */}
            <header className="chat-header">
                <div className="chat-avatar">
                    <Bot size={24} />
                </div>
                <div className="chat-info">
                    <span className="chat-name">{brandName} Assistant</span>
                    <span className="chat-status">
                        <span className="status-dot"></span>
                        Online
                    </span>
                </div>
                <div className="chat-actions">
                    <button onClick={() => setIsMinimized(true)}><Minus size={18} /></button>
                    <button><X size={18} /></button>
                </div>
            </header>

            {/* Messages */}
            <div className="chat-messages">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            className={`message ${msg.type}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {msg.type === 'bot' && (
                                <div className="message-avatar">
                                    <Bot size={16} />
                                </div>
                            )}

                            {msg.type === 'user' && (
                                <div className="message-avatar user">
                                    <User size={16} />
                                </div>
                            )}

                            {msg.type === 'genui' ? (
                                <div className="message-genui">
                                    {children}
                                </div>
                            ) : (
                                <div className="message-bubble">
                                    {msg.content}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isProcessing && (
                    <motion.div
                        className="message bot typing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="message-avatar">
                            <Bot size={16} />
                        </div>
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions && messages.length <= 2 && (
                <div className="chat-suggestions">
                    {suggestions.slice(0, 3).map((s, i) => {
                        const text = typeof s === 'string' ? s : s.text;
                        return (
                            <button
                                key={i}
                                className="chat-chip"
                                onClick={() => onSuggestionClick ? onSuggestionClick(s) : onQueryChange(text)}
                            >
                                <Sparkles size={12} />
                                {text}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Input */}
            <form className="chat-input" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
                <button type="submit" disabled={!query.trim() || isProcessing}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}

export default ChatChannel;
