/**
 * Dynamic buyflow — order state, pricing and the deterministic rules engine.
 *
 * The LLM never sets a price. It proposes slot values (ops) and components
 * (patches); everything here decides whether they are allowed and what they
 * cost. All prices come from the brief (see ../data.js); stock, distances,
 * switch dates and trade-in values are illustrative.
 */

import {
  PLANS, ROAMING, TRIALS, SLOTS, ACCOUNTS, NUMBERS, PODS, NEW_LINE_OFFER, SWOP_DISCOUNT, SWOP_MONTHLY,
  REGISTRATION_FEE, DELIVERY_FEE, SIM_ONLY, COLORS, STORAGES, money
} from '../data';
import { S1_SHOPS } from '../s1data';

/* ---------------- Catalogue ---------------- */

export const MODELS = {
  promax: { id: 'promax', name: 'iPhone 18 Pro Max', device: { L: 760, M: 1030, S: 1210 } },
  // The brief only prices the Pro with Priority L.
  pro: { id: 'pro', name: 'iPhone 18 Pro', device: { L: 580 } }
};

export const SHOPS = S1_SHOPS; // TPN · BDK · PSR with per-shop colour/storage stock
export const TELCOS = ['M1', 'StarHub', 'SIMBA', 'Circles.Life', 'giga', 'Other'];
export const VOUCHERS = { WELCOME50: 50 }; // illustrative
export const PORT_DISCOUNT = 0.1;
export const TRADE_BASE = 450; // iPhone 15 Pro 256GB, illustrative
export const LINE_TYPES = ['new', 'port', 'upgrade'];
export const DESTINATIONS = ['MY', 'JP', 'local'];

export const CONTROL_KEYS = ['filter', 'barring', 'cap', 'alert'];

/* ---------------- Order state ---------------- */

export const BASE_ORDER = {
  model: 'promax',
  color: 'burgundy',
  storage: '256GB',
  plan: 'L',
  lineType: 'new', // new | port | upgrade
  number: NUMBERS[0].num,
  portNumber: '+65 9123 ****',
  portTelco: 'M1',
  sim: 'esim',
  swop: true,
  trials: { prime: true },
  remind: true,
  pods: false,
  deferToStore: false, // number + add-ons decided in store (shop-first journeys)
  fulfil: 'door', // door | collect
  shop: null, // TPN | BDK | PSR when collecting
  slot: 'fri',
  collectWhen: 'tomorrow', // tonight | tomorrow
  payAt: 'now', // now | store
  account: 'main',
  childLine: false,
  controls: { filter: true, barring: true, cap: true, alert: true },
  tradeIn: null, // { model, storage, screen: 'ok'|'bad', battery: 'ok'|'bad', works: 'ok'|'bad' }
  payout: 'credit', // credit ($0 today, surplus to bill) | pay (pay subtotal, full credit)
  voucher: null,
  trip: null, // { destination: 'MY'|'JP'|'local', date?: string }
  budget: null
};

/** Builds a valid order from LLM-extracted slots, filling journey defaults. */
export function seedOrder(slots = {}) {
  const o = { ...BASE_ORDER };
  const ops = toOps(slots);
  for (const op of ops) {
    const r = validateOp(o, op);
    if (r.ok) Object.assign(o, r.patch);
  }
  // Journey defaults the customer didn't state.
  if (!('swop' in slots)) o.swop = o.lineType === 'new' && !o.deferToStore ? true : o.tradeIn ? true : false;
  if (!('trials' in slots) && (o.deferToStore || o.lineType !== 'new')) o.trials = {};
  if (o.fulfil === 'collect' && !o.shop) o.shop = 'TPN';
  if (o.model === 'pro') o.plan = 'L';
  return o;
}

function toOps(slots) {
  return Object.entries(slots).map(([key, value]) => ({ key, value }));
}

/**
 * A phone the customer asked for that this store doesn't sell, plus the
 * closest one it does. Phones being traded in or handed down don't count.
 */
