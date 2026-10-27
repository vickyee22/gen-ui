/**
 * Dynamic buyflow — orchestrator agent.
 *
 *   planJourney(text)        request → goals, extracted slots, ordered steps
 *   composeStep(step, order) step    → { message, patches[] } from the manifest
 *   interpretChange(text, …) chat    → { message, ops[], patches[] }
 *
 * Each call asks the LLM first and validates the answer against the manifest
 * and the rules engine. If the LLM is unavailable or returns nothing usable,
 * a deterministic fallback answers instead, so the demo never stalls.
 */

import { askJSON } from './llm';
import { MANIFEST, SLOTS, manifestForPrompt, validatePatch } from './manifest';
import { BASE_ORDER, SHOPS, TELCOS, summarize, seedOrder } from './model';
import { CUSTOMER, TODAY, COLORS, STORAGES, routeIntent } from '../data';
import { S1_SIGNALS } from '../s1data';

const STEP_SLOTS = SLOTS.filter((s) => !['intent', 'review', 'done'].includes(s));
const CHECKOUT_SLOTS = ['identity', 'billing', 'payment'];

const CONTEXT = `Store: Singtel EShop (Singapore). Today: ${TODAY}.
Customer: ${CUSTOMER.fullName}, existing customer, 2 billing accounts (main ending 4471, second ending 0912), Singpass on file.
Signals: ${S1_SIGNALS.map((s) => `${s.t} (${s.s})`).join('; ')}.
Catalogue: iPhone 18 Pro Max (colours ${COLORS.map((c) => c.id).join('/')}, storage ${STORAGES.join('/')}), iPhone 18 Pro (Priority L only).
Plans: L = Priority L $128/mth (unlimited Malaysia + 12GB worldwide roaming), M = Enhanced M $98/mth (50GB MY, 10GB Asia, 1GB worldwide), S = Enhanced S $78/mth (50GB MY, 4GB Asia).
Shops: ${SHOPS.map((s) => `${s.id}=${s.short} ${s.distance} ${s.stock}`).join('; ')}.
Never state prices you compute yourself; the UI shows prices from the price service.
Don't invent facts: only mention a trip, destination, budget or date if the customer said it. The signals show interest in roaming, not a trip.`;

const SLOT_KEYS = `Order slot keys you may set (value types):
model: "promax"|"pro"; color: ${COLORS.map((c) => `"${c.id}"`).join('|')}; storage: ${STORAGES.map((s) => `"${s}"`).join('|')};
plan: "L"|"M"|"S"; lineType: "new"|"port"|"upgrade"; portTelco: ${TELCOS.map((t) => `"${t}"`).join('|')}; portNumber: string;
swop: boolean (MobileSwop Plus, needed for $150 handset discount); trials: "none"|"all"|{prime,st,bein,viu,julecool: boolean}; pods: boolean (AirPods Pro 3);
deferToStore: boolean (number + add-ons decided by store staff); fulfil: "door"|"collect"; shop: "TPN"|"BDK"|"PSR"; slot: "thu"|"fri"|"sat"|"mon" (delivery);
collectWhen: "tonight"|"tomorrow"; payAt: "now"|"store"; account: "main"|"second"; childLine: boolean; controls: {filter,barring,cap,alert: boolean};
tradeIn: {model, storage, screen:"ok"|"bad", battery:"ok"|"bad", works:"ok"|"bad"} | "none"; payout: "credit"|"pay"; voucher: string|"none";
trip: {destination:"MY"|"JP"|"local", date?: string}; budget: number.`;

/* ======================= 1 · Plan the journey ======================= */

const PLAN_PROMPT = `You are the orchestrator agent for a generative-UI telco buyflow.
${CONTEXT}

Turn the customer's request into goals, order slots and an ordered list of steps.
${SLOT_KEYS}

Steps: each step is one decision screen with a one-word title (e.g. Shop, Fit, Line, Extras, Number, Lines, Trade-in) and the slots it decides, chosen from:
${STEP_SLOTS.join(', ')}.
- Intent decides which slot comes first: if they asked to collect/pick up or about stock → fulfilment first; switching telco/keeping number → number first; trade-in → tradein early; a line for a child → lines early.
- device and plan must appear. Put a final "Checkout" step with identity, billing, payment (and fulfilment again if collecting, to show the reservation).
- If collecting and they want setup in store, set deferToStore and skip separate number/addons steps.
- 3–6 steps total. Don't add review or done.

Respond ONLY with JSON:
{"message": "one short sentence back to the customer", "goals": ["Phone + plan", "..."], "slots": {only keys the request states or clearly implies}, "steps": [{"title": "Shop", "slots": ["fulfilment"]}]}`;

