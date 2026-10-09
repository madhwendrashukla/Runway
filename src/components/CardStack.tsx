import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { Card, Side } from '../engine/types';
import { BRAND } from '../config/brand';
import { prefersReducedMotion } from '../fx/motion';

interface Props {
  card: Card | null;
  /** Changes every turn; used to reset the stack for the next card. */
  turn: number;
  locked: boolean;
  onPreview: (side: Side | null) => void;
  onCommit: (side: Side) => void;
}

type Phase = 'idle' | 'drag' | 'spring' | 'fly';

/** Fractions of card width. */
const COMMIT_AT = 0.25;
const PREVIEW_AT = 0.15;
const MAX_ROT = 12;
/** Drag distance (fraction of card width) at which rotation peaks. */
const ROT_FULL_AT = 0.7;
const HELD_SCALE = 1.02;
const FLY_MS = 280;
const FLY_EASE = 'cubic-bezier(.2,.8,.2,1)';
const SPRING_MS = 460;
const SPRING_EASE = 'cubic-bezier(.34,1.56,.64,1)';
/** A flick this fast (px/ms) commits even below the distance threshold. */
const FLICK_VELOCITY = 0.55;
const FLICK_MIN = 0.08;

const BACK_REST = 'translate3d(0,10px,0) scale(0.94)';

const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sideOf = (dx: number): Side => (dx > 0 ? 'right' : 'left');

