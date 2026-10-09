import { nextRandom } from './rng';
import { RESOURCES, type Card, type RunState } from './types';

/** How many recent cards are kept out of the draw to avoid immediate repeats. */
const RECENT_WINDOW = 4;

export function isEligible(card: Card, state: RunState): boolean {
  if (card.once && state.seen.includes(card.id)) return false;
  const req = card.requires;
  if (!req) return true;
  if (req.minWeek !== undefined && state.week < req.minWeek) return false;
  if (req.maxWeek !== undefined && state.week > req.maxWeek) return false;
  for (const r of RESOURCES) {
    const range = req[r];
    if (!range) continue;
    if (range.min !== undefined && state.resources[r] < range.min) return false;
    if (range.max !== undefined && state.resources[r] > range.max) return false;
  }
  return true;
}

/** Weighted draw. Returns the chosen card id and the advanced RNG state. */
export function drawCard(deck: Card[], state: RunState): { cardId: string | null; rng: number } {
  const eligible = deck.filter((c) => isEligible(c, state));
  const fresh = eligible.filter((c) => !state.recent.includes(c.id));
  const pool = fresh.length > 0 ? fresh : eligible;
  if (pool.length === 0) return { cardId: null, rng: state.rng };

  const [roll, rng] = nextRandom(state.rng);
  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let t = roll * total;
  for (const c of pool) {
    t -= c.weight;
    if (t < 0) return { cardId: c.id, rng };
  }
  return { cardId: pool[pool.length - 1].id, rng };
}

export function pushRecent(recent: string[], id: string): string[] {
  return [...recent, id].slice(-RECENT_WINDOW);
}