export async function planJourney(text) {
  const res = await askJSON(PLAN_PROMPT, text, { maxTokens: 600, temperature: 0 });
  const fb = fallbackPlan(text);
  if (!res) return { ...fb, source: 'rules' };
  const j = res.json || {};
  const slots = mergeSlots(j.slots && typeof j.slots === 'object' ? j.slots : {}, fb.slots);
  const order = seedOrder(slots);
  const steps = cleanSteps(j.steps, order);
  if (!steps) return { ...fb, source: 'rules' };
  return {
    message: typeof j.message === 'string' ? j.message : fb.message,
    goals: Array.isArray(j.goals) && j.goals.length ? j.goals.slice(0, 4).map(String) : fb.goals,
    slots,
    order,
    steps,
    source: 'llm',
    ms: res.ms,
    raw: j
  };
}

/**
 * Guardrails on the LLM's step plan. The LLM picks titles and ordering; the
 * rules make sure the slots this order needs are present and that the slot the
 * customer led with comes first.
 */
function cleanSteps(raw, order = BASE_ORDER) {
  if (!Array.isArray(raw) || !raw.length) return null;
  const seen = new Set();
  let steps = raw
    .map((s) => ({
      title: String(s?.title || '').slice(0, 24) || 'Step',
      slots: (Array.isArray(s?.slots) ? s.slots : []).filter((x) => STEP_SLOTS.includes(x))
    }))
    .map((s) => ({
      ...s,
      // fulfilment may appear twice (choose shop early, reservation at checkout)
      slots: s.slots.filter((x) => (x === 'fulfilment' ? true : !seen.has(x) && seen.add(x)))
    }))
    .filter((s) => s.slots.length);
  const has = (slot) => steps.some((s) => !s.checkout && s.title.toLowerCase() !== 'checkout' && s.slots.includes(slot));
  const lead = (slot, title) => {
    // The slot the customer led with goes first, on its own screen.
    steps = steps.map((s) => ({ ...s, slots: s.slots.filter((x) => x !== slot) })).filter((s) => s.slots.length || s.title.toLowerCase() === 'checkout');
    steps.unshift({ title, slots: [slot] });
  };
  if (order.fulfil === 'collect') lead('fulfilment', 'Shop');
  else {
    // Delivery is decided at checkout, not on its own screen.
    steps = steps.map((s) => ({ ...s, slots: s.slots.filter((x) => x !== 'fulfilment') })).filter((s) => s.slots.length || s.title.toLowerCase() === 'checkout');
    if (order.lineType === 'port') lead('number', 'Number');
  }
  if (!has('device') || !has('plan')) {
    const fit = { title: 'Fit', slots: ['device', 'plan'].filter((x) => !has(x)) };
    const at = steps.findIndex((s) => s.title.toLowerCase() === 'checkout');
    steps.splice(at < 0 ? steps.length : at, 0, fit);
  }
  const before = (slot, title) => {
    if (has(slot)) return;
    const at = steps.findIndex((s) => s.title.toLowerCase() === 'checkout');
    steps.splice(at < 0 ? steps.length : at, 0, { title, slots: [slot] });
  };
  if (order.tradeIn) before('tradein', 'Trade-in');
  if (order.childLine) before('lines', 'Lines');
  if (order.lineType === 'port' && !has('number')) before('number', 'Number');
  if (order.lineType === 'new' && !order.deferToStore && order.fulfil !== 'collect') before('number', 'Line');
  if (order.lineType === 'new' && !order.deferToStore && !order.childLine) before('addons', 'Extras');
  // Exactly one checkout step at the end, holding identity, billing, payment.
  steps = steps.map((s) => ({ ...s, slots: s.slots.filter((x) => !CHECKOUT_SLOTS.includes(x)) })).filter((s) => s.slots.length || s.title === 'Checkout');
  const last = steps[steps.length - 1];
  if (last && last.title.toLowerCase() === 'checkout') steps.pop();
  // At most 5 screens before checkout: merge the smallest neighbours.
  while (steps.length > 5) {
    let best = 0;
    for (let i = 1; i < steps.length - 1; i++) {
      if (steps[i].slots.length + steps[i + 1].slots.length < steps[best].slots.length + steps[best + 1].slots.length) best = i;
    }
    const [a, b] = steps.splice(best, 2, null);
    steps[best] = { title: a.title, slots: [...a.slots, ...b.slots.filter((x) => !a.slots.includes(x))] };
  }
  steps.push({ title: 'Checkout', slots: ['fulfilment', ...CHECKOUT_SLOTS], checkout: true });
  return steps.map((s, i) => ({ ...s, id: `step${i}` }));
}

