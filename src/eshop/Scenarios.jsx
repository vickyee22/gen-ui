/**
 * EShop Buyflow — scenario journeys.
 * A · Shop first   B · Two lines   C · Port-in + trip   D · Pivot at checkout   E · Trade-in
 */

import React, { useState } from 'react';
import { MapPin, QrCode, ArrowLeftRight, Truck, Plane, Check, AlertCircle, Smartphone, Package } from 'lucide-react';
import {
  CUSTOMER, PLANS, SHOPS, ACCOUNTS, NEW_LINE_OFFER, SWOP_DISCOUNT, DELIVERY_FEE, PROMPTS, money, priceMain, colorOf
} from './data';
import {
  Page, UserSays, AgentSays, Card, Option, Switch, Btn, Row, Aside, AsideProduct, SumRow,
  Features, Agree, PhoneArt, Tick
} from './ui';
import { DeviceConfigurator, PlanHead, PlanPrice, PaySummary, ConfirmedHead, Timeline, NextActions, orderNo, slotProps } from './MainFlow';
import { ChatComposer, Recomposed, Gen, CLabel, SlotDiff } from './agent';

const SHOP_CODE = { A: 'TPN', B: 'BDK', C: 'PSR' };

/** Confirm-first switch to a plan with a higher device price. */
function planConfirm({ from, to, beforeToday, afterToday, beforeMonthly, afterMonthly, note, onConfirm }) {
  return {
    message: `${PLANS[to].name} lowers your monthly but the phone costs more upfront. Here is the trade-off first.`,
    confirm: {
      title: `Switch to ${PLANS[to].name}?`,
      before: { today: beforeToday, monthly: beforeMonthly },
      after: { today: afterToday, monthly: afterMonthly },
      note,
      confirmLabel: 'Switch plan',
      cancelLabel: `Keep ${PLANS[from].name}`,
      onConfirm,
      confirmedText: 'Switched. Only the plan changed.'
    }
  };
}

/* ======================= A · Shop first ======================= */

