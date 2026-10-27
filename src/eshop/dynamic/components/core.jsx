/**
 * Dynamic buyflow — core governed components (device, plan, add-ons,
 * checkout, done). Every number shown comes from price(order); taps go
 * through act({ key, value }) so the rules engine can refuse them.
 * The shell adds the component-label chip around each one.
 */

import React, { useState } from 'react';
import { User, Eye, CreditCard, Check, Bell, ShieldCheck, AlertCircle } from 'lucide-react';
import {
  COLORS, STORAGES, PLANS, ROAMING, TRIALS, ACCOUNTS, SLOTS, NUMBERS, PODS, CUSTOMER,
  SWOP_MONTHLY, SWOP_DISCOUNT, money, colorOf
} from '../../data';
import { S1_SIGNALS } from '../../s1data';
import { Card, Option, Switch, Btn, Row, Features, PhoneArt, Tick } from '../../ui';
import { Timeline } from '../../MainFlow';
import { MODELS, SHOPS, PORT_DISCOUNT, price as priceOf } from '../model';

/* ---------- helpers ---------- */

/** Wraps act() so a refused tap shows its reason next to the control. */
function useAct(act) {
  const [reason, setReason] = useState(null);
  const run = (key, value) => {
    const r = act ? act({ key, value }) : { ok: true };
    setReason(r && r.ok === false ? r.reason : null);
    return r;
  };
  return [run, reason];
}

