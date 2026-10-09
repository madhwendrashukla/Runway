// Pure run logic: no Math.random, no Date.now. Safe to share with a server-side replayer.
import { checkDeath } from './death';
import { drawCard, pushRecent } from './deck';
import { applyEffects } from './effects';
import { hashSeed } from './rng';
import type { Card, RunState, Side } from './types';

export const START = { cash: 50, users: 20, team: 50, cred: 40 } as const;

export function createRun(seed: string, deck: Card[]): RunState {
  const base: RunState = {
    seed,
    rng: hashSeed(seed),
    week: 1,
    resources: { ...START },
    cardId: null,
    seen: [],
    recent: [],
    log: [],
    death: null,
  };
  const { cardId, rng } = drawCard(deck, base);
  return { ...base, cardId, rng };
}

export function choose(state: RunState, side: Side, byId: Map<string, Card>, deck: Card[]): RunState {
  if (state.death || !state.cardId) return state;
  const card = byId.get(state.cardId);
  if (!card) return state;

  const resources = applyEffects(state.resources, card[side].effects);
  const death = checkDeath(resources);
  const next: RunState = {
    ...state,
    resources,
    death,
    week: state.week + 1,
    seen: state.seen.includes(card.id) ? state.seen : [...state.seen, card.id],
    recent: pushRecent(state.recent, card.id),
    log: [...state.log, { week: state.week, cardId: card.id, choice: side }],
    cardId: null,
  };
  if (death) return next;

  const { cardId, rng } = drawCard(deck, next);
  return { ...next, cardId, rng };
}

/** Replays a run from its seed and choice log. Used later for server-side validation. */
export function replay(seed: string, choices: Side[], deck: Card[]): RunState {
  const byId = new Map(deck.map((c) => [c.id, c]));
  let s = createRun(seed, deck);
  for (const c of choices) s = choose(s, c, byId, deck);
  return s;
}
