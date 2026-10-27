/**
 * Dynamic buyflow — journey components (shop, fulfilment, port-in, trade-in,
 * multi-line, payment). Every component follows the registry contract:
 *
 *   ({ variant, props, order, price, act }) => block
 *
 * Numbers come only from price(order) or price({ ...order, ...change }) for
 * "what if" figures. Taps go through act({ key, value }), which runs the rules
 * engine and returns { ok, reason }; a rejected tap shows its reason inline.
 */

import React, { useState } from 'react';
import { QrCode, Truck, Check, AlertCircle, Package, ShieldCheck, Store } from 'lucide-react';
import { PLANS, SLOTS, CUSTOMER, NEW_LINE_OFFER, SIM_PLANS, DELIVERY_FEE, DELIVERY_USUAL, money } from '../../data';
import { RESERVATION, CHILD_CONTROLS } from '../../s1data';
import { Card, Option, Switch, Btn, Row } from '../../ui';
import { Timeline } from '../../MainFlow';
import { SHOPS, TELCOS, PORT_DISCOUNT, price as priceOf } from '../model';

/* ---------------- Shared ---------------- */

/** Wraps act() so a rejected tap shows its reason under the component. */
function useAct(act) {
  const [reason, setReason] = useState(null);
  const run = (...ops) => {
    for (const op of ops) {
      const r = act(op) || { ok: true };
      if (!r.ok) {
        setReason(r.reason);
        return false;
      }
    }
    setReason(null);
    return true;
  };
  return [run, reason];
}