export function unavailablePhone(text) {
  const t = text.toLowerCase().replace(/(trad(e|ing)[- ]?in|hand(ing)?[- ]down|my (old|current))[^.,;]*/g, ' ');
  const m = t.match(/iphone\s*(\d{1,2})\s*(pro\s*max|pro|plus|mini|air|e\b)?/);
  if (m && m[1] !== '18') {
    const tier = (m[2] || '').replace(/\s+/g, ' ').trim();
    const asked = `iPhone ${m[1]}${tier ? ` ${tier.replace(/\b\w/g, (c) => c.toUpperCase())}` : ''}`;
    return { asked, closest: /max/.test(tier) || !tier ? 'promax' : 'pro' };
  }
  const other = t.match(/\b(samsung|galaxy|pixel)\b[\w ]{0,20}/);
  if (other) return { asked: other[0].trim().replace(/\b\w/g, (c) => c.toUpperCase()), closest: 'promax' };
  return null;
}

/* ---------------- Pricing ---------------- */

export function tradeEstimate(t) {
  if (!t) return 0;
  if (t.works === 'bad') return 80;
  return TRADE_BASE - (t.screen === 'bad' ? 150 : 0) - (t.battery === 'bad' ? 50 : 0);
}

export function price(o) {
  const model = MODELS[o.model] || MODELS.promax;
  const plan = PLANS[o.plan];
  const device = model.device[o.plan] ?? model.device.L;
  const lines = [{ label: `${model.name} with ${plan.name}`, amount: device }];
  const newLine = o.lineType === 'new' || o.lineType === 'port';
  if (newLine) lines.push({ label: o.lineType === 'port' ? 'Port-in offer' : 'New-line device offer', amount: -NEW_LINE_OFFER });
  if (o.swop) lines.push({ label: 'MobileSwop Plus handset discount', amount: -SWOP_DISCOUNT });
  const voucherOff = o.voucher ? VOUCHERS[o.voucher] || 0 : 0;
  if (voucherOff) lines.push({ label: `Voucher ${o.voucher}`, amount: -voucherOff });
  if (o.pods) lines.push({ label: `${PODS.name} (with phone)`, amount: PODS.price });
  // A trade-in courier delivers the new phone and collects the old one in one
  // visit, so it carries no separate delivery fee (as in the brief's Scenario E).
  const deliveryFee = o.fulfil === 'door' && !o.tradeIn ? DELIVERY_FEE : 0;
  if (o.fulfil === 'door' && !o.tradeIn) lines.push({ label: 'Doorstep delivery (usual $15)', amount: deliveryFee });
  if (o.fulfil === 'collect') lines.push({ label: 'Collect at store', amount: 0 });

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const estimate = tradeEstimate(o.tradeIn);
  let today = subtotal;
  let credit = 0;
  if (o.tradeIn) {
    if (o.payout === 'credit') {
      today = Math.max(0, subtotal - estimate);
      credit = Math.max(0, estimate - subtotal);
    } else {
      credit = estimate;
    }
  }
  const payNow = o.payAt === 'store' ? 0 : today;

  const planMonthly = o.lineType === 'port' ? round2(plan.monthly * (1 - PORT_DISCOUNT)) : plan.monthly;
  const monthlyLines = [{ label: o.lineType === 'port' ? `${plan.name} (10% off)` : plan.name, amount: planMonthly }];
  if (o.swop) monthlyLines.push({ label: 'MobileSwop Plus', amount: SWOP_MONTHLY });
  if (o.childLine) monthlyLines.push({ label: 'Child line · SIM Only (illustrative)', amount: SIM_ONLY });
  const monthly = round2(monthlyLines.reduce((s, l) => s + l.amount, 0));
  const trialsMonthly = round2(TRIALS.reduce((s, t) => s + (o.trials?.[t.id] ? t.price : 0), 0));
  const registration = newLine ? REGISTRATION_FEE : 0;

  return {
    model, plan, device, lines, subtotal, estimate, credit, today, payNow, monthly, monthlyLines, trialsMonthly,
    registration, firstBill: round2(monthly + registration), roaming: ROAMING[o.plan], over24: round2(today + monthly * 24)
  };
}

const round2 = (n) => Math.round(n * 100) / 100;

/* ---------------- Rules engine ---------------- */

