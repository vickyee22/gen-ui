/**
 * WebChannel - NovaTel web portal interface
 * Desktop/tablet view
 */

import { motion } from 'framer-motion';
import { Search, User, ShoppingCart } from 'lucide-react';

export function WebChannel({ children, query, onQueryChange, onSubmit, suggestions, brandName = 'FutureTel', navItems = [] }) {
    return (
        <div className="web-channel">
            {/* Header */}
            <header className="web-header">
                <div className="header-top">
                    <div className="logo">
                        <span className="logo-text">{brandName}</span>
                    </div>

                    <nav className="nav-main">
                        {navItems.map(({ icon: Icon, label }) => (
                            <a key={label} href="#" className="nav-item"><Icon size={16} /> {label}</a>
                        ))}
                    </nav>

                    <div className="header-actions">
                        <button className="icon-btn"><Search size={20} /></button>
                        <button className="icon-btn"><User size={20} /></button>
                        <button className="icon-btn cart-btn">
                            <ShoppingCart size={20} />
                            <span className="cart-badge">2</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section with GenUI Input */}
            <section className="web-hero">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1>How can we help you today?</h1>
                    <p>Ask anything about our plans, bills, or services</p>

                    <form className="genui-input" onSubmit={onSubmit}>
                        <input
                            type="text"
                            placeholder="e.g., Compare 5G plans with roaming..."
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                        />
                        <button type="submit">Ask</button>
                    </form>

                    {suggestions && (
                        <div className="suggestions">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    className="suggestion-chip"
                                    onClick={() => onQueryChange(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            </section>

            {/* Main Content Area */}
            <main className="web-main">
                <div className="content-container">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="web-footer">
                <div className="footer-content">
                    <span>© 2026 {brandName}. All rights reserved.</span>
                    <span className="footer-demo">GenUI Demo - CAIS 2026</span>
                </div>
            </footer>
        </div>
    );
}

export default WebChannel;
