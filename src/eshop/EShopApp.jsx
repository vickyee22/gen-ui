/**
 * EShop Gen UI Buyflow — standalone, production-style storefront.
 * The customer states intent once; each next screen is composed from the
 * governed components in ./ui and the scenario screens.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_ORDER, FLOWS, FLOW_ENTRY, BRAND, routeIntent } from './data';
import { Header, Progress, Composing } from './ui';
import { Intent, Fit, Line, Extras, Checkout, Done } from './MainFlow';
import {
  ShopAvail, ShopFit, ShopReserve, TwoLines, TwoLineCart, PortIn, PortTiming,
  Pivot, PivotResolved, TradeIn, TradePrice, Confirmed
} from './Scenarios';
import '../styles/eshop.css';

const SCREENS = {
  intent: { C: Intent, flow: 'main', step: 0 },
  fit: { C: Fit, flow: 'main', step: 1, composing: 'Matching plans to your trips' },
  line: { C: Line, flow: 'main', step: 2, composing: 'Setting up your new line' },
  extras: { C: Extras, flow: 'main', step: 3, composing: 'Checking trials and add-ons' },
  checkout: { C: Checkout, flow: 'main', step: 4, composing: 'Pre-filling from Singpass and your account' },
  done: { C: Done, composing: 'Placing your order' },
  pivot: { C: Pivot, flow: 'main', step: 4, composing: 'Recomputing fulfilment' },
  pivotResolved: { C: PivotResolved, flow: 'main', step: 4, composing: 'Updating your checkout' },
  shopAvail: { C: ShopAvail, flow: 'shop', step: 0, composing: 'Checking live stock near Tampines' },
  shopFit: { C: ShopFit, flow: 'shop', step: 1, composing: "Filtering to this shop's shelf" },
  shopReserve: { C: ShopReserve, flow: 'shop', step: 2, composing: 'Preparing your reservation' },
  twoLines: { C: TwoLines, flow: 'lines', step: 1, composing: 'Splitting your request into two lines' },
  twoLineCart: { C: TwoLineCart, flow: 'lines', step: 2, composing: 'Grouping both lines into one cart' },
  portIn: { C: PortIn, flow: 'port', step: 1, composing: 'Checking port-in eligibility' },
  portTiming: { C: PortTiming, flow: 'port', step: 2, composing: 'Checking dates against your flight' },
  tradeIn: { C: TradeIn, flow: 'trade', step: 1, composing: 'Looking up your iPhone 15 Pro' },
  tradePrice: { C: TradePrice, flow: 'trade', step: 2, composing: 'Adding up your price' },
  confirmed: { C: Confirmed, composing: 'Placing your order' }
};

const COMPOSE_MS = 750;

export default function EShopApp({ onExit }) {
  const [screen, setScreen] = useState('intent');
  const [order, setOrderState] = useState(DEFAULT_ORDER);
  const [scenario, setScenarioState] = useState({});
  const [prompt, setPrompt] = useState('');
  const [composing, setComposing] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const setOrder = useCallback((patch) => setOrderState((o) => ({ ...o, ...patch })), []);
  const setScenario = useCallback((patch) => setScenarioState((s) => ({ ...s, ...patch })), []);

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
      setScreen(next);
      return;
    }
    setComposing(SCREENS[next].composing);
    timer.current = setTimeout(() => {
      setComposing(null);
      setScreen(next);
    }, COMPOSE_MS);
  }, []);

  const restart = useCallback(() => {
    setOrderState(DEFAULT_ORDER);
    setScenarioState({});
    setPrompt('');
    go('intent', null, { instant: true });
  }, [go]);

  const handleIntent = useCallback((text, flow) => {
    const f = flow || routeIntent(text);
    setOrderState(DEFAULT_ORDER);
    setScenarioState({});
    setPrompt(text);
    go(FLOW_ENTRY[f]);
  }, [go]);

  const def = SCREENS[screen];
  const Screen = def.C;
  const progress = def.flow ? FLOWS[def.flow] : null;

  return (
    <div className="es">
      <Header onHome={restart} />
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
              onSubmit={handleIntent}
              onRestart={restart}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="es-footer">
        <div className="es-wrap es-footer-inner">
          <span>© 2026 {BRAND}. Prices include GST and are illustrative.</span>
          <div className="es-footer-links">
            <button type="button">Terms of use</button>
            <button type="button">Data protection</button>
            {onExit && <button type="button" onClick={onExit}>Exit demo</button>}
          </div>
        </div>
      </footer>
    </div>
  );
}
