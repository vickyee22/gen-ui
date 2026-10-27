/**
 * EShop Buyflow — main journey: Intent → Fit → Line → Extras → Checkout → Done.
 */

import React, { useState } from 'react';
import { Mic, ArrowRight, Bell, Eye, User, CreditCard, Check, ShieldCheck, Truck, Store } from 'lucide-react';
import {
  CUSTOMER, COLORS, STORAGES, PLANS, NUMBERS, TRIALS, ACCOUNTS, SLOTS, PODS, BUDGET,
  NEW_LINE_OFFER, SWOP_DISCOUNT, SWOP_MONTHLY, REGISTRATION_FEE, DELIVERY_FEE,
  SHOW_CONTEXT_SIGNALS, PROMPTS, STARTERS, money, priceMain, colorOf
} from './data';
import {
  Page, UserSays, AgentSays, Card, Option, Switch, Btn, Row, Aside, AsideProduct, SumRow,
  Features, Agree, Ask, PhoneArt, Tick
} from './ui';

function BundleAside({ order, extra, children }) {
  const c = colorOf(order.color);
  return (
    <Aside title="Your bundle">
      <AsideProduct hex={c.hex} title="iPhone 18 Pro Max" sub={`${c.name} · ${order.storage} · ${PLANS[order.plan].name}`} />
      <div className="es-sum">
        {extra}
      </div>
      {children}
    </Aside>
  );
}

/* ---------- 01 · Intent ---------- */

export function Intent({ onSubmit }) {
  const [text, setText] = useState(PROMPTS.main);
  return (
    <Page hero aside={SHOW_CONTEXT_SIGNALS ? <ContextSignals /> : null}>
      <div className="es-stack" style={{ gap: 12 }}>
        <p className="es-muted">Welcome back, {CUSTOMER.firstName}</p>
        <h1 className="es-h1">What are you shopping for today?</h1>
        <p className="es-lede">Tell us in your own words. We'll build the steps around you — only the choices that matter, with the maths shown.</p>
      </div>

      <form
        className="es-intent"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onSubmit(text.trim());
        }}
      >
        <label htmlFor="es-intent" className="es-eyebrow">Your request</label>
        <textarea
          id="es-intent"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) onSubmit(text.trim());
            }
          }}
        />
        <div className="es-row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="es-icon-btn" style={{ width: 44, height: 44 }} aria-label="Speak your request">
            <Mic size={20} />
          </button>
          <Btn type="submit" disabled={!text.trim()}>
            Build my bundle <ArrowRight size={18} />
          </Btn>
        </div>
      </form>

      <div className="es-stack" style={{ gap: 10 }}>
        <p className="es-note">Or start with</p>
        <div className="es-row" style={{ gap: 8 }}>
          {STARTERS.map((s) => (
            <button key={s.label} type="button" className="es-chip-btn" onClick={() => onSubmit(PROMPTS[s.flow], s.flow)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="es-stack" style={{ gap: 12, paddingTop: 8 }}>
        <h2 className="es-h3" style={{ fontSize: 18 }}>Pick up where you left off</h2>
        <Option row onClick={() => onSubmit(PROMPTS.main, 'main')} className="es-resume">
          <PhoneArt hex="#5B1E2A" width={48} />
          <span style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="es-option-title">Apple iPhone 18 Pro Max · Burgundy</span>
            <span className="es-muted" style={{ fontSize: 14 }}>You viewed this 3 times this week · from $760 with a plan</span>
          </span>
          <span style={{ fontWeight: 700, textDecoration: 'underline' }}>Continue</span>
        </Option>
      </div>
    </Page>
  );
}

function ContextSignals() {
  const items = [
    { Icon: User, t: 'Existing customer', s: '2 billing accounts · signed in' },
    { Icon: Eye, t: 'Browsing iPhone 18 Pro Max', s: 'Burgundy · 256GB · came from the Pro hero banner' },
    { Icon: CreditCard, t: 'Compared Priority L twice', s: 'Spent longest on roaming details' },
    { Icon: Check, t: 'Singpass details on file', s: 'No forms to re-type at checkout' }
  ];
  return (
    <Aside title="Tailoring this visit" soft>
      <ul className="es-stack" style={{ fontSize: 14 }}>
        {items.map(({ Icon, t, s }) => (
          <li key={t} style={{ display: 'flex', gap: 12 }}>
            <Icon size={20} color="#3A3FD9" style={{ flex: 'none' }} />
            <span><strong>{t}</strong><br /><span className="es-muted">{s}</span></span>
          </li>
        ))}
      </ul>
      <p className="es-note es-divider-top">Used only for this visit. <button type="button" className="es-link">Manage what we use</button></p>
    </Aside>
  );
}

/* ---------- 02 · Fit ---------- */

export function DeviceConfigurator({ order, setOrder, colors = COLORS, storages = STORAGES.map((s) => ({ label: s, ok: true })), status }) {
  const c = colorOf(order.color);
  return (
    <div className="es-card" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'center', padding: 24 }}>
      <PhoneArt hex={c.hex} width={96} />
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900 }}>iPhone 18 Pro Max</h2>
        <div className="es-stack" style={{ gap: 8 }}>
          <span className="es-note">Colour · <strong style={{ color: '#141414' }}>{c.name}</strong></span>
          <div className="es-row" style={{ gap: 10, alignItems: 'flex-start' }}>
            {colors.map((col) => {
              const out = col.ok === false;
              const btn = (
                <button
                  key={col.id}
                  type="button"
                  aria-label={col.name + (out ? ' — not in this shop' : '')}
                  aria-pressed={order.color === col.id}
                  disabled={out}
                  className={`es-swatch${order.color === col.id ? ' is-selected' : ''}${out ? ' is-out' : ''}`}
                  onClick={() => setOrder({ color: col.id })}
                >
                  <span style={{ background: col.hex }} />
                </button>
              );
              return col.note ? (
                <div key={col.id} className="es-swatch-wrap">{btn}<span>{col.note}</span></div>
              ) : btn;
            })}
          </div>
        </div>
        <div className="es-stack" style={{ gap: 8 }}>
          <span className="es-note">Storage</span>
          <div className="es-row" style={{ gap: 8 }}>
            {storages.map((s) => (
              <button
                key={s.label}
                type="button"
                aria-pressed={order.storage === s.label}
                disabled={!s.ok}
                className={`es-seg${order.storage === s.label ? ' is-selected' : ''}${!s.ok ? ' is-out' : ''}`}
                onClick={() => setOrder({ storage: s.label })}
              >
                {s.label}
                {s.note && <span className="es-seg-note">{s.note}</span>}
              </button>
            ))}
          </div>
        </div>
        {status}
      </div>
    </div>
  );
}