/**
 * The LLM's slots win, but anything it left out (or couldn't name) that the
 * deterministic extractor found is filled in — e.g. "iPhone 18 Pro" or a trip date.
 */
function mergeSlots(llm, rules) {
  const out = { ...llm };
  for (const [k, v] of Object.entries(rules)) {
    if (out[k] === undefined || out[k] === null || out[k] === '') out[k] = v;
  }
  if (rules.model === 'pro') out.model = 'pro';
  if (rules.trip) {
    const t = typeof out.trip === 'object' && out.trip ? out.trip : {};
    out.trip = { destination: rules.trip.destination, date: t.date || rules.trip.date || null };
  }
  return out;
}

/* ---------- Fallback planner (no LLM) ---------- */

export function fallbackPlan(text) {
  const t = text.toLowerCase();
  const slots = {};
  const color = COLORS.find((c) => t.includes(c.id));
  if (color) slots.color = color.id;
  const storage = STORAGES.find((s) => t.includes(s.toLowerCase()));
  if (storage) slots.storage = storage;
  if (/18 pro(?! max)/.test(t)) slots.model = 'pro';
  if (/enhanced s\b/.test(t)) slots.plan = 'S';
  else if (/enhanced m\b/.test(t)) slots.plan = 'M';
  else if (/priority l/.test(t)) slots.plan = 'L';
  const shop = SHOPS.find((s) => t.includes(s.short.toLowerCase()));
  const collect = /collect|pick ?(it )?up|in store|in stock|stock near/.test(t);
  if (collect) { slots.fulfil = 'collect'; slots.shop = shop?.id || 'TPN'; }
  if (/set (it )?up in store|setup in store/.test(t)) slots.deferToStore = true;
  if (/switch(ing)? to|keep(ing)? my number|port/.test(t)) slots.lineType = 'port';
  const telco = TELCOS.find((x) => t.includes(x.toLowerCase()));
  if (telco) slots.portTelco = telco;
  if (/upgrade/.test(t)) slots.lineType = 'upgrade';
  if (/child|kid|son|daughter|\d+-year-old/.test(t)) slots.childLine = true;
  if (/trade.?in|trading in/.test(t)) slots.tradeIn = { model: /15 pro/.test(t) ? 'iPhone 15 Pro' : 'iPhone 15 Pro', storage: '256GB' };
  if (/voucher|promo code/.test(t)) slots.voucher = 'WELCOME50';
  // "next Thursday" from Tue 27 Oct is Thu 5 Nov (switch dates are illustrative).
  if (/tokyo|japan/.test(t)) slots.trip = { destination: 'JP', date: 'Thu 5 Nov' };
  else if (/\bkl\b|malaysia|kuala lumpur/.test(t)) slots.trip = { destination: 'MY' };
  const budget = t.match(/\$\s?(\d{2,3})/);
  if (budget && /bill|month|budget/.test(t)) slots.budget = Number(budget[1]);

  const goals = ['Phone + plan'];
  if (slots.childLine) goals.push('Line for your child');
  if (slots.lineType === 'port') goals.push('Keep my number');
  if (slots.tradeIn) goals.push('Trade in');
  if (collect) goals.push(/tomorrow/.test(t) ? 'Collect tomorrow' : 'Collect in store');

  const flow = routeIntent(text);
  const steps = [];
  if (collect) steps.push({ title: 'Shop', slots: ['fulfilment'] });
  if (slots.lineType === 'port') steps.push({ title: 'Number', slots: ['number'] });
  if (slots.childLine) steps.push({ title: 'Lines', slots: ['lines'] });
  if (slots.tradeIn) steps.push({ title: 'Trade-in', slots: ['tradein'] });
  steps.push({ title: 'Fit', slots: ['device', 'plan'] });
  if (!slots.deferToStore && !slots.lineType && !slots.childLine) steps.push({ title: 'Line', slots: ['number'] });
  if (!slots.deferToStore && flow !== 'port' && !slots.childLine) steps.push({ title: 'Extras', slots: ['addons'] });
  steps.push({ title: 'Checkout', slots: CHECKOUT_SLOTS });

  return {
    message: goals.length > 1 ? `I've split that into ${goals.length} goals and built the steps around them.` : "Here's a bundle built around what you asked for.",
    goals,
    slots,
    order: seedOrder(slots),
    steps: cleanSteps(steps, seedOrder(slots))
  };
}

