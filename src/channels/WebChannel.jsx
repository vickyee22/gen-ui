/**
 * WebChannel - NovaTel web portal interface
 * Desktop/tablet view
 */

import { motion } from 'framer-motion';
import { Search, User, ShoppingCart } from 'lucide-react';

export function WebChannel({ children, query, onQueryChange, onSubmit, onSuggestionClick, suggestions, brandName = 'FutureTel', brandIcon: BrandIcon, heroTitle = 'How can we help you today?', heroSub = 'Ask anything about our plans, bills, or services', heroPlaceholder = 'Ask anything...', navItems = [] }) {
    return (
        <div className="web-channel">
            {/* Header */}
            <header className="web-header">
                <div className="header-top">
                    <div className="logo">
                        {BrandIcon && <BrandIcon size={22} style={{ color: 'var(--brand)', flexShrink: 0 }} />}
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
                    <h1>{heroTitle}</h1>
                    <p>{heroSub}</p>

                    <form className="genui-input" onSubmit={onSubmit}>
                        <input
                            type="text"
                            placeholder={heroPlaceholder}
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                        />
                        <button type="submit">Ask</button>
                    </form>

                    {suggestions && (
                        <div className="suggestions">
                            {suggestions.map((s, i) => {
                                const text = typeof s === 'string' ? s : s.text;
                                const multi = typeof s === 'object' && s.multi;
                                return (
                                    <button
                                        key={i}
                                        className={`suggestion-chip${multi ? ' multi-intent' : ''}`}
                                        onClick={() => onSuggestionClick ? onSuggestionClick(s) : onQueryChange(text)}
                                    >
                                        {multi && <span className="chip-multi-badge">⚡ multi</span>}
                                        {text}
                                    </button>
                                );
                            })}
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