export function Fit({ order, setOrder, go, prompt }) {
  const p = priceMain(order);
  return (
    <Page
      aside={
        <BundleAside
          order={order}
          extra={
            <>
              <SumRow label="Today" value={money(p.deviceToday)} size="big" />
              <SumRow label="Monthly" value={money(PLANS[order.plan].monthly)} size="mid" />
              <SumRow label="Your budget" value={`~$${BUDGET}/mth`} />
            </>
          }
        >
          <p className="es-note">Add-ons are decided on the next steps. Nothing is added without you seeing the monthly cost.</p>
        </BundleAside>
      }
    >
      <UserSays>{prompt || PROMPTS.main}</UserSays>
      <AgentSays>
        Got it. Because you're in Malaysia most months, <strong>unlimited Malaysia roaming</strong> decides the plan. Here's the setup that fits — and the cheaper option, so you can judge.
      </AgentSays>

      <DeviceConfigurator
        order={order}
        setOrder={setOrder}
        status={
          <span className="es-ok" style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Tick size={16} color="#1E6B37" /> In stock · eSIM-ready · delivery from Thu 29 Oct
          </span>
        }
      />

      <div className="es-stack">
        <h2 className="es-h2">Your plan</h2>
        <div className="es-grid-2">
          <Option selected={order.plan === 'L'} onClick={() => setOrder({ plan: 'L' })}>
            <PlanHead badge={<span className="es-pill is-brand">Best fit for your travel</span>} />
            <span style={{ fontSize: 26, fontWeight: 900 }}>Priority L</span>
            <PlanPrice monthly="$128" sub="/mth · device $760" />
            <Features items={[
              { text: <><strong>Unlimited Malaysia roaming</strong> — covers your KL trips</> },
              { text: 'Unlimited local data · 12GB worldwide' },
              { text: '5G+ priority lane · skip-the-queue care' }
            ]} />
          </Option>
          <Option selected={order.plan === 'M'} onClick={() => setOrder({ plan: 'M' })}>
            <PlanHead badge={<span className="es-pill is-grey">Saves $450 over 24 mths</span>} />
            <span style={{ fontSize: 26, fontWeight: 900 }}>Enhanced M</span>
            <PlanPrice monthly="$98" sub="/mth · device $1,030" />
            <Features items={[
              { warn: true, text: <><strong>50GB Malaysia roaming</strong> — enough unless you stream a lot in KL</> },
              { text: 'Unlimited local data · 10GB Asia · 1GB worldwide' },
              { text: '$270 more upfront, $30 less each month' }
            ]} />
          </Option>
        </div>
        <p className="es-note">Other plans hidden — they cap Malaysia roaming below what your trips need. <button type="button" className="es-link">Show all 5 plans</button></p>
      </div>

      <Card soft>
        <h3 className="es-h3">How you get to {money(p.deviceToday)} today</h3>
        <div className="es-ledger">
          <Row label={`Device price with ${p.plan.name}`} value={money(p.plan.device)} />
          <Row label="New-line device offer" value={`−${money(NEW_LINE_OFFER)}`} neg />
          {order.swop && (
            <Row label={<>MobileSwop Plus handset discount <span className="es-muted">· needs a $13.90/mth add-on</span></>} value={`−${money(SWOP_DISCOUNT)}`} neg />
          )}
          <Row label="Payable today" value={money(p.deviceToday)} total />
        </div>
        <p className="es-note" style={{ color: '#4A4A4A' }}>We'll check whether the MobileSwop add-on is actually worth it for you on the next step.</p>
      </Card>

      <div className="es-row">
        <Btn onClick={() => go('line')}>Looks right — set up my line</Btn>
        <Btn ghost>Show other phones</Btn>
      </div>
    </Page>
  );
}

