/**
 * EShop Buyflow — scenario data and intent routing.
 * All prices are illustrative and mirror the "EShop Gen UI Buyflow" design boards.
 */

// The "Tailoring this visit" context-signals card on the Intent screen is
// switched off for the production-style demo. Flip to true to bring it back.
export const SHOW_CONTEXT_SIGNALS = false;

export const BRAND = 'Singtel';

export const CUSTOMER = {
  firstName: 'Wei Ling',
  fullName: 'Tan Wei Ling',
  nric: '****567D',
  phone: '+65 ****8812',
  email: 'w****@gmail.com',
  address: 'Blk 512 Tampines Central 1'
};

export const FLOWS = {
  main: ['Intent', 'Fit', 'Line', 'Extras', 'Checkout'],
  shop: ['Shop', 'Fit', 'Reserve'],
  lines: ['Goals', 'Lines', 'Checkout'],
  port: ['Number', 'Plan', 'Timing', 'Checkout'],
  trade: ['Intent', 'Trade-in', 'Price', 'Checkout']
};

export const COLORS = [
  { id: 'burgundy', name: 'Burgundy', hex: '#5B1E2A' },
  { id: 'silver', name: 'Silver', hex: '#D9DCE0' },
  { id: 'graphite', name: 'Graphite', hex: '#2E2E30' },
  { id: 'white', name: 'White', hex: '#F2F1EE' }
];

export const STORAGES = ['256GB', '512GB', '1TB', '2TB'];

export const PLANS = {
  L: { id: 'L', name: 'Priority L', monthly: 128, device: 760 },
  M: { id: 'M', name: 'Enhanced M', monthly: 98, device: 1030 }
};

export const NEW_LINE_OFFER = 381;
export const SWOP_DISCOUNT = 150;
export const SWOP_MONTHLY = 13.9;
export const REGISTRATION_FEE = 10.9;
export const DELIVERY_FEE = 10;
export const PODS = { name: 'Apple AirPods Pro 3', was: 349, price: 229 };
export const BUDGET = 140;

export const NUMBERS = [
  { num: '9638 8347', tag: 'Repeats 8s' },
  { num: '9632 2241' },
  { num: '9732 6546' },
  { num: '9825 3053' },
  { num: '9619 0549' },
  { num: '9639 0975' }
];

export const TRIALS = [
  { id: 'prime', name: 'Amazon Prime', free: '90 days', price: 4.99, from: 'late Jan', match: true },
  { id: 'st', name: 'The Straits Times All Digital', free: '90 days', price: 29.9, from: 'late Jan' },
  { id: 'bein', name: 'beIN SPORTS CONNECT', free: '60 days', price: 14.98, from: 'late Dec' },
  { id: 'viu', name: 'Viu Premium', free: '60 days', price: 9.98, from: 'late Dec' },
  { id: 'julecool', name: 'Ju Le Cool', free: '60 days', price: 9.9, from: 'late Dec' }
];

export const ACCOUNTS = [
  { id: 'main', title: 'Main account · ending 4471', sub: 'Blk 512 Tampines Central 1 · 3 lines already' },
  { id: 'second', title: 'Second account · ending 0912', sub: 'Blk 512 Tampines Central 1 · fibre broadband' }
];

export const SLOTS = [
  { id: 'thu', label: 'Thu 29 Oct · 9am–12pm' },
  { id: 'fri', label: 'Fri 30 Oct · 9am–12pm' },
  { id: 'sat', label: 'Sat 31 Oct · 2pm–6pm' },
  { id: 'mon', label: 'Mon 2 Nov · 6pm–9pm' }
];

