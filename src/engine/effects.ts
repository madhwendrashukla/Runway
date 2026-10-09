import { RESOURCES, type Effects, type Resources } from './types';

export const MIN = 0;
export const MAX = 100;

export const clamp = (v: number) => Math.max(MIN, Math.min(MAX, v));

export function applyEffects(res: Resources, effects: Effects): Resources {
  const out = { ...res };
  for (const r of RESOURCES) {
    const d = effects[r];
    if (d) out[r] = clamp(out[r] + d);
  }
  return out;
}

/** Where each resource would land if `effects` were applied; null for untouched ones. */
export function previewEffects(res: Resources, effects: Effects): Partial<Resources> {
  const out: Partial<Resources> = {};
  for (const r of RESOURCES) {
    const d = effects[r];
    if (d) out[r] = clamp(res[r] + d);
  }
  return out;
}