export function PlanHead({ badge, term = '24 mths' }) {
  return (
    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, width: '100%' }}>
      {badge}
      <span className="es-note">{term}</span>
    </span>
  );
}

export function PlanPrice({ monthly, strike, sub }) {
  return (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
      {strike && <span className="es-muted" style={{ fontSize: 18, textDecoration: 'line-through' }}>{strike}</span>}
      <span style={{ fontSize: 30, fontWeight: 900 }}>{monthly}</span>
      <span className="es-muted" style={{ fontSize: 14 }}>{sub}</span>
    </span>
  );
}

/* ---------- 03 · Line ---------- */

export function Line({ order, setOrder, go }) {
  const p = priceMain(order);
  const swopNet = SWOP_MONTHLY * 24 - SWOP_DISCOUNT;
  const plan = PLANS[order.plan];
  const todayWith = plan.device - NEW_LINE_OFFER - SWOP_DISCOUNT;
  const todayWithout = plan.device - NEW_LINE_OFFER;
  return (
    <Page
      aside={
        <BundleAside
          order={order}
          extra={
            <>
              <SumRow label="Number" value={`${order.number} · eSIM`} />
              <SumRow label="MobileSwop Plus" value={order.swop ? '$13.90/mth' : 'Skipped'} />
              <SumRow label="Today" value={money(p.deviceToday)} size="big" />
              <SumRow label="Monthly" value={money(p.monthly)} size="mid" />
              <SumRow label="Your budget" value={`~$${BUDGET}/mth`} />
            </>
          }
        >
          {p.monthly > BUDGET && (
            <p className="es-callout">
              {money(p.monthly - BUDGET)} over your budget with MobileSwop. Skipping it brings you to {money(plan.monthly)}/mth.
            </p>
          )}
        </BundleAside>
      }
    >
      <AgentSays>
        This is a new line on your account. Your iPhone supports eSIM, so I've picked that — it arrives by email once the phone is delivered. Two quick decisions below.
      </AgentSays>

      <Card title="1 · Choose your number" right={<span className="es-pill is-ok">eSIM · free</span>}>
        <div className="es-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {NUMBERS.map((n) => (
            <Option key={n.num} compact selected={order.number === n.num} onClick={() => setOrder({ number: n.num })}>
              <span className="es-option-title" style={{ fontSize: 18, letterSpacing: 0.5 }}>{n.num}</span>
              <span className="es-option-sub">{n.tag || 'Available'}</span>
            </Option>
          ))}
        </div>
        <div className="es-row" style={{ gap: 20, fontSize: 14 }}>
          <button type="button" className="es-link">Show more numbers</button>
          <button type="button" className="es-link">Bring a number from another telco instead</button>
        </div>
      </Card>

      <Card title="2 · Is MobileSwop Plus worth it for you?">
        <p style={{ color: '#4A4A4A' }}>
          It takes $150 off the phone today, but costs $13.90 a month for 24 months. Keep it if you'd use a swop, battery replacement or device refresh in the next two years.
        </p>
        <div className="es-grid-2">
          <Option selected={order.swop} onClick={() => setOrder({ swop: true })}>
            <span className="es-option-title">Keep MobileSwop Plus</span>
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label="Today" value={<strong>{money(todayWith)}</strong>} />
              <Row label="Add-on, 24 × $13.90" value={money(SWOP_MONTHLY * 24)} />
              <Row label="Net cost of the cover" value={money(swopNet)} total />
            </div>
            <span className="es-note">Unlimited swops, battery replacement, device refresh</span>
          </Option>
          <Option selected={!order.swop} onClick={() => setOrder({ swop: false })}>
            <span className="es-option-title">Skip it</span>
            <div className="es-ledger" style={{ fontSize: 14 }}>
              <Row label="Today" value={<strong>{money(todayWithout)}</strong>} />
              <Row label="Add-on" value="$0" />
              <Row label="Saves over 24 mths" value={money(swopNet)} total />
            </div>
            <span className="es-note">Standard Apple warranty only</span>
          </Option>
        </div>
        <p className="es-note es-divider-top">
          <strong style={{ color: '#141414' }}>Already on, free:</strong> International call &amp; SMS scam barring · Mobile Protect (in Priority L) · 5G+ priority · <button type="button" className="es-link">Change</button>
        </p>
      </Card>

      <div className="es-row">
        <Btn onClick={() => go('extras')}>Continue</Btn>
        <Btn ghost onClick={() => go('fit', null, { instant: true })}>Back to plan</Btn>
      </div>
    </Page>
  );
}