const SLOT_OF = {
  model: 'device', color: 'device', storage: 'device', plan: 'plan',
  lineType: 'number', number: 'number', portNumber: 'number', portTelco: 'number', sim: 'sim',
  swop: 'addons', trials: 'addons', remind: 'addons', pods: 'addons', deferToStore: 'addons',
  fulfil: 'fulfilment', shop: 'fulfilment', slot: 'fulfilment', collectWhen: 'fulfilment', payAt: 'payment',
  account: 'billing', childLine: 'lines', controls: 'lines', tradeIn: 'tradein', payout: 'payment',
  voucher: 'payment', trip: 'plan', budget: 'plan'
};
export const slotOfKey = (key) => SLOT_OF[key];

const bool = (v) => v === true || v === 'true' || v === 'on' || v === 'yes';

/**
 * Validates one proposed change against the catalogue and dependency rules.
 * Returns { ok, patch } or { ok: false, reason } with a customer-facing reason.
 */
export function validateOp(o, { key, value }) {
  switch (key) {
    case 'model': {
      const v = String(value).toLowerCase();
      if (/iphone\s*(?!18)\d{1,2}\b|samsung|galaxy|pixel/.test(v)) return no(`We don't sell the ${value} here — we have the iPhone 18 Pro and iPhone 18 Pro Max.`);
      const id = MODELS[v] ? v : /pro ?max|promax/.test(v) ? 'promax' : /\bpro\b/.test(v) ? 'pro' : null;
      if (!id) return no(`We don't sell "${value}" here.`);
      return yes(id === 'pro' ? { model: id, plan: 'L' } : { model: id });
    }
    case 'color': {
      const c = COLORS.find((x) => x.id === String(value).toLowerCase() || x.name.toLowerCase() === String(value).toLowerCase());
      if (!c) return no(`${value} isn't a colour for this phone. It comes in ${COLORS.map((x) => x.name).join(', ')}.`);
      const stock = shopStock(o, 'colors', c.id);
      if (stock && !stock[0]) return no(`${c.name} isn't on the shelf at ${shopName(o)} — ${stock[1]}.`);
      return yes({ color: c.id });
    }
    case 'storage': {
      const s = String(value).toUpperCase().replace(/\s/g, '');
      if (!STORAGES.includes(s)) return no(`Storage comes in ${STORAGES.join(', ')}.`);
      const stock = shopStock(o, 'storages', s);
      if (stock && !stock[0]) return no(`${s} isn't in stock at ${shopName(o)} — it would have to be ordered in.`);
      return yes({ storage: s });
    }
    case 'plan': {
      const id = planId(value);
      if (!id) return no('Plans available: Priority L, Enhanced M, Enhanced S.');
      if (o.model === 'pro' && id !== 'L') return no('In this demo the iPhone 18 Pro is only priced with Priority L.');
      return yes({ plan: id });
    }
    case 'lineType':
      if (!LINE_TYPES.includes(value)) return no('Line must be new, port-in or upgrade.');
      return yes({ lineType: value });
    case 'portTelco':
      return yes({ portTelco: TELCOS.find((t) => t.toLowerCase() === String(value).toLowerCase()) || 'Other' });
    case 'portNumber':
      return yes({ portNumber: maskNumber(value) });
    case 'number':
      if (!NUMBERS.some((n) => n.num === value)) return no('Pick one of the suggested numbers.');
      return yes({ number: value });
    case 'sim':
      return ['esim', 'physical'].includes(value) ? yes({ sim: value }) : no('SIM is eSIM or physical.');
    case 'swop':
    case 'remind':
    case 'pods':
    case 'childLine':
    case 'deferToStore':
      return yes({ [key]: bool(value) });
    case 'trials': {
      if (value === 'none' || value === false || value === null) return yes({ trials: {} });
      if (value === 'all') return yes({ trials: Object.fromEntries(TRIALS.map((t) => [t.id, true])) });
      if (typeof value === 'object') {
        const t = { ...o.trials };
        for (const [k, v] of Object.entries(value)) if (TRIALS.some((x) => x.id === k)) t[k] = bool(v);
        return yes({ trials: t });
      }
      return no('Unknown trial setting.');
    }
    case 'controls': {
      const c = { ...o.controls };
      if (typeof value === 'object') for (const [k, v] of Object.entries(value)) if (CONTROL_KEYS.includes(k)) c[k] = bool(v);
      return yes({ controls: c, childLine: true });
    }
    case 'fulfil': {
      if (value === 'popstation') return no("POPStation delivery isn't available for new lines.");
      if (!['door', 'collect'].includes(value)) return no('You can have it delivered or collect it at a shop.');
      return yes(value === 'collect' ? { fulfil: 'collect', shop: o.shop || 'TPN' } : { fulfil: 'door', payAt: 'now' });
    }
    case 'shop': {
      const s = SHOPS.find((x) => x.id === value || x.short.toLowerCase() === String(value).toLowerCase());
      if (!s) return no(`We don't have a shop called "${value}" nearby. Try Tampines, Bedok or Pasir Ris.`);
      if (!s.ok) return no(`${s.short} is out of stock — back Thu.`);
      const color = s.colors[o.color];
      if (color && !color[0]) return no(`${s.short} has no ${o.color} on the shelf — ${color[1]}.`);
      return yes({ shop: s.id, fulfil: 'collect' });
    }
    case 'slot':
      if (!SLOTS.some((x) => x.id === value)) return no(`Delivery slots: ${SLOTS.map((x) => x.label).join(', ')}.`);
      return yes({ slot: value, fulfil: 'door', payAt: 'now' });
    case 'collectWhen':
      return ['tonight', 'tomorrow'].includes(value) ? yes({ collectWhen: value }) : no('Collect tonight or tomorrow.');
    case 'payAt':
      if (!['now', 'store'].includes(value)) return no('Pay now or in store.');
      if (value === 'store' && o.fulfil !== 'collect') return no('Paying in store only works when you collect.');
      return yes({ payAt: value });
    case 'account':
      return ACCOUNTS.some((a) => a.id === value) ? yes({ account: value }) : no('Bill to the main (4471) or second (0912) account.');
    case 'tradeIn':
      if (!value || value === 'none') return yes({ tradeIn: null });
      return yes({
        tradeIn: {
          model: value.model || 'iPhone 15 Pro',
          storage: value.storage || '256GB',
          screen: value.screen === 'bad' ? 'bad' : 'ok',
          battery: value.battery === 'bad' ? 'bad' : 'ok',
          works: value.works === 'bad' ? 'bad' : 'ok'
        }
      });
    case 'payout':
      return ['credit', 'pay'].includes(value) ? yes({ payout: value }) : no('Trade-in can cover today or go to your bills.');
    case 'voucher': {
      if (!value || value === 'none') return yes({ voucher: null });
      const code = String(value).toUpperCase();
      return VOUCHERS[code] ? yes({ voucher: code }) : no(`Voucher ${code} isn't valid.`);
    }
    case 'trip': {
      if (!value) return yes({ trip: null });
      const raw = String(typeof value === 'string' ? value : value.destination || '').toLowerCase();
      const d = /\bjp\b|japan|tokyo|osaka/.test(raw) ? 'JP' : /\bmy\b|malaysia|\bkl\b|kuala/.test(raw) ? 'MY' : 'local';
      return yes({ trip: { destination: d, date: (typeof value === 'object' && value.date) || null } });
    }
    case 'budget':
      return yes({ budget: Number(value) || null });
    default:
      return no(`I can't change "${key}" here.`);
  }
}