function Refused({ reason }) {
  if (!reason) return null;
  return (
    <p className="es-note" role="alert" style={{ color: '#8A3E00', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <AlertCircle size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
      <span>{reason}</span>
    </p>
  );
}

const planMonthly = (order, id) => {
  const m = PLANS[id].monthly;
  return order.lineType === 'port' ? Math.round(m * (1 - PORT_DISCOUNT) * 100) / 100 : m;
};
const shopOf = (order) => SHOPS.find((s) => s.id === order.shop);
const slotOf = (order) => SLOTS.find((s) => s.id === order.slot) || SLOTS[1];
const SWOP_FEES = Math.round(SWOP_MONTHLY * 24 * 100) / 100;

/* ---------- intent ---------- */

function ContextSignals() {
  const icons = [User, Eye, CreditCard, Check];
  return (
    <Card soft title="Tailoring this visit">
      <ul className="es-stack" style={{ fontSize: 14 }}>
        {S1_SIGNALS.map(({ t, s }, i) => {
          const Icon = icons[i] || Check;
          return (
            <li key={t} style={{ display: 'flex', gap: 12 }}>
              <Icon size={20} color="#3A3FD9" style={{ flex: 'none' }} aria-hidden="true" />
              <span><strong>{t}</strong><br /><span className="es-muted">{s}</span></span>
            </li>
          );
        })}
      </ul>
      <p className="es-note es-divider-top">
        Used only for this visit. <button type="button" className="es-link">Manage what we use</button>
      </p>
    </Card>
  );
}

function IntentSplitter({ props }) {
  const goals = props?.goals?.length ? props.goals : ['Phone + plan'];
  return (
    <div className="es-row" style={{ gap: 8 }} aria-label="Your goals">
      {goals.map((g, i) => (
        <span key={g + i} className="es-pill is-brand-soft is-lg">Goal {i + 1} · {g.replace(/^goal\s*\d+\s*·\s*/i, '')}</span>
      ))}
    </div>
  );
}

/* ---------- device ---------- */

function DeviceConfigurator({ variant, order, act }) {
  const [run, reason] = useAct(act);
  const c = colorOf(order.color);
  const stock = variant === 'stock' ? shopOf(order) : null;
  const colorStock = (id) => stock?.colors?.[id];
  const storageStock = (s) => stock?.storages?.[s];
  const model = MODELS[order.model] || MODELS.promax;
  return (
    <div className="es-card" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'center', padding: 24 }}>
      <PhoneArt hex={c.hex} width={96} />
      <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="es-stack" style={{ gap: 4 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>{model.name}</h2>
          {stock && <span className="es-note">Showing what's on the shelf at {stock.short}</span>}
        </div>
        <div className="es-stack" style={{ gap: 8 }}>
          <span className="es-note">Colour · <strong style={{ color: '#141414' }}>{c.name}</strong></span>
          <div className="es-row" style={{ gap: 10, alignItems: 'flex-start' }}>
            {COLORS.map((col) => {
              const st = colorStock(col.id);
              const out = st ? !st[0] : false;
              const btn = (
                <button
                  key={col.id}
                  type="button"
                  aria-label={col.name + (out ? ` — not at ${stock.short}` : '')}
                  aria-pressed={order.color === col.id}
                  disabled={out}
                  className={`es-swatch${order.color === col.id ? ' is-selected' : ''}${out ? ' is-out' : ''}`}
                  onClick={() => run('color', col.id)}
                >
                  <span style={{ background: col.hex }} />
                </button>
              );
              return st ? <div key={col.id} className="es-swatch-wrap">{btn}<span>{st[1]}</span></div> : btn;
            })}
          </div>
        </div>
        <div className="es-stack" style={{ gap: 8 }}>
          <span className="es-note">Storage</span>
          <div className="es-row" style={{ gap: 8 }}>
            {STORAGES.map((s) => {
              const st = storageStock(s);
              const out = st ? !st[0] : false;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={order.storage === s}
                  disabled={out}
                  className={`es-seg${order.storage === s ? ' is-selected' : ''}${out ? ' is-out' : ''}`}
                  onClick={() => run('storage', s)}
                >
                  {s}
                  {st && <span className="es-seg-note">{st[1]}</span>}
                </button>
              );
            })}
          </div>
        </div>
        {!stock && (
          <span className="es-ok" style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Tick size={16} color="#1E6B37" /> In stock · eSIM-ready
          </span>
        )}
        <Refused reason={reason} />
      </div>
    </div>
  );
}

/* ---------- plan ---------- */

const INTENT_LINE = {
  'travel:MY': 'Malaysia roaming decides the plan for your trips.',
  'travel:JP': 'Roaming in Japan decides the plan for your trip.',
  local: "Roaming shouldn't decide the plan for local use."
};

function PlanFitCompare({ variant, props = {}, order, act }) {
  const [run, reason] = useAct(act);
  const model = MODELS[order.model] || MODELS.promax;
  const priced = (id) => model.device[id] !== undefined;
  const recommended = priced(props.recommended) ? props.recommended : order.plan;
  const others = ['L', 'M', 'S'].filter((id) => id !== recommended && priced(id));
  const compareWith = props.compareWith && props.compareWith !== recommended && priced(props.compareWith)
    ? props.compareWith
    : others[0];
  const shown = [recommended, compareWith].filter(Boolean);
  const compact = variant === 'compact';
  const over = (id) => priceOf({ ...order, plan: id }).over24;

  return (
    <div className="es-stack">
      <div className="es-card-head">
        <h2 className="es-h2">Your plan</h2>
        {props.intent && <span className="es-note">{INTENT_LINE[props.intent]}</span>}
      </div>
      {props.reason && <p style={{ color: '#4A4A4A' }}>{props.reason}</p>}
      <div className="es-grid-2">
        {shown.map((id, i) => {
          const plan = PLANS[id];
          const m = planMonthly(order, id);
          const diff = i > 0 ? over(id) - over(recommended) : 0;
          return (
            <Option key={id} compact={compact} selected={order.plan === id} onClick={() => run('plan', id)}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                <span className={`es-pill ${i === 0 ? 'is-brand' : 'is-grey'}`}>{i === 0 ? 'Best fit' : 'Alternative'}</span>
                <span className="es-note">24 mths</span>
              </span>
              <span style={{ fontSize: compact ? 20 : 26, fontWeight: 900 }}>{plan.name}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                {m !== plan.monthly && (
                  <span className="es-muted" style={{ fontSize: 16, textDecoration: 'line-through' }}>${plan.monthly}</span>
                )}
                <span style={{ fontSize: compact ? 22 : 30, fontWeight: 900 }}>{money(m).replace('.00', '')}</span>
                <span className="es-muted" style={{ fontSize: 14 }}>/mth · device {money(model.device[id]).replace('.00', '')}</span>
              </span>
              {!compact && <Features items={[{ text: <><strong>Roaming:</strong> {ROAMING[id]}</> }]} />}
              <span className="es-note">
                {i === 0
                  ? `24 months: ${money(over(id))}`
                  : `24 months: ${money(over(id))} · ${diff < 0 ? `${money(-diff)} less` : `${money(diff)} more`}`}
              </span>
            </Option>
          );
        })}
      </div>
      <Refused reason={reason} />
      <p className="es-note">
        Other plans hidden — they don't fit what you told us. <button type="button" className="es-link">Show all plans</button>
      </p>
    </div>
  );
}

const DEST = {
  MY: { name: 'Malaysia', line: (o) => (o.plan === 'L' ? 'Unlimited data in Malaysia' : '50GB Malaysia data') },
  JP: { name: 'Japan', line: (o) => ({ L: '12GB worldwide data covers Japan', M: '10GB Asia data covers Japan', S: '4GB Asia data covers Japan' }[o.plan]) }
};

function RoamingReady({ props = {}, order }) {
  const d = DEST[props.destination || order.trip?.destination] || DEST.MY;
  return (
    <Card title={`Roaming ready for ${d.name}`} right={<span className="es-pill is-ok">On by default</span>}>
      <Features
        items={[
          { text: <><strong>{d.line(order)}</strong> on {PLANS[order.plan].name}</> },
          { text: 'Switches on when you land — no add-on to buy' },
          { text: "We'll text you at 80% of your roaming data" }
        ]}
      />
      {order.trip?.date && <p className="es-note">Trip: {order.trip.date}</p>}
    </Card>
  );
}

/* ---------- price ---------- */

function PriceExplainer({ order, price }) {
  return (
    <Card soft>
      <h3 className="es-h3">How you get to {money(price.payNow)} today</h3>
      <div className="es-ledger">
        {price.lines.map((l, i) => (
          <Row
            key={i}
            label={l.label}
            value={l.amount === 0 ? 'Free' : l.amount < 0 ? `−${money(-l.amount)}` : money(l.amount)}
            neg={l.amount < 0}
          />
        ))}
        {order.tradeIn && (
          <>
            <Row label="Subtotal" value={money(price.subtotal)} sub />
            <Row
              label={`Trade-in · ${order.tradeIn.model} (estimate)`}
              value={`−${money(order.payout === 'credit' ? Math.min(price.estimate, price.subtotal) : 0)}`}
              neg
            />
          </>
        )}
        {order.payAt === 'store' && <Row label="Paid in store at collection" value={`−${money(price.today)}`} neg />}
        <Row label="Payable today" value={money(price.payNow)} total />
        {price.credit > 0 && <Row label="Bill credit from trade-in" value={money(price.credit)} />}
      </div>
    </Card>
  );
}

/* ---------- number ---------- */

function NumberPicker({ order, act }) {
  const [run, reason] = useAct(act);
  return (
    <Card title="Choose your number" right={<span className="es-pill is-ok">eSIM · free</span>}>
      <div className="es-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {NUMBERS.map((n) => (
          <Option key={n.num} compact selected={order.number === n.num} onClick={() => run('number', n.num)}>
            <span className="es-option-title" style={{ fontSize: 18, letterSpacing: 0.5 }}>{n.num}</span>
            <span className="es-option-sub">{n.tag || 'Available'}</span>
          </Option>
        ))}
      </div>
      <Refused reason={reason} />
      <p className="es-note">Your iPhone supports eSIM — it arrives by email, so there's no SIM card to wait for.</p>
    </Card>
  );
}