/* ---------- 04 · Extras ---------- */

export function Extras({ order, setOrder, go }) {
  const p = priceMain(order);
  const count = TRIALS.filter((t) => order.trials[t.id]).length;
  return (
    <Page
      aside={
        <BundleAside
          order={order}
          extra={
            <>
              <SumRow label="Number" value={`${order.number} · eSIM`} />
              <SumRow label="MobileSwop Plus" value={order.swop ? '$13.90/mth' : 'Skipped'} />
              <SumRow label="Trials on" value={count === 0 ? 'None' : `${count} of 5`} />
              {order.pods && <SumRow label="AirPods Pro 3" value={money(PODS.price)} />}
              <SumRow label="Today" value={money(p.beforeFulfil)} size="big" />
              <SumRow label="Monthly now" value={money(p.monthly)} size="mid" />
              <SumRow label="After trials end" value={money(p.monthly + p.trialsMonthly)} />
            </>
          }
        />
      }
    >
      <AgentSays>
        Your plan comes with 5 free trials. All together they'd add <strong>$69.75 a month</strong> once the free period ends. I've kept Amazon Prime, which is your plan's promo, and left the rest off. Switch on anything you want.
      </AgentSays>

      <Card
        title="Free trials"
        right={<span style={{ fontSize: 14, color: '#4A4A4A' }}>After trials end: <strong style={{ color: '#141414' }}>+{money(p.trialsMonthly)}/mth</strong></span>}
      >
        <div>
          {TRIALS.map((t) => (
            <div key={t.id} className="es-setting">
              <div className="es-setting-body">
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</span>
                <span className="es-note">Free for {t.free} · then {money(t.price)}/mth from {t.from}</span>
              </div>
              {t.match && <span className="es-pill is-brand-soft">In your plan promo</span>}
              <Switch
                on={!!order.trials[t.id]}
                label={t.name}
                onToggle={() => setOrder({ trials: { ...order.trials, [t.id]: !order.trials[t.id] } })}
              />
            </div>
          ))}
          <div className="es-setting">
            <div className="es-setting-body" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Bell size={20} />
              <span>Remind me 7 days before any trial starts charging</span>
            </div>
            <Switch on={order.remind} label="Trial reminders" onToggle={() => setOrder({ remind: !order.remind })} />
          </div>
        </div>
      </Card>

      <div className="es-card" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" style={{ flex: 'none' }}>
          <rect width="72" height="72" rx="16" fill="#F6F6F8" />
          <rect x="18" y="26" width="36" height="28" rx="10" fill="#FFFFFF" stroke="#D4D4DA" />
          <circle cx="29" cy="20" r="6" fill="#FFFFFF" stroke="#D4D4DA" />
          <circle cx="43" cy="20" r="6" fill="#FFFFFF" stroke="#D4D4DA" />
        </svg>
        <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#B0102A', letterSpacing: '0.04em' }}>ONE PICK · $120 OFF WITH THIS PHONE</span>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{PODS.name}</span>
          <span style={{ fontSize: 14 }}>
            <span className="es-muted" style={{ textDecoration: 'line-through' }}>{money(PODS.was)}</span>{' '}
            <strong>{money(PODS.price)}</strong> <span className="es-muted">· noise cancelling for your flights to KL</span>
          </span>
        </div>
        {order.pods ? (
          <Btn ghost onClick={() => setOrder({ pods: false })}><Check size={16} /> Added · Undo</Btn>
        ) : (
          <Btn ghost onClick={() => setOrder({ pods: true })}>Add</Btn>
        )}
      </div>

      <p className="es-note">The other add-ons and accessories are hidden because nothing you've told us needs them. <button type="button" className="es-link">Browse them all</button></p>

      <div className="es-row">
        <Btn onClick={() => go('checkout')}>Go to checkout</Btn>
        <Btn ghost onClick={() => go('line', null, { instant: true })}>Back</Btn>
      </div>
    </Page>
  );
}

