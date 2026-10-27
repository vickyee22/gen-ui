/**
 * EShop Buyflow — Scenario 1 (opener): two intents, collect at Tampines,
 * three chat changes. Plus the three-intent closing example.
 *
 * Chat changes go through applyChange so they land in the change log. The
 * affected component is wrapped in <Recomposed /> keyed by its slot value, so
 * only that component re-renders.
 */

import React, { useState } from 'react';
import { Mic, ArrowRight, Bell, User, Eye, CreditCard, Check, MapPin, Truck, Store, QrCode, ArrowLeftRight } from 'lucide-react';
import {
  DEFAULT_ORDER, COLORS, STORAGES, PLANS, ROAMING, TRIALS, ACCOUNTS, SLOTS, PODS, CUSTOMER,
  NEW_LINE_OFFER, SWOP_DISCOUNT, SWOP_MONTHLY, REGISTRATION_FEE, DELIVERY_FEE, DELIVERY_USUAL, SIM_ONLY,
  SHOW_CONTEXT_SIGNALS, money, priceMain, colorOf
} from './data';
import {
  Page, UserSays, AgentSays, Card, Option, Switch, Btn, Row, Aside, AsideProduct, SumRow, Features, Agree, PhoneArt, Tick
} from './ui';
import { ChatComposer, Recomposed, ChangeLog, SlotDiff, Gen, useLabels } from './agent';
import { DeviceConfigurator, PlanHead, PlanPrice, IdentityCard, ConfirmedHead, Timeline, NextActions, orderNo } from './MainFlow';
import {
  S1_PROMPT, THREE_PROMPT, S1_GOALS, THREE_GOALS, S1_SIGNALS, S1_SHOPS, RESERVATION, PHRASES, MATCH, CHILD_CONTROLS
} from './s1data';
import '../styles/eshop-s1.css';

/* ======================= Shared ======================= */

const S1_ORDER = { ...DEFAULT_ORDER, fulfil: 'collect', shop: 'TPN' };
const shopOf = (order) => S1_SHOPS.find((s) => s.id === order.shop) || S1_SHOPS[0];
const slotOf = (order) => SLOTS.find((s) => s.id === order.slot) || SLOTS[1];
const SWOP_FEES = SWOP_MONTHLY * 24; // $333.60
const trialsOn = (order) => TRIALS.filter((t) => order.trials?.[t.id]);
const getItLabel = (order) => (order.fulfil === 'door' ? `Deliver ${slotOf(order).label.split(' ')[0]}` : 'Collect Wed');
const addonsLabel = (order) =>
  [order.swop && 'MobileSwop', trialsOn(order).length > 0 && 'trials'].filter(Boolean).join(' + ') || 'None';

function IntentSplitter({ goals }) {
  return (
    <Gen name={`IntentSplitter goals={${goals.length}}`}>
      <div className="es-row" style={{ gap: 8 }}>
        {goals.map((g) => <span key={g} className="es-tag is-changing">{g}</span>)}
      </div>
    </Gen>
  );
}

function ContextSignals() {
  const icons = [User, Eye, CreditCard, Check];
  return (
    <Gen name="ContextSignals">
      <Aside title="Tailoring this visit" soft>
        <ul className="es-stack" style={{ fontSize: 14 }}>
          {S1_SIGNALS.map(({ t, s }, i) => {
            const Icon = icons[i];
            return (
              <li key={t} style={{ display: 'flex', gap: 12 }}>
                <Icon size={20} color="#3A3FD9" style={{ flex: 'none' }} />
                <span><strong>{t}</strong><br /><span className="es-muted">{s}</span></span>
              </li>
            );
          })}
        </ul>
        <p className="es-note es-divider-top">Used only for this visit. <button type="button" className="es-link">Manage what we use</button></p>
      </Aside>
    </Gen>
  );
}

/** Right rail: live Today / Monthly from order state, with the ledger behind it. */
function S1Rail({ order, title = 'Your bundle', children }) {
  const p = priceMain(order);
  const c = colorOf(order.color);
  const shop = shopOf(order);
  const trials = trialsOn(order);
  const addons = [order.swop && 'MobileSwop Plus', trials.length && `${trials.length} trial${trials.length > 1 ? 's' : ''}`, order.pods && 'AirPods Pro 3']
    .filter(Boolean).join(', ') || 'None';
  return (
    <Aside title={title}>
      <AsideProduct hex={c.hex} title="iPhone 18 Pro Max" sub={`${c.name} · ${order.storage} · ${p.plan.name}`} />
      <div className="es-sum">
        <SumRow label="Get it" value={order.fulfil === 'door' ? `Delivery · ${slotOf(order).label.split(' · ')[0]}` : `Collect · ${shop.short}`} />
        <SumRow label="Add-ons" value={addons} />
        <SumRow label="Today" value={money(p.today)} size="big" />
        <SumRow label="Monthly" value={money(p.monthly)} size="mid" />
      </div>
      <div className="es-ledger es-divider-top" style={{ fontSize: 13 }}>
        <Row label={`Device with ${p.plan.name}`} value={money(p.plan.device)} />
        <Row label="New-line device offer" value={`−${money(NEW_LINE_OFFER)}`} neg />
        {order.swop && <Row label="MobileSwop Plus discount" value={`−${money(SWOP_DISCOUNT)}`} neg />}
        {order.pods && <Row label="AirPods Pro 3" value={money(PODS.price)} />}
        <Row label={order.fulfil === 'door' ? 'Doorstep delivery' : 'Collect at store'} value={p.fulfilFee ? money(p.fulfilFee) : 'Free'} />
        <Row label="Payable today" value={money(p.today)} total />
      </div>
      {children}
    </Aside>
  );
}