/* ======================= 2 · Compose a step ======================= */

const COMPOSE_PROMPT = `You are the orchestrator agent composing ONE screen of a generative-UI telco buyflow.
${CONTEXT}

Pick components ONLY from this manifest (name, allowed slots, variants, props):
${JSON.stringify(manifestForPrompt())}

Rules:
- Cover every slot of this step with 1–3 components whose "slots" include it. Fewer is better: show only what this customer needs to decide.
- Only use components that fit the order state: shop/reservation components only when fulfil is "collect"; FulfilmentSlots only for "door"; PortInForm/OfferUnlocked only for lineType "port"; NumberPicker only for a new line; trade-in components only with a trade-in; child-line components only when childLine is true; PaymentTiming only when collecting; OpenSlotsHandoff when deferToStore.
- On a step with "device" and fulfil "collect", use DeviceConfigurator variant "stock".
- PlanFitCompare: set intent from the trip ("travel:MY", "travel:JP" or "local"), recommended = best plan for them, compareWith = the one alternative worth showing, reason = one short line why.
- The payment slot always ends with PaySummary.
- message: one plain sentence (max 25 words) spoken to the customer about THIS step only. Example for an Extras step: "Here are the add-ons worth a look — the trials stay free until they end, and you can switch any off." Don't repeat the request or mention other steps.

Respond ONLY with JSON: {"message": "...", "patches": [{"slot": "plan", "component": "PlanFitCompare", "variant": "full", "props": {}}]}`;

export async function composeStep(step, order, { goals = [], prompt = '' } = {}) {
  const res = await askJSON(COMPOSE_PROMPT, {
    request: prompt,
    goals,
    step: { title: step.title, slots: step.slots, isCheckout: !!step.checkout },
    order: summarize(order),
    state: pick(order, ['fulfil', 'shop', 'lineType', 'childLine', 'deferToStore', 'tradeIn', 'trip', 'budget', 'voucher', 'plan'])
  }, { maxTokens: 700 });
  const fb = fallbackCompose(step, order);
  if (!res) return { ...fb, source: 'rules' };
  const patches = finalizePatches(res.json?.patches, step, order);
  return {
    message: typeof res.json?.message === 'string' ? res.json.message : fb.message,
    patches,
    source: 'llm',
    ms: res.ms,
    raw: res.json
  };
}

/** Validates LLM patches, drops ones that don't fit the state, fills uncovered slots. */
export function finalizePatches(raw, step, order) {
  const out = [];
  for (const p of Array.isArray(raw) ? raw : []) {
    const v = validatePatch(p);
    if (!v || !step.slots.includes(v.slot) || !fits(v.component, order)) continue;
    if (out.some((x) => x.component === v.component && x.slot === v.slot)) continue;
    const f = fix(v, order, step);
    if (!out.some((x) => x.component === f.component)) out.push(f);
  }
  for (const slot of step.slots) {
    if (!out.some((p) => p.slot === slot)) out.push(...defaultsFor(slot, order, step));
    for (const r of required(slot, order, step)) {
      if (!out.some((p) => p.component === r.component && (r.match ? r.match(p) : true))) out.push(r);
    }
  }
  // Keep slot order as the step lists it; PaySummary last.
  return out.sort((a, b) => rank(a, step) - rank(b, step));
}

