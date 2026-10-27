/**
 * Dynamic buyflow — component registry: manifest name → renderer.
 */

import { CORE } from './core';
import { JOURNEYS } from './journeys';

export const REGISTRY = { ...CORE, ...JOURNEYS };
