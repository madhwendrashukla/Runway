import type { RunState } from './types';

/** Weeks fully survived. A run that dies on week N survived N - 1 weeks. */
export const weeksSurvived = (s: RunState) => s.week - 1;

// M1: weeks only. Momentum and chapter bonuses arrive with those systems.
export const score = (s: RunState) => weeksSurvived(s) * 100;
