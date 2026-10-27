/**
 * Dynamic buyflow — the shell. Every screen here is composed at runtime:
 *
 *   request ──planJourney──▶ goals + slots + ordered steps
 *   step    ──composeStep──▶ patches [{ slot, component, variant, props }]
 *   chat    ──interpretChange──▶ ops ──rules engine──▶ confirm? ──▶ apply + log
 *
 * Patches are rendered from the component registry, grouped by slot. A chat
 * change only re-composes the slots it touches; everything else stays mounted.
 */

import React, { useCallback, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Mic, Cpu } from 'lucide-react';
import { CUSTOMER, SCENARIOS, money } from '../data';
import {
  Page, UserSays, AgentSays, Btn, Aside, AsideProduct, SumRow, Row, Progress, Composing
} from '../ui';
import { ChatComposer, Recomposed, ChangeLog, SlotDiff, CLabel, useLabels, FALLBACK } from '../agent';
import { ConfirmedHead, orderNo } from '../MainFlow';
import { REGISTRY } from './components';
import { BASE_ORDER, price, applyOps, impact, describe, slotOfKey, summarize, colorInfo, SHOPS } from './model';
import { planJourney, composeStep, interpretChange, reconcile, finalizePatches } from './orchestrator';
import { llmStatus } from './llm';

const SLOT_LABEL = {
  device: 'Phone', plan: 'Plan', number: 'Number', sim: 'SIM', addons: 'Add-ons', tradein: 'Trade-in', lines: 'Lines',
  fulfilment: 'Get it', identity: 'Identity', billing: 'Billing', payment: 'Payment'
};
const MIN_COMPOSE_MS = 500;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const labelOf = (p) => {
  const bits = [p.component];
  if (p.variant) bits.push(`variant="${p.variant}"`);
  for (const [k, v] of Object.entries(p.props || {})) bits.push(`${k}=${Array.isArray(v) ? `{${v.length}}` : `"${v}"`}`);
  return bits.join(' ');
};