export function CardStack({ card, turn, locked, onPreview, onCommit }: Props) {
  const topRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<Record<Side, HTMLDivElement | null>>({ left: null, right: null });
  const timer = useRef(0);

  const s = useRef({
    phase: 'idle' as Phase,
    pointerId: -1,
    originX: 0,
    originY: 0,
    dx: 0,
    dy: 0,
    w: 320,
    vx: 0,
    vy: 0,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    raf: 0,
    preview: null as Side | null,
    stamp: null as Side | null,
  });

  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const onPreviewRef = useRef(onPreview);
  onPreviewRef.current = onPreview;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const setPreview = (side: Side | null) => {
    if (s.current.preview === side) return;
    s.current.preview = side;
    onPreviewRef.current(side);
  };

  const setStamp = (side: Side | null) => {
    const st = s.current;
    if (st.stamp === side) return;
    if (st.stamp) stampRef.current[st.stamp]?.classList.remove('is-on');
    if (side) stampRef.current[side]?.classList.add('is-on');
    st.stamp = side;
  };

  /** Writes the drag pose straight to the DOM. Called from rAF only. */
  const paint = () => {
    const st = s.current;
    st.raf = 0;
    const top = topRef.current;
    const back = backRef.current;
    if (!top) return;
    const r = st.dx / st.w;
    const rot = clampN(r / ROT_FULL_AT, -1, 1) * MAX_ROT;
    top.style.transform = `translate3d(${st.dx}px,${st.dy}px,0) rotate(${rot}deg) scale(${HELD_SCALE})`;
    if (back) {
      const a = clampN(Math.abs(r) / 0.6, 0, 1);
      back.style.transform = `translate3d(0,${10 * (1 - a)}px,0) scale(${0.94 + 0.06 * a})`;
    }
  };

  const schedule = () => {
    if (!s.current.raf) s.current.raf = requestAnimationFrame(paint);
  };

  const cancelPaint = () => {
    if (s.current.raf) cancelAnimationFrame(s.current.raf);
    s.current.raf = 0;
  };

  const updateThresholds = () => {
    const st = s.current;
    const r = Math.abs(st.dx) / st.w;
    setPreview(r >= PREVIEW_AT ? sideOf(st.dx) : null);
    setStamp(r >= COMMIT_AT ? sideOf(st.dx) : null);
  };

  const fly = useCallback((side: Side) => {
    const st = s.current;
    const top = topRef.current;
    const back = backRef.current;
    if (!top) return;
    cancelPaint();
    st.phase = 'fly';
    setPreview(side);
    setStamp(side);
    top.classList.remove('is-held');

    const dir = side === 'right' ? 1 : -1;
    const reduced = prefersReducedMotion();
    // Off-screen with room for the rotated corners, carrying some of the throw.
    const tx = dir * Math.max(Math.abs(st.dx) + 80, window.innerWidth / 2 + st.w * 1.1);
    const ty = st.dy + clampN(st.vy * 140, -220, 220) + (reduced ? 0 : 40);
    const rot = dir * (MAX_ROT + 14) + clampN(st.vx * 6, -10, 10);

    top.style.transition = `transform ${FLY_MS}ms ${FLY_EASE}, opacity ${FLY_MS}ms linear`;
    top.style.transform = reduced
      ? `translate3d(${dir * 60}px,${st.dy}px,0) rotate(${dir * 4}deg)`
      : `translate3d(${tx}px,${ty}px,0) rotate(${rot}deg) scale(1)`;
    if (reduced) top.style.opacity = '0';

    if (back) {
      back.style.transition = `transform ${FLY_MS}ms ${FLY_EASE}`;
      back.style.transform = 'translate3d(0,0,0) scale(1)';
    }

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onCommitRef.current(side), FLY_MS);
  }, []);

  const springBack = () => {
    const st = s.current;
    const top = topRef.current;
    const back = backRef.current;
    if (!top) return;
    cancelPaint();
    st.phase = 'spring';
    setPreview(null);
    setStamp(null);
    top.classList.remove('is-held');
    top.style.transition = `transform ${SPRING_MS}ms ${SPRING_EASE}`;
    top.style.transform = 'translate3d(0,0,0) rotate(0deg) scale(1)';
    if (back) {
      back.style.transition = `transform ${SPRING_MS}ms ${SPRING_EASE}`;
      back.style.transform = BACK_REST;
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (st.phase === 'spring') st.phase = 'idle';
    }, SPRING_MS);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = s.current;
    if (lockedRef.current || st.phase === 'fly' || st.phase === 'drag') return;
    if (e.button !== 0) return;
    const top = e.currentTarget;
    top.setPointerCapture(e.pointerId);

    // Grabbing mid-spring: continue from where the card currently is.
    const m = new DOMMatrixReadOnly(getComputedStyle(top).transform);
    const curX = st.phase === 'spring' ? m.m41 : 0;
    const curY = st.phase === 'spring' ? m.m42 : 0;
    window.clearTimeout(timer.current);

    st.phase = 'drag';
    st.pointerId = e.pointerId;
    st.w = top.offsetWidth || 320;
    st.originX = e.clientX - curX;
    st.originY = e.clientY - curY;
    st.dx = curX;
    st.dy = curY;
    st.vx = 0;
    st.vy = 0;
    st.lastX = e.clientX;
    st.lastY = e.clientY;
    st.lastT = e.timeStamp;

    top.style.transition = 'none';
    if (backRef.current) backRef.current.style.transition = 'none';
    top.classList.add('is-held');
    schedule();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = s.current;
    if (st.phase !== 'drag' || e.pointerId !== st.pointerId) return;
    st.dx = e.clientX - st.originX;
    st.dy = e.clientY - st.originY;
    const dt = e.timeStamp - st.lastT;
    if (dt > 0) {
      // Smoothed velocity so the throw reflects the last few frames, not one.
      st.vx = 0.7 * ((e.clientX - st.lastX) / dt) + 0.3 * st.vx;
      st.vy = 0.7 * ((e.clientY - st.lastY) / dt) + 0.3 * st.vy;
    }
    st.lastX = e.clientX;
    st.lastY = e.clientY;
    st.lastT = e.timeStamp;
    updateThresholds();
    schedule();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = s.current;
    if (st.phase !== 'drag' || e.pointerId !== st.pointerId) return;
    st.pointerId = -1;
    // A pause before release kills the throw.
    if (e.timeStamp - st.lastT > 80) {
      st.vx = 0;
      st.vy = 0;
    }
    const r = st.dx / st.w;
    const flick =
      Math.abs(st.vx) > FLICK_VELOCITY && Math.abs(r) > FLICK_MIN && Math.sign(st.vx) === Math.sign(r);
    if (Math.abs(r) >= COMMIT_AT || flick) fly(sideOf(st.dx));
    else springBack();
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = s.current;
    if (st.phase !== 'drag' || e.pointerId !== st.pointerId) return;
    st.pointerId = -1;
    springBack();
  };

  /** Keyboard and button choices run the same fly-off. */
  const trigger = useCallback(
    (side: Side) => {
      const st = s.current;
      if (lockedRef.current || st.phase === 'fly' || st.phase === 'drag' || !topRef.current) return;
      st.w = topRef.current.offsetWidth || 320;
      st.dx = 0;
      st.dy = 0;
      st.vx = side === 'right' ? 1 : -1;
      st.vy = 0;
      fly(side);
    },
    [fly],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft') trigger('left');
      else if (e.key === 'ArrowRight') trigger('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trigger]);

  // New turn: the back card has become the top card; deal a fresh one behind it.
  useLayoutEffect(() => {
    const st = s.current;
    st.phase = 'idle';
    st.preview = null;
    st.stamp = null;
    st.dx = st.dy = st.vx = st.vy = 0;
    const back = backRef.current;
    if (!back) return;
    back.style.transition = 'none';
    back.style.opacity = '0';
    back.style.transform = 'translate3d(0,22px,0) scale(0.9)';
    void back.offsetWidth;
    back.style.transition = `transform 320ms ${SPRING_EASE}, opacity 200ms ease-out`;
    back.style.opacity = '1';
    back.style.transform = BACK_REST;
  }, [turn]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      cancelPaint();
    },
    [],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4">
      <div className={`stack ${locked ? 'is-collapsed' : ''}`}>
        <div ref={backRef} className="card card-back" style={{ transform: BACK_REST }} aria-hidden="true">
          <div className="card-back-face">
            <span className="font-display">{BRAND.cardBackMark}</span>
          </div>
        </div>

        {card && (
          <div
            key={turn}
            ref={topRef}
            className="card card-top"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={onPointerCancel}
          >
            <div className="card-shadow" aria-hidden="true" />
            <div className="card-face">
              <div className="card-content">
                <div className="flex items-center gap-3">
                  <Avatar seed={card.avatar} name={card.speaker} />
                  <div className="font-display text-[19px] font-semibold leading-tight text-ink">
                    {card.speaker}
                  </div>
                </div>
                <p className="card-text">{card.text}</p>
              </div>

              <div
                ref={(el) => (stampRef.current.left = el)}
                className="stamp stamp-left"
                aria-hidden="true"
              >
                {card.left.label}
              </div>
              <div
                ref={(el) => (stampRef.current.right = el)}
                className="stamp stamp-right"
                aria-hidden="true"
              >
                {card.right.label}
              </div>
            </div>
          </div>
        )}
      </div>

      {card && (
        <div className="choices">
          <ChoiceButton side="left" label={card.left.label} disabled={locked} onPick={trigger} onHover={onPreview} />
          <ChoiceButton side="right" label={card.right.label} disabled={locked} onPick={trigger} onHover={onPreview} />
        </div>
      )}
    </div>
  );
}

function ChoiceButton({
  side,
  label,
  disabled,
  onPick,
  onHover,
}: {
  side: Side;
  label: string;
  disabled: boolean;
  onPick: (side: Side) => void;
  onHover: (side: Side | null) => void;
}) {
  return (
    <button
      type="button"
      className={`choice choice-${side}`}
      disabled={disabled}
      onClick={() => onPick(side)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(side)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
    >
      {side === 'left' && <span aria-hidden="true">←</span>}
      <span>{label}</span>
      {side === 'right' && <span aria-hidden="true">→</span>}
    </button>
  );
}

function Avatar({ seed, name }: { seed: string; name: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  // "Meera, bakery owner" -> M; "Startup newsletter" -> SN
  const initials = name
    .replace(/^your\s+/i, '')
    .split(',')[0]
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  return (
    <div
      className="avatar font-display"
      style={{ background: `hsl(${h} 45% 38%)` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
