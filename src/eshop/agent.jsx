/**
 * EShop Buyflow — agent layer shared by every journey.
 *
 * The demo agent is scripted: each screen passes a script of
 * { match: RegExp, run: () => reply } entries to <ChatComposer />. A reply is a
 * string, or { message, confirm } where confirm renders a <ConfirmTradeOff />
 * inside the thread before anything is applied. Unmatched requests get FALLBACK.
 *
 * Slot changes go through ctx.applyChange (see EShopApp) so they land in the
 * change log with a working Undo.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ArrowUp, Undo2, ArrowRight } from 'lucide-react';
import { Spark } from './ui';
import { money } from './data';

export const FALLBACK = "I can't change that here — here's the standard page.";

/* ---------- Component labels (architecture view) ---------- */

export const LabelsContext = createContext(false);
export const useLabels = () => useContext(LabelsContext);

/** Mono chip naming the governed component, e.g. <PlanFitCompare intent="local" />. */
export function CLabel({ name }) {
  const on = useLabels();
  if (!on) return null;
  return <code className="es-clabel">&lt;{name} /&gt;</code>;
}

/** Wraps a generated component so its manifest name shows when labels are on. */
export function Gen({ name, children }) {
  const on = useLabels();
  if (!on) return children;
  return (
    <div className="es-gen">
      <CLabel name={name} />
      {children}
    </div>
  );
}

/* ---------- Re-composed component ---------- */

/**
 * Re-renders only its own slot. When `version` changes it shows a ~400ms
 * skeleton, then the new content tinted with a "Changed · Undo" pill.
 */
export function Recomposed({ version, changed, onUndo, name, minHeight = 120, children }) {
  const [busy, setBusy] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    setBusy(true);
    const t = setTimeout(() => setBusy(false), 400);
    return () => clearTimeout(t);
  }, [version]);

  return (
    <div className={`es-recomposed${changed && !busy ? ' is-changed' : ''}`}>
      {(name || (changed && !busy)) && (
        <div className="es-recomposed-head">
          {name && <CLabel name={name} />}
          {changed && !busy && (
            <button type="button" className="es-changed-pill" onClick={onUndo}>
              Changed · <Undo2 size={13} aria-hidden="true" /> Undo
            </button>
          )}
        </div>
      )}
      {busy ? <div className="es-skel" style={{ height: minHeight }} aria-label="Updating" /> : children}
    </div>
  );
}

/* ---------- Confirm before a costly change ---------- */

