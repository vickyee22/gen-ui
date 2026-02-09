/**
 * MobileChannel - My Singtel app simulator
 * Mobile viewport with bottom navigation
 */

import { motion } from 'framer-motion';
import { Home, CreditCard, Gift, User, Send, Mic } from 'lucide-react';

export function MobileChannel({ children, query, onQueryChange, onSubmit, suggestions }) {
    return (
        <div className="mobile-channel">
            {/* Status Bar */}
            <div className="status-bar">
                <span className="time">9:41</span>
                <div className="status-icons">
                    <span className="signal">●●●●○</span>
                    <span className="wifi">📶</span>
                    <span className="battery">🔋 100%</span>
                </div>
            </div>

            {/* App Header */}
            <header className="mobile-header">
                <div className="header-greeting">
                    <span className="greeting-text">Good evening,</span>
                    <span className="user-name">Vicky</span>
                </div>
                <div className="header-avatar">
                    <User size={24} />
                </div>
            </header>

            {/* Quick Stats */}
            <div className="mobile-stats">
                <div className="stat-card">
                    <span className="stat-value">45.2 GB</span>
                    <span className="stat-label">Data left</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">$98.90</span>
                    <span className="stat-label">Due Feb 28</span>
                </div>
            </div>

            {/* GenUI Input */}
            <div className="mobile-input-container">
                <form className="mobile-genui-input" onSubmit={onSubmit}>
                    <input
                        type="text"
                        placeholder="Ask me anything..."
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                    />
                    <button type="button" className="mic-btn">
                        <Mic size={20} />
                    </button>
                    <button type="submit" className="send-btn">
                        <Send size={20} />
                    </button>
                </form>

                {suggestions && (
                    <div className="mobile-suggestions">
                        {suggestions.slice(0, 2).map((s, i) => (
                            <motion.button
                                key={i}
                                className="mobile-chip"
                                onClick={() => onQueryChange(s)}
                                whileTap={{ scale: 0.95 }}
                            >
                                {s}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <main className="mobile-main">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="mobile-nav">
                <button className="nav-item active">
                    <Home size={24} />
                    <span>Home</span>
                </button>
                <button className="nav-item">
                    <CreditCard size={24} />
                    <span>Bills</span>
                </button>
                <button className="nav-item">
                    <Gift size={24} />
                    <span>Rewards</span>
                </button>
                <button className="nav-item">
                    <User size={24} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
}

export default MobileChannel;
