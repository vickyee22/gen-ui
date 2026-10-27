/**
 * EShop Buyflow — scenario picker. "Start" runs the live, LLM-composed flow
 * with the scenario's request; "Scripted" opens the hand-built screens as a
 * stage-safe backup.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SCENARIOS } from './data';
import { Page, Btn } from './ui';
import { llmStatus } from './dynamic/llm';

export function Home({ onPick, onLive }) {
  const status = llmStatus();
  return (
    <Page hero>
      <div className="es-stack" style={{ gap: 12 }}>
        <p className="es-eyebrow">EShop buyflow</p>
        <h1 className="es-h1">Pick a journey</h1>
        <p className="es-lede">
          Each journey fills the same order slots in a different order. Say no in plain words at any step and only the
          affected part re-composes.
        </p>
        <div className="es-row">
          <Btn onClick={() => onLive('')}>Ask in your own words <ArrowRight size={18} /></Btn>
          <span className="es-note">
            {status.live ? 'Live — screens composed by the LLM, checked by the rules engine.' : `LLM off (${status.reason}) — rules engine composes instead.`}
          </span>
        </div>
      </div>
      <div className="es-picker">
        {SCENARIOS.map((s) => (
          <div key={s.id} className={`es-option es-picker-card${s.featured ? ' is-featured' : ''}`}>
            <span className={`es-pill ${s.featured ? 'is-brand' : 'is-grey'}`}>{s.tag}</span>
            <span className="es-option-title">{s.title}</span>
            <span className="es-muted" style={{ fontSize: 14 }}>"{s.draft}"</span>
            <div className="es-row" style={{ marginTop: 'auto', gap: 8 }}>
              <Btn onClick={() => onLive(s.draft)}>Start live <ArrowRight size={16} /></Btn>
              <Btn ghost onClick={() => onPick(s)}>Scripted</Btn>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
