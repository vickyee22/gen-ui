/**
 * Dynamic buyflow — the governed component manifest.
 *
 * The LLM may only render components listed here, on the slots listed, with
 * the variants and prop values listed. validatePatch() drops anything else.
 * Prop specs: an array = enum, 'string' | 'number' | 'boolean' | 'string[]'.
 */

export const SLOTS = [
  'intent', 'device', 'plan', 'number', 'sim', 'addons', 'tradein', 'lines', 'fulfilment', 'identity', 'billing', 'payment', 'review', 'done'
];

export const MANIFEST = {
  ContextSignals: { slots: ['intent'], desc: 'Behaviour signals used to tailor this visit, with "Manage what we use".' },
  IntentSplitter: { slots: ['intent'], props: { goals: 'string[]' }, desc: "Splits the request into goal chips, e.g. ['Phone + plan', 'Collect tomorrow']." },

  ShopAvailability: { slots: ['fulfilment'], variants: ['list+map', 'list'], desc: 'Nearby shops with live stock for the chosen phone; pick one to collect.' },
  ReservationCard: { slots: ['fulfilment'], desc: 'Hold at the chosen shop: ready time and hold-until.' },
  FulfilmentSlots: { slots: ['fulfilment'], desc: 'Doorstep delivery slot picker ($10, usual $15).' },
  FulfilmentRecompute: { slots: ['fulfilment'], props: { reason: ['sooner'] }, desc: 'Faster ways to get it (collect tonight/tomorrow vs keep delivery) with price delta.' },
  DeadlineFeasibility: { slots: ['fulfilment'], props: { deadline: 'string' }, desc: 'Timeline checking delivery + number switch against a trip date.' },

  DeviceConfigurator: { slots: ['device'], variants: ['full', 'stock'], desc: 'Phone model + colour + storage picker. "stock" greys out options not at the chosen shop.' },
  PlanFitCompare: {
    slots: ['plan'], variants: ['full', 'compact'],
    props: { intent: ['travel:MY', 'travel:JP', 'local'], recommended: ['F', 'P', 'L', 'M', 'S', 'XS'], compareWith: ['F', 'P', 'L', 'M', 'S', 'XS'], reason: 'string' },
    desc: 'Max 2 plans side by side: recommended + one alternative, reason, 24-month comparison.'
  },
  RoamingReady: { slots: ['plan'], props: { destination: ['MY', 'JP'] }, desc: 'Confirms roaming is on and what is included at the destination.' },
  PriceExplainer: { slots: ['plan', 'payment'], desc: 'Ledger lines counting down to "Payable today".' },

  NumberPicker: { slots: ['number'], variants: ['new'], desc: 'Suggested new numbers + eSIM.' },
  PortInForm: { slots: ['number'], desc: 'Number to keep, current telco, Singpass-verified holder.' },
  OfferUnlocked: { slots: ['number'], props: { trigger: ['port-in'] }, desc: 'Port-in offer: extra $381 off + 10% off the plan.' },
  OpenSlotsHandoff: { slots: ['number', 'addons'], props: { deferred: 'string[]' }, desc: 'Slots left for store staff, who see the same order in the retail app.' },

  TradeOffDecision: { slots: ['addons'], props: { addon: ['mobileswop'] }, desc: 'Keep vs skip MobileSwop Plus with net maths.' },
  TrialTransparency: { slots: ['addons'], desc: 'Free trials with switches and "after trials end +$X/mth".' },
  AccessoryPick: { slots: ['addons'], props: { limit: 'number' }, desc: 'One accessory pick (AirPods Pro 3, $120 off with phone).' },

  TradeInEstimator: { slots: ['tradein'], desc: 'Condition questions → live trade-in estimate.' },
  TradeInLogistics: { slots: ['tradein'], desc: 'How and when the courier collects the old phone.' },

  LineCard: { slots: ['lines'], props: { role: ['upgrade', 'new', 'new-child'] }, desc: 'One line in a multi-line order.' },
  ParentalControls: { slots: ['lines'], desc: 'Controls for a child line: filter, barring, purchase cap, data alert.' },
  GroupedCart: { slots: ['lines'], desc: 'All lines in one cart with one total.' },
  HandDownChecklist: { slots: ['lines'], desc: 'Steps to hand the current phone down to the child.' },

  VerifiedIdentity: { slots: ['identity'], desc: 'Masked Singpass details.' },
  AccountChooser: { slots: ['billing'], desc: 'Choose billing account; primary preselected.' },
  VoucherApply: { slots: ['payment'], props: { code: 'string' }, desc: 'Apply a voucher code.' },
  TradeInPayout: { slots: ['payment'], desc: 'How the trade-in is paid: cover today vs bill credit.' },
  PaymentTiming: { slots: ['payment'], desc: 'Pay now or pay in store (collect only).' },
  PaySummary: { slots: ['payment'], desc: 'Pay today + monthly summary with the Pay button.' },

  ChangeLog: { slots: ['review'], desc: 'Every change made in chat, each with Undo.' },
  SlotDiff: { slots: ['review', 'fulfilment'], props: { changing: 'string[]', kept: 'string[]' }, desc: 'Changing vs Kept chips.' },

  PostOrderTimeline: { slots: ['done'], desc: 'What happens next after paying.' },
  BillExplainer: { slots: ['done'], desc: 'First-bill breakdown.' }
};

/** Prompt-friendly manifest. */
export function manifestForPrompt() {
  return Object.entries(MANIFEST).map(([name, m]) => ({
    name, slots: m.slots, variants: m.variants, props: m.props, desc: m.desc
  }));
}

/** Returns a clean patch, or null if the component/slot isn't allowed. */
export function validatePatch(p) {
  const m = p && MANIFEST[p.component];
  if (!m) return null;
  const slot = m.slots.includes(p.slot) ? p.slot : m.slots[0];
  const variant = m.variants ? (m.variants.includes(p.variant) ? p.variant : m.variants[0]) : undefined;
  const props = {};
  for (const [k, spec] of Object.entries(m.props || {})) {
    const v = p.props?.[k];
    if (v === undefined || v === null) continue;
    if (Array.isArray(spec)) { if (spec.includes(v)) props[k] = v; }
    else if (spec === 'string[]') { if (Array.isArray(v)) props[k] = v.map(String).slice(0, 6); }
    else if (spec === 'number') { if (Number.isFinite(Number(v))) props[k] = Number(v); }
    else if (spec === 'boolean') props[k] = !!v;
    else if (typeof v === 'string') props[k] = v.slice(0, 160);
  }
  return { slot, component: p.component, variant, props };
}