/* ---------- 05 · Checkout ---------- */

export function PaySummary({ order, deltaNote, live }) {
  const p = priceMain(order);
  const c = colorOf(order.color);
  const fulfilLabel = order.fulfil === 'door'
    ? 'Doorstep delivery'
    : order.pivot?.fulfilLabel || 'Collect at store';
  return (
    <Aside title="Pay today">
      <div className="es-ledger" style={{ fontSize: 14 }}>
        <Row label={`iPhone 18 Pro Max · ${c.name} ${order.storage}`} value={money(p.plan.device)} />
        <Row label="New-line device offer" value={`−${money(NEW_LINE_OFFER)}`} neg />
        {order.swop && <Row label="MobileSwop Plus discount" value={`−${money(SWOP_DISCOUNT)}`} neg />}
        {order.pods && <Row label={PODS.name} value={money(PODS.price)} />}
        <Row label={fulfilLabel} value={p.fulfilFee ? money(DELIVERY_FEE) : 'Free'} />
        <Row label="Total, GST incl." value={money(p.today)} total />
        {deltaNote && <span className="es-note" style={{ textAlign: 'right' }}>{deltaNote}</span>}
      </div>
      <div className="es-ledger es-divider-top" style={{ fontSize: 14 }}>
        <strong>On your first bill</strong>
        <Row label={`Monthly (plan${order.swop ? ' + MobileSwop' : ''})`} value={money(p.monthly)} />
        {!live && <Row label="Service registration, one-time" value={money(REGISTRATION_FEE)} />}
        {!live && <Row label="5G activation" value="Waived" />}
        {live && <span className="es-note">Unchanged by this choice.</span>}
      </div>
    </Aside>
  );
}

