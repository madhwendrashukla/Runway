import { useCallback, useEffect, useState } from 'react';
import { CardStack } from './components/CardStack';
import { DeathScreen } from './components/DeathScreen';
import { ResourceBar } from './components/ResourceBar';
import { BRAND } from './config/brand';
import { previewEffects } from './engine/effects';
import { cardById, useGame } from './engine/store';
import { RESOURCES, type Side } from './engine/types';

export default function App() {
  const run = useGame((g) => g.run);
  const reply = useGame((g) => g.reply);
  const choose = useGame((g) => g.choose);
  const restart = useGame((g) => g.restart);
  const [preview, setPreview] = useState<Side | null>(null);
  const [showDeath, setShowDeath] = useState(false);

  const card = cardById(run.cardId);
  const dead = run.death !== null;
  const targets = preview && card ? previewEffects(run.resources, card[preview].effects) : {};

  const commit = useCallback(
    (side: Side) => {
      setPreview(null);
      choose(side);
    },
    [choose],
  );

  const onRestart = useCallback(() => {
    setShowDeath(false);
    setPreview(null);
    restart();
  }, [restart]);

  // Let the final bar movement land before the death card slides up.
  useEffect(() => {
    if (!dead) return;
    const t = window.setTimeout(() => setShowDeath(true), 650);
    return () => window.clearTimeout(t);
  }, [dead]);

  return (
    <>
    <div className={`stage ${dead ? 'is-dead' : ''}`}>
      <div className="backdrop" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <main className="relative z-10 mx-auto flex h-full w-full max-w-[460px] flex-col px-4">
        <header className="panel">
          {RESOURCES.map((r) => (
            <ResourceBar key={r} kind={r} value={run.resources[r]} preview={targets[r]} />
          ))}
        </header>

        <div className="flex items-baseline justify-between pb-1 pt-3">
          <div className="font-display text-[15px] uppercase tracking-[0.2em] text-[#bfb29d]">
            Week <span className="text-[#efe6d8] tabular-nums">{run.week}</span>
          </div>
          <div className="font-display text-[13px] italic text-[#8c8070]">{BRAND.name}</div>
        </div>

        <div className="reply-slot" aria-live="polite">
          {reply && (
            <p key={reply.key} className="reply">
              {reply.text}
            </p>
          )}
        </div>

        <CardStack card={card} turn={run.week} locked={dead} onPreview={setPreview} onCommit={commit} />
      </main>
    </div>
    {showDeath && <DeathScreen run={run} onRestart={onRestart} />}
    </>
  );
}