/**
 * The three scripted chat changes. Every screen after Intent gets the full
 * script so any phrase works anywhere; each screen suggests its own phrase.
 * #1 lowers the 24-month cost, so it applies straight away. #2 removes a
 * discount and #3 raises today's price, so both confirm first.
 */
function useS1Script({ order, applyChange }) {
  return [
    {
      match: MATCH.plan,
      run: () => {
        if (order.plan === 'S') return "You're already on Enhanced S — the lowest plan that still covers Malaysia.";
        const from = PLANS[order.plan];
        applyChange({ slot: 'plan', label: 'Plan', from: from.name, to: 'Enhanced S', order: { plan: 'S' } });
        return "Then roaming shouldn't decide the plan. Enhanced S fits local use — here's the trade-off.";
      }
    },
    {
      match: MATCH.addons,
      run: () => {
        const hasTrials = trialsOn(order).length > 0;
        if (!order.swop && !hasTrials) return 'There are no add-ons on this order — nothing will start charging later.';
        const apply = () =>
          applyChange({ slot: 'addons', label: 'Add-ons', from: addonsLabel(order), to: 'None', order: { swop: false, trials: {} } });
        if (!order.swop) {
          apply();
          return 'Done — trials are off. Nothing will start charging later.';
        }
        const before = priceMain(order);
        const after = priceMain({ ...order, swop: false, trials: {} });
        return {
          message: 'MobileSwop carries the $150 handset discount, so here is the maths before I remove it.',
          confirm: {
            title: 'Remove MobileSwop and the trials?',
            before: { today: before.today, monthly: before.monthly },
            after: { today: after.today, monthly: after.monthly },
            note: `Without MobileSwop, today goes ${money(before.today)} → ${money(after.today)}, and you skip ${money(SWOP_FEES)} of fees — ${money(SWOP_FEES - SWOP_DISCOUNT)} less overall.`,
            confirmLabel: 'Remove anyway',
            cancelLabel: 'Keep it',
            onConfirm: apply,
            confirmedText: 'Removed. Add-ons are now none — nothing will start charging later.',
            cancelledText: 'Kept MobileSwop and your trial.'
          }
        };
      }
    },
    {
      match: MATCH.fulfil,
      run: () => {
        if (order.fulfil === 'door') return `It's already set to deliver — ${slotOf(order).label}.`;
        const before = priceMain(order);
        const after = priceMain({ ...order, fulfil: 'door', slot: 'fri' });
        return {
          message: "No problem — I'll swap collection for delivery. Everything else stays as it is.",
          confirm: {
            title: 'Deliver instead?',
            before: { today: before.today, monthly: before.monthly },
            after: { today: after.today, monthly: after.monthly },
            note: `Doorstep delivery is ${money(DELIVERY_FEE)} (usually ${money(DELIVERY_USUAL)}). Earliest slot: Fri 30 Oct, 9am–12pm.`,
            confirmLabel: 'Deliver instead',
            cancelLabel: 'Keep collection',
            onConfirm: () =>
              applyChange({ slot: 'fulfil', label: 'Get it', from: 'Collect Wed', to: 'Deliver Fri', order: { fulfil: 'door', slot: 'fri' } }),
            confirmedText: 'Switched to delivery. Pick another slot above if Friday morning doesn’t work.',
            cancelledText: 'Kept collection at Tampines.'
          }
        };
      }
    }
  ];
}

function S1Chat({ order, applyChange, suggest }) {
  const script = useS1Script({ order, applyChange });
  return <ChatComposer script={script} suggestions={suggest ? [suggest] : []} />;
}

/* ======================= 1 · Intent ======================= */

function IntentForm({ initial, goals, onSubmit, cta = 'Build my bundle' }) {
  const [text, setText] = useState(initial);
  const submit = () => text.trim() && onSubmit(text.trim());
  return (
    <>
      <form className="es-intent" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label htmlFor="es-s1-intent" className="es-eyebrow">Your request</label>
        <textarea
          id="es-s1-intent"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="es-row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="es-icon-btn" style={{ width: 44, height: 44 }} aria-label="Speak your request">
            <Mic size={20} />
          </button>
          <Btn type="submit" disabled={!text.trim()}>{cta} <ArrowRight size={18} /></Btn>
        </div>
      </form>
      {text.trim() && (
        <div className="es-stack" style={{ gap: 8 }}>
          <p className="es-note">I heard {goals.length} goals</p>
          <IntentSplitter goals={goals} />
        </div>
      )}
    </>
  );
}