const yes = (patch) => ({ ok: true, patch });
const no = (reason) => ({ ok: false, reason });

function shopStock(o, kind, id) {
  if (o.fulfil !== 'collect' || !o.shop) return null;
  const s = SHOPS.find((x) => x.id === o.shop);
  return s?.[kind]?.[id] || null;
}
const shopName = (o) => SHOPS.find((x) => x.id === o.shop)?.short || 'that shop';
const planId = (v) => {
  const s = String(v).toLowerCase();
  if (['l', 'priority l', 'prio_l', 'priority'].includes(s)) return 'L';
  if (['m', 'enhanced m', 'enh_m'].includes(s)) return 'M';
  if (['s', 'enhanced s', 'enh_s'].includes(s)) return 'S';
  return PLANS[v] ? v : null;
};
const maskNumber = (v) => {
  const d = String(v).replace(/\D/g, '').slice(-8);
  return d.length === 8 ? `+65 ${d.slice(0, 4)} ****` : '+65 9123 ****';
};

/**
 * Applies a set of ops. Changing one slot keeps every other slot unless a rule
 * invalidates it; invalidated slots are reset and reported.
 */
export function applyOps(o, ops) {
  let next = { ...o };
  const applied = [];
  const rejected = [];
  for (const op of ops) {
    const r = validateOp(next, op);
    if (r.ok) {
      next = { ...next, ...r.patch };
      applied.push(op);
    } else rejected.push({ ...op, reason: r.reason });
  }
  // Dependency: the device colour/storage must stay in stock at the chosen shop.
  const invalidated = [];
  if (next.fulfil === 'collect' && next.shop) {
    const s = SHOPS.find((x) => x.id === next.shop);
    const c = s?.colors?.[next.color];
    if (c && !c[0]) invalidated.push(`${next.color} isn't at ${s.short} (${c[1]})`);
  }
  return { order: next, applied, rejected, invalidated };
}

