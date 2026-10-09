import { MAX, MIN } from './effects';
import { RESOURCES, type Death, type Resources } from './types';

export const DANGER_LOW = 20;
export const DANGER_HIGH = 80;

export function checkDeath(res: Resources): Death | null {
  for (const r of RESOURCES) {
    if (res[r] <= MIN) return { resource: r, end: 'low' };
    if (res[r] >= MAX) return { resource: r, end: 'high' };
  }
  return null;
}

export const isDanger = (v: number) => v < DANGER_LOW || v > DANGER_HIGH;
export const isLethal = (v: number) => v <= MIN || v >= MAX;
