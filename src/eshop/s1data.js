/**
 * EShop Buyflow — Scenario 1 (two intents, collect at Tampines) and the
 * three-intent closing example. Prices come from ./data; stock counts and
 * distances are illustrative.
 */

export const S1_PROMPT = "I want the iPhone 18 Pro Max in burgundy, and I'd like to pick it up at Tampines tomorrow.";
export const THREE_PROMPT = "iPhone 18 Pro Max for me, a line for my 12-year-old with parental controls, and I'd like to pick it up at Tampines tomorrow.";

export const S1_GOALS = ['Goal 1 · Phone + plan', 'Goal 2 · Collect tomorrow'];
export const THREE_GOALS = ['Goal 1 · Phone + plan', 'Goal 2 · Line for your child', 'Goal 3 · Collect tomorrow'];

export const S1_SIGNALS = [
  { t: 'Existing customer', s: '2 billing accounts · signed in' },
  { t: 'Browsed the Pro Max 3× this week', s: 'Burgundy · 256GB' },
  { t: 'Compared Priority L twice', s: 'Spent longest on roaming details' },
  { t: 'Singpass on file', s: 'No forms to re-type at checkout' }
];

// Stock per shop (illustrative). Colour/storage options follow the
// DeviceConfigurator shape: { ok, note }.
export const S1_SHOPS = [
  {
    id: 'TPN', letter: 'A', name: 'Singtel Shop · Tampines', short: 'Tampines', distance: '0.6 km',
    close: '9:30pm', stock: 'In stock · 3', tone: 'ok', ok: true,
    colors: { burgundy: [true, '3 here'], graphite: [true, '5 here'], white: [true, '1 here'], silver: [false, 'Bedok has 2'] },
    storages: { '256GB': [true, 'In stock'], '512GB': [true, '1 left'], '1TB': [false, 'Order in'], '2TB': [false, 'Order in'] }
  },
  {
    id: 'BDK', letter: 'B', name: 'Singtel Shop · Bedok', short: 'Bedok', distance: '3.1 km',
    close: '9:30pm', stock: 'Last one', tone: 'warn', ok: true,
    colors: { burgundy: [true, 'Last one'], silver: [true, '2 here'], graphite: [false, 'Tampines has 5'], white: [false, 'Tampines has 1'] },
    storages: { '256GB': [true, 'In stock'], '512GB': [false, 'Order in'], '1TB': [false, 'Order in'], '2TB': [false, 'Order in'] }
  },
  {
    id: 'PSR', letter: 'C', name: 'Singtel Shop · Pasir Ris', short: 'Pasir Ris', distance: '4.4 km',
    close: '9pm', stock: 'Out · back Thu', tone: 'out', ok: false, colors: {}, storages: {}
  }
];

export const RESERVATION = { ready: 'Wed 28 Oct, 11am', held: 'Thu 29 Oct, 9pm' };

// Demo phrases (exact, from the brief) and what each one matches.
export const PHRASES = {
  plan: 'Priority L is too much — I barely travel now.',
  addons: 'Drop MobileSwop and the trials.',
  fulfil: "Actually, deliver it — I'm busy tomorrow."
};

export const MATCH = {
  plan: /too much|too expensive|barely travel|don'?t travel|cheaper plan|smaller plan|local use/i,
  addons: /drop|remove|no add.?ons|without (mobileswop|the trials)|skip (mobileswop|the trials)/i,
  fulfil: /deliver|delivery|busy tomorrow|send it/i
};

export const CHILD_CONTROLS = [
  { key: 'filter', name: 'Mobile Internet Filter', desc: 'Blocks adult and harmful sites · 1 number', price: 'Free' },
  { key: 'barring', name: 'International incoming call/SMS barring', desc: 'Stops overseas scam calls and messages', price: 'Free' },
  { key: 'cap', name: 'App purchase cap', desc: 'In-app purchases need your approval', price: '' },
  { key: 'alert', name: 'Data alert', desc: 'Sent to your phone at 80% of the data allowance', price: '' }
];