export function DynamicFlow({ draft, onHome }) {
  const labels = useLabels();
  const [phase, setPhase] = useState('intent'); // intent | busy | step | review | done
  const [busyLabel, setBusyLabel] = useState('');
  const [text, setText] = useState(draft || SCENARIOS[0].draft);
  const [prompt, setPrompt] = useState('');
  const [plan, setPlan] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [screens, setScreens] = useState({}); // stepId → { message, patches, source, ms, raw }
  const [order, setOrderState] = useState(BASE_ORDER);
  const [changes, setChanges] = useState([]);
  const [versions, setVersions] = useState({});
  const [diff, setDiff] = useState(null);
  const [paid, setPaid] = useState(null);
  const orderRef = useRef(order);
  const prefetch = useRef({}); // stepId → Promise<composition>, started while the previous step is open
  const screensRef = useRef(screens);
  screensRef.current = screens;

  const setOrder = (o) => {
    orderRef.current = o;
    setOrderState(o);
  };
  const bump = (slots) => setVersions((v) => {
    const next = { ...v };
    for (const s of slots) next[s] = (next[s] || 0) + 1;
    return next;
  });

  const step = plan?.steps[stepIdx];

  /** Re-checks the current screen against the new order; returns slots that changed. */
  const reconcileScreen = useCallback((o, extraPatches = [], touched = []) => {
    if (!step) return [];
    const cur = screensRef.current[step.id];
    if (!cur) return [];
    let patches = cur.patches;
    // LLM-proposed components for slots it changed replace that slot's components.
    const proposed = finalizePatches(extraPatches, { ...step, slots: step.slots.filter((s) => touched.includes(s)) }, o)
      .filter((p) => extraPatches.some((x) => x.component === p.component));
    if (proposed.length) {
      const slots = new Set(proposed.map((p) => p.slot));
      patches = [...patches.filter((p) => !slots.has(p.slot)), ...proposed];
    }
    const r = reconcile(patches, step, o);
    const next = { ...screensRef.current, [step.id]: { ...cur, patches: r.patches } };
    screensRef.current = next;
    setScreens(next);
    return [...new Set([...r.changedSlots, ...proposed.map((p) => p.slot)])];
  }, [step]);

  /* ---------- customer taps ---------- */

  const act = useCallback((op) => {
    const res = applyOps(orderRef.current, [op]);
    if (!res.applied.length) return { ok: false, reason: res.rejected[0]?.reason };
    setOrder(res.order);
    const changed = reconcileScreen(res.order);
    if (changed.length) bump(changed);
    return { ok: true };
  }, [reconcileScreen]);

  /* ---------- chat changes ---------- */

  const commit = useCallback((before, after, applied, llmPatches) => {
    const bySlot = {};
    for (const op of applied) {
      const slot = slotOfKey(op.key) || op.key;
      (bySlot[slot] ||= []).push(op.key);
    }
    setChanges((list) => {
      let next = [...list];
      for (const [slot, keys] of Object.entries(bySlot)) {
        const prev = Object.fromEntries(keys.map((k) => [k, before[k]]));
        const existing = next.find((c) => c.slot === slot);
        const from = describe(before, keys[0]);
        const to = describe(after, keys[0]);
        if (existing) {
          next = next.map((c) => (c === existing ? { ...c, to, prevOrder: { ...prev, ...c.prevOrder } } : c));
        } else {
          next.push({ id: `${slot}-${Date.now()}`, slot, label: SLOT_LABEL[slot] || slot, from, to, prevOrder: prev });
        }
      }
      return next;
    });
    setOrder(after);
    const touched = Object.keys(bySlot);
    const changed = reconcileScreen(after, llmPatches, touched);
    bump([...new Set([...touched, ...changed])]);
    const kept = Object.keys(SLOT_LABEL).filter((s) => !touched.includes(s) && ['device', 'plan', 'addons', 'fulfilment', 'identity', 'billing'].includes(s));
    setDiff({ changing: touched.map((s) => SLOT_LABEL[s] || s), kept: kept.map((s) => SLOT_LABEL[s]) });
  }, [reconcileScreen]);

  const undo = useCallback((idOrSlot) => {
    const c = changes.find((x) => x.id === idOrSlot || x.slot === idOrSlot);
    if (!c) return;
    const o = { ...orderRef.current, ...c.prevOrder };
    setOrder(o);
    setChanges((list) => list.filter((x) => x !== c));
    const changed = reconcileScreen(o);
    bump([c.slot, ...changed]);
    setDiff(null);
  }, [changes, reconcileScreen]);

  const onAsk = useCallback(async (q) => {
    const before = orderRef.current;
    const r = await interpretChange(q, before, { step, patches: screensRef.current[step?.id]?.patches || [] });
    const tag = labels ? ` (${r.source === 'llm' ? `LLM · ${r.ms}ms` : 'rules'})` : '';
    if (!r.ops.length) {
      if (r.outOfScope || !r.message) return { message: (r.message || FALLBACK) + tag, fallback: true };
      return r.message + tag;
    }
    const res = applyOps(before, r.ops);
    const refused = res.rejected.map((x) => x.reason).join(' ');
    if (!res.applied.length) return `${refused || "I couldn't make that change."}${tag}`;
    const imp = impact(before, res.order);
    const message = [r.message, refused && `Note: ${refused}`].filter(Boolean).join(' ') + tag;
    const apply = () => commit(before, res.order, res.applied, r.patches);
    if (!imp.confirm) {
      apply();
      return message || 'Done — only that part changed.';
    }
    const removesSwop = before.swop && !res.order.swop;
    const d = imp.over24Delta;
    return {
      message,
      confirm: {
        title: removesSwop ? 'Remove the discount?' : 'Before I change this',
        before: imp.before,
        after: imp.after,
        note: `Today goes ${money(imp.before.today)} → ${money(imp.after.today)}.${d ? ` Over 24 months that's ${money(Math.abs(d))} ${d < 0 ? 'less' : 'more'} overall.` : ''}`,
        confirmLabel: removesSwop ? 'Remove anyway' : 'Apply change',
        cancelLabel: 'Keep it',
        onConfirm: apply,
        confirmedText: 'Done — updated above. You can undo it from the change log.',
        cancelledText: 'Kept as it was.'
      }
    };
  }, [step, commit, labels]);

  /* ---------- navigation ---------- */

  const openStep = useCallback(async (idx, p = plan, o = orderRef.current) => {
    const s = p.steps[idx];
    setDiff(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (screensRef.current[s.id]) {
      // Revisit: keep its composition, re-check it against the current order.
      const r = reconcile(screensRef.current[s.id].patches, s, o);
      const next = { ...screensRef.current, [s.id]: { ...screensRef.current[s.id], patches: r.patches } };
      screensRef.current = next;
      setScreens(next);
      setStepIdx(idx);
      setPhase('step');
      return;
    }
    setBusyLabel(s.checkout ? 'Pre-filling from Singpass and your account' : `Composing ${s.title.toLowerCase()}`);
    setPhase('busy');
    // Use the prefetched screen only if the order hasn't changed since; otherwise its copy may be stale.
    const pre = prefetch.current[s.id];
    const pending = pre && pre.key === JSON.stringify(summarize(o)) ? pre.promise : composeStep(s, o, { goals: p.goals, prompt: prompt || p.prompt });
    const [c] = await Promise.all([pending, wait(MIN_COMPOSE_MS)]);
    // A prefetched screen was composed against an earlier order — re-check it.
    const fresh = { ...c, patches: reconcile(c.patches, s, orderRef.current).patches };
    const next = { ...screensRef.current, [s.id]: fresh };
    screensRef.current = next;
    setScreens(next);
    setStepIdx(idx);
    setPhase('step');
    const ahead = p.steps[idx + 1];
    if (ahead && !screensRef.current[ahead.id]) {
      prefetch.current[ahead.id] = {
        key: JSON.stringify(summarize(orderRef.current)),
        promise: composeStep(ahead, orderRef.current, { goals: p.goals, prompt: prompt || p.prompt })
      };
    }
  }, [plan, prompt]);

  const start = async (q) => {
    const v = q.trim();
    if (!v) return;
    setPrompt(v);
    setBusyLabel('Understanding your request');
    setPhase('busy');
    setChanges([]);
    setVersions({});
    prefetch.current = {};
    screensRef.current = {};
    setScreens({});
    const [planned] = await Promise.all([planJourney(v), wait(MIN_COMPOSE_MS)]);
    const p = { ...planned, prompt: v };
    setPlan(p);
    setOrder(p.order);
    await openStepFor(p, p.order);
  };
  // openStep closes over `plan`; on first load pass the fresh plan explicitly.
  const openStepFor = (p, o) => openStep(0, p, o);

  const next = () => {
    if (stepIdx < plan.steps.length - 1) return openStep(stepIdx + 1);
    if (changes.length && phase !== 'review') {
      setPhase('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return undefined;
    }
    return pay();
  };
  const back = () => {
    if (phase === 'review') return setPhase('step');
    if (stepIdx > 0) return openStep(stepIdx - 1);
    return setPhase('intent');
  };
  const pay = async () => {
    setBusyLabel('Placing your order');
    setPhase('busy');
    await wait(700);
    setPaid({ no: orderNo(prompt), amount: price(orderRef.current).payNow });
    setPhase('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------- render ---------- */

  const pr = price(order);
  const titles = plan ? [...plan.steps.map((s) => s.title), ...(changes.length ? ['Review'] : [])] : null;
  const current = phase === 'review' ? plan.steps.length : stepIdx;

  if (phase === 'intent') {
    return <IntentScreen text={text} setText={setText} onSubmit={start} />;
  }
  if (phase === 'busy') {
    return (
      <>
        {titles && <Progress steps={titles} current={current} />}
        <Composing label={busyLabel} />
      </>
    );
  }
  if (phase === 'done') {
    return <DoneScreen order={order} price={pr} paid={paid} onHome={onHome} />;
  }

  const screen = screens[step.id];
  const isLast = stepIdx === plan.steps.length - 1;
  const cta = phase === 'review' || (isLast && !changes.length) ? `Pay ${money(pr.payNow)}` : isLast ? 'Review changes' : 'Continue';

  return (
    <>
      <Progress steps={titles} current={current} />
      <Page aside={<Rail order={order} price={pr} changes={changes} />}>
        {labels && <SourceNote plan={plan} screen={phase === 'review' ? null : screen} />}
        {stepIdx === 0 && phase === 'step' && (
          <>
            <UserSays>{prompt}</UserSays>
            {plan.goals.length > 1 && (
              <Gen name={`IntentSplitter goals={${plan.goals.length}}`}>
                {REGISTRY.IntentSplitter ? <REGISTRY.IntentSplitter props={{ goals: plan.goals }} order={order} price={pr} act={act} /> : null}
              </Gen>
            )}
          </>
        )}
        <AgentSays>{phase === 'review' ? 'Here is everything you changed. Undo any of it, then pay.' : stepIdx === 0 && plan.message ? plan.message : screen.message}</AgentSays>

        {phase === 'review' ? (
          <>
            <ChangeLog changes={changes} onUndo={undo} />
            {renderPatch({ slot: 'payment', component: 'PaySummary', props: {} }, order, pr, act)}
          </>
        ) : (
          groupBySlot(screen.patches).map(([slot, patches]) => (
            <Recomposed
              key={slot}
              version={versions[slot] || 0}
              changed={changes.some((c) => c.slot === slot)}
              onUndo={() => undo(slot)}
              minHeight={160}
            >
              <div className="es-stack" style={{ gap: 16 }}>
                {patches.map((p, i) => (
                  <Gen key={`${p.component}-${i}`} name={labelOf(p)}>{renderPatch(p, order, pr, act)}</Gen>
                ))}
              </div>
            </Recomposed>
          ))
        )}

        {diff && phase === 'step' && <SlotDiff changing={diff.changing} kept={diff.kept} />}

        <div className="es-row" style={{ justifyContent: 'space-between' }}>
          <Btn ghost onClick={back}><ArrowLeft size={18} /> Back</Btn>
          <Btn onClick={next}>{cta} <ArrowRight size={18} /></Btn>
        </div>

        <ChatComposer key={phase === 'review' ? 'review' : step.id} onAsk={onAsk} suggestions={suggestionsFor(step, order, phase)} onFallback={onHome} />
      </Page>
    </>
  );
}

/* ---------- pieces ---------- */

function Gen({ name, children }) {
  const on = useLabels();
  if (!on) return children;
  return (
    <div className="es-gen">
      <CLabel name={name} />
      {children}
    </div>
  );
}

function renderPatch(p, order, pr, act) {
  const C = REGISTRY[p.component];
  if (!C) return null;
  return <C variant={p.variant} props={p.props || {}} order={order} price={pr} act={act} />;
}

function groupBySlot(patches) {
  const map = new Map();
  for (const p of patches) {
    if (!map.has(p.slot)) map.set(p.slot, []);
    map.get(p.slot).push(p);
  }
  return [...map.entries()];
}

/** Demo phrases worth suggesting for what is on screen. */
function suggestionsFor(step, o, phase) {
  if (phase === 'review') return [];
  const s = step.slots;
  const out = [];
  if (s.includes('plan') && o.plan === 'L') out.push('Priority L is too much — I barely travel now.');
  if ((s.includes('addons') || s.includes('number')) && (o.swop || Object.values(o.trials || {}).some(Boolean))) out.push('Drop MobileSwop and the trials.');
  if (step.checkout && o.fulfil === 'collect') out.push("Actually, deliver it — I'm busy tomorrow.");
  if (step.checkout && o.fulfil === 'door') out.push('Actually — can I get it today instead?');
  if (s.includes('device')) out.push('Make it 512GB in graphite.');
  return out.slice(0, 2);
}

function Rail({ order, price: p, changes }) {
  const c = colorInfo(order);
  const shop = SHOPS.find((s) => s.id === order.shop);
  return (
    <Aside title="Your bundle">
      <AsideProduct hex={c.hex} title={p.model.name} sub={`${c.name} · ${order.storage} · ${p.plan.name}`} />
      <div className="es-sum">
        <SumRow label="Get it" value={order.fulfil === 'collect' ? `Collect · ${shop?.short || 'Tampines'}` : describe(order, 'fulfil')} />
        <SumRow label={order.payAt === 'store' ? 'Pay now' : 'Today'} value={money(p.payNow)} size="big" />
        <SumRow label="Monthly" value={money(p.monthly)} size="mid" />
        {p.credit > 0 && <SumRow label="Bill credit" value={money(p.credit)} />}
      </div>
      {p.illustrative && <p className="es-note">Phone price on this plan is illustrative.</p>}
      <div className="es-ledger es-divider-top" style={{ fontSize: 13 }}>
        {p.lines.map((l) => (
          <Row key={l.label} label={l.label} value={l.amount < 0 ? `−${money(-l.amount)}` : l.amount ? money(l.amount) : 'Free'} neg={l.amount < 0} />
        ))}
        {order.tradeIn && <Row label={`Trade-in estimate${order.payout === 'credit' ? ' (covers today)' : ''}`} value={`−${money(p.estimate)}`} neg />}
        <Row label="Payable today" value={money(p.payNow)} total />
      </div>
      {changes.length > 0 && <p className="es-note es-divider-top">{changes.length} change{changes.length > 1 ? 's' : ''} made in chat · undo from the screen or review</p>}
    </Aside>
  );
}

function SourceNote({ plan, screen }) {
  const status = llmStatus();
  const src = screen || plan;
  const live = src?.source === 'llm';
  return (
    <details className="es-source">
      <summary>
        <Cpu size={14} aria-hidden="true" />
        {live ? `Composed by gpt-4o-mini · ${src.ms}ms` : `Composed by rules engine${status.live ? '' : ` · ${status.reason}`}`}
        {' · '}validated against the manifest
      </summary>
      <pre>{JSON.stringify(screen ? { message: screen.message, patches: screen.patches } : { goals: plan.goals, slots: plan.slots, steps: plan.steps }, null, 2)}</pre>
    </details>
  );
}

function IntentScreen({ text, setText, onSubmit }) {
  const labels = useLabels();
  const status = llmStatus();
  const Signals = REGISTRY.ContextSignals;
  return (
    <Page hero aside={labels && Signals ? <Gen name="ContextSignals"><Signals order={BASE_ORDER} price={price(BASE_ORDER)} /></Gen> : null}>
      <div className="es-stack" style={{ gap: 12 }}>
        <p className="es-muted">Welcome back, {CUSTOMER.firstName}</p>
        <h1 className="es-h1">What are you shopping for today?</h1>
        <p className="es-lede">Tell us in your own words. We'll build the steps around you — only the choices that matter, with the maths shown.</p>
      </div>
      <form
        className="es-intent"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(text);
        }}
      >
        <label htmlFor="es-dyn-intent" className="es-eyebrow">Your request</label>
        <textarea
          id="es-dyn-intent"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(text);
            }
          }}
        />
        <div className="es-row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="es-icon-btn" style={{ width: 44, height: 44 }} aria-label="Speak your request">
            <Mic size={20} />
          </button>
          <Btn type="submit" disabled={!text.trim()}>Build my bundle <ArrowRight size={18} /></Btn>
        </div>
      </form>
      <div className="es-stack" style={{ gap: 10 }}>
        <p className="es-note">Or try</p>
        <div className="es-row" style={{ gap: 8 }}>
          {SCENARIOS.map((s) => (
            <button key={s.id} type="button" className="es-chip-btn" onClick={() => setText(s.draft)}>{s.title}</button>
          ))}
        </div>
      </div>
      {labels && (
        <p className="es-note">
          {status.live ? 'Live: requests and changes go to gpt-4o-mini; the rules engine validates every answer.' : `LLM off (${status.reason}) — the rules engine answers instead.`}
        </p>
      )}
    </Page>
  );
}

function DoneScreen({ order, price: p, paid, onHome }) {
  const patches = DONE_PATCHES;
  return (
    <Page aside={<Rail order={order} price={p} changes={[]} />}>
      <ConfirmedHead title="Order placed" sub={`Order ${paid?.no} · ${money(paid?.amount ?? p.payNow)} paid today`} />
      {patches.map((x) => (
        <Gen key={x.component} name={labelOf(x)}>{renderPatch(x, order, p, () => ({ ok: true }))}</Gen>
      ))}
      <div className="es-row">
        <Btn onClick={onHome}>Start another order <ArrowRight size={18} /></Btn>
      </div>
    </Page>
  );
}

const DONE_PATCHES = [
  { slot: 'done', component: 'PostOrderTimeline', props: {} },
  { slot: 'done', component: 'BillExplainer', props: {} }
];