export function S1Intent({ draft, go, setPrompt, changes, undoChange }) {
  const labels = useLabels();
  return (
    <Page hero aside={SHOW_CONTEXT_SIGNALS && labels ? <ContextSignals /> : null}>
      <div className="es-stack" style={{ gap: 12 }}>
        <p className="es-muted">Welcome back, {CUSTOMER.firstName}</p>
        <h1 className="es-h1">What are you shopping for today?</h1>
        <p className="es-lede">Tell us in your own words. We'll build the steps around you — and you can change anything by just saying so.</p>
      </div>
      <IntentForm
        initial={draft || S1_PROMPT}
        goals={S1_GOALS}
        onSubmit={(text) => {
          changes.forEach((c) => undoChange(c.id));
          setPrompt?.(text);
          go('s1Shop', S1_ORDER);
        }}
      />
    </Page>
  );
}

/* ======================= 2 · Shop & stock ======================= */

function S1Map({ selected }) {
  const pins = [
    { id: 'TPN', l: 'A', x: 250, y: 150 },
    { id: 'BDK', l: 'B', x: 110, y: 230 },
    { id: 'PSR', l: 'C', x: 330, y: 60 }
  ];
  return (
    <div className="es-map">
      <svg viewBox="0 0 420 300" role="img" aria-label="Map of shops near Tampines">
        <rect width="420" height="300" fill="#EEF1EC" />
        <path d="M0 210 C 120 190, 220 240, 420 200" stroke="#FFFFFF" strokeWidth="14" fill="none" />
        <path d="M200 0 C 190 100, 240 180, 220 300" stroke="#FFFFFF" strokeWidth="10" fill="none" />
        <path d="M0 90 L 420 120" stroke="#FFFFFF" strokeWidth="8" fill="none" />
        <rect x="30" y="20" width="90" height="50" rx="8" fill="#DCE6D6" />
        <rect x="270" y="220" width="110" height="56" rx="8" fill="#DCE6D6" />
        <circle cx="232" cy="176" r="28" fill="#3A3FD9" fillOpacity="0.12" />
        <circle cx="232" cy="176" r="8" fill="#3A3FD9" stroke="#FFFFFF" strokeWidth="3" />
        <text x="246" y="200" fontSize="12" fontWeight="700" fill="#272BA8">You · Tampines</text>
        {pins.map((p) => (
          <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
            <path d="M0 0 C -14 -16, -14 -34, 0 -34 C 14 -34, 14 -16, 0 0 Z" fill={selected === p.id ? '#3A3FD9' : '#6B6B73'} />
            <text x="0" y="-19" textAnchor="middle" fontSize="12" fontWeight="900" fill="#FFFFFF">{p.l}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function S1Shop({ order, setOrder, go, prompt, applyChange }) {
  const shop = shopOf(order);
  const pickShop = (s) => {
    // Rule: a shop limits the device to what it has on the shelf.
    const patch = { shop: s.id };
    if (s.colors[order.color] && !s.colors[order.color][0]) patch.color = 'burgundy';
    if (s.storages[order.storage] && !s.storages[order.storage][0]) patch.storage = '256GB';
    setOrder(patch);
  };
  return (
    <Page
      aside={
        <div className="es-stack" style={{ gap: 16 }}>
          <Gen name='ShopAvailability variant="map"'><S1Map selected={shop.id} /></Gen>
          <S1Rail order={order} />
        </div>
      }
    >
      <UserSays>{prompt || S1_PROMPT}</UserSays>
      <IntentSplitter goals={S1_GOALS} />
      <AgentSays>
        You asked to collect tomorrow, so I'll start with where you can get it. Burgundy 256GB is on the shelf at two shops near Tampines.
      </AgentSays>

      <Gen name='ShopAvailability sku="IP18PM-BUR-256" variant="list+map"'>
        <Card title="Burgundy · 256GB near you">
          <div className="es-stack" style={{ gap: 10 }}>
            {S1_SHOPS.map((s) => (
              <Option key={s.id} row compact selected={shop.id === s.id} disabled={!s.ok} onClick={() => pickShop(s)}>
                <span className="es-letter">{s.letter}</span>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, opacity: s.ok ? 1 : 0.6 }}>
                  <span className="es-option-title" style={{ fontSize: 15 }}>{s.name}</span>
                  <span className="es-option-sub">{s.distance} · open till {s.close}</span>
                </span>
                <span className={`es-pill is-${s.tone}`}>{s.stock}</span>
              </Option>
            ))}
          </div>
          <p className="es-note">Live stock, refreshed when you open this page. Stock counts shown are illustrative.</p>
        </Card>
      </Gen>

      <div className="es-row">
        <Btn onClick={() => go('s1Fit')}><MapPin size={18} /> Collect at {shop.short} — continue</Btn>
      </div>

      <S1Chat order={order} applyChange={applyChange} />
    </Page>
  );
}

/* ======================= 3 · Fit ======================= */

function PlanFitCompare({ order, setOrder, onRevert }) {
  if (order.plan === 'S') {
    const s = PLANS.S;
    const l = PLANS.L;
    const perMonth = l.monthly - s.monthly;
    const upfront = s.device - l.device;
    return (
      <div className="es-grid-2">
        <Option selected onClick={() => setOrder({ plan: 'S' })}>
          <PlanHead badge={<span className="es-pill is-brand">Fits local use</span>} />
          <span style={{ fontSize: 26, fontWeight: 900 }}>Enhanced S</span>
          <PlanPrice monthly={`$${s.monthly}`} sub={`/mth · device ${money(s.device).replace('.00', '')}`} />
          <Features items={[
            { text: ROAMING.S },
            { text: <><strong>{money(perMonth).replace('.00', '')} less a month</strong>, phone {money(upfront).replace('.00', '')} more upfront — <strong>{money(perMonth * 24 - upfront).replace('.00', '')} less over 24 months</strong></> }
          ]} />
        </Option>
        <Option compact onClick={() => (onRevert ? onRevert() : setOrder({ plan: 'L' }))}>
          <PlanHead badge={<span className="es-pill is-grey">Was suggested for roaming</span>} />
          <span style={{ fontSize: 20, fontWeight: 900 }}>Priority L</span>
          <PlanPrice monthly={`$${l.monthly}`} sub={`/mth · device $${l.device}`} />
          <span className="es-note">{ROAMING.L}</span>
        </Option>
      </div>
    );
  }
  return (
    <div className="es-grid-2">
      <Option selected={order.plan === 'L'} onClick={() => setOrder({ plan: 'L' })}>
        <PlanHead badge={<span className="es-pill is-brand">Best fit for your roaming</span>} />
        <span style={{ fontSize: 26, fontWeight: 900 }}>Priority L</span>
        <PlanPrice monthly="$128" sub="/mth · device $760" />
        <Features items={[
          { text: <><strong>{ROAMING.L}</strong></> },
          { text: '$40 plan + $88 bundled roaming' }
        ]} />
      </Option>
      <Option selected={order.plan === 'M'} onClick={() => setOrder({ plan: 'M' })}>
        <PlanHead badge={<span className="es-pill is-grey">Saves $450 over 24 mths</span>} />
        <span style={{ fontSize: 26, fontWeight: 900 }}>Enhanced M</span>
        <PlanPrice monthly="$98" sub="/mth · device $1,030" />
        <Features items={[
          { text: ROAMING.M },
          { text: '$270 more upfront, $30 less each month' }
        ]} />
      </Option>
    </div>
  );
}

export function S1Fit({ order, setOrder, go, applyChange, changeFor, undoChange }) {
  const shop = shopOf(order);
  const colors = COLORS.map((c) => {
    const st = shop.colors[c.id];
    return { ...c, ok: st ? st[0] : true, note: st?.[1] };
  });
  const storages = STORAGES.map((s) => {
    const st = shop.storages[s];
    return { label: s, ok: st ? st[0] : true, note: st?.[1] };
  });
  const local = order.plan === 'S';
  return (
    <Page aside={<S1Rail order={order} />}>
      <AgentSays>
        This is what {shop.short} can hand you tomorrow. Anything greyed out isn't on their shelf — I'll say where it is instead.
      </AgentSays>

      <Gen name={`DeviceConfigurator mode="stock" shop="${shop.id}"`}>
        <DeviceConfigurator order={order} setOrder={setOrder} colors={colors} storages={storages} />
      </Gen>

      <div className="es-stack">
        <h2 className="es-h2">Your plan</h2>
        <Recomposed
          version={order.plan}
          changed={!!changeFor('plan')}
          onUndo={() => undoChange('plan')}
          name={local ? 'PlanFitCompare intent="local" variant="compact" recommended="ENH_S" compareWith="PRIO_L"' : 'PlanFitCompare intent="travel:MY" variant="full"'}
          minHeight={260}
        >
          <PlanFitCompare order={order} setOrder={setOrder} onRevert={changeFor('plan') ? () => undoChange('plan') : null} />
          <p className="es-note" style={{ marginTop: 10 }}>
            {local
              ? 'Other plans hidden — none is cheaper and still covers Malaysia.'
              : 'You compared Priority L twice and spent longest on roaming, so it leads. Max two plans shown.'}
          </p>
        </Recomposed>
      </div>

      <div className="es-row">
        <Btn onClick={() => go('s1Extras')}>Looks right — continue</Btn>
        <Btn ghost onClick={() => go('s1Shop', null, { instant: true })}>Change shop</Btn>
      </div>

      <S1Chat order={order} applyChange={applyChange} suggest={!changeFor('plan') ? PHRASES.plan : null} />
    </Page>
  );
}

/* ======================= 4 · Extras ======================= */

function TradeOffDecision({ order, setOrder }) {
  const plan = PLANS[order.plan];
  const keep = plan.device - NEW_LINE_OFFER - SWOP_DISCOUNT;
  const skip = plan.device - NEW_LINE_OFFER;
  return (
    <Gen name='TradeOffDecision addon="mobileswop"'>
      <Card title="Is MobileSwop Plus worth it for you?">
        <p style={{ color: '#4A4A4A' }}>
          It takes $150 off the phone today, but costs $13.90 a month for 24 months.
        </p>
        <div className="es-grid-2">
          <Option selected={order.swop} onClick={() => setOrder({ swop: true })}>
            <span className="es-option-title">Keep MobileSwop Plus</span>
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label="Today" value={<strong>{money(keep)}</strong>} />
              <Row label="Add-on, 24 × $13.90" value={money(SWOP_FEES)} />
              <Row label="Net cost of the cover" value={money(SWOP_FEES - SWOP_DISCOUNT)} total />
            </div>
          </Option>
          <Option selected={!order.swop} onClick={() => setOrder({ swop: false })}>
            <span className="es-option-title">Skip it</span>
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label="Today" value={<strong>{money(skip)}</strong>} />
              <Row label="Add-on" value="$0" />
              <Row label="Saves over 24 mths" value={money(SWOP_FEES - SWOP_DISCOUNT)} total />
            </div>
          </Option>
        </div>
      </Card>
    </Gen>
  );
}

function TrialTransparency({ order, setOrder }) {
  const after = trialsOn(order).reduce((s, t) => s + t.price, 0);
  return (
    <Gen name="TrialTransparency">
      <Card
        title="Free trials"
        right={<span style={{ fontSize: 14, color: '#4A4A4A' }}>After trials end: <strong style={{ color: '#141414' }}>+{money(after)}/mth</strong></span>}
      >
        <p className="es-note">All five together would add $69.75 a month once the free period ends. Only Amazon Prime is on.</p>
        <div>
          {TRIALS.map((t) => (
            <div key={t.id} className="es-setting">
              <div className="es-setting-body">
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</span>
                <span className="es-note">Free for {t.free} · then {money(t.price)}/mth</span>
              </div>
              <Switch on={!!order.trials[t.id]} label={t.name} onToggle={() => setOrder({ trials: { ...order.trials, [t.id]: !order.trials[t.id] } })} />
            </div>
          ))}
          <div className="es-setting">
            <div className="es-setting-body" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Bell size={20} aria-hidden="true" />
              <span>Remind me 7 days before any trial starts charging</span>
            </div>
            <Switch on={order.remind} label="Trial reminders" onToggle={() => setOrder({ remind: !order.remind })} />
          </div>
        </div>
      </Card>
    </Gen>
  );
}

function AccessoryPick({ order, setOrder }) {
  return (
    <Gen name='AccessoryPick limit="1"'>
      <div className="es-card" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" style={{ flex: 'none' }}>
          <rect width="72" height="72" rx="16" fill="#F6F6F8" />
          <rect x="18" y="26" width="36" height="28" rx="10" fill="#FFFFFF" stroke="#D4D4DA" />
          <circle cx="29" cy="20" r="6" fill="#FFFFFF" stroke="#D4D4DA" />
          <circle cx="43" cy="20" r="6" fill="#FFFFFF" stroke="#D4D4DA" />
        </svg>
        <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#B0102A', letterSpacing: '0.04em' }}>ONE PICK · $120 OFF WITH THIS PHONE</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{PODS.name}</span>
          <span style={{ fontSize: 14 }}>
            <span className="es-muted" style={{ textDecoration: 'line-through' }}>{money(PODS.was)}</span> <strong>{money(PODS.price)}</strong>
          </span>
        </div>
        {order.pods ? (
          <Btn ghost onClick={() => setOrder({ pods: false })}><Check size={16} /> Added · Remove</Btn>
        ) : (
          <Btn ghost onClick={() => setOrder({ pods: true })}>Add</Btn>
        )}
      </div>
    </Gen>
  );
}

export function S1Extras({ order, setOrder, go, applyChange, changeFor, undoChange }) {
  const none = !order.swop && trialsOn(order).length === 0;
  const collapsed = !!changeFor('addons') && none;
  return (
    <Page aside={<S1Rail order={order} />}>
      <AgentSays>
        Two things can add to your bill later: MobileSwop Plus and the free trials. Here's what each really costs, so you can decide.
      </AgentSays>

      <Recomposed
        version={collapsed ? 'none' : 'some'}
        changed={!!changeFor('addons')}
        onUndo={() => undoChange('addons')}
        minHeight={300}
      >
        {collapsed ? (
          <Card title="Add-ons">
            <p style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 16 }}>
              <Tick /> <strong>None — nothing will start charging later.</strong>
            </p>
            <p className="es-note">MobileSwop Plus and all five trials are off. Today is {money(priceMain(order).today)}; monthly is just your plan.</p>
          </Card>
        ) : (
          <div className="es-stack" style={{ gap: 24 }}>
            <TradeOffDecision order={order} setOrder={setOrder} />
            <TrialTransparency order={order} setOrder={setOrder} />
          </div>
        )}
      </Recomposed>

      <AccessoryPick order={order} setOrder={setOrder} />

      <div className="es-row">
        <Btn onClick={() => go('s1Reserve')}>Continue to reserve</Btn>
        <Btn ghost onClick={() => go('s1Fit', null, { instant: true })}>Back</Btn>
      </div>

      <S1Chat order={order} applyChange={applyChange} suggest={!changeFor('addons') ? PHRASES.addons : null} />
    </Page>
  );
}

/* ======================= 5 · Reserve / Checkout ======================= */

function ReservationCard({ order }) {
  const shop = shopOf(order);
  const c = colorOf(order.color);
  return (
    <Card title="Collection" right={<span className="es-pill is-ok"><Store size={14} /> Free</span>}>
      <div className="es-row" style={{ alignItems: 'stretch', gap: 20 }}>
        <div className="es-grid-2" style={{ flex: '1 1 280px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          {[
            ['Shop', shop.name],
            ['Ready from', RESERVATION.ready],
            ['Held until', RESERVATION.held],
            ['Phone', `${c.name} · ${order.storage}`]
          ].map(([k, v]) => (
            <div key={k} className="es-stack" style={{ gap: 2 }}>
              <span className="es-note">{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <div className="es-s1-qr">
          <QrCode size={52} aria-hidden="true" />
          Pass sent after you pay
        </div>
      </div>
    </Card>
  );
}

function DeliverySlots({ order, setOrder }) {
  return (
    <Card title="Delivery" right={<span className="es-pill is-grey"><Truck size={14} /> <s>{money(DELIVERY_USUAL)}</s> {money(DELIVERY_FEE)}</span>}>
      <p className="es-note">To {CUSTOMER.address}</p>
      <div className="es-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {SLOTS.filter((s) => s.id !== 'thu').map((s) => (
          <Option key={s.id} compact selected={order.slot === s.id} onClick={() => setOrder({ slot: s.id })}>
            <span className="es-option-title" style={{ fontSize: 15 }}>{s.label}</span>
            {s.id === 'fri' && <span className="es-option-sub">Earliest</span>}
          </Option>
        ))}
      </div>
    </Card>
  );
}

function AccountChooser({ order, setOrder }) {
  return (
    <Gen name='AccountChooser preselect="4471"'>
      <Card title="Bill it to">
        <div className="es-stack" style={{ gap: 10 }}>
          {ACCOUNTS.map((a) => (
            <Option key={a.id} row compact selected={order.account === a.id} onClick={() => setOrder({ account: a.id })}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="es-option-title" style={{ fontSize: 15 }}>{a.title}</span>
                <span className="es-option-sub">{a.sub}</span>
              </span>
            </Option>
          ))}
        </div>
      </Card>
    </Gen>
  );
}

function OpenSlotsHandoff({ order, scenario, setScenario }) {
  const delivery = order.fulfil === 'door';
  const inStore = !delivery && (scenario.s1Defer ?? false);
  return (
    <Gen name={`OpenSlotsHandoff slots={["number","sim"]}${delivery ? ' fulfilment="delivery"' : ''}`}>
      <Card title="Number and eSIM">
        {delivery ? (
          <p className="es-note">With delivery there's no store visit, so we'll set these up now: new number <strong>9638 8347</strong> on eSIM, sent to {CUSTOMER.email}.</p>
        ) : (
          <div className="es-grid-2">
            <Option compact selected={!inStore} onClick={() => setScenario({ s1Defer: false })}>
              <span className="es-option-title">Do it now · 9638 8347</span>
              <span className="es-option-sub">eSIM ready when you collect</span>
            </Option>
            <Option compact selected={inStore} onClick={() => setScenario({ s1Defer: true })}>
              <span className="es-option-title">Finish in store</span>
              <span className="es-option-sub">Staff see this same order on the retail app</span>
            </Option>
          </div>
        )}
      </Card>
    </Gen>
  );
}

export function S1Reserve({ order, setOrder, go, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const delivery = order.fulfil === 'door';
  const changed = !!changeFor('fulfil');
  return (
    <Page aside={<S1Rail order={order} title={delivery ? 'Pay today' : 'Your reservation'} />}>
      <AgentSays>
        {delivery
          ? 'Delivery it is. Your Singpass details and billing account are already filled in.'
          : `I'll hold one at ${shopOf(order).short}. Your Singpass details and billing account are already filled in — nothing to type.`}
      </AgentSays>

      <Recomposed
        version={order.fulfil}
        changed={changed}
        onUndo={() => undoChange('fulfil')}
        name={delivery ? 'FulfilmentRecompute reason="busy" slots="delivery"' : `ReservationCard shop="${shopOf(order).id}"`}
        minHeight={180}
      >
        {delivery ? <DeliverySlots order={order} setOrder={setOrder} /> : <ReservationCard order={order} />}
        {changed && (
          <div style={{ marginTop: 12 }}>
            <SlotDiff changing={['How you get it']} kept={['Phone', 'Plan', 'Add-ons', 'Singpass', 'Billing']} />
          </div>
        )}
      </Recomposed>

      <Gen name='VerifiedIdentity source="singpass"'><IdentityCard /></Gen>
      <AccountChooser order={order} setOrder={setOrder} />
      <OpenSlotsHandoff order={order} scenario={scenario} setScenario={setScenario} />

      <div className="es-row">
        <Btn onClick={() => go('s1Review')}>Review my order</Btn>
        <Btn ghost onClick={() => go('s1Extras', null, { instant: true })}>Back</Btn>
      </div>

      <S1Chat order={order} applyChange={applyChange} suggest={!changed ? PHRASES.fulfil : null} />
    </Page>
  );
}

/* ======================= 6 · Review ======================= */

export function S1Review({ order, go, changes, undoChange, applyChange }) {
  const p = priceMain(order);
  const c = colorOf(order.color);
  const [agreed, setAgreed] = useState(true);
  const acct = ACCOUNTS.find((a) => a.id === order.account) || ACCOUNTS[0];
  return (
    <Page aside={<S1Rail order={order} title="Pay today" />}>
      <AgentSays>
        Here's everything, with each change you asked for. Undo any of them and the price updates straight away.
      </AgentSays>

      <ChangeLog changes={changes} onUndo={undoChange} />

      <Card title="Your order">
        <div className="es-ledger" style={{ fontSize: 14 }}>
          <Row label="Phone" value={`iPhone 18 Pro Max · ${c.name} · ${order.storage}`} />
          <Row label="Plan" value={`${p.plan.name} · ${money(p.plan.monthly)}/mth`} />
          <Row label="Add-ons" value={addonsLabel(order) === 'None' ? 'None' : addonsLabel(order)} />
          <Row label="Get it" value={order.fulfil === 'door' ? `Deliver · ${slotOf(order).label}` : `Collect · ${shopOf(order).short} · ${RESERVATION.ready}`} />
          <Row label="Bill to" value={acct.title} />
          <Row label="Monthly" value={money(p.monthly)} total />
        </div>
      </Card>

      <div className="es-stack">
        <Agree checked={agreed} onChange={() => setAgreed(!agreed)}>
          I agree to the <button type="button" className="es-link">Terms &amp; Conditions</button> and <button type="button" className="es-link">Singtel Data Protection Policy</button>
        </Agree>
        <Btn block disabled={!agreed} onClick={() => go('s1Done')}>Pay {money(p.today)}</Btn>
      </div>

      <S1Chat order={order} applyChange={applyChange} />
    </Page>
  );
}

/* ======================= 7 · Done ======================= */

export function S1Done({ order, onRestart }) {
  const p = priceMain(order);
  const delivery = order.fulfil === 'door';
  const steps = delivery
    ? [
        { t: 'Order placed · Tue 27 Oct', d: `Paid ${money(p.today)}` },
        { t: 'eSIM sent to your email', d: `9638 8347 · ${CUSTOMER.email}` },
        { t: `Delivered · ${slotOf(order).label}`, d: CUSTOMER.address },
        { t: 'Your number goes live', d: 'As soon as you scan the eSIM QR code' }
      ]
    : [
        { t: 'Order placed · Tue 27 Oct', d: `Paid ${money(p.today)}` },
        { t: `Ready at ${shopOf(order).short} · ${RESERVATION.ready}`, d: `Held until ${RESERVATION.held}` },
        { t: 'Collect and set up', d: 'Bring your NRIC · staff see this same order' },
        { t: 'Your number goes live', d: 'Before you leave the shop' }
      ];
  const trialsAfter = trialsOn(order).reduce((s, t) => s + t.price, 0);
  return (
    <Page aside={<S1Rail order={order} title="Paid today" />}>
      <ConfirmedHead
        title="You're all set"
        sub={`Order ${orderNo(order)} · confirmation sent to ${CUSTOMER.email}`}
      />
      <Gen name="PostOrderTimeline">
        <Card title="What happens next"><Timeline steps={steps} /></Card>
      </Gen>
      <Gen name="BillExplainer">
        <Card title="Your first bill">
          <div className="es-ledger" style={{ fontSize: 14 }}>
            <Row label={`${p.plan.name}${order.swop ? ' + MobileSwop Plus' : ''}`} value={money(p.monthly)} />
            <Row label="Service registration, one-time" value={money(REGISTRATION_FEE)} />
            <Row label="5G activation" value="Waived" />
            <Row label="First bill" value={money(p.firstBill)} total />
          </div>
          <p className="es-note">
            {trialsAfter > 0
              ? `After trials end, +${money(trialsAfter)}/mth. We'll remind you 7 days before.`
              : 'No trials on — nothing will start charging later.'}
          </p>
        </Card>
      </Gen>
      <NextActions items={['Move my data from my old phone', delivery ? 'Track my delivery' : 'Get directions to the shop']} onRestart={onRestart} />
    </Page>
  );
}

/* ======================= Closing · three intents ======================= */

export function ThreeIntent({ draft, go, setPrompt }) {
  return (
    <Page hero>
      <div className="es-stack" style={{ gap: 12 }}>
        <p className="es-muted">Welcome back, {CUSTOMER.firstName}</p>
        <h1 className="es-h1">What are you shopping for today?</h1>
        <p className="es-lede">Bigger request, same components.</p>
      </div>
      <IntentForm
        initial={draft || THREE_PROMPT}
        goals={THREE_GOALS}
        onSubmit={(text) => {
          setPrompt?.(text);
          go('threeOverview', S1_ORDER);
        }}
      />
    </Page>
  );
}

export function ThreeOverview({ order, setOrder, scenario, setScenario, prompt, applyChange, onRestart }) {
  const controls = scenario.threeControls || { filter: true, barring: true, cap: true, alert: true };
  const p = priceMain(order);
  const c = colorOf(order.color);
  const shop = shopOf(order);
  const today = p.today;
  const monthly = p.monthly + SIM_ONLY;
  const onCount = CHILD_CONTROLS.filter((k) => controls[k.key]).length;
  const [paid, setPaid] = useState(false);
  return (
    <Page
      aside={
        <Aside title="Your order · 2 lines">
          <div className="es-sum">
            <SumRow label="Line 1" value={`${money(p.monthly)}/mth`} />
            <SumRow label="Line 2 · SIM Only" value={`${money(SIM_ONLY)}/mth`} />
            <SumRow label="Get it" value={`Collect · ${shop.short}`} />
            <SumRow label="Today" value={money(today)} size="big" />
            <SumRow label="Monthly" value={money(monthly)} size="mid" />
          </div>
          <p className="es-note">One bill to Main account · ending 4471. SIM Only price is illustrative.</p>
          <Btn block onClick={() => setPaid(true)} disabled={paid}>{paid ? 'Reserved' : `Pay ${money(today)} and reserve`}</Btn>
        </Aside>
      }
    >
      <UserSays>{prompt || THREE_PROMPT}</UserSays>
      <IntentSplitter goals={THREE_GOALS} />
      <AgentSays>Three goals, one overview. Each card is the same component you'd see on its own step — change any of them by just saying so.</AgentSays>

      {paid && (
        <p className="es-callout is-ok" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Check size={20} /> <span><strong>Reserved at {shop.short}.</strong> Both lines are on one order.</span>
        </p>
      )}

      <div className="es-grid-2">
        <Gen name='LineCard role="new"'>
          <Card title="Line 1 · You" right={<span className="es-pill is-brand-soft">New line</span>}>
            <div className="es-row" style={{ gap: 16, flexWrap: 'nowrap' }}>
              <PhoneArt hex={c.hex} width={56} />
              <div className="es-stack" style={{ gap: 4 }}>
                <strong style={{ fontSize: 17 }}>iPhone 18 Pro Max</strong>
                <span className="es-note">{c.name} · {order.storage}</span>
              </div>
            </div>
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label={p.plan.name} value={`${money(p.plan.monthly)}/mth`} />
              <Row label="Device today" value={money(p.deviceToday)} />
            </div>
          </Card>
        </Gen>
        <Gen name='LineCard role="new-child"'>
          <Card title="Line 2 · Your child" right={<span className="es-pill is-brand-soft">New line</span>}>
            <div className="es-row" style={{ gap: 16, flexWrap: 'nowrap' }}>
              <span className="es-s1-icon"><ArrowLeftRight size={24} aria-hidden="true" /></span>
              <div className="es-stack" style={{ gap: 4 }}>
                <strong style={{ fontSize: 15 }}>Hand-down: your current iPhone</strong>
                <span className="es-note">No second phone needed</span>
              </div>
            </div>
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label="SIM Only" value={`${money(SIM_ONLY)}/mth`} />
              <Row label="Number" value="9638 8347 · eSIM" />
              <Row label="Parental controls" value={`${onCount} of 4 on`} />
            </div>
          </Card>
        </Gen>
      </div>

      <Gen name='ParentalControls preset="age:12"'>
        <Card title="Parental controls on Line 2">
          <div>
            {CHILD_CONTROLS.map((k) => (
              <div key={k.key} className="es-setting">
                <div className="es-setting-body">
                  <span style={{ fontWeight: 700 }}>{k.name}</span>
                  <span className="es-note">{k.desc}</span>
                </div>
                {k.price && <span className="es-ok" style={{ fontSize: 13, fontWeight: 700 }}>{k.price}</span>}
                <Switch on={!!controls[k.key]} label={k.name} onToggle={() => setScenario({ threeControls: { ...controls, [k.key]: !controls[k.key] } })} />
              </div>
            ))}
          </div>
        </Card>
      </Gen>

      <div className="es-grid-2">
        <Gen name={`ReservationCard shop="${shop.id}"`}>
          <Card title="Get it" right={<span className="es-pill is-ok"><Store size={14} /> Free</span>}>
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label="Collect at" value={shop.name} />
              <Row label="Ready from" value={RESERVATION.ready} />
              <Row label="Held until" value={RESERVATION.held} />
            </div>
          </Card>
        </Gen>
        <Gen name='TradeOffDecision addon="mobileswop" variant="compact"'>
          <Card title="Add-ons">
            <div className="es-setting">
              <div className="es-setting-body">
                <span style={{ fontWeight: 700 }}>MobileSwop Plus</span>
                <span className="es-note">$13.90/mth · takes $150 off the phone today</span>
              </div>
              <Switch on={order.swop} label="MobileSwop Plus" onToggle={() => setOrder({ swop: !order.swop })} />
            </div>
            <div className="es-setting">
              <div className="es-setting-body">
                <span style={{ fontWeight: 700 }}>Amazon Prime trial</span>
                <span className="es-note">Free 90 days · then $4.99/mth</span>
              </div>
              <Switch on={!!order.trials.prime} label="Amazon Prime trial" onToggle={() => setOrder({ trials: { ...order.trials, prime: !order.trials.prime } })} />
            </div>
          </Card>
        </Gen>
      </div>

      <div className="es-row">
        <Btn ghost onClick={onRestart}>Back to journeys</Btn>
      </div>

      <S1Chat order={order} applyChange={applyChange} />
    </Page>
  );
}