/**
 * Price impact of a change. A change needs confirmation when it raises today's
 * price or removes a discount.
 */
export function impact(before, after) {
  const a = price(before);
  const b = price(after);
  const removesDiscount = (before.swop && !after.swop) || (before.voucher && !after.voucher) || (before.lineType !== 'upgrade' && after.lineType === 'upgrade');
  return {
    before: { today: a.payNow, monthly: a.monthly },
    after: { today: b.payNow, monthly: b.monthly },
    confirm: b.payNow > a.payNow + 0.001 || removesDiscount,
    over24Delta: round2(b.over24 - a.over24)
  };
}

/* ---------------- Descriptions (change log + LLM context) ---------------- */

export function describe(o, key) {
  switch (key) {
    case 'plan': return PLANS[o.plan].name;
    case 'model': return MODELS[o.model].name;
    case 'color': return COLORS.find((c) => c.id === o.color)?.name;
    case 'storage': return o.storage;
    case 'swop': return o.swop ? 'MobileSwop' : 'No MobileSwop';
    case 'trials': {
      const on = TRIALS.filter((t) => o.trials?.[t.id]).map((t) => t.name.split(' ')[0]);
      return on.length ? `Trials: ${on.join(', ')}` : 'No trials';
    }
    case 'pods': return o.pods ? 'AirPods Pro 3' : 'No AirPods';
    case 'fulfil':
    case 'shop':
    case 'slot':
    case 'collectWhen':
      return o.fulfil === 'collect'
        ? `Collect ${o.collectWhen === 'tonight' ? 'tonight' : 'Wed'} · ${shopName(o)}`
        : `Deliver ${SLOTS.find((s) => s.id === o.slot)?.label.split(' · ')[0]}`;
    case 'payAt': return o.payAt === 'store' ? 'Pay in store' : 'Pay now';
    case 'account': return ACCOUNTS.find((a) => a.id === o.account)?.title;
    case 'lineType': return { new: 'New line', port: `Port-in from ${o.portTelco}`, upgrade: 'Upgrade' }[o.lineType];
    case 'payout': return o.payout === 'credit' ? '$0 today + bill credit' : 'Pay subtotal + full credit';
    case 'voucher': return o.voucher || 'No voucher';
    case 'childLine': return o.childLine ? 'Child line added' : 'No child line';
    case 'tradeIn': return o.tradeIn ? `${o.tradeIn.model} · est. ${money(tradeEstimate(o.tradeIn))}` : 'No trade-in';
    default: return JSON.stringify(o[key]);
  }
}

/** Compact state summary for the LLM. Prices are included as read-only facts. */
export function summarize(o) {
  const p = price(o);
  return {
    device: `${p.model.name} · ${describe(o, 'color')} · ${o.storage}`,
    plan: `${p.plan.name} ($${p.plan.monthly}/mth) · roaming: ${p.roaming}`,
    line: describe(o, 'lineType'),
    addons: [describe(o, 'swop'), describe(o, 'trials'), describe(o, 'pods')].join(' · '),
    getIt: describe(o, 'fulfil'),
    payAt: describe(o, 'payAt'),
    childLine: o.childLine,
    tradeIn: describe(o, 'tradeIn'),
    voucher: o.voucher,
    trip: o.trip,
    budget: o.budget,
    payToday: p.payNow,
    monthly: p.monthly
  };
}
