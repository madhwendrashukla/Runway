// Client-side store. The pure engine lives in run.ts; this file only wires it to React.
import { create } from 'zustand';
import { DECK } from '../content/cards';
import { choose, createRun } from './run';
import type { Card, RunState, Side } from './types';

const BY_ID = new Map<string, Card>(DECK.map((c) => [c.id, c]));

export const cardById = (id: string | null) => (id ? BY_ID.get(id) ?? null : null);

function newSeed(): string {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return a[0].toString(36) + a[1].toString(36);
}

interface Reply {
  text: string;
  key: number;
}

interface GameStore {
  run: RunState;
  reply: Reply | null;
  restart: () => void;
  choose: (side: Side) => void;
}

export const useGame = create<GameStore>((set, get) => ({
  run: createRun(newSeed(), DECK),
  reply: null,
  restart: () => set({ run: createRun(newSeed(), DECK), reply: null }),
  choose: (side) => {
    const { run } = get();
    const card = cardById(run.cardId);
    if (!card || run.death) return;
    set({
      run: choose(run, side, BY_ID, DECK),
      reply: { text: card[side].reply, key: run.week },
    });
  },
}));
