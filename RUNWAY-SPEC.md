# Runway — Game Design & Build Spec

A browser game for IIM Bangalore BBA-DBE students. You run a startup and try to survive
as long as possible. Business concepts from the course are embedded in the decisions,
never shown as course material.

**Build this with Claude Code. This document is the source of truth.**

---

## 0. What went wrong in the prototype (read this first)

A first version was built as multiple-choice questions with a stats bar on top. It failed
because:

1. **It tested arithmetic.** Players computed a number and picked it from three options.
   That is homework with a timer, not a game.
2. **Answers were right or wrong.** Binary correctness kills replay value. Once you know
   the formula, there is no game left.
3. **No consequence chain.** Each card was isolated. Nothing a player did in week 3
   mattered in week 9.
4. **No juice.** Static DOM, one confetti burst, no motion, no weight, no feedback loop
   that makes the hand want to tap again.

**The correction, and the single rule for every decision in this build:**

> Decisions are **trade-offs between resources**, not questions with correct answers.
> Every choice costs something. The skill is in reading the situation and managing
> compounding state — not in computing a value.

Arithmetic may *inform* a choice (a player who understands margin plays better), but the
game must never ask "what is X?" with X as a multiple-choice answer.

---

## 1. Concept

**Genre:** card-swipe management sim (Reigns-style), endless, run-based.

**Fantasy:** you are a first-time founder. Every card is a week. You swipe left or right.
Every swipe moves four resources. You die when any resource hits zero or max. You try to
survive more weeks than your friends.

**Session length:** 2–4 minutes per run. Fast death, instant restart, high replay.

**Hook:** the run is never the same twice, deaths are funny, and the leaderboard is
visible from the home screen.

---

## 2. Core loop

```
   ┌─────────────────────────────────────────────┐
   │  Draw a card (weighted by state + chapter)  │
   │                 ↓                           │
   │  Player drags the card left or right        │
   │  (live preview of which resources move)     │
   │                 ↓                           │
   │  Card flies off, resources animate          │
   │                 ↓                           │
   │  Consequence fires: immediate deltas,       │
   │  delayed effects, unlocked follow-up cards  │
   │                 ↓                           │
   │  Week += 1 → check death → next card        │
   └─────────────────────────────────────────────┘
```

No timer by default. (Timers punish reading. Add an optional "Pressure Mode" later.)

---

## 3. Resources

Four bars. Each runs 0–100. **Death at 0 OR 100** — both ends kill, which is what makes
this a balancing game rather than a score-maximising one.

| Resource | 0 means | 100 means |
|---|---|---|
| **Cash** | Bankrupt. Payroll bounced. | Hoarding. Board forces you out for not deploying capital. |
| **Users** | Nobody is using the product. | You scaled past what you can serve; support collapses. |
| **Team** | Everyone quit. | Overhired; burn explodes and nobody knows what they own. |
| **Cred** | No one takes your calls. | Overhyped. Expectations you cannot possibly meet. |

Start every run at **50 / 20 / 50 / 40** (Cash / Users / Team / Cred). Users starts low on
purpose — early game is about finding traction without dying.

**Design rule:** most cards should move 2 resources, a few should move 3. Never all 4.
A card that moves only 1 resource is boring; a card that moves 4 is noise.

---

## 4. Cards

### 4.1 Card shape

```json
{
  "id": "ad_agency_pitch",
  "chapter": 2,
  "weight": 1.0,
  "speaker": "Growth agency",
  "avatar": "agency",
  "text": "We can 10x your signups in a month. We just need a ₹2L retainer up front.",
  "left": {
    "label": "Not yet",
    "effects": { "cash": 0, "users": -3, "cred": -2 },
    "reply": "They post about your 'lack of vision' on LinkedIn that evening."
  },
  "right": {
    "label": "Sign them",
    "effects": { "cash": -18, "users": +14, "cred": +3 },
    "reply": "Signups spike. Nobody checks whether any of them come back.",
    "delayed": [
      { "inWeeks": 4, "effects": { "users": -12 }, "note": "The agency traffic churns out." }
    ],
    "unlocks": ["agency_renewal"]
  },
  "requires": { "minWeek": 6, "users": { "min": 15 } },
  "once": true
}
```