/* ---------- add-ons ---------- */

function TradeOffDecision({ order, act }) {
  const [run, reason] = useAct(act);
  const keep = priceOf({ ...order, swop: true });
  const skip = priceOf({ ...order, swop: false });
  const net = SWOP_FEES - SWOP_DISCOUNT;
  const p = priceOf(order);
  const overBudget = order.budget && p.monthly > order.budget ? p.monthly - order.budget : 0;
  return (
    <Card title="Is MobileSwop Plus worth it for you?">
      <p style={{ color: '#4A4A4A' }}>
        It takes {money(SWOP_DISCOUNT)} off the phone today, but costs {money(SWOP_MONTHLY)} a month for 24 months. Keep it if you'd use a swop,
        battery replacement or device refresh in the next two years.
      </p>
      <div className="es-grid-2">
        <Option selected={order.swop} onClick={() => run('swop', true)}>
          <span className="es-option-title">Keep MobileSwop Plus</span>
          <div className="es-ledger" style={{ fontSize: 14 }}>
            <Row label="Today" value={<strong>{money(keep.payNow)}</strong>} />
            <Row label={`Add-on, 24 × ${money(SWOP_MONTHLY)}`} value={money(SWOP_FEES)} />
            <Row label="Net cost of the cover" value={money(net)} total />
          </div>
          <span className="es-note">Unlimited swops, battery replacement, device refresh</span>
        </Option>
        <Option selected={!order.swop} onClick={() => run('swop', false)}>
          <span className="es-option-title">Skip it</span>
          <div className="es-ledger" style={{ fontSize: 14 }}>
            <Row label="Today" value={<strong>{money(skip.payNow)}</strong>} />
            <Row label="Add-on" value="$0" />
            <Row label="Saves over 24 mths" value={money(net)} total />
          </div>
          <span className="es-note">Standard Apple warranty only</span>
        </Option>
      </div>
      {overBudget > 0 && (
        <p className="es-callout">
          {money(overBudget)} over your ~${order.budget} budget{order.swop ? ' with MobileSwop' : ''}.
          {order.swop ? ` Skipping it brings you to ${money(skip.monthly)}/mth.` : ''}
        </p>
      )}
      <Refused reason={reason} />
    </Card>
  );
}