function ShopMap({ selected }) {
  const pin = (id) => (selected === id ? '#3A3FD9' : '#6B6B73');
  const pins = [
    { id: 'A', x: 250, y: 150 },
    { id: 'B', x: 110, y: 230 },
    { id: 'C', x: 330, y: 60 }
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
            <path d="M0 0 C -14 -16, -14 -34, 0 -34 C 14 -34, 14 -16, 0 0 Z" fill={pin(p.id)} />
            <text x="0" y="-19" textAnchor="middle" fontSize="12" fontWeight="900" fill="#FFFFFF">{p.id}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function ShopAvail({ go, prompt, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const shop = scenario.shop || 'A';
  const current = SHOPS.find((s) => s.id === shop);
  const pickShop = (id) => () => {
    if (shop === id) return `${current.short} is already selected.`;
    const next = SHOPS.find((s) => s.id === id);
    if (!next.ok) return `${next.short} is out until Thu. Tampines or Bedok can hand it to you today.`;
    applyChange({ slot: 'shop', label: 'Shop', from: current.short, to: next.short, scenario: { shop: id } });
    return `Switched to ${next.short} — ${next.stock.toLowerCase()}, ${next.distance} away.`;
  };
  const script = [
    { match: /bedok/i, run: pickShop('B') },
    { match: /pasir ris/i, run: pickShop('C') },
    { match: /tampines/i, run: pickShop('A') }
  ];
  return (
    <Page aside={<ShopMap selected={shop} />}>
      <UserSays>{prompt || PROMPTS.shop}</UserSays>
      <AgentSays>
        Three shops near Tampines. Burgundy 256GB is on the shelf at two of them today. Pick one and I'll show only what that shop can hand you.
      </AgentSays>

      <Recomposed {...slotProps('shop', changeFor, undoChange)} name='ShopAvailability sku="IP18PM-BUR-256" variant="list+map"' minHeight={260}>
      <Card title="Burgundy · 256GB near you">
        <div className="es-stack" style={{ gap: 10 }}>
          {SHOPS.map((s) => (
            <Option key={s.id} row compact selected={shop === s.id} disabled={!s.ok} onClick={() => setScenario({ shop: s.id })}>
              <span className="es-letter">{s.id}</span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, opacity: s.ok ? 1 : 0.6 }}>
                <span className="es-option-title" style={{ fontSize: 15 }}>{s.name}</span>
                <span className="es-option-sub">{s.distance} · open till {s.close} · {s.queue}</span>
              </span>
              <span className={`es-pill is-${s.tone}`}>{s.stock}</span>
            </Option>
          ))}
        </div>
        <p className="es-note">Live stock, refreshed when you open this page. Stock counts and distances shown are illustrative. <button type="button" className="es-link">Prefer delivery instead?</button></p>
      </Card>
      </Recomposed>

      <div className="es-row">
        <Btn onClick={() => go('shopFit')}><MapPin size={18} /> Collect at {current.short} — continue</Btn>
        <Btn ghost>Book a set-up appointment</Btn>
      </div>

      <ChatComposer script={script} suggestions={['Bedok is closer to work — use that']} />
    </Page>
  );
}

const SHOP_COLORS = [
  { id: 'burgundy', name: 'Burgundy', hex: '#5B1E2A', ok: true, note: '3 here' },
  { id: 'graphite', name: 'Graphite', hex: '#2E2E30', ok: true, note: '5 here' },
  { id: 'white', name: 'White', hex: '#F2F1EE', ok: true, note: '1 here' },
  { id: 'silver', name: 'Silver', hex: '#D9DCE0', ok: false, note: 'Bedok has 2' }
];
const SHOP_STORAGES = [
  { label: '256GB', ok: true, note: 'In stock' },
  { label: '512GB', ok: true, note: '1 left' },
  { label: '1TB', ok: false, note: 'Order in' },
  { label: '2TB', ok: false, note: 'Order in' }
];

function shopName(scenario) {
  return SHOPS.find((s) => s.id === (scenario.shop || 'A'));
}

export function ShopFit({ order, setOrder, go, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const shop = shopName(scenario);
  const script = [
    {
      match: /too (much|expensive)|cheaper|lower monthly|enhanced m/i,
      run: () => {
        if (order.plan === 'M') return 'You are already on Enhanced M.';
        return planConfirm({
          from: order.plan,
          to: 'M',
          beforeToday: PLANS[order.plan].device - NEW_LINE_OFFER,
          afterToday: PLANS.M.device - NEW_LINE_OFFER,
          beforeMonthly: PLANS[order.plan].monthly,
          afterMonthly: PLANS.M.monthly,
          note: '$270 more upfront, $30 less a month — $450 less over 24 months.',
          onConfirm: () => applyChange({ slot: 'plan', label: 'Plan', from: PLANS[order.plan].name, to: PLANS.M.name, order: { plan: 'M' } })
        });
      }
    },
    {
      match: /silver/i,
      run: () => `Silver isn't on the ${shop.short} shelf — Bedok has 2. Say "use Bedok" on the previous step, or pick another colour here.`
    }
  ];
  const defer = scenario.defer ?? true;
  const plan = PLANS[order.plan];
  const c = colorOf(order.color);
  return (
    <Page
      aside={
        <Aside title="Your reservation">
          <AsideProduct hex={c.hex} title="iPhone 18 Pro Max" sub={`${c.name} · ${order.storage} · ${plan.name}`} />
          <div className="es-sum">
            <SumRow label="Collect at" value={shop.name} />
            <SumRow label="Number, add-ons" value={defer ? 'In store' : 'Now, online'} />
            <SumRow label="Device after offer" value={money(plan.device - NEW_LINE_OFFER)} size="big" />
            <SumRow label="Monthly" value={money(plan.monthly)} size="mid" />
          </div>
          <p className="es-note">Includes the $381 new-line offer. Add-on discounts are applied when you choose add-ons.</p>
        </Aside>
      }
    >
      <AgentSays>
        This is what {shop.short} can hand you today. Anything greyed out isn't on their shelf — I'll tell you where it is instead.
      </AgentSays>

      <Gen name={`DeviceConfigurator mode="stock" shop="${SHOP_CODE[shop.id]}"`}>
        <DeviceConfigurator order={order} setOrder={setOrder} colors={SHOP_COLORS} storages={SHOP_STORAGES} />
      </Gen>

      <Recomposed {...slotProps('plan', changeFor, undoChange)} name='PlanFitCompare variant="compact"' minHeight={150}>
      <Card title="Plan">
        <p className="es-note">You compared Priority L twice this week, so it's first. The shop can walk you through the rest.</p>
        <div className="es-grid-2">
          {[
            { id: 'L', d: 'Unlimited local + Malaysia' },
            { id: 'M', d: 'Unlimited local · 50GB Malaysia' }
          ].map((p) => (
            <Option key={p.id} row compact selected={order.plan === p.id} onClick={() => setOrder({ plan: p.id })}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="es-option-title">{PLANS[p.id].name}</span>
                <span className="es-option-sub">{p.d}</span>
              </span>
              <strong>${PLANS[p.id].monthly}/mth</strong>
            </Option>
          ))}
        </div>
      </Card>
      </Recomposed>

      <Gen name="OpenSlotsHandoff">
      <Card title="Number and add-ons">
        <div className="es-grid-2">
          <Option compact selected={defer} onClick={() => setScenario({ defer: true })}>
            <span className="es-option-title">Decide in store</span>
            <span className="es-option-sub">Staff set up your number and eSIM with you</span>
          </Option>
          <Option compact selected={!defer} onClick={() => setScenario({ defer: false })}>
            <span className="es-option-title">Do it now</span>
            <span className="es-option-sub">Shorter visit — just collect and go</span>
          </Option>
        </div>
        {!defer && <p className="es-callout is-info">I'll add the same number and add-on steps from the online flow before you reserve.</p>}
        {defer && <p className="es-note">The $150 MobileSwop Plus discount is decided with you in store.</p>}
      </Card>
      </Gen>

      <div className="es-row">
        <Btn onClick={() => go('shopReserve')}>Reserve at {shop.short}</Btn>
        <Btn ghost onClick={() => go('shopAvail', null, { instant: true })}>Change shop</Btn>
      </div>

      <ChatComposer script={script} suggestions={['Priority L is too much for me']} />
    </Page>
  );
}

export function ShopReserve({ order, go, scenario, setScenario, onRestart, applyChange, changeFor, undoChange }) {
  const shop = shopName(scenario);
  const now = scenario.pay === 'now';
  const confirmed = !!scenario.reserved;
  const plan = PLANS[order.plan];
  const c = colorOf(order.color);
  const due = plan.device - NEW_LINE_OFFER;
  const script = [
    {
      match: /pay (now|online)|pay it now/i,
      run: () => {
        if (now) return `You're already paying ${money(due)} now.`;
        return {
          message: 'Paying now skips the counter queue. It moves the payment to today.',
          confirm: {
            title: 'Pay now instead?',
            before: { today: 0 },
            after: { today: due },
            confirmLabel: `Pay ${money(due)} now`,
            cancelLabel: 'Pay in store',
            onConfirm: () => applyChange({ slot: 'payment', label: 'Payment', from: 'Pay in store', to: 'Pay now', scenario: { pay: 'now' } })
          }
        };
      }
    },
    {
      match: /pay (in store|later|at the (shop|counter))/i,
      run: () => {
        if (!now) return "You're already paying in store — $0 now.";
        applyChange({ slot: 'payment', label: 'Payment', from: 'Pay now', to: 'Pay in store', scenario: { pay: 'store' } });
        return 'Switched to pay in store — $0 now. The hold is free.';
      }
    }
  ];
  return (
    <Page
      aside={
        <Aside title="Summary">
          <div className="es-ledger" style={{ fontSize: 14 }}>
            <Row label={`iPhone 18 Pro Max · with ${plan.name}`} value={money(plan.device)} />
            <Row label="New-line device offer" value={`−${money(NEW_LINE_OFFER)}`} neg />
            <Row label="Collect at store" value="Free" />
            <Row label={now ? 'Pay now' : 'Pay in store'} value={money(due)} total />
          </div>
          <div className="es-stack es-divider-top" style={{ gap: 6, fontSize: 13 }}>
            <strong>Bring</strong>
            <span className="es-muted">Your NRIC or FIN card</span>
            <span className="es-muted">Your old phone, if you want to move data in store</span>
          </div>
        </Aside>
      }
    >
      <AgentSays>
        I'll hold one for you at {shop.short}. Pay now to skip the counter, or pay when you're there — your Singpass details are already attached, so there's nothing to fill in.
      </AgentSays>

      {confirmed && (
        <p className="es-callout is-ok" style={{ fontSize: 15, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Check size={20} /> <span><strong>Reserved.</strong> We've sent your collection pass by SMS and email.</span>
        </p>
      )}

      <Gen name='ReservationCard hold="Thu 29 Oct 9pm"'>
      <Card title="Collection">
        <div className="es-row" style={{ alignItems: 'stretch', gap: 20 }}>
          <div className="es-grid-2" style={{ flex: '1 1 300px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
            {[
              ['Shop', shop.name],
              ['Ready from', 'Wed 28 Oct, 11am'],
              ['Held until', 'Thu 29 Oct, 9pm'],
              ['Phone', `${c.name} · ${order.storage}`]
            ].map(([k, v]) => (
              <div key={k} className="es-stack" style={{ gap: 2 }}>
                <span className="es-note">{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{ flex: 'none', width: 140, borderRadius: 14, background: confirmed ? '#141414' : '#F6F6F8', color: confirmed ? '#FFFFFF' : '#9A9AA2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, fontSize: 12, textAlign: 'center' }}>
            <QrCode size={56} />
            Show at the counter
          </div>
        </div>
      </Card>
      </Gen>

      {!confirmed && (
        <Recomposed {...slotProps('payment', changeFor, undoChange)} name="PaymentTiming" minHeight={120}>
        <Card title="How do you want to pay?">
          <div className="es-grid-2">
            <Option compact selected={now} onClick={() => setScenario({ pay: 'now' })}>
              <span className="es-option-title">Pay now · {money(due)}</span>
              <span className="es-option-sub">Express counter · about 15 min in store</span>
            </Option>
            <Option compact selected={!now} onClick={() => setScenario({ pay: 'store' })}>
              <span className="es-option-title">Pay in store · $0 now</span>
              <span className="es-option-sub">Hold is free · pay after you've seen it</span>
            </Option>
          </div>
        </Card>
        </Recomposed>
      )}

      <Gen name="OpenSlotsHandoff">
      <Card soft title="Still open — we'll finish these with you in store">
        <div className="es-row" style={{ gap: 8 }}>
          {['New number · eSIM', 'MobileSwop Plus · $150 off, decided in store', 'Free trials'].map((t) => <span key={t} className="es-tag">{t}</span>)}
        </div>
        <p className="es-note">Staff see the same order in the retail app — no starting over at the counter.</p>
      </Card>
      </Gen>

      <div className="es-row">
        {confirmed ? (
          <Btn onClick={onRestart}>Start a new order</Btn>
        ) : (
          <>
            <Btn onClick={() => setScenario({ reserved: true })}>{now ? `Pay ${money(due)} and reserve` : 'Reserve — pay in store'}</Btn>
            <Btn ghost onClick={() => go('shopFit', null, { instant: true })}>Back</Btn>
          </>
        )}
      </div>

      {!confirmed && <ChatComposer script={script} suggestions={[now ? 'Pay in store instead' : 'Pay now online']} />}
    </Page>
  );
}

/* ======================= B · Two lines ======================= */

const B_COLOURS = [
  { id: 'graphite', name: 'Graphite', hex: '#3B3B40' },
  { id: 'burgundy', name: 'Burgundy', hex: '#5B1E2A' }
];
const CONTROLS = [
  { key: 'filter', name: 'Mobile Internet Filter', desc: 'Blocks adult and harmful sites on mobile data', price: 'FREE' },
  { key: 'intl', name: 'Block international incoming calls & SMS', desc: 'Stops overseas scam calls and messages', price: 'FREE' },
  { key: 'cap', name: 'App and in-app purchase cap', desc: 'Purchases stop at $20 a month', price: '$20/mth cap' },
  { key: 'alert', name: 'Data alert at 80%', desc: `Sent to your phone, ${CUSTOMER.phone}`, price: '' }
];
const B_DEVICE = 580;
const B_LINE1 = 128;
const B_LINE2 = 20;

function bState(scenario) {
  return {
    colour: scenario.colour || 'graphite',
    controls: scenario.controls || { filter: true, intl: true, cap: true, alert: true }
  };
}

export function TwoLines({ go, prompt, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const { colour, controls } = bState(scenario);
  const script = [
    {
      match: /(no|remove|drop|turn off).{0,20}(purchase )?cap/i,
      run: () => {
        if (!controls.cap) return 'The purchase cap is already off.';
        applyChange({ slot: 'controls', label: 'Parental controls', from: 'All 4 on', to: 'Purchase cap off', scenario: { controls: { ...controls, cap: false } } });
        return 'Turned off the purchase cap. The filter, call barring and data alert stay on.';
      }
    },
    {
      match: /burgundy|graphite/i,
      run: (t) => {
        const id = /burgundy/i.test(t) ? 'burgundy' : 'graphite';
        if (colour === id) return `It's already ${id}.`;
        const name = (c) => B_COLOURS.find((x) => x.id === c).name;
        applyChange({ slot: 'colour', label: 'Colour', from: name(colour), to: name(id), scenario: { colour: id } });
        return `Switched Line 1 to ${name(id)}. Same price.`;
      }
    }
  ];
  const cur = B_COLOURS.find((c) => c.id === colour);
  const onCount = CONTROLS.filter((k) => controls[k.key]).length;
  return (
    <Page
      aside={
        <Aside title="Your order · 2 lines">
          <div className="es-stack" style={{ gap: 12, fontSize: 14 }}>
            <div>
              <div className="es-ledger-row"><strong>Line 1 · Upgrade</strong><span>${B_LINE1}/mth</span></div>
              <span className="es-muted">iPhone 18 Pro · {cur.name} · Priority L</span>
            </div>
            <div>
              <div className="es-ledger-row"><strong>Line 2 · New</strong><span>${B_LINE2}/mth</span></div>
              <span className="es-muted">SIM Only · eSIM · 9638 8347<br />Parental controls · {onCount} of 4 on</span>
            </div>
          </div>
          <div className="es-sum">
            <SumRow label="iPhone 18 Pro" value={money(B_DEVICE)} />
            <SumRow label="Delivery" value={money(DELIVERY_FEE)} />
            <SumRow label="Today" value={money(B_DEVICE + DELIVERY_FEE)} size="big" />
            <SumRow label="Monthly" value={money(B_LINE1 + B_LINE2)} size="mid" />
          </div>
          <p className="es-note">One bill to Main account · ending 4471. One delivery for both lines.</p>
        </Aside>
      }
    >
      <UserSays>{prompt || PROMPTS.lines}</UserSays>
      <AgentSays>
        I found two goals, so I've built one card per line. One idea: once your data is on the new iPhone, hand your current phone down to your child. Then the new line only needs a SIM, not a second phone.
      </AgentSays>
      <Gen name='IntentSplitter goals={["upgrade", "new-child"]}'>
        <div className="es-row" style={{ gap: 8 }}>
          <span className="es-tag is-changing">Goal 1 · Upgrade {CUSTOMER.phone}</span>
          <span className="es-tag is-changing">Goal 2 · New line for your child</span>
        </div>
      </Gen>

      <div className="es-grid-2">
        <Recomposed {...slotProps('colour', changeFor, undoChange)} name='LineCard role="upgrade"' minHeight={260}>
        <Card title={`Line 1 · ${CUSTOMER.phone}`} right={<span className="es-pill is-brand-soft">Upgrade</span>}>
          <div className="es-row" style={{ gap: 16, flexWrap: 'nowrap' }}>
            <PhoneArt hex={cur.hex} width={56} />
            <div className="es-stack" style={{ gap: 4 }}>
              <strong style={{ fontSize: 17 }}>iPhone 18 Pro</strong>
              <span className="es-note">from $580 with a plan</span>
            </div>
          </div>
          <div className="es-row" style={{ gap: 8 }}>
            {B_COLOURS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={colour === c.id}
                className={`es-seg${colour === c.id ? ' is-selected' : ''}`}
                onClick={() => setScenario({ colour: c.id })}
              >
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.hex, marginRight: 8, verticalAlign: -1 }} />
                {c.name}
              </button>
            ))}
          </div>
          <div className="es-ledger-row es-divider-top"><strong>Keep Priority L</strong><strong>${B_LINE1}/mth</strong></div>
          <span className="es-note">Unlimited local data + Malaysia roaming</span>
          <span className="es-pill is-ok" style={{ alignSelf: 'flex-start' }}><Check size={14} />Re-contract eligible</span>
        </Card>
        </Recomposed>

        <Gen name='LineCard role="new-child"'>
        <Card title="Line 2 · For your child" right={<span className="es-pill is-brand-soft">New line</span>}>
          <div className="es-row" style={{ gap: 16, flexWrap: 'nowrap' }}>
            <span style={{ width: 56, height: 56, borderRadius: 14, background: '#F6F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <ArrowLeftRight size={24} />
            </span>
            <div className="es-stack" style={{ gap: 4 }}>
              <strong style={{ fontSize: 15 }}>Hand-down phone: your current iPhone</strong>
              <span className="es-note">Moves over after your data is on the iPhone 18 Pro</span>
            </div>
          </div>
          <div className="es-ledger-row es-divider-top"><strong>SIM Only</strong><strong>${B_LINE2}/mth</strong></div>
          <span className="es-note">No device on this line</span>
          <div className="es-ledger" style={{ fontSize: 14 }}>
            <Row label="New number" value="9638 8347" />
            <Row label="SIM" value="eSIM · free" />
          </div>
        </Card>
        </Gen>
      </div>

      <Recomposed {...slotProps('controls', changeFor, undoChange)} name='ParentalControls age="12"' minHeight={280}>
      <Card title="Parental controls on Line 2">
        <p className="es-note">Set for a 12-year-old. You can change any of these later from your account.</p>
        <div>
          {CONTROLS.map((k) => (
            <div key={k.key} className="es-setting">
              <div className="es-setting-body">
                <span style={{ fontWeight: 700 }}>{k.name}</span>
                <span className="es-note">{k.desc}</span>
              </div>
              {k.price && <span style={{ fontSize: 13, fontWeight: 700, color: k.price === 'FREE' ? '#1E6B37' : '#4A4A4A' }}>{k.price}</span>}
              <Switch
                on={!!controls[k.key]}
                label={k.name}
                onToggle={() => setScenario({ controls: { ...controls, [k.key]: !controls[k.key] } })}
              />
            </div>
          ))}
        </div>
      </Card>
      </Recomposed>

      <div className="es-row">
        <Btn onClick={() => go('twoLineCart')}>Review both lines</Btn>
        <button type="button" className="es-link" style={{ fontSize: 14 }}>Buy a separate phone for Line 2 instead</button>
      </div>

      <ChatComposer script={script} suggestions={['No purchase cap — she buys her own games', 'Make mine burgundy']} />
    </Page>
  );
}

const HANDDOWN = [
  { title: 'Back up and move your data to the new iPhone', desc: 'Use Quick Start with both phones side by side' },
  { title: 'Sign out of your Apple ID on the old phone', desc: 'Settings, your name, Sign Out. Turns off Find My too' },
  { title: 'Reset the old phone', desc: 'Erase All Content and Settings' },
  { title: "Install your child's eSIM", desc: 'Scan the QR code we email for 9638 8347' }
];

export function TwoLineCart({ go, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const { colour } = bState(scenario);
  const account = ACCOUNTS.find((a) => a.id === (scenario.bAccount || 'main'));
  const script = [
    {
      match: /second account|0912/i,
      run: () => {
        if (account.id === 'second') return 'Both lines are already on the account ending 0912.';
        applyChange({ slot: 'billing', label: 'Billing', from: ACCOUNTS[0].title, to: ACCOUNTS[1].title, scenario: { bAccount: 'second' } });
        return 'Both lines now bill to your second account, ending 0912. Nothing else changed.';
      }
    },
    {
      match: /remind|checklist/i,
      run: () => "I'll send the hand-down checklist again on delivery day."
    }
  ];
  const done = scenario.handDone || [false, false, false, false];
  const [agreed, setAgreed] = useState(true);
  const today = B_DEVICE + DELIVERY_FEE;
  const pay = () =>
    go('confirmed', {
      confirmation: {
        paid: today,
        steps: [
          { t: 'Fri 30 Oct, 9am–12pm · iPhone 18 Pro arrives', d: `One delivery to ${CUSTOMER.address}.` },
          { t: 'Same day · hand your iPhone down', d: "We'll send the 4-step checklist on delivery day." },
          { t: "Child's eSIM · 9638 8347", d: 'Scan the QR code we email. Parental controls are on from the first minute.' },
          { t: `First bill · ${money(B_LINE1 + B_LINE2)}/mth`, d: `Both lines on ${account.title}.` }
        ],
        monthly: [
          ['Line 1 · Priority L', B_LINE1],
          ['Line 2 · SIM Only', B_LINE2]
        ],
        next: ['Set up Screen Time on the hand-down phone', 'Track my delivery']
      }
    });
  return (
    <Page
      aside={
        <div className="es-stack" style={{ gap: 16 }}>
          <Aside title="Pay summary">
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label="iPhone 18 Pro" value={money(B_DEVICE)} />
              <Row label="Delivery" value={money(DELIVERY_FEE)} />
              <Row label="Today" value={money(today)} total />
            </div>
            <div className="es-ledger es-divider-top" style={{ fontSize: 14 }}>
              <Row label={<strong>Monthly</strong>} value={<strong>{money(B_LINE1 + B_LINE2)}</strong>} />
              <Row label="Line 1 · Priority L" value={money(B_LINE1)} sub />
              <Row label="Line 2 · SIM Only" value={money(B_LINE2)} sub />
            </div>
          </Aside>
          <Agree checked={agreed} onChange={() => setAgreed(!agreed)}>
            I agree to the terms for both lines, including the 24-month contract on Line 1. <button type="button" className="es-link">Read terms</button>
          </Agree>
          <Btn block disabled={!agreed} onClick={pay}>Pay {money(today)}</Btn>
        </div>
      }
    >
      <AgentSays>
        Both lines are grouped here: one cart, one bill, one delivery. I've added a short checklist for handing your current iPhone down safely.
      </AgentSays>

      <Gen name="GroupedCart lines={2}">
      <Card title="Your cart · 2 lines">
        <div className="es-option is-row is-compact" style={{ cursor: 'default' }}>
          <PhoneArt hex={B_COLOURS.find((c) => c.id === colour).hex} width={30} detailed={false} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="es-note">Line 1 · {CUSTOMER.phone} · Upgrade</span>
            <strong>iPhone 18 Pro</strong>
            <span className="es-option-sub">Priority L · unlimited local data + Malaysia roaming · re-contract</span>
          </span>
          <span style={{ textAlign: 'right' }}><strong>{money(B_DEVICE)} today</strong><br /><span className="es-muted">${B_LINE1}/mth</span></span>
        </div>
        <div className="es-option is-row is-compact" style={{ cursor: 'default' }}>
          <Smartphone size={28} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="es-note">Line 2 · 9638 8347 · New for your child</span>
            <strong>SIM Only · eSIM</strong>
            <span className="es-option-sub">Mobile Internet Filter FREE · parental controls on</span>
          </span>
          <span style={{ textAlign: 'right' }}><strong>$0.00 today</strong><br /><span className="es-muted">${B_LINE2}/mth</span></span>
        </div>
      </Card>
      </Gen>

      <Gen name="HandDownChecklist">
      <Card title="Hand your iPhone down" right={<span className="es-pill is-grey">{done.filter(Boolean).length} of 4 done</span>}>
        <p className="es-note">Do these after the iPhone 18 Pro arrives. I'll remind you on delivery day.</p>
        <div>
          {HANDDOWN.map((s, i) => (
            <label key={s.title} className="es-setting" style={{ cursor: 'pointer' }}>
              <span className={`es-node${done[i] ? ' is-done' : ''}`}>
                {done[i] ? <Check size={14} color="#FFFFFF" strokeWidth={2.6} /> : <span style={{ fontSize: 12, fontWeight: 900, color: '#3A3FD9' }}>{i + 1}</span>}
              </span>
              <span className="es-setting-body">
                <span style={{ fontWeight: 700, textDecoration: done[i] ? 'line-through' : 'none' }}>{s.title}</span>
                <span className="es-note">{s.desc}</span>
              </span>
              <input
                type="checkbox"
                checked={done[i]}
                style={{ width: 18, height: 18, accentColor: '#3A3FD9' }}
                onChange={() => {
                  const next = done.slice();
                  next[i] = !next[i];
                  setScenario({ handDone: next });
                }}
              />
            </label>
          ))}
        </div>
      </Card>
      </Gen>

      <div className="es-grid-2">
        <Recomposed {...slotProps('billing', changeFor, undoChange)} name='AccountChooser preselect="4471"'>
        <Card>
          <span className="es-note">Billing</span>
          <strong>{account.title}</strong>
          <span className="es-note">Both lines on one bill · <button type="button" className="es-link">Change</button></span>
        </Card>
        </Recomposed>
        <Card>
          <span className="es-note">Delivery · $10</span>
          <strong>Fri 30 Oct · 9am–12pm</strong>
          <span className="es-note">{CUSTOMER.address} · {CUSTOMER.fullName} · <button type="button" className="es-link">Change</button></span>
        </Card>
      </div>

      <div className="es-row">
        <Btn ghost onClick={() => go('twoLines', null, { instant: true })}>Back to lines</Btn>
      </div>

      <ChatComposer script={script} suggestions={['Put both lines on my second account']} />
    </Page>
  );
}

/* ======================= C · Port-in + trip ======================= */

const PORT_MONTHLY = { L: 115.2, M: 88.2 };

export function PortIn({ order, setOrder, go, prompt, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const plan = PLANS[order.plan];
  const telco = scenario.telco || 'M1';
  const script = [
    {
      match: /enhanced m|cheaper|lower monthly|too (much|expensive)/i,
      run: () => {
        if (order.plan === 'M') return 'You are already on Enhanced M — $88.20 a month after the port-in discount.';
        return planConfirm({
          from: order.plan,
          to: 'M',
          beforeToday: plan.device - NEW_LINE_OFFER,
          afterToday: PLANS.M.device - NEW_LINE_OFFER,
          beforeMonthly: PORT_MONTHLY[order.plan],
          afterMonthly: PORT_MONTHLY.M,
          note: 'Enhanced M has 10GB Asia roaming, enough for a week in Tokyo. $270 more upfront, $27 less a month after the 10% discount.',
          onConfirm: () => applyChange({ slot: 'plan', label: 'Plan', from: plan.name, to: PLANS.M.name, order: { plan: 'M' } })
        });
      }
    },
    {
      match: /starhub|simba|circles|\bm1\b/i,
      run: (t) => {
        const next = ['StarHub', 'SIMBA', 'Circles.Life', 'M1'].find((x) => new RegExp(x.split('.')[0], 'i').test(t));
        if (next === telco) return `Got it — ${telco} is already set.`;
        applyChange({ slot: 'telco', label: 'Current telco', from: telco, to: next, scenario: { telco: next } });
        return `Updated — we'll move your number from ${next}. The offer still applies.`;
      }
    }
  ];
  return (
    <Page
      aside={
        <Aside title="Your bundle">
          <AsideProduct hex={colorOf('burgundy').hex} title="iPhone 18 Pro Max" sub={`Burgundy · 256GB · ${plan.name}`} />
          <div className="es-sum">
            <SumRow label="Number" value="+65 9123 **** · port-in" />
            <SumRow label={`Device with ${plan.name}`} value={money(plan.device)} />
            <SumRow label="Port-in offer" value={<span className="es-neg">−{money(NEW_LINE_OFFER)}</span>} />
            <SumRow label="Today" value={money(plan.device - NEW_LINE_OFFER)} size="big" />
            <SumRow label="Monthly" value={money(PORT_MONTHLY[order.plan])} size="mid" />
          </div>
          <p className="es-note">Monthly includes the 10% port-in discount. Delivery is chosen on the next step.</p>
        </Aside>
      }
    >
      <UserSays>{prompt || PROMPTS.port}</UserSays>
      <AgentSays>
        Welcome, {CUSTOMER.firstName}. Since you're bringing your number, I've turned the number step into a <strong>port-in form</strong> — and switching unlocks the <strong>port-in offer</strong>. I picked the two plans that cover your Tokyo trip.
      </AgentSays>

      <Recomposed {...slotProps('telco', changeFor, undoChange)} name='PortInForm' minHeight={150}>
      <Card title="Bring your number" right={<span className="es-pill is-ok">eSIM · free</span>}>
        <div className="es-row" style={{ alignItems: 'flex-end', gap: 16 }}>
          <div className="es-field">
            <label htmlFor="portNumber">Number you're bringing</label>
            <input id="portNumber" className="es-input" value="+65 9123 ****" readOnly />
          </div>
          <div className="es-field">
            <label htmlFor="currentTelco">Current telco</label>
            <select id="currentTelco" className="es-input" value={telco} onChange={(e) => setScenario({ telco: e.target.value })}>
              {['StarHub', 'M1', 'SIMBA', 'Circles.Life', 'Other'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <span className="es-ok" style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Tick size={16} color="#1E6B37" /> Account holder: you — verified with Singpass
        </span>
      </Card>
      </Recomposed>

      <Gen name='OfferUnlocked trigger="port-in"'>
      <Card accent>
        <div className="es-card-head">
          <strong style={{ fontSize: 17, display: 'flex', gap: 8, alignItems: 'center' }}><Package size={20} color="#3A3FD9" /> Port-in offer unlocked</strong>
        </div>
        <p style={{ fontSize: 15 }}>Extra <strong>$381 off your new phone</strong> + <strong>10% off your monthly phone plan</strong>, because you're switching to Singtel.</p>
      </Card>
      </Gen>

      <Recomposed {...slotProps('plan', changeFor, undoChange)} name='PlanFitCompare intent="travel:JP" variant="full"' minHeight={320}>
      <div className="es-stack">
        <h2 className="es-h2">Your plan</h2>
        <div className="es-grid-2">
          <Option selected={order.plan === 'L'} onClick={() => setOrder({ plan: 'L' })}>
            <PlanHead badge={<span className="es-pill is-brand">Most headroom for travel</span>} />
            <span style={{ fontSize: 26, fontWeight: 900 }}>Priority L</span>
            <PlanPrice strike="$128" monthly="$115.20" sub="/mth after 10% off" />
            <Features items={[
              { text: <><strong>12GB worldwide roaming</strong> — Japan included</> },
              { text: 'Unlimited Malaysia roaming' },
              { text: 'Device $760 with this plan' }
            ]} />
          </Option>
          <Option selected={order.plan === 'M'} onClick={() => setOrder({ plan: 'M' })}>
            <PlanHead badge={<span className="es-pill is-grey">Lower monthly</span>} />
            <span style={{ fontSize: 26, fontWeight: 900 }}>Enhanced M</span>
            <PlanPrice strike="$98" monthly="$88.20" sub="/mth after 10% off" />
            <Features items={[
              { text: <><strong>10GB Asia roaming</strong> — Japan included</> },
              { text: '1GB worldwide' },
              { text: 'Device $1,030 with this plan' }
            ]} />
          </Option>
        </div>
        <p className="es-callout is-info" style={{ display: 'flex', gap: 8 }}>
          <Plane size={16} style={{ flex: 'none', marginTop: 2 }} /> Both cover a one-week Tokyo trip. Priority L has more headroom if you travel further afield later.
        </p>
      </div>
      </Recomposed>

      <div className="es-row">
        <Btn onClick={() => go('portTiming')}>Check it's ready before my flight</Btn>
        <Btn ghost>Show all plans</Btn>
      </div>

      <ChatComposer script={script} suggestions={['Is there a cheaper plan that still covers Japan?', "I'm actually on StarHub"]} />
    </Page>
  );
}

export function PortTiming({ order, go, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const plan = PLANS[order.plan];
  const roam = scenario.roam ?? true;
  const alert = scenario.alert ?? true;
  const [agreed, setAgreed] = useState(false);
  const telco = scenario.telco || 'M1';
  const today = plan.device - NEW_LINE_OFFER + DELIVERY_FEE;
  const script = [
    {
      match: /slip|delay|late|what if/i,
      run: () => "If the switch slips past Tue 3 Nov, we'll text you — and any Singtel Shop can sort it out before you fly."
    },
    {
      match: /(no|turn off|don'?t need).{0,12}roaming/i,
      run: () => {
        if (!roam) return 'Roaming is already off.';
        applyChange({ slot: 'roaming', label: 'Roaming', from: 'On before you fly', to: 'Off', scenario: { roam: false } });
        return "Roaming is off. You can switch it on in the app before you fly — it won't change your price.";
      }
    }
  ];
  const steps = [
    { date: 'Tue 27 Oct · today', title: 'Order placed', state: 'done' },
    { date: 'Thu 29 Oct', title: 'Phone + eSIM delivered', Icon: Truck },
    { date: 'Fri 30 Oct', title: 'Number moves to Singtel', note: 'Overnight switch window', Icon: ArrowLeftRight },
    { date: 'Thu 5 Nov', title: 'Flight to Tokyo', note: '6 days after your number is live', state: 'goal' }
  ];
  const pay = () =>
    go('confirmed', {
      confirmation: {
        paid: today,
        steps: [
          { t: 'Thu 29 Oct · iPhone + eSIM delivered', d: `To ${CUSTOMER.address}. Keep using your ${telco} SIM until the switch.` },
          { t: 'Fri 30 Oct overnight · number moves to Singtel', d: `+65 9123 **** goes live on Singtel. ${telco} service ends automatically.` },
          { t: 'Thu 5 Nov · fly to Tokyo', d: roam ? 'Roaming is on, using your worldwide data.' : 'Remember to turn roaming on before you fly.' },
          { t: `First bill · ${money(PORT_MONTHLY[order.plan])}/mth`, d: `${plan.name} with 10% port-in discount.` }
        ],
        monthly: [[`${plan.name} · after 10% off`, PORT_MONTHLY[order.plan]]],
        next: ['Set a roaming alert for Japan', 'Track my delivery']
      }
    });
  return (
    <Page
      aside={
        <div className="es-stack" style={{ gap: 16 }}>
          <Aside title="Your order">
            <AsideProduct hex={colorOf('burgundy').hex} title="iPhone 18 Pro Max" sub={`Burgundy · 256GB · ${plan.name}`} />
            <span className="es-note">+65 9123 **** · port-in · eSIM</span>
            <div className="es-ledger es-divider-top" style={{ fontSize: 14 }}>
              <Row label="iPhone 18 Pro Max" value={money(plan.device)} />
              <Row label="Port-in offer" value={`−${money(NEW_LINE_OFFER)}`} neg />
              <Row label="Doorstep delivery · Thu 29 Oct" value={money(DELIVERY_FEE)} />
              <Row label="Today" value={money(today)} total />
            </div>
            <div className="es-sum">
              <SumRow label="Monthly" value={money(PORT_MONTHLY[order.plan])} size="mid" />
              <span className="es-note">{plan.name} after 10% port-in discount</span>
            </div>
          </Aside>
          <Agree checked={agreed} onChange={() => setAgreed(!agreed)}>
            I agree to the <button type="button" className="es-link">terms and conditions</button> and authorise Singtel to move my number from {telco}.
          </Agree>
          <Btn block disabled={!agreed} onClick={pay}>Pay {money(today)}</Btn>
        </div>
      }
    >
      <AgentSays>
        I checked the dates against your flight. If you order today, your number will be working on Singtel with <strong>6 days to spare</strong> before you fly to Tokyo.
      </AgentSays>

      <Gen name='DeadlineFeasibility deadline="Thu 5 Nov"'>
      <Card title="Ready before you fly" right={<span className="es-pill is-ok is-lg"><Check size={16} />Ready with 6 days to spare</span>}>
        <ol className="es-htl">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="es-htl-node">
                <span className={`es-node${s.state === 'done' ? ' is-done' : s.state === 'goal' ? ' is-goal' : ''}`}>
                  {s.state === 'done' && <Check size={14} color="#FFFFFF" strokeWidth={2.6} />}
                  {s.state === 'goal' && <Plane size={14} color="#FFFFFF" />}
                  {s.Icon && <s.Icon size={14} color="#3A3FD9" />}
                </span>
                {i < steps.length - 1 && <i className={s.state === 'done' ? 'is-done' : ''} />}
              </span>
              <span className="es-note">{s.date}</span>
              <strong style={{ fontSize: 15 }}>{s.title}</strong>
              {s.note && <span style={{ fontSize: 13, color: s.state === 'goal' ? '#1E6B37' : '#4A4A4A', fontWeight: s.state === 'goal' ? 700 : 400 }}>{s.note}</span>}
            </li>
          ))}
        </ol>
        <p className="es-note">Switch dates are illustrative.</p>
      </Card>
      </Gen>

      <Recomposed {...slotProps('roaming', changeFor, undoChange)} name='RoamingReady destination="JP"' minHeight={160}>
      <Card title="Roaming for Japan">
        <div>
          <div className="es-setting">
            <div className="es-setting-body">
              <strong>Turn roaming on before you fly</strong>
              <span className="es-note">Uses your {plan.id === 'L' ? '12GB worldwide' : '10GB Asia'} roaming in {plan.name}</span>
            </div>
            <Switch on={roam} label="Roaming" onToggle={() => setScenario({ roam: !roam })} />
          </div>
          <div className="es-setting">
            <div className="es-setting-body">
              <strong>Data alert at 80%</strong>
              <span className="es-note">We'll text you before your roaming data runs low</span>
            </div>
            <Switch on={alert} label="Data alert" onToggle={() => setScenario({ alert: !alert })} />
          </div>
        </div>
        <p className="es-note">Your old telco's service ends when the switch completes — no need to cancel it yourself.</p>
      </Card>
      </Recomposed>

      <p className="es-callout" style={{ display: 'flex', gap: 10 }}>
        <AlertCircle size={18} style={{ flex: 'none', marginTop: 1 }} />
        <span>If the switch slips past Tue 3 Nov, we'll text you.</span>
      </p>

      <div className="es-row">
        <Btn ghost onClick={() => go('portIn', null, { instant: true })}>Back to number and plan</Btn>
      </div>

      <ChatComposer script={script} suggestions={['What if the switch is late?']} />
    </Page>
  );
}

/* ======================= D · Pivot at checkout ======================= */

const PIVOT_OPTIONS = [
  { id: 'a', letter: 'A', title: 'Graphite 256GB · collect tonight', sub: 'Singtel Shop · Tampines · open till 9:30pm · swaps your colour', fee: 'Free', color: 'graphite', fulfil: 'store', fulfilLabel: 'Collect tonight · Tampines', when: 'Tonight' },
  { id: 'b', letter: 'B', title: 'Burgundy 256GB · collect tomorrow', sub: 'Singtel Shop · Tampines · Wed 28 Oct from 11am', fee: 'Free', tag: 'Keeps your colour', color: 'burgundy', fulfil: 'store', fulfilLabel: 'Collect Wed 28 Oct · Tampines', when: 'Wed 28 Oct from 11am' },
  { id: 'c', letter: 'C', title: 'Keep doorstep delivery', sub: 'Burgundy 256GB · Fri 30 Oct · 9am–12pm', fee: '$10', color: 'burgundy', fulfil: 'door' }
];

export function Pivot({ order, setOrder, go, prompt, scenario, setScenario }) {
  const opt = scenario.pivotOpt || 'b';
  const cur = PIVOT_OPTIONS.find((o) => o.id === opt);
  const before = priceMain(order).today;
  const preview = { ...order, color: cur.color, fulfil: cur.fulfil, pivot: cur.fulfil === 'store' ? cur : null };
  const after = priceMain(preview).today;
  const delta = after - before;
  const kept = ['iPhone 18 Pro Max', `${PLANS[order.plan].name} plan`, `Number ${order.number} · eSIM`];
  if (order.swop) kept.push('MobileSwop Plus');
  if (order.trials.prime) kept.push('Amazon Prime trial');
  kept.push('Singpass details', 'Billing account ending 4471');
  const pickScript = (id, msg) => () => {
    setScenario({ pivotOpt: id });
    return msg;
  };
  const script = [
    { match: /graphite|tonight/i, run: pickScript('a', 'Selected Graphite, collect tonight at Tampines. It swaps your colour.') },
    { match: /burgundy|tomorrow|keep (my )?colou?r/i, run: pickScript('b', 'Selected Burgundy, collect tomorrow 11am at Tampines. Keeps your colour.') },
    { match: /keep (fri|friday|delivery)|deliver/i, run: pickScript('c', 'Selected: keep Friday delivery.') }
  ];
  const apply = () => {
    if (cur.fulfil === 'door') {
      setOrder({ fulfil: 'door', pivot: null });
      go('checkout');
      return;
    }
    setOrder({ color: cur.color, fulfil: 'store', pivot: { ...cur, was: 'Doorstep delivery · Fri 30 Oct · 9am–12pm · $10', delta } });
    go('pivotResolved');
  };
  return (
    <Page
      aside={
        <PaySummary
          order={preview}
          live
          deltaNote={delta === 0 ? 'Same as before' : `${delta < 0 ? '−' : '+'}${money(Math.abs(delta))} vs before`}
        />
      }
    >
      <div className="es-card" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '8px 20px', padding: '14px 18px', borderRadius: 16, background: '#FAFAFB', fontSize: 14, color: '#333333' }}>
        <strong style={{ color: '#141414' }}>Checkout</strong>
        <span>{CUSTOMER.fullName} · {CUSTOMER.nric}</span>
        <span>Main account · ending 4471</span>
        <span>Doorstep · Fri 30 Oct · 9am–12pm</span>
      </div>
      <UserSays>{prompt || 'Actually — can I get it today instead?'}</UserSays>
      <AgentSays>
        Sure — only the delivery choice changes; everything else stays as you set it. Burgundy isn't on any shop shelf tonight, so here are three ways to play it.
      </AgentSays>

      <SlotDiff changing={['How you get it']} kept={kept} />

      <Gen name='FulfilmentRecompute reason="sooner"'>
      <Card title="Get it sooner">
        <div className="es-stack" style={{ gap: 10 }}>
          {PIVOT_OPTIONS.map((o) => (
            <Option key={o.id} row compact selected={opt === o.id} onClick={() => setScenario({ pivotOpt: o.id })}>
              <span className="es-letter">{o.letter}</span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="es-row" style={{ gap: 8 }}>
                  <span className="es-option-title" style={{ fontSize: 15 }}>{o.title}</span>
                  {o.tag && <span className="es-pill is-brand-soft">{o.tag}</span>}
                </span>
                <span className="es-option-sub">{o.sub}</span>
              </span>
              <strong>{o.fee}</strong>
            </Option>
          ))}
        </div>
      </Card>
      </Gen>

      <div className="es-row">
        <Btn onClick={apply}>Use this</Btn>
        <Btn ghost onClick={() => go('checkout', null, { instant: true })}>Never mind, keep Friday</Btn>
      </div>

      <ChatComposer script={script} suggestions={['Graphite tonight is fine']} />
    </Page>
  );
}

export function PivotResolved({ order, go }) {
  const p = priceMain(order);
  const c = colorOf(order.color);
  const pv = order.pivot || PIVOT_OPTIONS[1];
  const [agreed, setAgreed] = useState(true);
  const unchanged = [
    { title: 'You', detail: `${CUSTOMER.fullName} · ${CUSTOMER.nric} · Verified with Singpass` },
    { title: 'Bill this line to', detail: 'Main account · ending 4471' },
    {
      title: 'Phone and plan',
      detail: [`iPhone 18 Pro Max ${c.name} ${order.storage}`, PLANS[order.plan].name, `${order.number} eSIM`, order.swop && 'MobileSwop Plus', order.trials.prime && 'Amazon Prime trial'].filter(Boolean).join(' · ')
    }
  ];
  return (
    <Page
      aside={
        <div className="es-stack" style={{ gap: 16 }}>
          <PaySummary order={order} deltaNote={pv.delta ? `${pv.delta < 0 ? '−' : '+'}${money(Math.abs(pv.delta))} vs before` : null} />
          <Agree checked={agreed} onChange={() => setAgreed(!agreed)}>
            I agree to the <button type="button" className="es-link">Terms &amp; Conditions</button> and <button type="button" className="es-link">Singtel Data Protection Policy</button>
          </Agree>
          <Btn block disabled={!agreed} onClick={() => go('done')}>Pay {money(p.today)}</Btn>
        </div>
      }
    >
      <AgentSays>
        Done — you'll collect your {c.name} iPhone {pv.id === 'a' ? 'tonight' : 'tomorrow'} at Tampines, and you save the $10 delivery fee. Nothing else moved; the one change is highlighted below.
      </AgentSays>

      <h2 className="es-h2">Your checkout</h2>
      <CLabel name="ChangeHighlights" />
      <Card accent>
        <div className="es-card-head">
          <span className="es-row" style={{ gap: 10 }}>
            <strong>Get it</strong>
            <span className="es-pill is-brand">Changed</span>
          </span>
          <button type="button" className="es-link" onClick={() => go('pivot', null, { instant: true })}>Change</button>
        </div>
        <div className="es-row" style={{ gap: 12, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <MapPin size={20} color="#3A3FD9" style={{ flex: 'none', marginTop: 2 }} />
          <div className="es-stack" style={{ gap: 4 }}>
            <strong style={{ fontSize: 16 }}>Collect at Singtel Shop · Tampines · {pv.when} · Free</strong>
            <span style={{ fontSize: 14, color: '#4A4A4A' }}>{c.name} {order.storage} held for you. Unboxed and your eSIM activated with you at the counter.</span>
            <span className="es-note" style={{ textDecoration: 'line-through' }}>Was: {pv.was}</span>
          </div>
        </div>
      </Card>

      <Card>
        {unchanged.map((u, i) => (
          <div key={u.title} className="es-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', borderTop: i ? '1px solid #EDEDF0' : 'none', paddingTop: i ? 14 : 0 }}>
            <div className="es-stack" style={{ gap: 2, flex: '1 1 300px' }}>
              <strong>{u.title}</strong>
              <span className="es-note">{u.detail}</span>
            </div>
            <span className="es-pill is-out">Unchanged</span>
          </div>
        ))}
      </Card>

      <ChatComposer
        script={[
          {
            match: /undo|keep (fri|friday)|deliver|put it back/i,
            run: () => {
              go('checkout', { fulfil: 'door', pivot: null, color: 'burgundy' });
              return 'Putting Friday delivery back.';
            }
          },
          { match: /tonight|graphite|other option/i, run: () => { go('pivot', null, { instant: true }); return 'Here are the three options again.'; } }
        ]}
        suggestions={['Actually, keep Friday delivery']}
      />
    </Page>
  );
}

/* ======================= E · Trade-in ======================= */

const TI_QUESTIONS = [
  { key: 'screen', label: 'Screen', good: 'No cracks', bad: 'Cracked' },
  { key: 'battery', label: 'Battery health', good: '80% or more', bad: 'Below 80%' },
  { key: 'works', label: 'Powers on and works normally', good: 'Yes', bad: 'No' }
];
const VOUCHER = 50;

function tradeEstimate(t) {
  if (t.works === 'bad') return { est: 80, note: "Phones that don't work normally get a flat $80" };
  let est = 450;
  const cuts = [];
  if (t.screen === 'bad') { est -= 150; cuts.push('cracked screen −$150'); }
  if (t.battery === 'bad') { est -= 50; cuts.push('battery below 80% −$50'); }
  return { est, note: cuts.length ? `Good condition $450 · ${cuts.join(' · ')}` : 'Good condition — top value for this model' };
}

function tState(scenario) {
  return { storage: '256GB', screen: 'good', battery: 'good', works: 'good', ...(scenario.trade || {}) };
}

export function TradeIn({ go, prompt, scenario, setScenario }) {
  const t = tState(scenario);
  const set = (patch) => setScenario({ trade: { ...t, ...patch } });
  const { est, note } = tradeEstimate(t);
  const answer = (patch, label) => () => {
    const next = tradeEstimate({ ...t, ...patch });
    set(patch);
    return `Noted — ${label}. Your estimate is now ${money(next.est)}.`;
  };
  const script = [
    { match: /crack/i, run: answer({ screen: 'bad' }, 'cracked screen, −$150') },
    { match: /battery/i, run: answer({ battery: 'bad' }, 'battery below 80%, −$50') },
    { match: /(doesn'?t|does not|won'?t) (work|turn on)|broken|dead/i, run: answer({ works: 'bad' }, "phones that don't work get a flat $80") },
    { match: /512|1 ?tb|128/i, run: (x) => answer({ storage: /512/.test(x) ? '512GB' : /128/.test(x) ? '128GB' : '1TB' }, 'storage updated')() }
  ];
  return (
    <Page
      aside={
        <Aside title="Your bundle">
          <AsideProduct hex={colorOf('burgundy').hex} title="iPhone 18 Pro Max" sub="Burgundy · 256GB · Priority L" />
          <div className="es-sum">
            <SumRow label="Account" value={`${CUSTOMER.fullName} · ending 4471`} />
            <SumRow label="Trading in" value={`iPhone 15 Pro · ${t.storage}`} />
            <SumRow label="Trade-in estimate" value={<span className="es-neg">−{money(est)}</span>} />
            <SumRow label="Voucher WELCOME50" value={<span className="es-neg">−{money(VOUCHER)}</span>} />
          </div>
          <p className="es-note">Both are already in the price on the next step — you'll see the full sum before you choose how to pay.</p>
        </Aside>
      }
    >
      <UserSays>{prompt || PROMPTS.trade}</UserSays>
      <AgentSays>
        Three quick questions about your iPhone 15 Pro give you a trade-in estimate. I'm checking your voucher now too, so <strong>the price you see is the price you pay</strong> — no surprises at checkout.
      </AgentSays>

      <Gen name='TradeInEstimator model="iPhone 15 Pro"'>
      <Card title="Trade in your phone">
        <div className="es-row" style={{ gap: 16 }}>
          <PhoneArt hex="#8A8F98" width={40} />
          <div className="es-stack" style={{ gap: 8 }}>
            <strong style={{ fontSize: 17 }}>iPhone 15 Pro</strong>
            <div className="es-row" style={{ gap: 8 }}>
              {['128GB', '256GB', '512GB', '1TB'].map((s) => (
                <button key={s} type="button" aria-pressed={t.storage === s} className={`es-seg${t.storage === s ? ' is-selected' : ''}`} onClick={() => set({ storage: s })}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          {TI_QUESTIONS.map((q) => (
            <div key={q.key} className="es-setting">
              <span className="es-setting-body"><strong>{q.label}</strong></span>
              <div className="es-toggle-q" role="group" aria-label={q.label}>
                <button type="button" aria-pressed={t[q.key] === 'good'} className={t[q.key] === 'good' ? 'is-selected' : ''} onClick={() => set({ [q.key]: 'good' })}>{q.good}</button>
                <button type="button" aria-pressed={t[q.key] === 'bad'} className={t[q.key] === 'bad' ? 'is-selected' : ''} onClick={() => set({ [q.key]: 'bad' })}>{q.bad}</button>
              </div>
            </div>
          ))}
        </div>
        <div className="es-card is-soft" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="es-stack" style={{ gap: 2 }}>
            <span className="es-note">Estimate — confirmed when the courier checks it</span>
            <span style={{ fontSize: 14 }}>{note}</span>
          </div>
          <span style={{ fontSize: 30, fontWeight: 900 }}>{money(est)}</span>
        </div>
        <p className="es-note">Trade-in values are illustrative.</p>
      </Card>
      </Gen>

      <Gen name='VoucherApply code="WELCOME50"'>
      <Card title="Voucher">
        <div className="es-row" style={{ alignItems: 'flex-end' }}>
          <div className="es-field">
            <label htmlFor="voucher-code">Voucher code</label>
            <input id="voucher-code" className="es-input" defaultValue="WELCOME50" autoComplete="off" />
          </div>
          <span className="es-pill is-ok is-lg" style={{ marginBottom: 12 }}><Check size={16} />Applied · $50 off your phone</span>
        </div>
      </Card>
      </Gen>

      <div className="es-row">
        <Btn onClick={() => go('tradePrice')}>See my price</Btn>
        <span className="es-note">You can change any answer later — the estimate updates as you go.</span>
      </div>

      <ChatComposer script={script} suggestions={['The screen has a small crack']} />
    </Page>
  );
}

export function TradePrice({ go, scenario, setScenario, applyChange, changeFor, undoChange }) {
  const t = tState(scenario);
  const { est } = tradeEstimate(t);
  const plan = PLANS.L;
  const subtotal = plan.device - NEW_LINE_OFFER - SWOP_DISCOUNT - VOUCHER;
  const surplus = est - subtotal;
  const covers = surplus > 0;
  const payout = covers ? (scenario.payout || 'cover') : 'pay';
  const isCover = payout === 'cover';
  const today = isCover ? Math.max(0, subtotal - est) : subtotal;
  const credit = isCover ? Math.max(0, surplus) : est;
  const monthly = plan.monthly + 13.9;
  const checks = scenario.tiChecks || {};
  const script = [
    {
      match: /full credit|pay (by card|\$?179)|keep the (whole|full)/i,
      run: () => {
        if (!covers) return 'Your trade-in already goes on your bills in full.';
        if (!isCover) return `You're already paying ${money(subtotal)} today with ${money(est)} credit.`;
        return {
          message: 'You can pay the subtotal by card and take the whole trade-in as bill credit. That moves money to today.',
          confirm: {
            title: `Pay ${money(subtotal)} today instead?`,
            before: { today: 0 },
            after: { today: subtotal },
            note: `Bill credit goes from ${money(surplus)} to ${money(est)}.`,
            confirmLabel: `Pay ${money(subtotal)} today`,
            cancelLabel: 'Keep $0 today',
            onConfirm: () => applyChange({ slot: 'payout', label: 'Trade-in payout', from: `$0 today + ${money(surplus)} credit`, to: `${money(subtotal)} today + ${money(est)} credit`, scenario: { payout: 'pay' } })
          }
        };
      }
    },
    {
      match: /\$?0 today|nothing today|cover/i,
      run: () => {
        if (isCover) return 'You already pay $0 today.';
        applyChange({ slot: 'payout', label: 'Trade-in payout', from: `${money(subtotal)} today`, to: '$0 today', scenario: { payout: 'cover' } });
        return `Switched — $0 today and ${money(surplus)} credited to your bills.`;
      }
    }
  ];
  const pay = () =>
    go('confirmed', {
      confirmation: {
        paid: today,
        steps: [
          { t: 'Fri 30 Oct, 9am–12pm · iPhone arrives', d: 'The courier collects your iPhone 15 Pro at the same visit.' },
          { t: 'Courier checks your iPhone 15 Pro', d: `Estimate ${money(est)} is confirmed on the spot.` },
          { t: `Next bill · ${money(credit)} credit`, d: 'Comes off your bills until it is used up.' },
          { t: `Monthly · ${money(monthly)}`, d: 'Priority L $128.00 + MobileSwop Plus $13.90.' }
        ],
        monthly: [['Priority L', 128], ['MobileSwop Plus', 13.9]],
        next: ['Move my data from my old phone', 'Track my delivery']
      }
    });
  return (
    <Page
      aside={
        <div className="es-stack" style={{ gap: 16 }}>
          <Aside title="What you'll pay">
            <AsideProduct hex={colorOf('burgundy').hex} title="iPhone 18 Pro Max" sub="Burgundy · 256GB · Priority L" />
            <div className="es-sum">
              <SumRow label="Today" value={money(today)} size="big" />
              <SumRow label="Credited to your bills" value={money(credit)} size="mid" />
              <SumRow label="Monthly" value={money(monthly)} />
              <span className="es-note">Priority L $128.00 + MobileSwop Plus $13.90</span>
            </div>
          </Aside>
          <Btn block onClick={pay}>{today > 0 ? `Pay ${money(today)}` : 'Place order · $0 today'}</Btn>
          <Btn ghost block onClick={() => go('tradeIn', null, { instant: true })}>Change trade-in answers</Btn>
        </div>
      }
    >
      <AgentSays>
        {covers
          ? <>Here's the whole sum. Your trade-in <strong>more than covers today's payment</strong>, so choose what happens to the rest.</>
          : <>Here's the whole sum. Your trade-in brings today's payment down to <strong>{money(subtotal - est)}</strong>.</>}
      </AgentSays>

      <Gen name="PriceExplainer">
      <Card title="Your price, line by line">
        <div className="es-ledger">
          <Row label="iPhone 18 Pro Max with Priority L" value={money(plan.device)} />
          <Row label="New-line device offer" value={`−${money(NEW_LINE_OFFER)}`} neg />
          <Row label={<>MobileSwop Plus discount <span className="es-muted">· needs a $13.90/mth add-on</span></>} value={`−${money(SWOP_DISCOUNT)}`} neg />
          <Row label="Voucher WELCOME50" value={`−${money(VOUCHER)}`} neg />
          <Row label="Subtotal" value={money(subtotal)} total />
          <Row label="Trade-in estimate · iPhone 15 Pro" value={`−${money(est)}`} neg />
        </div>
        {covers && <p className="es-callout is-ok">Your trade-in covers {money(surplus)} more than today's price</p>}
      </Card>
      </Gen>

      {covers && (
        <Recomposed {...slotProps('payout', changeFor, undoChange)} name="TradeInPayout" minHeight={160}>
        <div className="es-grid-2">
          <Option selected={isCover} onClick={() => setScenario({ payout: 'cover' })}>
            <span className="es-pill is-brand" style={{ alignSelf: 'flex-start' }}>Recommended</span>
            <span className="es-option-title">Pay $0 today, {money(surplus)} credited to your bills</span>
            <span className="es-option-sub">Trade-in pays off the {money(subtotal)} now; the rest comes off your next bills.</span>
          </Option>
          <Option selected={!isCover} onClick={() => setScenario({ payout: 'pay' })}>
            <span className="es-pill is-grey" style={{ alignSelf: 'flex-start' }}>Keep the full credit</span>
            <span className="es-option-title">Pay {money(subtotal)} today, {money(est)} credited to your bills</span>
            <span className="es-option-sub">Pay the subtotal by card; the whole trade-in comes off your bills.</span>
          </Option>
        </div>
        </Recomposed>
      )}

      <Gen name='TradeInLogistics pickup="Fri 30 Oct"'>
      <Card title="Handing over your iPhone 15 Pro">
        <p style={{ fontSize: 15, display: 'flex', gap: 10 }}>
          <Truck size={20} style={{ flex: 'none' }} />
          <span>The courier collects your old phone when your new one arrives — <strong>Fri 30 Oct, 9am–12pm</strong>.</span>
        </p>
        <div className="es-stack" style={{ gap: 10 }}>
          {[
            ['backup', 'Back up your iPhone 15 Pro to iCloud or a computer'],
            ['signout', 'Sign out of Apple ID and turn off Find My'],
            ['erase', 'Erase all content and settings']
          ].map(([id, label]) => (
            <Agree key={id} checked={!!checks[id]} onChange={() => setScenario({ tiChecks: { ...checks, [id]: !checks[id] } })}>
              <span style={{ fontSize: 14, color: '#141414' }}>{label}</span>
            </Agree>
          ))}
        </div>
      </Card>
      </Gen>

      <ChatComposer script={script} suggestions={['Keep the full credit, I will pay $179']} />
    </Page>
  );
}

/* ======================= Shared confirmation ======================= */

export function Confirmed({ order, onRestart }) {
  const conf = order.confirmation;
  if (!conf) return null;
  const total = conf.monthly.reduce((s, [, v]) => s + v, 0);
  return (
    <Page
      hero
      aside={
        <Aside title="Your monthly, explained" soft>
          <div className="es-ledger" style={{ fontSize: 14 }}>
            <CLabel name="BillExplainer" />
            {conf.monthly.map(([k, v]) => <Row key={k} label={k} value={money(v)} />)}
            <Row label="Every month" value={money(total)} total />
          </div>
        </Aside>
      }
    >
      <ConfirmedHead
        title={`You're all set, ${CUSTOMER.firstName}`}
        sub={<>Order <strong>SG-{orderNo(conf)}</strong> · {money(conf.paid)} paid. Here's exactly what happens next.</>}
      />
      <Gen name="PostOrderTimeline">
        <Card title="What happens next">
          <Timeline steps={conf.steps} />
        </Card>
      </Gen>
      <NextActions items={conf.next} onRestart={onRestart} />
      <ChatComposer
        placeholder="Anything else?"
        script={[{ match: /track/i, run: () => "You'll get an SMS with live tracking on delivery day." }]}
      />
    </Page>
  );
}