**Field notes**

- `left` / `right` — both must be *defensible*. If one choice is obviously correct, the
  card is broken. Rewrite it until a smart player could argue either way.
- `effects` — integers, typically −20…+20. Keep most in the −10…+10 band.
- `reply` — one line of consequence shown as the card leaves. This is where the humour
  lives. Dry, specific, never a joke for its own sake.
- `delayed` — the single most important mechanic in the game (see §5).
- `unlocks` — push a specific card into the deck so stories continue.
- `requires` — gates by week, chapter, or resource ranges.
- `once` — card never repeats within a run.

### 4.2 Card types to write (target mix)

| Type | Share | What it does |
|---|---|---|
| **Trade-off** | 55% | Plain two-sided choice with opposed resource movement. |
| **Chain** | 20% | Part of a 2–4 card story (a hire, an investor, a competitor). |
| **Trap** | 10% | Looks great, has a delayed cost. Teaches players to read ahead. |
| **Gift** | 10% | Genuinely good, low cost. Needed so the game does not feel punishing. |
| **Boss** | 5% | Chapter-ending, large swings, memorable. |

### 4.3 Writing rules

- **Second person, present tense.** "Your biggest customer wants a feature nobody else needs."
- **One situation per card.** No setup paragraphs. Maximum 2 sentences, ~220 characters.
- **No course vocabulary on screen.** Never write "CAC", "break-even", "gross margin",
  "Poisson". Write the situation; let the player's course knowledge do the work.
  A player who understands unit economics should *feel* an edge, not be quizzed.
- **Choice labels are 1–3 words.** "Sign them." "Hold the price." "Let him go."
- **No real names.** No professors, no real companies, no real investors, no IIMB
  references anywhere in content. See §12.
- **English throughout.** Indian context and ₹ amounts are fine and encouraged.

### 4.4 Where course content maps in (hidden layer)

Each card carries a `tags` array used only for the post-run breakdown and difficulty
tuning. Never rendered during play.

```json
"tags": ["unit-economics", "pricing"]
```

Tag vocabulary: `unit-economics`, `pricing`, `cash-flow`, `margin`, `funnel`,
`retention`, `hiring`, `ops`, `supply-chain`, `product`, `fundraising`, `competition`,
`experimentation`, `ethics`, `brand`, `strategy`.

At the end of a run, show: *"You handled pricing calls well. Cash flow is where you
died."* That is the only place course structure surfaces, and it reads as a player
profile, not a report card.

---

## 5. The systems that make it a game

### 5.1 Delayed consequences (highest priority feature)

Every `delayed` effect is queued with a fire-week. When it lands, the game shows a small
**consequence toast** above the card: *"The agency traffic churned out. −12 users."*

This is what makes the game a game. The player learns that week-3 decisions kill them in
week 9. Nothing else on this list matters as much. Build this first.

### 5.2 Card chains

`unlocks` pushes a card to the front of the draw queue with a delay of 2–6 weeks. A chain
has a beginning, a complication, and a payoff. Write at least 8 chains before launch.

Example chain — *the co-founder*:
1. Friend offers to join full-time for 40% equity.
2. (3 weeks later) He has not shipped anything. Confront or wait?
3. (4 weeks later) He wants to leave and keep the equity. Vesting now matters.

### 5.3 Streak and momentum

Track consecutive weeks where no resource moved into a danger zone (below 20 / above 80).
At 5, 10, 20 weeks show a **momentum badge** with a screen-wide flash. Momentum adds a
small score multiplier. It is a reward for stability, not for correct answers.

### 5.4 Chapters

Chapters gate the card pool and change the backdrop and music bed. They are not levels —
the run is continuous and endless.