function TrialTransparency({ order, price, act }) {
  const [run, reason] = useAct(act);
  const anyOn = TRIALS.some((t) => order.trials?.[t.id]);
  return (
    <Card
      title="Free trials"
      right={
        <span style={{ fontSize: 14, color: '#4A4A4A' }}>
          After trials end: <strong style={{ color: '#141414' }}>+{money(price.trialsMonthly)}/mth</strong>
        </span>
      }
    >
      {!anyOn && <p className="es-ok-text">None — nothing will start charging later.</p>}
      <div>
        {TRIALS.map((t) => (
          <div key={t.id} className="es-setting">
            <div className="es-setting-body">
              <span style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</span>
              <span className="es-note">Free for {t.free} · then {money(t.price)}/mth from {t.from}</span>
            </div>
            {t.match && <span className="es-pill is-brand-soft">In your plan promo</span>}
            <Switch on={!!order.trials?.[t.id]} label={t.name} onToggle={() => run('trials', { [t.id]: !order.trials?.[t.id] })} />
          </div>
        ))}
        <div className="es-setting">
          <div className="es-setting-body" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Bell size={20} aria-hidden="true" />
            <span>Remind me 7 days before any trial starts charging</span>
          </div>
          <Switch on={order.remind} label="Trial reminders" onToggle={() => run('remind', !order.remind)} />
        </div>
      </div>
      <Refused reason={reason} />
    </Card>
  );
}

function AccessoryPick({ order, act }) {
  const [run, reason] = useAct(act);
  return (
    <div className="es-card" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" style={{ flex: 'none' }}>
        <rect width="72" height="72" rx="16" fill="#F6F6F8" />
        <rect x="18" y="26" width="36" height="28" rx="10" fill="#FFFFFF" stroke="#D4D4DA" />
        <circle cx="29" cy="20" r="6" fill="#FFFFFF" stroke="#D4D4DA" />
        <circle cx="43" cy="20" r="6" fill="#FFFFFF" stroke="#D4D4DA" />
      </svg>
      <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#B0102A', letterSpacing: '0.04em' }}>
          ONE PICK · {money(PODS.was - PODS.price).replace('.00', '')} OFF WITH THIS PHONE
        </span>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{PODS.name}</span>
        <span style={{ fontSize: 14 }}>
          <span className="es-muted" style={{ textDecoration: 'line-through' }}>{money(PODS.was)}</span> <strong>{money(PODS.price)}</strong>
        </span>
        <Refused reason={reason} />
      </div>
      {order.pods ? (
        <Btn ghost onClick={() => run('pods', false)}><Check size={16} aria-hidden="true" /> Added · Remove</Btn>
      ) : (
        <Btn ghost onClick={() => run('pods', true)}>Add</Btn>
      )}
    </div>
  );
}

/* ---------- checkout ---------- */