export const SHOPS = [
  { id: 'A', name: 'Singtel Shop · Tampines', short: 'Tampines', distance: '0.6 km', close: '9:30pm', queue: 'about 10 min wait', stock: 'In stock · 3', tone: 'ok', ok: true },
  { id: 'B', name: 'Singtel Shop · Bedok', short: 'Bedok', distance: '3.1 km', close: '9:30pm', queue: 'short wait', stock: 'Last one', tone: 'warn', ok: true },
  { id: 'C', name: 'Singtel Shop · Pasir Ris', short: 'Pasir Ris', distance: '4.4 km', close: '9pm', queue: 'short wait', stock: 'Out · back Thu', tone: 'out', ok: false }
];

export const DEFAULT_ORDER = {
  color: 'burgundy',
  storage: '256GB',
  plan: 'L',
  number: '9638 8347',
  swop: true,
  trials: { prime: true },
  remind: true,
  pods: false,
  account: 'main',
  fulfil: 'door',
  slot: 'fri',
  pivot: null,
  confirmation: null
};

export const money = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function priceMain(order) {
  const plan = PLANS[order.plan];
  const swopOff = order.swop ? SWOP_DISCOUNT : 0;
  const deviceToday = plan.device - NEW_LINE_OFFER - swopOff;
  const podsToday = order.pods ? PODS.price : 0;
  const fulfilFee = order.fulfil === 'door' ? DELIVERY_FEE : 0;
  const monthly = plan.monthly + (order.swop ? SWOP_MONTHLY : 0);
  const trialsMonthly = TRIALS.reduce((s, t) => s + (order.trials[t.id] ? t.price : 0), 0);
  return {
    plan,
    deviceToday,
    podsToday,
    fulfilFee,
    beforeFulfil: deviceToday + podsToday,
    today: deviceToday + podsToday + fulfilFee,
    monthly,
    trialsMonthly,
    firstBill: monthly + REGISTRATION_FEE
  };
}

export const colorOf = (id) => COLORS.find((c) => c.id === id) || COLORS[0];

// Canonical customer requests for each journey (used by the starter chips).
export const PROMPTS = {
  main: "I want the new iPhone 18 Pro Max in burgundy. I'm in KL most months for work — keep my bill around $140 a month.",
  shop: "Is the burgundy iPhone 18 Pro Max in stock near Tampines? I'd rather collect it and get it set up in store.",
  lines: 'Upgrade my phone to the iPhone 18 Pro, and add a line for my 12-year-old with parental controls.',
  port: "I'm switching to Singtel and keeping my number. I want the iPhone 18 Pro Max, and I fly to Tokyo next Thursday.",
  trade: "iPhone 18 Pro Max on Priority L. I'm trading in my iPhone 15 Pro and I've got a voucher code."
};

export const STARTERS = [
  { label: 'Upgrade my phone, add a line for my child', flow: 'lines' },
  { label: 'Switch to Singtel, keep my number', flow: 'port' },
  { label: 'Is it in stock near me?', flow: 'shop' },
  { label: 'Trade in my old phone', flow: 'trade' },
  { label: 'Compare plans for travel', flow: 'main' }
];

export const FLOW_ENTRY = {
  main: 'fit',
  shop: 'shopAvail',
  lines: 'twoLines',
  port: 'portIn',
  trade: 'tradeIn'
};

/** Deterministic intent router: picks the journey whose slot should come first. */
export function routeIntent(text) {
  const t = text.toLowerCase();
  if (/trade.?in|trading in|voucher|old phone for/.test(t)) return 'trade';
  if (/switch(ing)? to|port|keep my number|bring my number|from (m1|starhub|simba|circles)|tokyo|japan/.test(t)) return 'port';
  if (/child|kid|son|daughter|12-year|two lines|2 lines|add a line|family|parental/.test(t)) return 'lines';
  if (/in stock|stock|collect|pick ?it up|pick up|near (me|tampines)|in store|shop near|nearest shop/.test(t)) return 'shop';
  return 'main';
}

export function isPivotRequest(text) {
  return /today|tonight|sooner|faster|earlier|pick ?(it )?up|collect/.test(text.toLowerCase());
}