function PayBlock({ amount, onPay }) {
  const [agreed, setAgreed] = useState(true);
  return (
    <div className="es-stack">
      <Agree checked={agreed} onChange={() => setAgreed(!agreed)}>
        I agree to the <button type="button" className="es-link">Terms &amp; Conditions</button> and <button type="button" className="es-link">Singtel Data Protection Policy</button>
      </Agree>
      <Btn block disabled={!agreed} onClick={onPay}>Pay {money(amount)}</Btn>
    </div>
  );
}

export function IdentityCard() {
  return (
    <Card
      title="You"
      right={
        <span className="es-row" style={{ gap: 12 }}>
          <span className="es-pill is-ok"><ShieldCheck size={14} /> Verified with Singpass</span>
          <button type="button" className="es-link" style={{ fontSize: 14 }}>Edit</button>
        </span>
      }
    >
      <div className="es-grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          ['Name', CUSTOMER.fullName],
          ['NRIC', CUSTOMER.nric],
          ['Contact', CUSTOMER.phone],
          ['eSIM sent to', CUSTOMER.email]
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

export function Checkout({ order, setOrder, go }) {
  const p = priceMain(order);
  return (
    <Page
      aside={
        <div className="es-stack" style={{ gap: 16 }}>
          <PaySummary order={order} />
          <PayBlock amount={p.today} onPay={() => go('done')} />
        </div>
      }
    >
      <AgentSays>Everything's filled in from Singpass and your account. Check three things and pay — one page, no re-typing.</AgentSays>

      <IdentityCard />

      <Card title="Bill this line to">
        <div className="es-stack" style={{ gap: 10 }}>
          {ACCOUNTS.map((a) => (
            <Option key={a.id} row compact selected={order.account === a.id} onClick={() => setOrder({ account: a.id })}>
              <span className={`es-radio${order.account === a.id ? ' is-on' : ''}`} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="es-option-title" style={{ fontSize: 15 }}>{a.title}</span>
                <span className="es-option-sub">{a.sub}</span>
              </span>
            </Option>
          ))}
        </div>
      </Card>

      <Card title="Get it">
        <div className="es-grid-2">
          <Option compact selected={order.fulfil === 'door'} onClick={() => setOrder({ fulfil: 'door', pivot: null })}>
            <span className="es-row" style={{ gap: 8 }}><Truck size={18} /><span className="es-option-title">Doorstep delivery · $10</span></span>
            <span className="es-option-sub">To your billing address</span>
          </Option>
          <Option compact selected={order.fulfil === 'store'} onClick={() => setOrder({ fulfil: 'store', pivot: null })}>
            <span className="es-row" style={{ gap: 8 }}><Store size={18} /><span className="es-option-title">Collect at store · Free</span></span>
            <span className="es-option-sub">Unboxed and activated with you</span>
          </Option>
        </div>
        {order.fulfil === 'door' ? (
          <div className="es-stack es-divider-top" style={{ gap: 10 }}>
            <span className="es-note">Pick a slot</span>
            <div className="es-row" style={{ gap: 8 }}>
              {SLOTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={order.slot === s.id}
                  className={`es-seg${order.slot === s.id ? ' is-selected' : ''}`}
                  onClick={() => setOrder({ slot: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="es-divider-top" style={{ fontSize: 14 }}>
            Nearest shop to your address: <strong>Singtel Shop · Tampines</strong> · ready from Thu 29 Oct. <button type="button" className="es-link">Change shop</button>
          </p>
        )}
      </Card>

      <Ask
        placeholder="Anything you'd like to change before you pay?"
        suggestions={['Actually — can I get it today instead?']}
        onAsk={(text) => go('pivot', { pivotPrompt: text })}
      />
    </Page>
  );
}

/* ---------- 06 · Done ---------- */

export function Done({ order, go, onRestart }) {
  const p = priceMain(order);
  const c = colorOf(order.color);
  const slot = SLOTS.find((s) => s.id === order.slot);
  const prime = order.trials.prime;
  const steps = [
    order.fulfil === 'door'
      ? { t: `${slot.label.replace(' · ', ', ')} · iPhone arrives`, d: `To ${CUSTOMER.address}. We'll text you when the driver is 30 min away.` }
      : { t: `${order.pivot?.when || 'Thu 29 Oct'} · collect at Tampines`, d: `${c.name} ${order.storage} held for you. Unboxed and set up with you at the counter.` },
    { t: 'Same day · eSIM in your inbox', d: `Scan it on the new iPhone. ${order.number} goes live in minutes.` },
    { t: `First bill · ${money(p.firstBill)}`, d: `${money(p.monthly)} monthly plus the ${money(REGISTRATION_FEE)} one-time registration fee.` },
    prime && { t: 'Late Jan · Amazon Prime trial ends', d: `Becomes $4.99/mth.${order.remind ? " We'll remind you 7 days before — cancel in one tap." : ''}` }
  ].filter(Boolean);
  const roaming = p.plan.id === 'L' ? 88 : 58;
  return (
    <Page
      hero
      aside={
        <Aside title="Your monthly, explained" soft>
          <div className="es-ledger" style={{ fontSize: 14 }}>
            <Row label={`${p.plan.name} plan`} value={money(p.plan.monthly - roaming)} />
            <Row label={`Bundled roaming · ${p.plan.id === 'L' ? 'unlimited' : '50GB'} Malaysia`} value={money(roaming)} />
            {order.swop && <Row label="MobileSwop Plus" value={money(SWOP_MONTHLY)} />}
            <Row label="Every month" value={money(p.monthly)} total />
          </div>
          <div className="es-stack es-divider-top" style={{ gap: 8, fontSize: 13 }}>
            <span><strong>Free for 24 months</strong><br /><span className="es-muted">Caller ID · McAfee Mobile Security (2 devices)</span></span>
            <span><strong>Free, no end date</strong><br /><span className="es-muted">5G+ priority · Mobile Protect · scam call &amp; SMS barring · Data X Infinity</span></span>
          </div>
          {p.monthly > BUDGET && (
            <p className="es-callout">{money(p.monthly - BUDGET)} above the ~${BUDGET} you asked for, because you kept MobileSwop Plus.</p>
          )}
        </Aside>
      }
    >
      <ConfirmedHead
        title={`You're all set, ${CUSTOMER.firstName}`}
        sub={<>Order <strong>SG-{orderNo(order)}</strong> · {money(p.today)} paid. Here's exactly what happens next, and what you'll pay — no surprises on your bill.</>}
      />
      <Card title="What happens next">
        <Timeline steps={steps} />
      </Card>
      <NextActions items={['Move my data from my old phone', 'Set a roaming alert for KL trips', 'Track my delivery']} onRestart={onRestart} />
    </Page>
  );
}

export function orderNo(seed) {
  const s = JSON.stringify(seed);
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9000000;
  return String(1000000 + h);
}

export function ConfirmedHead({ title, sub }) {
  return (
    <div className="es-stack" style={{ gap: 14 }}>
      <span style={{ width: 56, height: 56, borderRadius: '50%', background: '#E7F4EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={28} color="#1E6B37" strokeWidth={2.6} />
      </span>
      <h1 className="es-h1" style={{ fontSize: 40 }}>{title}</h1>
      <p className="es-lede">{sub}</p>
    </div>
  );
}

export function Timeline({ steps }) {
  return (
    <ol className="es-vtl">
      {steps.map((s, i) => (
        <li key={i}>
          <span className={`es-node${i === 0 ? ' is-done' : ''}`}>
            {i === 0 ? <Check size={14} color="#FFFFFF" strokeWidth={2.6} /> : <span style={{ fontSize: 12, fontWeight: 900, color: '#3A3FD9' }}>{i + 1}</span>}
          </span>
          <div>
            <strong>{s.t}</strong>
            <span>{s.d}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function NextActions({ items, onRestart }) {
  return (
    <div className="es-stack">
      <h2 className="es-h3">Next, I can help you</h2>
      <div className="es-row" style={{ gap: 8 }}>
        {items.map((s) => <button key={s} type="button" className="es-chip-btn">{s}</button>)}
      </div>
      <div style={{ paddingTop: 12 }}>
        <Btn ghost onClick={onRestart}>Start a new order</Btn>
      </div>
    </div>
  );
}