function VerifiedIdentity() {
  return (
    <Card
      title="You"
      right={<span className="es-pill is-ok"><ShieldCheck size={14} aria-hidden="true" /> Verified with Singpass</span>}
    >
      <div className="es-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {[
          ['Name', CUSTOMER.fullName],
          ['NRIC', CUSTOMER.nric],
          ['Contact', CUSTOMER.phone],
          ['Email', CUSTOMER.email],
          ['Address', CUSTOMER.address]
        ].map(([k, v]) => (
          <div key={k} className="es-stack" style={{ gap: 2 }}>
            <span className="es-note">{k}</span>
            <strong style={{ fontSize: 15 }}>{v}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AccountChooser({ order, act }) {
  const [run, reason] = useAct(act);
  return (
    <Card title="Bill it to">
      <div className="es-stack" style={{ gap: 10 }}>
        {ACCOUNTS.map((a) => (
          <Option key={a.id} row compact selected={order.account === a.id} onClick={() => run('account', a.id)}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span className="es-option-title">{a.title}</span>
              <span className="es-option-sub">{a.sub}</span>
            </span>
            {a.id === 'main' && <span className="es-pill is-grey">Primary</span>}
          </Option>
        ))}
      </div>
      <Refused reason={reason} />
    </Card>
  );
}

function PaySummary({ order, price }) {
  return (
    <Card title="Pay today">
      <div className="es-ledger" style={{ fontSize: 15 }}>
        <Row label={order.payAt === 'store' ? 'Pay now (rest in store)' : 'Pay today, GST incl.'} value={money(price.payNow)} total />
        {price.credit > 0 && <Row label="Trade-in bill credit" value={money(price.credit)} />}
      </div>
      <div className="es-ledger es-divider-top" style={{ fontSize: 14 }}>
        <strong>On your first bill</strong>
        {price.monthlyLines.map((l) => <Row key={l.label} label={l.label} value={money(l.amount)} />)}
        {price.registration > 0 && <Row label="Service registration, one-time" value={money(price.registration)} />}
        {price.registration > 0 && <Row label="5G activation" value="Waived" />}
        <Row label="First bill" value={money(price.firstBill)} total />
      </div>
    </Card>
  );
}

/* ---------- done ---------- */

function PostOrderTimeline({ order, price }) {
  const c = colorOf(order.color);
  const shop = shopOf(order);
  const model = MODELS[order.model] || MODELS.promax;
  const steps = [
    order.fulfil === 'collect'
      ? {
          t: `${order.collectWhen === 'tonight' ? 'Tonight' : 'Wed 28 Oct, 11am'} · collect at ${shop?.short || 'the shop'}`,
          d: `${c.name} ${order.storage} held for you. Set up with you at the counter.${order.payAt === 'store' ? ` Pay ${money(price.today)} there.` : ''}`
        }
      : { t: `${slotOf(order).label.replace(' · ', ', ')} · ${model.name} arrives`, d: `To ${CUSTOMER.address}. We'll text you when the driver is 30 min away.` },
    order.tradeIn && { t: 'Same visit · courier collects your old phone', d: `${order.tradeIn.model} checked on the spot; estimate ${money(price.estimate)}.` },
    order.lineType === 'port'
      ? { t: 'Fri 30 Oct · your number moves', d: `${order.portNumber} switches from ${order.portTelco}. If it slips past Tue 3 Nov, we'll text you.` }
      : order.lineType === 'new' && { t: 'Same day · eSIM in your inbox', d: `Scan it on the new iPhone. ${order.number} goes live in minutes.` },
    order.childLine && { t: 'Child line · eSIM to your email', d: 'Parental controls are on from the first minute.' },
    { t: `First bill · ${money(price.firstBill)}`, d: `${money(price.monthly)} monthly${price.registration ? ` plus the ${money(price.registration)} one-time registration fee` : ''}.` },
    price.credit > 0 && { t: `Next bill · ${money(price.credit)} credit`, d: 'Comes off your bills until it is used up.' },
    order.trials?.prime && { t: 'Late Jan · Amazon Prime trial ends', d: `Becomes $4.99/mth.${order.remind ? " We'll remind you 7 days before." : ''}` }
  ].filter(Boolean);
  return (
    <Card title="What happens next">
      <Timeline steps={steps} />
    </Card>
  );
}

function BillExplainer({ price }) {
  return (
    <Card soft title="Your first bill, explained">
      <div className="es-ledger" style={{ fontSize: 14 }}>
        {price.monthlyLines.map((l) => <Row key={l.label} label={l.label} value={money(l.amount)} />)}
        <Row label="Every month" value={money(price.monthly)} sub />
        {price.registration > 0 && <Row label="Service registration, one-time" value={money(price.registration)} />}
        <Row label="First bill" value={money(price.firstBill)} total />
      </div>
      {price.trialsMonthly > 0 && (
        <p className="es-note">Trials add {money(price.trialsMonthly)}/mth only if you keep them after the free period.</p>
      )}
    </Card>
  );
}

export const CORE = {
  ContextSignals,
  IntentSplitter,
  DeviceConfigurator,
  PlanFitCompare,
  RoamingReady,
  PriceExplainer,
  NumberPicker,
  TradeOffDecision,
  TrialTransparency,
  AccessoryPick,
  VerifiedIdentity,
  AccountChooser,
  PaySummary,
  PostOrderTimeline,
  BillExplainer
};