/**
 * Components the rules engine requires for a slot whatever the LLM picks, so
 * a decision the order depends on is never left off the screen.
 */
function required(slot, o, step) {
  const R = (component, props = {}, extra = {}) => ({ slot, component, props, ...extra });
  switch (slot) {
    case 'device': return [R('DeviceConfigurator')];
    case 'plan': return [R('PlanFitCompare', defaultsFor('plan', o, step)[0].props, { variant: 'compact' }), ...(o.trip?.destination === 'JP' ? [R('RoamingReady', { destination: 'JP' })] : [])];
    case 'number': return o.lineType === 'port' ? [R('PortInForm'), R('OfferUnlocked', { trigger: 'port-in' })] : [];
    case 'tradein': return o.tradeIn ? [R('TradeInEstimator')] : [];
    case 'lines': return o.childLine
      ? [R('LineCard', { role: 'new-child' }, { match: (p) => p.props?.role === 'new-child' }), R('ParentalControls')]
      : [];
    case 'addons': return o.deferToStore ? [R('OpenSlotsHandoff', { deferred: ['Add-ons', 'MobileSwop'] })] : [R('TrialTransparency')];
    case 'fulfilment':
      if (o.fulfil === 'collect') return [step.checkout ? R('ReservationCard') : R('ShopAvailability', {}, { variant: 'list+map' })];
      return [R('FulfilmentSlots'), ...(o.trip?.date ? [R('DeadlineFeasibility', { deadline: o.trip.date })] : [])];
    case 'payment':
      return [
        ...(o.childLine ? [R('GroupedCart')] : []),
        ...(o.tradeIn ? [R('TradeInPayout')] : []),
        R('PaySummary')
      ];
    default: return [];
  }
}

const rank = (p, step) => (p.component === 'PaySummary' ? 99 : step.slots.indexOf(p.slot));

/** Forces state-dependent variants the rules engine owns. */
function fix(p, order, step = {}) {
  if (p.component === 'ShopAvailability' && step.checkout) return { slot: 'fulfilment', component: 'ReservationCard', props: {} };
  if (p.component === 'ReservationCard' && !step.checkout) return { slot: 'fulfilment', component: 'ShopAvailability', variant: 'list+map', props: {} };
  if (p.component === 'PlanFitCompare' && !order.trip && /malaysia|japan|tokyo|\bkl\b|trip|travel/i.test(p.props?.reason || '')) {
    return { ...p, props: { ...p.props, intent: 'local', reason: p.props.recommended === 'L' || !p.props.recommended ? 'You compared Priority L twice and spent longest on its roaming details.' : undefined } };
  }
  if (p.component === 'DeviceConfigurator') return { ...p, variant: order.fulfil === 'collect' && order.shop ? 'stock' : 'full' };
  return p;
}

const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));

/** Whether a component makes sense for the current order (rules, not taste). */
export function fits(component, o) {
  switch (component) {
    case 'ShopAvailability':
    case 'ReservationCard':
    case 'PaymentTiming':
      return o.fulfil === 'collect';
    case 'FulfilmentSlots':
      return o.fulfil === 'door';
    case 'PortInForm':
    case 'OfferUnlocked':
      return o.lineType === 'port';
    case 'NumberPicker':
      return o.lineType === 'new' && !o.deferToStore;
    case 'TradeInEstimator':
    case 'TradeInLogistics':
    case 'TradeInPayout':
      return !!o.tradeIn;
    case 'ParentalControls':
    case 'GroupedCart':
    case 'HandDownChecklist':
      return !!o.childLine;
    case 'OpenSlotsHandoff':
      return !!o.deferToStore;
    case 'TradeOffDecision':
      return o.lineType !== 'upgrade' && !o.deferToStore;
    case 'TrialTransparency':
    case 'AccessoryPick':
      return !o.deferToStore;
    case 'RoamingReady':
      return o.trip?.destination === 'MY' || o.trip?.destination === 'JP';
    case 'DeadlineFeasibility':
      return !!o.trip?.date;
    default:
      return true;
  }
}

