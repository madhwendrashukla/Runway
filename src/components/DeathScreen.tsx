import { useEffect } from 'react';
import { DEATHS } from '../content/deaths';
import { RESOURCE_META } from '../content/resources';
import { cardById } from '../engine/store';
import { weeksSurvived } from '../engine/score';
import type { RunState } from '../engine/types';
import { ResourceIcon } from './Icon';

export function DeathScreen({ run, onRestart }: { run: RunState; onRestart: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart]);

  if (!run.death) return null;
  const { resource, end } = run.death;
  const copy = DEATHS[resource][end];
  const meta = RESOURCE_META[resource];
  const last = run.log[run.log.length - 1];
  const lastCard = last ? cardById(last.cardId) : null;
  const weeks = weeksSurvived(run);

  return (
    <div className="death" role="dialog" aria-modal="true" aria-labelledby="death-title">
      <div className="death-card">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
          <ResourceIcon kind={resource} size={16} />
          {meta.label} {end === 'low' ? 'hit zero' : 'maxed out'}
        </div>
        <h2 id="death-title" className="mt-3 font-display text-[30px] font-semibold leading-[1.05]">
          {copy.title}
        </h2>
        <p className="mt-2 text-[15px] leading-snug text-[#cfc4b2]">{copy.line}</p>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-[56px] font-semibold leading-none tabular-nums">{weeks}</span>
          <span className="text-sm text-[#a99d8a]">{weeks === 1 ? 'week survived' : 'weeks survived'}</span>
        </div>

        {lastCard && last && (
          <p className="mt-4 border-t border-white/10 pt-3 text-[13px] leading-snug text-[#a99d8a]">
            Last call: <span className="text-[#efe6d8]">“{lastCard[last.choice].label}”</span> to{' '}
            {lastCard.speaker.replace(/^Your /, 'your ')}.
          </p>
        )}

        <button type="button" className="restart" onClick={onRestart} autoFocus>
          Run it back
        </button>
      </div>
    </div>
  );
}