| Chapter | Weeks | Theme |
|---|---|---|
| 1 | 1–12 | Garage. Finding anyone who will pay. |
| 2 | 13–30 | Traction. Ads, first hires, first churn. |
| 3 | 31–55 | Funding. Investors, boards, pressure. |
| 4 | 56–85 | Scale. Ops breaks, competitors arrive. |
| 5 | 86+ | Endless. All cards, bigger swings, faster decay. |

Each chapter transition is a **full-screen moment**: title card, resource snapshot,
new backdrop sliding in. ~3 seconds, skippable with a tap.

### 5.5 Passive drift

Every week, apply a small automatic drift so standing still is never safe:
`cash −1`, `users −0.5`, `team −0.3`. Drift scales by chapter (×1.0, ×1.2, ×1.5, ×1.8, ×2.2).
This is what makes the game endless-but-finite: eventually the drift wins.

### 5.6 Score

```
score = weeks_survived * 100
      + momentum_bonus
      + (chapters_reached * 500)
```

Weeks survived is the headline number. Everything else is a modifier.

---

## 6. Juice and animation spec

**This section is not optional polish. It is the product.** The prototype failed mainly
here. Budget real time for it.

### 6.1 Card drag (the signature interaction)

- Card follows the pointer/finger 1:1 with a **rotation of up to ±12°** proportional to
  horizontal offset.
- Slight **scale up to 1.02** while held, with a lifted shadow.
- The **card behind** is visible, scaled 0.94, offset down 10px, and animates up to full
  size as the top card is dragged away.
- Past a 25% drag threshold, the corresponding choice label **fades in on the card** with a
  stamp effect (scale from 1.3 → 1.0, slight rotation).
- **Live resource preview:** as soon as the drag passes 15%, the affected resource bars
  show ghost indicators of where they will land. This is what rewards a thinking player
  and it must feel instantaneous.
- Release past threshold → card **flies off** in the drag direction with momentum,
  rotating, over 280ms, `cubic-bezier(.2,.8,.2,1)`.
- Release below threshold → **spring back** to centre with a slight overshoot.
- Keyboard: ← and → trigger the same animation. Click on a choice label does too.

Use **pointer events** (not touch/mouse separately) and `requestAnimationFrame`. Do not
drag with CSS transitions attached; set `transform` directly and re-enable transitions on
release.

### 6.2 Resource bars

- Numbers **count up/down** over 400ms with easing, never snap.
- The bar fill animates with a short overshoot.
- A gaining bar gets a **brief glow pulse**; a losing bar gets a **shake and a red flash**.
- Below 20 or above 80, the bar **pulses continuously** at low opacity — persistent danger
  signalling the player sees in peripheral vision.
- Floating **+12 / −8 deltas** rise from each bar and fade out over 700ms.

### 6.3 Screen feedback

- Big losses (≥12 on any resource): **screen shake**, 220ms, 6px amplitude, decaying.
- Big gains: **particle burst** from the bar, in that bar's colour. Canvas, not DOM.
- Danger zone entry: subtle **vignette** pulse at the screen edge in the danger colour.
- Chapter change: **backdrop crossfade** plus a parallax layer that slides at a different
  rate.
- Death: card stack **collapses and scatters**, screen desaturates to greyscale over
  600ms, death card slides up from the bottom.

### 6.4 Idle life

The screen must never be fully static. Add a slow-drifting gradient or a subtle grain
layer in the backdrop. A still screen reads as a document; a breathing screen reads as a
game.

### 6.5 Reduced motion

Respect `prefers-reduced-motion: reduce`: keep state changes and crossfades, drop shake,
parallax, particles and continuous pulsing. Never remove feedback entirely — replace
motion with colour and opacity changes.

---

## 7. Audio

Sound is half of game feel. Ship with audio **on** by default, with a visible mute toggle,
and start the audio context on the first user gesture.

| Event | Sound |
|---|---|
| Card pickup | Soft paper lift |
| Drag past threshold | Short click, pitch rises with drag distance |
| Card release | Whoosh, panned to the swipe direction |
| Resource gain | Short rising chime, pitched by magnitude |
| Resource loss | Dull thud |
| Danger zone entry | Low warning tone, once per entry |
| Momentum badge | Three-note rise |
| Chapter change | Four-note motif, one per chapter, same key |
| Death | Descending tone plus a low hit |

