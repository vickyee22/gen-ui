/**
 * EShop Gen UI Buyflow — standalone, production-style storefront.
 * The customer states intent once; each next screen is composed from the
 * governed components in ./ui, ./agent and the scenario screens.
 *
 * Routes: #eshop (picker), #eshop/<scenario>/<step>. ?demo=1 hides the
 * component-labels toggle (customer view only).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_ORDER, FLOWS, FLOW_ENTRY, BRAND, routeIntent } from './data';
import { Header, Progress, Composing } from './ui';
import { LabelsContext } from './agent';
import { Home } from './Home';
import { Intent, Fit, Line, Extras, Checkout, Done } from './MainFlow';
import {
  ShopAvail, ShopFit, ShopReserve, TwoLines, TwoLineCart, PortIn, PortTiming,
  Pivot, PivotResolved, TradeIn, TradePrice, Confirmed
} from './Scenarios';
import {
  S1Intent, S1Shop, S1Fit, S1Extras, S1Reserve, S1Review, S1Done, ThreeIntent, ThreeOverview
} from './Scenario1';
import '../styles/eshop.css';

const SCREENS = {
  home: { C: Home, path: '' },
  // Scenario 1 (opener)
  s1Intent: { C: S1Intent, path: '/s1/intent', flow: 's1', step: 0 },
  s1Shop: { C: S1Shop, path: '/s1/shop', flow: 's1', step: 1, composing: 'Checking live stock near Tampines' },
  s1Fit: { C: S1Fit, path: '/s1/fit', flow: 's1', step: 2, composing: "Filtering to Tampines' shelf" },
  s1Extras: { C: S1Extras, path: '/s1/extras', flow: 's1', step: 3, composing: 'Checking trials and add-ons' },
  s1Reserve: { C: S1Reserve, path: '/s1/reserve', flow: 's1', step: 4, composing: 'Preparing your reservation' },
  s1Review: { C: S1Review, path: '/s1/review', flow: 's1', step: 5, composing: 'Collecting your changes' },
  s1Done: { C: S1Done, path: '/s1/done', composing: 'Placing your order' },
  // Scenario 2 (device first) — the original main flow
  intent: { C: Intent, path: '/s2/intent', flow: 'main', step: 0 },
  fit: { C: Fit, path: '/s2/fit', flow: 'main', step: 1, composing: 'Matching plans to your trips' },
  line: { C: Line, path: '/s2/line', flow: 'main', step: 2, composing: 'Setting up your new line' },
  extras: { C: Extras, path: '/s2/extras', flow: 'main', step: 3, composing: 'Checking trials and add-ons' },
  checkout: { C: Checkout, path: '/s2/checkout', flow: 'main', step: 4, composing: 'Pre-filling from Singpass and your account' },
  done: { C: Done, path: '/s2/done', composing: 'Placing your order' },
  // Scenario D (pivot)
  pivot: { C: Pivot, path: '/d/pivot', flow: 'main', step: 4, composing: 'Recomputing fulfilment' },
  pivotResolved: { C: PivotResolved, path: '/d/resolved', flow: 'main', step: 4, composing: 'Updating your checkout' },
  // Scenario A (shop first)
  shopAvail: { C: ShopAvail, path: '/a/shop', flow: 'shop', step: 0, composing: 'Checking live stock near Tampines' },
  shopFit: { C: ShopFit, path: '/a/fit', flow: 'shop', step: 1, composing: "Filtering to this shop's shelf" },
  shopReserve: { C: ShopReserve, path: '/a/reserve', flow: 'shop', step: 2, composing: 'Preparing your reservation' },
  // Scenario B (two lines)
  twoLines: { C: TwoLines, path: '/b/lines', flow: 'lines', step: 1, composing: 'Splitting your request into two lines' },
  twoLineCart: { C: TwoLineCart, path: '/b/cart', flow: 'lines', step: 2, composing: 'Grouping both lines into one cart' },
  // Scenario C (port-in)
  portIn: { C: PortIn, path: '/c/port-in', flow: 'port', step: 1, composing: 'Checking port-in eligibility' },
  portTiming: { C: PortTiming, path: '/c/timing', flow: 'port', step: 2, composing: 'Checking dates against your flight' },
  // Scenario E (trade-in)
  tradeIn: { C: TradeIn, path: '/e/trade-in', flow: 'trade', step: 1, composing: 'Looking up your iPhone 15 Pro' },
  tradePrice: { C: TradePrice, path: '/e/price', flow: 'trade', step: 2, composing: 'Adding up your price' },
  confirmed: { C: Confirmed, path: '/confirmed', composing: 'Placing your order' },
  // Closing example (three intents)
  threeIntent: { C: ThreeIntent, path: '/three/intent', flow: 'three', step: 0 },
  threeOverview: { C: ThreeOverview, path: '/three/overview', flow: 'three', step: 1, composing: 'Composing one overview for three goals' }
};

const BY_PATH = Object.fromEntries(Object.entries(SCREENS).map(([k, v]) => [v.path, k]));
const screenFromHash = () => BY_PATH[window.location.hash.replace(/^#eshop/, '').replace(/\/$/, '')] || 'home';

// Scenario 1 and the closing example start from shop collection, so deep links
// into them seed the same order the Intent screen would.
const COLLECT_ORDER = { ...DEFAULT_ORDER, fulfil: 'collect', shop: 'TPN' };
const initialOrder = (screen) => (/^(s1|three)/.test(screen) ? COLLECT_ORDER : DEFAULT_ORDER);

const COMPOSE_MS = 750;
const DEMO = new URLSearchParams(window.location.search).get('demo') === '1';

export default function EShopApp({ onExit }) {
  const [screen, setScreen] = useState(screenFromHash);
  const [order, setOrderState] = useState(() => initialOrder(screenFromHash()));
  const [scenario, setScenarioState] = useState({});
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(null);
  const [changes, setChanges] = useState([]);
  const [labels, setLabels] = useState(false);
  const timer = useRef(null);
  const orderRef = useRef(order);
  const scenarioRef = useRef(scenario);
  orderRef.current = order;
  scenarioRef.current = scenario;

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const onPop = () => setScreen(screenFromHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const show = useCallback((next) => {
    setScreen(next);
    const hash = '#eshop' + SCREENS[next].path;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  }, []);

  const setOrder = useCallback((patch) => setOrderState((o) => ({ ...o, ...patch })), []);
  const setScenario = useCallback((patch) => setScenarioState((s) => ({ ...s, ...patch })), []);

  /**
   * Apply a slot change and log it. Same-slot changes merge into one row and
   * keep the original values, so Undo always returns to before the first change.
   * change = { slot, label?, from, to, order?: patch, scenario?: patch }
   */
  const applyChange = useCallback((change) => {
    const o = change.order || {};
    const sc = change.scenario || {};
    const prevOrder = Object.fromEntries(Object.keys(o).map((k) => [k, orderRef.current[k]]));
    const prevScenario = Object.fromEntries(Object.keys(sc).map((k) => [k, scenarioRef.current[k]]));
    setChanges((list) => {
      const existing = list.find((c) => c.slot === change.slot);
      if (!existing) {
        return [...list, { id: `${change.slot}-${Date.now()}`, slot: change.slot, label: change.label, from: change.from, to: change.to, prevOrder, prevScenario }];
      }
      return list.map((c) =>
        c === existing
          ? { ...c, to: change.to, prevOrder: { ...prevOrder, ...c.prevOrder }, prevScenario: { ...prevScenario, ...c.prevScenario } }
          : c
      );
    });
    if (Object.keys(o).length) setOrderState((cur) => ({ ...cur, ...o }));
    if (Object.keys(sc).length) setScenarioState((cur) => ({ ...cur, ...sc }));
  }, []);

  const undoChange = useCallback((idOrSlot) => {
    setChanges((list) => {
      const c = list.find((x) => x.id === idOrSlot || x.slot === idOrSlot);
      if (!c) return list;
      setOrderState((cur) => ({ ...cur, ...c.prevOrder }));
      setScenarioState((cur) => ({ ...cur, ...c.prevScenario }));
      return list.filter((x) => x !== c);
    });
  }, []);

  const changeFor = useCallback((slot) => changes.find((c) => c.slot === slot), [changes]);

  const go = useCallback((next, patch, opts = {}) => {
    if (patch?.pivotPrompt) {
      setPrompt(patch.pivotPrompt);
      const { pivotPrompt, ...rest } = patch;
      patch = rest;
    }
    if (patch && Object.keys(patch).length) setOrderState((o) => ({ ...o, ...patch }));
    clearTimeout(timer.current);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (opts.instant || !SCREENS[next].composing) {
      setComposing(null);
      show(next);
      return;
    }
    setComposing(SCREENS[next].composing);
    timer.current = setTimeout(() => {
      setComposing(null);
      show(next);
    }, COMPOSE_MS);
  }, [show]);

  const reset = useCallback(() => {
    setOrderState(DEFAULT_ORDER);
    setScenarioState({});
    setChanges([]);
    setPrompt('');
  }, []);

  const restart = useCallback(() => {
    reset();
    setDraft('');
    go('home', null, { instant: true });
  }, [go, reset]);

  const pick = useCallback((s) => {
    reset();
    setDraft(s.draft);
    if (s.entry === 'checkout') setPrompt(s.draft);
    go(s.entry, null, { instant: true });
  }, [go, reset]);

  const handleIntent = useCallback((text, flow) => {
    const f = flow || routeIntent(text);
    reset();
    setPrompt(text);
    go(FLOW_ENTRY[f]);
  }, [go, reset]);

  const def = SCREENS[screen];
  const Screen = def.C;
  const progress = def.flow ? FLOWS[def.flow] : null;

  return (
    <LabelsContext.Provider value={labels}>
      <div className="es">
        <Header onHome={restart} labels={labels} onLabels={() => setLabels((v) => !v)} showLabelsToggle={!DEMO} />
        {!composing && <Progress steps={progress} current={def.step} />}
        <AnimatePresence mode="wait">
          {composing ? (
            <motion.div key="composing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Composing label={composing} />
            </motion.div>
          ) : (
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Screen
                order={order}
                setOrder={setOrder}
                scenario={scenario}
                setScenario={setScenario}
                go={go}
                prompt={prompt}
                setPrompt={setPrompt}
                draft={draft}
                onSubmit={handleIntent}
                onRestart={restart}
                onPick={pick}
                changes={changes}
                applyChange={applyChange}
                undoChange={undoChange}
                changeFor={changeFor}
                labels={labels}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <footer className="es-footer">
          <div className="es-wrap es-footer-inner">
            <span>© 2026 {BRAND}. Prices include GST. Stock, distances, trade-in and switch dates are illustrative.</span>
            <div className="es-footer-links">
              <button type="button">Terms of use</button>
              <button type="button">Data protection</button>
              {onExit && <button type="button" onClick={onExit}>Exit demo</button>}
            </div>
          </div>
        </footer>
      </div>
    </LabelsContext.Provider>
  );
}