export function ConfirmTradeOff({
  title = 'Before I change this',
  before,
  after,
  note,
  confirmLabel = 'Remove anyway',
  cancelLabel = 'Keep it',
  onConfirm,
  onCancel,
  resolved
}) {
  const delta = (k) => (after[k] !== undefined && before[k] !== undefined ? after[k] - before[k] : 0);
  return (
    <div className="es-confirm" role="group" aria-label={title}>
      <CLabel name="ConfirmTradeOff" />
      <strong>{title}</strong>
      <div className="es-confirm-grid">
        {['today', 'monthly'].filter((k) => before[k] !== undefined).map((k) => (
          <div key={k} className="es-confirm-cell">
            <span className="es-muted">{k === 'today' ? 'Pay today' : 'Monthly'}</span>
            <span className="es-confirm-move">
              {money(before[k])} <ArrowRight size={14} aria-hidden="true" /> <strong>{money(after[k])}</strong>
            </span>
            {delta(k) !== 0 && (
              <span className={delta(k) > 0 ? 'es-neg' : 'es-ok-text'}>
                {delta(k) > 0 ? '+' : '−'}{money(Math.abs(delta(k)))}
              </span>
            )}
          </div>
        ))}
      </div>
      {note && <p className="es-confirm-note">{note}</p>}
      {resolved ? (
        <p className="es-muted">{resolved}</p>
      ) : (
        <div className="es-row">
          <button type="button" className="es-btn" onClick={onConfirm}>{confirmLabel}</button>
          <button type="button" className="es-btn is-ghost" onClick={onCancel}>{cancelLabel}</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Chat composer (pinned) ---------- */

export function matchScript(text, script = []) {
  return script.find((s) => s.match.test(text));
}

/**
 * Pinned "Ask for a change…" box with its own small thread.
 * `script`: [{ match, run }] where run() returns a reply (see file header).
 * `suggestions`: demo phrases shown as chips.
 */
export function ChatComposer({ script = [], suggestions = [], placeholder = 'Ask for a change…', onFallback, onAsk }) {
  const [text, setText] = useState('');
  const [thread, setThread] = useState([]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [thread, typing]);

  const send = (value) => {
    const v = (value ?? text).trim();
    if (!v || typing) return;
    setText('');
    setThread((t) => [...t, { who: 'user', text: v }]);
    setTyping(true);
    const post = (reply) => {
      const msg = typeof reply === 'string' ? { message: reply } : reply || { message: FALLBACK, fallback: true };
      setTyping(false);
      setThread((t) => [...t, { who: 'agent', ...msg, id: Date.now() }]);
    };
    // onAsk (LLM-backed) takes precedence over the scripted matcher.
    if (onAsk) {
      Promise.resolve(onAsk(v)).then(post, () => post({ message: FALLBACK, fallback: true }));
      return;
    }
    timer.current = setTimeout(() => {
      const hit = matchScript(v, script);
      post(hit ? hit.run(v) : { message: FALLBACK, fallback: true });
    }, 450);
  };

  const resolve = (id, label) =>
    setThread((t) => t.map((m) => (m.id === id ? { ...m, resolved: label } : m)));

  const used = new Set(thread.filter((m) => m.who === 'user').map((m) => m.text));
  const chips = suggestions.filter((s) => !used.has(s));

  return (
    <div className="es-chat">
      <CLabel name="ChatComposer" />
      {(thread.length > 0 || typing) && (
        <div className="es-chat-thread" aria-live="polite">
          {thread.map((m, i) =>
            m.who === 'user' ? (
              <div key={i} className="es-user"><p>{m.text}</p></div>
            ) : (
              <div key={i} className="es-stack" style={{ gap: 10 }}>
                <div className="es-agent">
                  <span className="es-agent-mark"><Spark /></span>
                  <p>{m.message}</p>
                </div>
                {m.fallback && (
                  <button type="button" className="es-link-btn" onClick={onFallback}>
                    Open the standard page <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
                {m.confirm && (
                  <ConfirmTradeOff
                    {...m.confirm}
                    resolved={m.resolved}
                    onConfirm={() => {
                      m.confirm.onConfirm?.();
                      resolve(m.id, m.confirm.confirmedText || 'Done — updated above.');
                    }}
                    onCancel={() => {
                      m.confirm.onCancel?.();
                      resolve(m.id, m.confirm.cancelledText || 'Kept as it was.');
                    }}
                  />
                )}
              </div>
            )
          )}
          {typing && (
            <div className="es-agent">
              <span className="es-agent-mark"><Spark /></span>
              <span className="es-dots"><span /><span /><span /></span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}
      {chips.length > 0 && (
        <div className="es-row" style={{ gap: 8 }}>
          {chips.map((s) => (
            <button key={s} type="button" className="es-chip-btn" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}
      <form
        className="es-ask"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Spark size={16} color="#3A3FD9" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label="Ask for a change"
        />
        <button type="submit" className="es-ask-send" disabled={!text.trim() || typing} aria-label="Send">
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}

/* ---------- Change log ---------- */

export function ChangeLog({ changes, onUndo }) {
  return (
    <div className="es-card">
      <CLabel name="ChangeLog" />
      <div className="es-card-head"><h2 className="es-h2">What you changed</h2></div>
      {changes.length === 0 ? (
        <p className="es-muted">No changes — this is the bundle as first suggested.</p>
      ) : (
        <ul className="es-changelog">
          {changes.map((c) => (
            <li key={c.id}>
              <span className="es-changelog-slot">{c.label || c.slot}</span>
              <span className="es-changelog-move">
                <span className="es-muted">{c.from}</span>
                <ArrowRight size={14} aria-hidden="true" />
                <strong>{c.to}</strong>
              </span>
              <button type="button" className="es-link-btn" onClick={() => onUndo(c.id)}>
                <Undo2 size={14} aria-hidden="true" /> Undo
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Slot diff (Changing vs Kept) ---------- */

export function SlotDiff({ changing = [], kept = [] }) {
  return (
    <div className="es-slotdiff">
      <CLabel name="SlotDiff" />
      <div className="es-row" style={{ gap: 8 }}>
        <span className="es-note">Changing</span>
        {changing.map((c) => <span key={c} className="es-pill is-brand-soft">{c}</span>)}
      </div>
      <div className="es-row" style={{ gap: 8 }}>
        <span className="es-note">Kept</span>
        {kept.map((c) => <span key={c} className="es-pill is-grey">{c}</span>)}
      </div>
    </div>
  );
}