**Music:** one calm loop per chapter, same key and tempo so chapter changes crossfade
cleanly. Keep it quiet; it is a bed, not a feature.

**Assets:** use CC0 sources (kenney.nl, freesound CC0 filter). Check each licence. Keep
every clip under 2 seconds, encode as compressed audio, lazy-load after first interaction.
Target under 1.5 MB total audio.

Use **Howler.js** for playback and sprite management.

---

## 8. Visual direction

Pick a direction and commit. Do not build a generic dashboard.

**Direction: "founder's desk at 2am."** A dark, warm, tactile scene. Cards look like
physical index cards with a paper texture and a soft drop shadow. Resource bars are
instrument-panel strips at the top, not web progress bars. Backdrop is a desk surface that
changes per chapter (bare table → shared desk → office → floor of desks).

Requirements:
- Mobile-first portrait. One screen, no page scroll.
- Dark theme primary. Optional light theme, but dark is the designed state.
- Two typefaces: a characterful display face for numbers and card speakers, a clean
  readable face for card body text.
- Four resource colours that are distinguishable in greyscale and to colourblind players.
  Never rely on colour alone — each bar has an icon and a label.
- Everything must be legible at 360px width with one thumb.

---

## 9. Tech stack

```
Vite + React 18 + TypeScript
Zustand                 — game state
Framer Motion           — card drag, layout transitions, chapter changes
Howler.js               — audio sprites
Canvas (hand-rolled)    — particles, screen effects
Tailwind                — styling
Supabase                — auth, save, leaderboard
Vercel                  — hosting
```

**Do not use Next.js.** There is no SEO or server rendering requirement; the extra
framework is cost without benefit.

### File structure

```
src/
  engine/
    store.ts            # zustand: resources, week, chapter, queue, history
    deck.ts             # draw logic, weighting, requires-filter, unlocks
    effects.ts          # apply effects, clamp, drift, delayed queue
    death.ts            # death checks + death reason selection
    score.ts
  content/
    cards/
      chapter1.json
      chapter2.json
      chapter3.json
      chapter4.json
      endless.json
    chapters.ts
    deaths.ts           # death screen copy, keyed by resource + direction
    momentum.ts
  components/
    CardStack.tsx       # drag, rotation, stamp, fly-off
    ResourceBar.tsx     # animated fill, delta floaters, danger pulse
    ChapterIntro.tsx
    DeathScreen.tsx
    Leaderboard.tsx
    Home.tsx
  fx/
    particles.ts
    shake.ts
    audio.ts
  lib/
    supabase.ts
    validate.ts         # card schema validation at build time
```

### Content validation (build step)

Write a script that validates every card JSON at build time and fails the build on:
- missing `left` or `right`
- an effect outside −30…+30
- a card where one side has strictly better outcomes on every resource (unwinnable choice)
- `unlocks` pointing at a non-existent card id
- card text over 240 characters
- any string matching a blocklist of real names/brands (see §12)

This keeps content quality from drifting as the deck grows.

---

## 10. Backend (Supabase)

### Tables

```sql
-- profiles
id            uuid primary key references auth.users
display_name  text not null
batch         int                              -- 1, 2, 3 — for batch leaderboards
created_at    timestamptz default now()

-- runs
id            uuid primary key default gen_random_uuid()
user_id       uuid references profiles(id)
weeks         int not null
score         int not null
chapter       int not null
death_reason  text
seed          text not null                    -- RNG seed for the run
log           jsonb not null                   -- array of {week, cardId, choice}
created_at    timestamptz default now()

-- saves
user_id       uuid primary key references profiles(id)
state         jsonb not null                   -- full serialized run
updated_at    timestamptz default now()
```

### Row-level security

- `profiles`: user can read all, write own.
- `runs`: user can read all (leaderboard), insert own only.
- `saves`: user can read and write own only.

### Anti-cheat

