export const RESOURCES = ['cash', 'users', 'team', 'cred'] as const;
export type Resource = (typeof RESOURCES)[number];
export type Resources = Record<Resource, number>;
export type Effects = Partial<Record<Resource, number>>;
export type Side = 'left' | 'right';

export interface DelayedEffect {
  inWeeks: number;
  effects: Effects;
  note: string;
}

export interface Choice {
  label: string;
  effects: Effects;
  reply: string;
  delayed?: DelayedEffect[];
  unlocks?: string[];
}

export interface Range {
  min?: number;
  max?: number;
}

export type Requires = {
  minWeek?: number;
  maxWeek?: number;
} & Partial<Record<Resource, Range>>;

export interface Card {
  id: string;
  chapter: number;
  weight: number;
  speaker: string;
  avatar: string;
  text: string;
  left: Choice;
  right: Choice;
  requires?: Requires;
  once?: boolean;
  tags?: string[];
}

export interface Death {
  resource: Resource;
  end: 'low' | 'high';
}

export interface LogEntry {
  week: number;
  cardId: string;
  choice: Side;
}

/** Fully serialisable run state. Same seed + same choices => same state. */
export interface RunState {
  seed: string;
  rng: number;
  week: number;
  resources: Resources;
  cardId: string | null;
  seen: string[];
  recent: string[];
  log: LogEntry[];
  death: Death | null;
}
