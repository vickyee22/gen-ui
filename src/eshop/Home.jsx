/**
 * EShop Buyflow — scenario picker.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SCENARIOS } from './data';
import { Page, Option } from './ui';

export function Home({ onPick }) {
  return (
    <Page hero>
      <div className="es-stack" style={{ gap: 12 }}>
        <p className="es-eyebrow">EShop buyflow</p>
        <h1 className="es-h1">Pick a journey</h1>
        <p className="es-lede">
          Each journey fills the same order slots in a different order. Say no in plain words at any step and only the
          affected part re-composes.
        </p>
      </div>
      <div className="es-picker">
        {SCENARIOS.map((s) => (
          <Option key={s.id} className={s.featured ? 'is-featured' : ''} onClick={() => onPick(s)}>
            <span className={`es-pill ${s.featured ? 'is-brand' : 'is-grey'}`}>{s.tag}</span>
            <span className="es-option-title">{s.title}</span>
            <span className="es-muted" style={{ fontSize: 14 }}>"{s.draft}"</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, marginTop: 'auto' }}>
              Start <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Option>
        ))}
      </div>
    </Page>
  );
}