/** Deterministic composition for a slot — used when the LLM is off or leaves a gap. */
export function defaultsFor(slot, o, step = {}) {
  const P = (component, props = {}, variant) => ({ slot, component, props, ...(variant ? { variant } : {}) });
  const intent = o.trip?.destination === 'MY' ? 'travel:MY' : o.trip?.destination === 'JP' ? 'travel:JP' : 'local';
  switch (slot) {
    case 'device':
      return [P('DeviceConfigurator', {}, o.fulfil === 'collect' && o.shop ? 'stock' : 'full')];
    case 'plan': {
      const alt = o.plan === 'L' ? 'M' : 'L';
      const out = [P('PlanFitCompare', { intent, recommended: o.plan, compareWith: o.model === 'pro' ? undefined : alt }, step.slots?.length > 1 ? 'compact' : 'full')];
      if (o.trip?.destination === 'JP') out.push(P('RoamingReady', { destination: 'JP' }));
      return out;
    }
    case 'number':
      if (o.lineType === 'port') return [P('PortInForm'), P('OfferUnlocked', { trigger: 'port-in' })];
      if (o.deferToStore) return [P('OpenSlotsHandoff', { deferred: ['Number', 'Add-ons', 'MobileSwop'] })];
      if (o.lineType === 'upgrade') return [P('LineCard', { role: 'upgrade' })];
      return [P('NumberPicker', {}, 'new')];
    case 'sim':
      return [];
    case 'addons':
      if (o.deferToStore) return [P('OpenSlotsHandoff', { deferred: ['Add-ons', 'MobileSwop'] })];
      return [
        ...(fits('TradeOffDecision', o) ? [P('TradeOffDecision', { addon: 'mobileswop' })] : []),
        P('TrialTransparency'),
        P('AccessoryPick', { limit: 1 })
      ];
    case 'tradein':
      return o.tradeIn ? [P('TradeInEstimator'), P('TradeInLogistics')] : [];
    case 'lines':
      return o.childLine
        ? [P('LineCard', { role: o.lineType === 'upgrade' ? 'upgrade' : 'new' }), P('LineCard', { role: 'new-child' }), P('ParentalControls'), P('HandDownChecklist')]
        : [];
    case 'fulfilment':
      if (o.fulfil === 'collect') return [step.checkout ? P('ReservationCard') : P('ShopAvailability', {}, 'list+map')];
      if (o.trip?.date) return [P('FulfilmentSlots'), P('DeadlineFeasibility', { deadline: o.trip.date })];
      return [P('FulfilmentSlots')];
    case 'identity':
      return [P('VerifiedIdentity')];
    case 'billing':
      return [P('AccountChooser')];
    case 'payment':
      return [
        ...(o.childLine ? [P('GroupedCart')] : []),
        ...(o.voucher ? [P('VoucherApply', { code: o.voucher })] : []),
        ...(o.tradeIn ? [P('TradeInPayout')] : []),
        ...(o.fulfil === 'collect' ? [P('PaymentTiming')] : []),
        P('PriceExplainer'),
        P('PaySummary')
      ];
    default:
      return [];
  }
}

export function fallbackCompose(step, order) {
  return {
    message: step.checkout ? "Everything's pre-filled from Singpass and your account — check and pay." : `Here's what to decide for ${step.title.toLowerCase()}.`,
    patches: finalizePatches([], step, order)
  };
}

/**
 * Re-checks a screen after the order changed: keeps every patch that still
 * fits, recomposes only the slots whose components no longer fit.
 * Returns { patches, changedSlots }.
 */
export function reconcile(patches, step, order) {
  const changedSlots = new Set();
  const kept = patches.filter((p) => {
    if (fits(p.component, order)) return true;
    changedSlots.add(p.slot);
    return false;
  });
  const next = [...kept];
  for (const slot of changedSlots) {
    for (const p of defaultsFor(slot, order, step)) {
      if (!next.some((x) => x.slot === p.slot && x.component === p.component)) next.push(p);
    }
  }
  return { patches: next.map((p) => fix(p, order, step)).sort((a, b) => rank(a, step) - rank(b, step)), changedSlots: [...changedSlots] };
}

/* ======================= 3 · Interpret a chat change ======================= */