function Reason({ text }) {
  if (!text) return null;
  return (
    <p className="es-note" role="alert" style={{ color: 'var(--es-warn)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <AlertCircle size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 1 }} />
      <span>{text}</span>
    </p>
  );
}

const delta = (n) => (Math.abs(n) < 0.005 ? 'Same price' : `${n > 0 ? '+' : '−'}${money(Math.abs(n))} today`);
const shopOf = (id) => SHOPS.find((s) => s.id === id) || SHOPS[0];
const slotLabel = (id) => (SLOTS.find((s) => s.id === id) || SLOTS[1]).label;
const colorName = (id) => id.charAt(0).toUpperCase() + id.slice(1);

/* ---------------- Fulfilment ---------------- */

function ShopMap({ selected }) {
  const pins = [
    { id: 'TPN', letter: 'A', x: 250, y: 150 },
    { id: 'BDK', letter: 'B', x: 110, y: 230 },
    { id: 'PSR', letter: 'C', x: 330, y: 60 }
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
        <path d="M330 0 C 360 40, 400 50, 420 40 L 420 0 Z" fill="#CFE0EE" />
        <circle cx="232" cy="176" r="28" fill="#3A3FD9" fillOpacity="0.12" />
        <circle cx="232" cy="176" r="8" fill="#3A3FD9" stroke="#FFFFFF" strokeWidth="3" />
        <text x="246" y="200" fontSize="12" fontWeight="700" fill="#272BA8">You · Tampines</text>
        {pins.map((p) => (
          <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
            <path d="M0 0 C -14 -16, -14 -34, 0 -34 C 14 -34, 14 -16, 0 0 Z" fill={selected === p.id ? '#3A3FD9' : '#6B6B73'} />
            <text x="0" y="-19" textAnchor="middle" fontSize="12" fontWeight="900" fill="#FFFFFF">{p.letter}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ShopAvailability({ variant = 'list+map', order, act }) {
  const [run, reason] = useAct(act);
  const selected = order.fulfil === 'collect' ? order.shop : null;
  return (
    <Card title={`${colorName(order.color)} · ${order.storage} near you`}>
      {variant === 'list+map' && <ShopMap selected={selected} />}
      <div className="es-stack" style={{ gap: 10 }}>
        {SHOPS.map((s) => (
          <Option key={s.id} row compact selected={selected === s.id} onClick={() => run({ key: 'shop', value: s.id })}>
            <span className="es-letter">{s.letter}</span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, opacity: s.ok ? 1 : 0.6 }}>
              <span className="es-option-title" style={{ fontSize: 15 }}>{s.name}</span>
              <span className="es-option-sub">{s.distance} · open till {s.close}</span>
            </span>
            <span className={`es-pill is-${s.tone}`}>{s.stock}</span>
          </Option>
        ))}
      </div>
      <Reason text={reason} />
      <p className="es-note">Stock counts and distances are illustrative.</p>
    </Card>
  );
}

function ReservationCard({ order }) {
  const shop = shopOf(order.shop);
  const tonight = order.collectWhen === 'tonight';
  return (
    <Card title="Your reservation" right={<span className="es-pill is-ok">Held for you</span>}>
      <div className="es-row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <Store size={22} color="#3A3FD9" aria-hidden="true" style={{ flex: 'none' }} />
        <div className="es-stack" style={{ gap: 4 }}>
          <strong>{shop.name}</strong>
          <span className="es-muted">{shop.distance} · open till {shop.close}</span>
        </div>
      </div>
      <div className="es-ledger">
        <Row label="Ready" value={tonight ? 'Tonight, from 7pm' : RESERVATION.ready} />
        <Row label="Held until" value={tonight ? 'Wed 28 Oct, 9pm' : RESERVATION.held} />
        <Row label="Bring" value="Your NRIC or Singpass app" />
      </div>
      <p className="es-note">Show the QR code from your confirmation email at the counter.</p>
    </Card>
  );
}

function FulfilmentSlots({ order, act }) {
  const [run, reason] = useAct(act);
  return (
    <Card title="Doorstep delivery" right={<span className="es-muted">{money(DELIVERY_FEE)} · usual {money(DELIVERY_USUAL)}</span>}>
      <p className="es-muted">To {CUSTOMER.address}. Someone 18 or older signs for it.</p>
      <div className="es-grid-2">
        {SLOTS.map((s) => (
          <Option
            key={s.id}
            compact
            selected={order.fulfil === 'door' && order.slot === s.id}
            onClick={() => run({ key: 'slot', value: s.id })}
          >
            <span className="es-row" style={{ gap: 8 }}>
              <Truck size={18} aria-hidden="true" />
              <span className="es-option-title" style={{ fontSize: 15 }}>{s.label}</span>
            </span>
          </Option>
        ))}
      </div>
      <Reason text={reason} />
    </Card>
  );
}

function FulfilmentRecompute({ order, price, act }) {
  const [run, reason] = useAct(act);
  const options = [
    {
      id: 'tonight',
      title: 'Graphite tonight at Tampines',
      sub: 'Burgundy is not on the shelf tonight. Free.',
      change: { fulfil: 'collect', shop: 'TPN', color: 'graphite', collectWhen: 'tonight', payAt: 'now' },
      ops: [
        { key: 'fulfil', value: 'collect' }, { key: 'shop', value: 'TPN' },
        { key: 'color', value: 'graphite' }, { key: 'collectWhen', value: 'tonight' }
      ]
    },
    {
      id: 'tomorrow',
      title: 'Burgundy tomorrow 11am at Tampines',
      sub: 'Keeps your colour. Free.',
      tag: 'Keeps your colour',
      change: { fulfil: 'collect', shop: 'TPN', color: 'burgundy', collectWhen: 'tomorrow', payAt: 'now' },
      ops: [
        { key: 'fulfil', value: 'collect' }, { key: 'shop', value: 'TPN' },
        { key: 'color', value: 'burgundy' }, { key: 'collectWhen', value: 'tomorrow' }
      ]
    },
    {
      id: 'keep',
      title: `Keep ${slotLabel('fri').split(' · ')[0]} delivery`,
      sub: `${money(DELIVERY_FEE)} doorstep delivery.`,
      change: { fulfil: 'door', slot: 'fri', payAt: 'now' },
      ops: [{ key: 'fulfil', value: 'door' }, { key: 'slot', value: 'fri' }]
    }
  ];
  const isSelected = (o) => Object.entries(o.change).every(([k, v]) => k === 'payAt' || order[k] === v);
  return (
    <Card title="Ways to get it sooner">
      <div className="es-stack" style={{ gap: 10 }}>
        {options.map((o) => {
          const d = priceOf({ ...order, ...o.change }).payNow - price.payNow;
          return (
            <Option key={o.id} row compact selected={isSelected(o)} onClick={() => run(...o.ops)}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="es-option-title" style={{ fontSize: 15 }}>{o.title}</span>
                <span className="es-option-sub">{o.sub}</span>
              </span>
              <span className="es-stack" style={{ gap: 4, alignItems: 'flex-end' }}>
                {o.tag && <span className="es-pill is-brand-soft">{o.tag}</span>}
                <span className={d < 0 ? 'es-ok-text' : 'es-muted'} style={{ fontSize: 13 }}>{delta(d)}</span>
              </span>
            </Option>
          );
        })}
      </div>
      <Reason text={reason} />
      <p className="es-note">Shelf stock is illustrative.</p>
    </Card>
  );
}

function DeadlineFeasibility({ props = {}, order }) {
  const deadline = props.deadline || order.trip?.date || 'Thu 5 Nov';
  const port = order.lineType === 'port';
  const steps = [
    { t: 'Tue 27 Oct · You order', d: 'Today.' },
    { t: 'Thu 29 Oct · iPhone delivered', d: `${slotLabel(order.slot)} to your door.` },
    ...(port ? [{ t: 'Fri 30 Oct · Your number moves', d: `From ${order.portTelco}. Your old SIM stops working when it does.` }] : []),
    { t: `${deadline} · You fly`, d: 'Roaming is on before you leave.' }
  ];
  return (
    <Card title="Ready before your flight" right={<span className="es-pill is-ok"><Check size={13} aria-hidden="true" /> 6 days to spare</span>}>
      <Timeline steps={steps} />
      <p className="es-callout is-info">If the switch slips past Tue 3 Nov, we'll text you.</p>
      <p className="es-note">Switch dates are illustrative.</p>
    </Card>
  );
}

/* ---------------- Number ---------------- */

function PortInForm({ order, act }) {
  const [run, reason] = useAct(act);
  return (
    <Card title="Keep your number">
      <div className="es-row" style={{ gap: 16 }}>
        <div className="es-field">
          <label htmlFor="dyn-port-number">Number to keep</label>
          <input id="dyn-port-number" className="es-input" value={order.portNumber} readOnly />
        </div>
        <div className="es-field">
          <label htmlFor="dyn-port-telco">Current telco</label>
          <select
            id="dyn-port-telco"
            className="es-input"
            value={order.portTelco}
            onChange={(e) => run({ key: 'portTelco', value: e.target.value })}
          >
            {TELCOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="es-row" style={{ gap: 10 }}>
        <ShieldCheck size={20} color="#1E6B37" aria-hidden="true" />
        <span>Holder {CUSTOMER.fullName} · verified with Singpass</span>
      </div>
      <Reason text={reason} />
    </Card>
  );
}

function OfferUnlocked({ order, price }) {
  const plan = PLANS[order.plan];
  const after = Math.round(plan.monthly * (1 - PORT_DISCOUNT) * 100) / 100;
  return (
    <Card accent title="Port-in offer unlocked" right={<span className="es-pill is-brand">Unlocked</span>}>
      <div className="es-ledger">
        <Row label="Extra off a new phone" value={`−${money(NEW_LINE_OFFER)}`} neg />
        <Row label={`${plan.name} monthly`} value={`${money(plan.monthly)} → ${money(after)}`} />
      </div>
      <p className="es-muted">Applies because you're bringing your number. Pay today is now {money(price.payNow)}.</p>
    </Card>
  );
}

function OpenSlotsHandoff({ props = {} }) {
  const deferred = props.deferred?.length ? props.deferred : ['Number', 'Add-ons', 'MobileSwop'];
  return (
    <Card soft title="Finish these in store">
      <div className="es-row" style={{ gap: 8 }}>
        {deferred.map((d) => <span key={d} className="es-pill is-grey">{d}</span>)}
      </div>
      <p className="es-muted">Staff see the same order in the retail app, so nothing is re-typed. The $150 MobileSwop discount is decided there.</p>
    </Card>
  );
}

/* ---------------- Trade-in ---------------- */

const TI_QUESTIONS = [
  { key: 'screen', q: 'Is the screen free of cracks?', bad: 'Cracked (−$150)' },
  { key: 'battery', q: 'Is battery health 80% or more?', bad: 'Below 80% (−$50)' },
  { key: 'works', q: 'Does it work normally?', bad: "Doesn't work ($80 flat)" }
];

function TradeInEstimator({ order, price, act }) {
  const [run, reason] = useAct(act);
  const t = order.tradeIn || { model: 'iPhone 15 Pro', storage: '256GB', screen: 'ok', battery: 'ok', works: 'ok' };
  const set = (k, v) => run({ key: 'tradeIn', value: { ...t, [k]: v } });
  return (
    <Card title={`Trade in your ${t.model} · ${t.storage}`} right={<span className="es-pill is-ok">Estimate {money(price.estimate || priceOf({ ...order, tradeIn: t }).estimate)}</span>}>
      <div className="es-stack" style={{ gap: 14 }}>
        {TI_QUESTIONS.map((q) => (
          <div key={q.key} className="es-stack" style={{ gap: 8 }}>
            <strong>{q.q}</strong>
            <div className="es-row" style={{ gap: 8 }}>
              <Option compact selected={t[q.key] !== 'bad'} onClick={() => set(q.key, 'ok')}>Yes</Option>
              <Option compact selected={t[q.key] === 'bad'} onClick={() => set(q.key, 'bad')}>{q.bad}</Option>
            </div>
          </div>
        ))}
      </div>
      <Reason text={reason} />
      <p className="es-note">Trade-in values are illustrative. The courier confirms the estimate on the spot.</p>
    </Card>
  );
}

function TradeInLogistics({ order }) {
  const model = order.tradeIn?.model || 'iPhone 15 Pro';
  return (
    <Card title="Handing over your old phone">
      <Timeline
        steps={[
          { t: 'Fri 30 Oct, 9am–12pm · Courier visit', d: `Brings your new iPhone and collects your ${model} in one visit.` },
          { t: 'Checked on the spot', d: 'The courier confirms condition against your answers.' },
          { t: 'Value applied', d: 'As you chose below: off today, or as bill credit.' }
        ]}
      />
      <p className="es-note"><Package size={14} aria-hidden="true" /> Back up and sign out of your Apple ID before the visit.</p>
    </Card>
  );
}

function TradeInPayout({ order, price, act }) {
  const [run, reason] = useAct(act);
  const credit = priceOf({ ...order, payout: 'credit' });
  const pay = priceOf({ ...order, payout: 'pay' });
  const recommend = credit.estimate > credit.subtotal ? 'credit' : null;
  const options = [
    { id: 'credit', title: `Pay ${money(credit.payNow)} today + ${money(credit.credit)} bill credit`, sub: 'Trade-in covers the phone first; the rest comes off your bills.' },
    { id: 'pay', title: `Pay ${money(pay.payNow)} today + ${money(pay.credit)} bill credit`, sub: 'Pay the phone now and take the whole trade-in as credit.' }
  ];
  return (
    <Card title="How you get your trade-in value">
      <div className="es-stack" style={{ gap: 10 }}>
        {options.map((o) => (
          <Option key={o.id} row compact selected={order.payout === o.id} onClick={() => run({ key: 'payout', value: o.id })}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="es-option-title" style={{ fontSize: 15 }}>{o.title}</span>
              <span className="es-option-sub">{o.sub}</span>
            </span>
            {recommend === o.id && <span className="es-pill is-brand-soft">Recommended</span>}
          </Option>
        ))}
      </div>
      <p className="es-muted" style={{ fontSize: 13 }}>Subtotal {money(price.subtotal)} · estimate {money(price.estimate)}.</p>
      <Reason text={reason} />
    </Card>
  );
}

/* ---------------- Multi-line ---------------- */

function LineCard({ props = {}, order, price, act }) {
  const role = props.role || 'upgrade';
  if (role === 'new-child') {
    return (
      <Card title="Line 2 · Your child" right={<span className="es-pill is-grey">New line</span>}>
        <div className="es-ledger">
          <Row label="Phone" value="Hand-down of your current iPhone" />
          <Row label="Number" value="9638 8347 · eSIM" />
        </div>
        <span className="es-note">SIM Only plan</span>
        <div className="es-grid-2">
          {Object.values(SIM_PLANS).map((p) => (
            <Option key={p.id} compact selected={order.childPlan === p.id} onClick={() => act?.({ key: 'childPlan', value: p.id })}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                <strong>{p.name}</strong>
                <span>{money(p.monthly)}/mth</span>
              </span>
              <span className="es-muted" style={{ fontSize: 13 }}>{p.data} · {p.contract}</span>
            </Option>
          ))}
        </div>
      </Card>
    );
  }
  const plan = price.plan;
  return (
    <Card title={role === 'upgrade' ? 'Line 1 · You' : 'Your new line'} right={<span className="es-pill is-ok">{role === 'upgrade' ? 'Re-contract eligible' : 'New line'}</span>}>
      <div className="es-ledger">
        <Row label="Phone" value={`${price.model.name} · ${colorName(order.color)} · ${order.storage}`} />
        <Row label="Plan" value={`${plan.name} · ${money(plan.monthly)}/mth`} />
        <Row label="Number" value={role === 'upgrade' ? CUSTOMER.phone : `${order.number} · eSIM`} />
        <Row label="Phone today" value={money(price.device - (order.lineType === 'upgrade' ? 0 : NEW_LINE_OFFER))} />
      </div>
    </Card>
  );
}

function ParentalControls({ order, act }) {
  const [run, reason] = useAct(act);
  return (
    <Card title="Parental controls" right={<span className="es-muted">For line 2</span>}>
      <div className="es-stack" style={{ gap: 12 }}>
        {CHILD_CONTROLS.map((c) => (
          <div key={c.key} className="es-row" style={{ gap: 12, justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <strong>{c.name}</strong>
              <span className="es-muted" style={{ fontSize: 13 }}>{c.desc}{c.price ? ` · ${c.price}` : ''}</span>
            </span>
            <Switch
              on={!!order.controls?.[c.key]}
              label={c.name}
              onToggle={() => run({ key: 'controls', value: { [c.key]: !order.controls?.[c.key] } })}
            />
          </div>
        ))}
      </div>
      <Reason text={reason} />
    </Card>
  );
}

function GroupedCart({ order, price }) {
  const plan = price.plan;
  return (
    <Card title="One cart, both lines">
      <div className="es-ledger">
        <Row label={`Line 1 · ${price.model.name}`} value={`${money(plan.monthly)}/mth`} />
        {order.childLine && <Row label={`Line 2 · ${(SIM_PLANS[order.childPlan] || SIM_PLANS.lite).name}`} value={`${money((SIM_PLANS[order.childPlan] || SIM_PLANS.lite).monthly)}/mth`} />}
        {price.lines.map((l) => (
          <Row key={l.label} label={l.label} value={l.amount < 0 ? `−${money(-l.amount)}` : l.amount ? money(l.amount) : 'Free'} neg={l.amount < 0} sub />
        ))}
        <Row label="Pay today" value={money(price.payNow)} total />
        <Row label="Monthly, both lines" value={money(price.monthly)} />
      </div>
      <p className="es-muted" style={{ fontSize: 13 }}>Billed together to the account ending {order.account === 'second' ? '0912' : '4471'}.</p>
    </Card>
  );
}

const HANDDOWN = [
  { t: 'Back up and move your data to the new iPhone', d: 'Use Quick Start with both phones side by side.' },
  { t: 'Sign out of your Apple ID on the old phone', d: 'Settings, your name, Sign Out. Turns off Find My too.' },
  { t: 'Reset the old phone', d: 'Erase All Content and Settings.' },
  { t: "Install your child's eSIM", d: 'Scan the QR code we email for 9638 8347.' }
];

function HandDownChecklist() {
  return (
    <Card title="Handing your phone down">
      <ol className="es-stack" style={{ gap: 12 }}>
        {HANDDOWN.map((s, i) => (
          <li key={s.t} className="es-row" style={{ gap: 12, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <span className="es-letter">{i + 1}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <strong>{s.t}</strong>
              <span className="es-muted" style={{ fontSize: 13 }}>{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="es-note"><QrCode size={14} aria-hidden="true" /> We email the eSIM QR code once the order is placed.</p>
    </Card>
  );
}

/* ---------------- Payment ---------------- */

function VoucherApply({ props = {}, order, act }) {
  const [run, reason] = useAct(act);
  const [code, setCode] = useState(props.code || order.voucher || '');
  const applied = order.voucher;
  return (
    <Card title="Voucher" right={applied ? <span className="es-pill is-ok">{applied} applied</span> : null}>
      <form
        className="es-row"
        style={{ gap: 10, alignItems: 'flex-end' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) run({ key: 'voucher', value: code.trim() });
        }}
      >
        <div className="es-field">
          <label htmlFor="dyn-voucher">Code</label>
          <input id="dyn-voucher" className="es-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. WELCOME50" />
        </div>
        <Btn type="submit" disabled={!code.trim()}>Apply</Btn>
        {applied && <Btn ghost onClick={() => run({ key: 'voucher', value: 'none' })}>Remove</Btn>}
      </form>
      <Reason text={reason} />
      <p className="es-note">Voucher codes are illustrative.</p>
    </Card>
  );
}

function PaymentTiming({ order, price, act }) {
  const [run, reason] = useAct(act);
  const now = priceOf({ ...order, payAt: 'now' }).payNow;
  const collect = order.fulfil === 'collect';
  return (
    <Card title="When you pay">
      <div className="es-grid-2">
        <Option compact selected={order.payAt !== 'store'} onClick={() => run({ key: 'payAt', value: 'now' })}>
          <span className="es-option-title" style={{ fontSize: 15 }}>Pay now · {money(now)}</span>
          <span className="es-option-sub">Faster pick-up at the counter.</span>
        </Option>
        <Option compact selected={order.payAt === 'store'} disabled={!collect} onClick={() => run({ key: 'payAt', value: 'store' })}>
          <span className="es-option-title" style={{ fontSize: 15 }}>Pay in store · $0.00 now</span>
          <span className="es-option-sub">{collect ? 'Pay when you collect.' : 'Only when you collect at a shop.'}</span>
        </Option>
      </div>
      <p className="es-muted" style={{ fontSize: 13 }}>Due {order.payAt === 'store' ? 'at collection' : 'today'}: {money(order.payAt === 'store' ? price.today : price.payNow)}</p>
      <Reason text={reason} />
    </Card>
  );
}

export const JOURNEYS = {
  ShopAvailability,
  ReservationCard,
  FulfilmentSlots,
  FulfilmentRecompute,
  DeadlineFeasibility,
  PortInForm,
  OfferUnlocked,
  OpenSlotsHandoff,
  TradeInEstimator,
  TradeInLogistics,
  LineCard,
  ParentalControls,
  GroupedCart,
  HandDownChecklist,
  VoucherApply,
  TradeInPayout,
  PaymentTiming
};
