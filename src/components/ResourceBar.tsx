import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { isDanger, isLethal } from '../engine/death';
import type { Resource } from '../engine/types';
import { RESOURCE_META } from '../content/resources';
import { BRAND } from '../config/brand';
import { prefersReducedMotion } from '../fx/motion';
import { ResourceIcon } from './Icon';

interface Props {
  kind: Resource;
  value: number;
  /** Where the value would land under the currently previewed choice. */
  preview: number | undefined;
}

interface Floater {
  id: number;
  delta: number;
}

const COUNT_MS = 400;
let floaterId = 0;

export function ResourceBar({ kind, value, preview }: Props) {
  const meta = RESOURCE_META[kind];
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const prev = useRef(value);
  const [floaters, setFloaters] = useState<Floater[]>([]);

  useLayoutEffect(() => {
    if (numRef.current) numRef.current.textContent = String(Math.round(shown.current));
  }, []);

  // Count the number towards the new value; never snap.
  useEffect(() => {
    const from = shown.current;
    const to = value;
    if (from === to) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / COUNT_MS);
      const e = 1 - Math.pow(1 - k, 3);
      shown.current = from + (to - from) * e;
      if (numRef.current) numRef.current.textContent = String(Math.round(shown.current));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  // Gain glow / loss shake + floating delta.
  useEffect(() => {
    const delta = value - prev.current;
    prev.current = value;
    if (delta === 0) return;
    setFloaters((f) => [...f, { id: ++floaterId, delta }]);

    const reduced = prefersReducedMotion();
    const track = trackRef.current;
    const root = rootRef.current;
    if (!track || !root) return;
    if (delta > 0) {
      track.animate(
        [
          { boxShadow: `0 0 0 0 ${meta.color}00` },
          { boxShadow: `0 0 14px 2px ${meta.color}cc` },
          { boxShadow: `0 0 0 0 ${meta.color}00` },
        ],
        { duration: 520, easing: 'ease-out' },
      );
    } else {
      track.animate(
        [
          { backgroundColor: 'rgba(255,75,75,0.55)' },
          { backgroundColor: 'rgba(255,255,255,0.07)' },
        ],
        { duration: 480, easing: 'ease-out' },
      );
      if (!reduced) {
        root.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(4px)' },
            { transform: 'translateX(-3px)' },
            { transform: 'translateX(2px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 320, easing: 'ease-out' },
        );
      }
    }
  }, [value, meta.color]);

  const hasPreview = preview !== undefined && preview !== value;
  const lethal = hasPreview && isLethal(preview!);
  const lo = hasPreview ? Math.min(value, preview!) : value;
  const hi = hasPreview ? Math.max(value, preview!) : value;
  const gaining = hasPreview && preview! > value;

  return (
    <div
      ref={rootRef}
      className={`res ${isDanger(value) ? 'res-danger' : ''} ${hasPreview ? 'res-previewing' : ''}`}
      style={{ ['--c' as string]: meta.color, ['--danger' as string]: BRAND.colors.danger }}
      role="meter"
      aria-label={meta.label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="res-icon" style={{ color: meta.color }}>
          <ResourceIcon kind={kind} size={18} />
        </span>
        <span className="relative flex items-center gap-1">
          {hasPreview && (
            <span className={`res-arrow ${lethal ? 'is-lethal' : ''}`} aria-hidden="true">
              {(gaining ? '▲' : '▼').repeat(Math.abs(preview! - value) >= 10 ? 2 : 1)}
            </span>
          )}
          {/* Text is owned by the count-up tween, not React. */}
          <span ref={numRef} className="font-display text-[22px] leading-none tabular-nums" />
          {floaters.map((f) => (
            <span
              key={f.id}
              className={`res-floater ${f.delta > 0 ? 'is-gain' : 'is-loss'}`}
              onAnimationEnd={() => setFloaters((all) => all.filter((x) => x.id !== f.id))}
            >
              {f.delta > 0 ? `+${f.delta}` : `−${Math.abs(f.delta)}`}
            </span>
          ))}
        </span>
      </div>

      <div className="res-meter">
        <div ref={trackRef} className="res-track">
          <div className="res-fill" style={{ transform: `scaleX(${value / 100})` }} />
          <div
            className={`res-ghost ${gaining ? 'is-gain' : 'is-loss'}`}
            style={{
              left: `${lo}%`,
              width: `${hi - lo}%`,
              opacity: hasPreview ? 1 : 0,
            }}
          />
          <div className="res-zone res-zone-low" />
          <div className="res-zone res-zone-high" />
        </div>
        <div
          className={`res-marker ${lethal ? 'is-lethal' : ''}`}
          style={{ left: `${hasPreview ? preview : value}%`, opacity: hasPreview ? 1 : 0 }}
        />
      </div>

      <div className="res-label">{meta.label}</div>
    </div>
  );
}
