# Runway

A card-swipe startup survival game. The full design is in [`RUNWAY-SPEC.md`](./RUNWAY-SPEC.md),
which is the source of truth.

## Status: M1 — Feel

Built so far:

- Card stack with drag physics, using pointer events and `requestAnimationFrame`. The card follows 1:1
  and rotates up to ±12°. While held it lifts to 1.02 scale and gets a bigger shadow. The card behind
  scales from 0.94 up to full size as you drag.
- A choice stamp appears on the card past 25% drag. The live resource preview starts at 15%.
- Release past the threshold, or flick fast, and the card flies off over 280ms with momentum.
  Otherwise it springs back with overshoot. You can grab it again mid-spring.
- ← / → keys and the choice buttons trigger the same fly-off.
- Four resource bars:
  - Numbers count up and down over 400ms, and the fill animates with overshoot.
  - Gains glow; losses shake and flash red.
  - Floating +/− deltas rise from the bar.
  - Bars pulse while in a danger zone (below 20 or above 80).
  - While you drag, a ghost shows where each bar will land, highlighted when that would be lethal.
- Death at 0 or 100 on any bar. The screen goes greyscale and the death card names the resource and
  the last decision. Restart is one tap (or Enter / R).
- The engine is pure and seeded (`src/engine/run.ts`). The same seed and the same choices always
  give the same run, so the server can replay runs in M5.
- `prefers-reduced-motion` is respected: shake, grain and pulsing are swapped for colour and opacity
  changes.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Layout

```
src/engine/      pure game logic (types, rng, deck, effects, death, run, score) + zustand store
src/content/     placeholder cards, death copy, resource metadata
src/components/  CardStack, ResourceBar, DeathScreen, Icon
src/config/      brand.ts — single-point rebrand (name, colours)
```