const CHANGE_PROMPT = `You are the orchestrator agent of a generative-UI telco buyflow. The customer is mid-journey and typed a change request in chat.
${CONTEXT}
${SLOT_KEYS}

Turn the request into order changes (ops). Change only what they asked for; every other slot is kept.
If the request is about something this order can't change (account settings, bills, complaints, other products), set "outOfScope": true and give no ops.
If they only ask a question, answer in "message" with no ops.
You may also propose a component for a changed slot from this manifest: ${Object.keys(MANIFEST).join(', ')} (e.g. a cheaper plan → PlanFitCompare with intent "local", recommended "S", compareWith "L", variant "compact").

Respond ONLY with JSON:
{"message": "one or two short sentences, plain words, no prices you computed yourself", "ops": [{"key": "plan", "value": "S"}], "patches": [{"slot": "plan", "component": "PlanFitCompare", "variant": "compact", "props": {}}], "outOfScope": false}`;

export async function interpretChange(text, order, { step, patches = [] } = {}) {
  const res = await askJSON(CHANGE_PROMPT, {
    request: text,
    order: summarize(order),
    state: pick(order, Object.keys(BASE_ORDER)),
    screen: { title: step?.title, components: patches.map((p) => `${p.component}${p.variant ? `:${p.variant}` : ''}`) }
  }, { maxTokens: 500 });
  if (!res) return { ...fallbackChange(text, order), source: 'rules' };
  const j = res.json || {};
  const ops = (Array.isArray(j.ops) ? j.ops : [])
    .filter((op) => op && typeof op.key === 'string' && op.key in BASE_ORDER)
    .slice(0, 6);
  const fb = !ops.length && !j.outOfScope && !j.message ? fallbackChange(text, order) : null;
  if (fb && fb.ops.length) return { ...fb, source: 'rules' };
  return {
    message: typeof j.message === 'string' ? j.message : '',
    ops,
    patches: (Array.isArray(j.patches) ? j.patches : []).map(validatePatch).filter(Boolean),
    outOfScope: !!j.outOfScope,
    source: 'llm',
    ms: res.ms,
    raw: j
  };
}

/** Keyword interpretation used when the LLM is unavailable. */
export function fallbackChange(text, order) {
  const t = text.toLowerCase();
  const ops = [];
  let message = '';
  if (/too much|too expensive|barely travel|don'?t travel|cheaper plan|smaller plan|local use/.test(t)) {
    ops.push({ key: 'plan', value: 'S' });
    message = "Then roaming shouldn't decide the plan. Enhanced S fits local use — here's the trade-off.";
  } else if (/enhanced m\b/.test(t)) ops.push({ key: 'plan', value: 'M' });
  else if (/priority l\b/.test(t)) ops.push({ key: 'plan', value: 'L' });
  if (/drop|remove|no add.?ons|without|skip/.test(t)) {
    if (/mobileswop|swop|add.?ons/.test(t)) ops.push({ key: 'swop', value: false });
    if (/trial|add.?ons/.test(t)) ops.push({ key: 'trials', value: 'none' });
    if (/airpods/.test(t)) ops.push({ key: 'pods', value: false });
  } else if (/add (the )?airpods|with airpods/.test(t)) ops.push({ key: 'pods', value: true });
  if (/deliver|delivery|send it|busy tomorrow/.test(t)) {
    ops.push({ key: 'fulfil', value: 'door' }, { key: 'slot', value: 'fri' });
    message = message || "No problem — I'll swap collection for delivery. Everything else stays as it is.";
  } else if (/today|tonight|sooner|collect|pick ?(it )?up/.test(t) && order.fulfil === 'door') {
    ops.push({ key: 'fulfil', value: 'collect' }, { key: 'shop', value: 'TPN' }, { key: 'collectWhen', value: /tonight|today/.test(t) ? 'tonight' : 'tomorrow' });
  }
  const color = COLORS.find((c) => t.includes(c.id));
  if (color && color.id !== order.color) ops.push({ key: 'color', value: color.id });
  const storage = STORAGES.find((s) => t.includes(s.toLowerCase()));
  if (storage && storage !== order.storage) ops.push({ key: 'storage', value: storage });
  const shop = SHOPS.find((s) => t.includes(s.short.toLowerCase()));
  if (shop && shop.id !== order.shop) ops.push({ key: 'shop', value: shop.id });
  if (/second account|0912/.test(t)) ops.push({ key: 'account', value: 'second' });
  return { message: message || (ops.length ? 'Done — only that part of the screen changed.' : ''), ops, patches: [], outOfScope: !ops.length };
}