The client must not be trusted with the score. **Submit the seed and the choice log, not
the score.** An Edge Function replays the run server-side using the same deck and seed,
recomputes the score, and inserts the row only if it matches.

This requires the deck and the effects engine to be **pure and deterministic**: same seed
plus same choices must always produce the same result. Design `engine/` with no `Math.random()`
outside a seeded PRNG, and no `Date.now()` in game logic. Share the engine between client
and Edge Function as a single module.

### Leaderboards

- All-time top 50
- This week's top 50
- Batch filter (Batch 1 / 2 / 3)
- The player's own best, always pinned and visible even when off the list

### Cost

Free tier covers a few hundred students comfortably. Hosting free on Vercel. Only cost is
an optional domain.

---

## 11. Build order

Ship each milestone as something playable. Do not build everything before testing.

**M1 — Feel (no content)**
Card stack, drag physics, fly-off, spring-back, four animated resource bars, live preview,
death check. Ten placeholder cards. **Stop and play it for ten minutes.** If the swipe does
not feel good with placeholder text, no amount of content will save it.

**M2 — Loop**
Delayed consequences, chapters 1–2, drift, death screen with death reasons, restart,
localStorage best score. 60 real cards.

**M3 — Juice**
Particles, screen shake, chapter transitions, full audio pass, backdrops, momentum badges.

**M4 — Content**
Chapters 3–5, all chains, 150+ cards total, tag-based end-of-run profile.

**M5 — Online**
Supabase auth, save/resume, leaderboards, seeded replay validation.

**M6 — Launch**
Playtest with 10 students. Instrument: average run length, deaths per resource, which
cards cause quits. Tune card weights from real data.

---

## 12. Content safety rules (hard requirements)

The game will be played by students of a named institution. These are not negotiable.

1. **No real names anywhere.** No professors, students, staff, investors, companies, or
   brands. Invented names only.
2. **No institution references in content.** No IIMB, no campus, no course codes, no
   course names, no exam references. The brand lives in the wrapper, not the cards.
3. **Humour targets situations, never people or groups.** The joke is always "startups are
   absurd", never "this kind of person is stupid."
4. **Nothing political, religious, regional or communal.** No exceptions.
5. **No content lifted from any course material, question bank, notes, or another
   student's study site.** Every card is written from scratch.
6. **Single-point rebrand.** All naming, colours, logo and any institution reference live
   in `src/config/brand.ts`. Changing that one file must fully rebrand the game. Default
   the game name to something neutral so it can ship without institutional approval.
7. Build-time blocklist check (§9) enforces rules 1, 2 and 5 mechanically.

Before any public launch, show the game to the program office. Asking first is cheaper
than taking it down.

---

## 13. Acceptance criteria

A build is done when:

- [ ] A run can be played end to end with one thumb on a 360px screen, no page scroll.
- [ ] Dragging a card feels physical: rotation, scale, shadow, spring-back, momentum fly-off.
- [ ] Resource changes animate; no number ever snaps.
- [ ] A decision made in week 3 visibly fires a consequence in a later week.
- [ ] Two consecutive runs are clearly different.
- [ ] No card has an obviously correct choice.
- [ ] No card asks the player to compute a value.
- [ ] Death is readable: the player knows which resource killed them and which decision
      started it.
- [ ] Restart is one tap and under 1 second.
- [ ] Audio works on iOS Safari after first tap, and the mute toggle persists.
- [ ] `prefers-reduced-motion` is respected without removing feedback.
- [ ] Leaderboard scores are server-validated; a client-submitted score is rejected.
- [ ] Total initial payload under 500 KB excluding lazy-loaded audio.
- [ ] 60fps card drag on a mid-range Android phone.

---

## 14. First task for Claude Code

Build **M1 only**. Scaffold the Vite + React + TypeScript project, implement the card
stack with full drag physics, the four animated resource bars with live preview, and the
death check. Use ten placeholder cards with real-sounding text so the feel can be judged.

Do not write content, backend, audio or chapters yet. Get the swipe to feel good first,
then stop and report back.
