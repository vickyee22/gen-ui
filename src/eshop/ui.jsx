/**
 * EShop Buyflow — governed component primitives.
 */

import React, { useState } from 'react';
import { Check, AlertCircle, ArrowUp, Search, ShoppingBag } from 'lucide-react';
import { BRAND, CUSTOMER } from './data';

export function Spark({ size = 16, color = '#FFFFFF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
    </svg>
  );
}

export function Tick({ size = 18, color = '#3A3FD9' }) {
  return <Check size={size} color={color} strokeWidth={2.4} aria-hidden="true" />;
}

export function PhoneArt({ hex = '#5B1E2A', width = 96, detailed = true }) {
  const height = Math.round((width * 72) / 48);
  return (
    <svg width={width} height={height} viewBox="0 0 48 72" aria-hidden="true" style={{ flex: 'none' }}>
      <rect x="2" y="2" width="44" height="68" rx="9" fill={hex} stroke="#00000014" />
      {detailed && (
        <>
          <rect x="7" y="7" width="20" height="20" rx="5" fill="#000000" fillOpacity="0.22" />
          <circle cx="13" cy="13" r="3.4" fill="#1A1A1A" />
          <circle cx="21" cy="13" r="3.4" fill="#1A1A1A" />
          <circle cx="13" cy="21" r="3.4" fill="#1A1A1A" />
        </>
      )}
    </svg>
  );
}

export function Header({ onHome }) {
  return (
    <header className="es-header">
      <div className="es-wrap es-header-inner">
        <div className="es-header-left">
          <button type="button" className="es-logo" onClick={onHome} aria-label={`${BRAND} home`}>
            <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true">
              <circle cx="10" cy="6" r="2" fill="#E4002B" />
              <circle cx="16" cy="3" r="2.3" fill="#E4002B" />
              <circle cx="23" cy="2.5" r="2.6" fill="#E4002B" />
              <circle cx="30" cy="5" r="3" fill="#E4002B" />
            </svg>
            <span className="es-logo-word">{BRAND}</span>
          </button>
          <nav className="es-nav" aria-label="Main">
            {['Mobile', 'Broadband', 'Entertainment', 'Rewards', 'My Account'].map((l) => (
              <a key={l} href="#eshop" onClick={(e) => e.preventDefault()}>{l}</a>
            ))}
          </nav>
        </div>
        <div className="es-header-right">
          <button type="button" className="es-icon-btn" aria-label="Search"><Search size={18} /></button>
          <button type="button" className="es-icon-btn" aria-label="Cart"><ShoppingBag size={18} /></button>
          <span className="es-header-greeting">Hi, {CUSTOMER.firstName}</span>
          <span className="es-avatar" aria-hidden="true">WL</span>
        </div>
      </div>
    </header>
  );
}

export function Progress({ steps, current }) {
  if (!steps) return null;
  return (
    <div className="es-wrap">
      <ol className="es-progress" aria-label="Progress">
        {steps.map((s, i) => (
          <li
            key={s}
            className={i < current ? 'is-done' : i === current ? 'is-current' : ''}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="es-progress-dot" />
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Standard two-column page: content column + sticky summary aside. */
export function Page({ children, aside, hero }) {
  return (
    <main className={`es-wrap es-main${hero ? ' is-hero' : ''}`}>
      <section className="es-col">{children}</section>
      {aside && <aside className="es-side">{aside}</aside>}
    </main>
  );
}

export function UserSays({ children }) {
  return (
    <div className="es-user">
      <p>{children}</p>
    </div>
  );
}

export function AgentSays({ children }) {
  return (
    <div className="es-agent">
      <span className="es-agent-mark"><Spark /></span>
      <p>{children}</p>
    </div>
  );
}

export function Card({ title, right, soft, accent, className = '', children }) {
  const cls = ['es-card', soft && 'is-soft', accent && 'is-accent', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {(title || right) && (
        <div className="es-card-head">
          {title && <h2 className="es-h2">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Option({ selected, onClick, compact, row, disabled, className = '', children, label }) {
  const cls = [
    'es-option',
    compact && 'is-compact',
    row && 'is-row',
    selected && 'is-selected',
    className
  ].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} aria-pressed={selected} aria-label={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Switch({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`es-switch${on ? ' is-on' : ''}`}
      onClick={onToggle}
    >
      <span />
    </button>
  );
}

export function Btn({ onClick, ghost, block, disabled, children, type = 'button' }) {
  const cls = ['es-btn', ghost && 'is-ghost', block && 'is-block'].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Row({ label, value, neg, total, sub }) {
  const cls = ['es-ledger-row', total && 'is-total', sub && 'is-sub'].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <span>{label}</span>
      <span className={neg ? 'es-neg' : undefined}>{value}</span>
    </div>
  );
}

export function Aside({ title, soft, children }) {
  return (
    <div className={`es-aside${soft ? ' is-soft' : ''}`}>
      {title && <h2 className="es-h3">{title}</h2>}
      {children}
    </div>
  );
}

export function AsideProduct({ hex, title, sub }) {
  return (
    <div className="es-aside-product">
      {hex && <PhoneArt hex={hex} width={34} detailed={false} />}
      <div>
        <strong>{title}</strong>
        <span className="es-muted">{sub}</span>
      </div>
    </div>
  );
}

export function SumRow({ label, value, size }) {
  return (
    <div className={`es-sum-row${size ? ` is-${size}` : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Features({ items }) {
  return (
    <ul className="es-features">
      {items.map((it, i) => (
        <li key={i}>
          {it.warn ? <AlertCircle size={18} color="#B4530A" aria-hidden="true" /> : <Tick />}
          <span>{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function Agree({ checked, onChange, children }) {
  return (
    <label className="es-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

/** Inline composer for follow-up requests mid-journey. */
export function Ask({ placeholder, suggestions = [], onAsk }) {
  const [text, setText] = useState('');
  const submit = (value) => {
    const v = (value ?? text).trim();
    if (!v) return;
    setText('');
    onAsk(v);
  };
  return (
    <div className="es-stack">
      <form
        className="es-ask"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Spark size={16} color="#3A3FD9" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label="Ask about your order"
        />
        <button type="submit" className="es-ask-send" disabled={!text.trim()} aria-label="Send">
          <ArrowUp size={18} />
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="es-row">
          {suggestions.map((s) => (
            <button key={s} type="button" className="es-chip-btn" onClick={() => submit(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Composing({ label }) {
  return (
    <div className="es-wrap es-composing" role="status" aria-live="polite">
      <div className="es-composing-label">
        <span className="es-agent-mark"><Spark /></span>
        <span>{label}</span>
        <span className="es-dots"><span /><span /><span /></span>
      </div>
      <div className="es-skel" style={{ height: 180 }} />
      <div className="es-grid-2">
        <div className="es-skel" style={{ height: 220 }} />
        <div className="es-skel" style={{ height: 220 }} />
      </div>
      <div className="es-skel" style={{ height: 120 }} />
    </div>
  );
}
