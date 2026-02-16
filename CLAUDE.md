# CLAUDE.md — RunPets

## What Is This

RunPets is a running companion app where a virtual pet evolves based on your real runs via HealthKit. Your miles make them grow. Your PRs trigger transformations. Your consistency shapes their personality.

**One-liner:** Your running brings them to life.

**Core loop:** Run → Data syncs → Pet evolves/reacts → Emotional attachment → Desire to run more → Run

---

## Tech Stack

- **Expo SDK 52+** with TypeScript (strict mode)
- **Expo Router** (file-based routing)
- **expo-health** — HealthKit integration (runs, distance, pace, heart rate)
- **expo-sqlite** — Local-first storage (no backend for MVP)
- **zustand** — State management
- **Rive** (`rive-react-native`) — Pet animations via state machines
- **react-native-reanimated** — UI animations
- **expo-haptics** — Tactile feedback
- **date-fns** — Date calculations
- **expo-notifications** — Push notifications (Phase 2)

### Platform Targets
- iOS 15.0+ (HealthKit)
- watchOS 9.0+ (Apple Watch, Phase 2)
- Android 8.0+ (V3, not MVP)

### NOT in MVP
- No backend / no user accounts / no cloud sync
- No Android
- No Apple Watch app (just complication later)
- No in-app purchases (validate retention first)

---

## Architecture Principles

### 1. Pets Are Content, Not Code
Every pet species is defined by a JSON config in `content/pets/`. Adding a new pet = adding a JSON file + a `.riv` asset. The evolution engine reads configs — zero pet logic is hardcoded.

```
content/pets/
├── endurance-wolf.json
├── sprint-hare.json      # Phase 3
├── trail-fox.json         # Phase 3
└── steady-turtle.json     # Phase 3
```

**Pet config schema** (see ARCHITECTURE.md for full TypeScript interfaces):
- `id`, `name`, `archetype`, `rarity`
- `unlock` — free, purchase, or achievement-gated
- `stages[]` — evolution tiers with requirements (total_km, streak_days, best_5k_under, etc.)
- `riveAsset` + `stateMachineName` — animation file reference
- `reactions` — state machine trigger names for PR, streak, rest day, race, evolution
- `statWeights` — how this pet weights pace vs distance vs consistency for XP

### 2. Local-First, Backend-Later
All data in SQLite on device. No server, no accounts, no cloud sync for MVP. Export/import via JSON for device migration. Backend (Firebase/Supabase) deferred to V2 when social features justify it.

### 3. Evolution Engine Is the Heart
`lib/engine/evolution.ts` — reads pet JSON configs, queries run data from SQLite, checks requirements, triggers level-ups. This must be:
- **Data-driven** (reads JSON, not hardcoded thresholds)
- **Transparent** (always show user progress % toward next evolution)
- **Extensible** (new requirements like "race_completed" can be added to schema without code changes)

### 4. Rive State Machines for Animation
One `.riv` file per pet species containing ALL evolution stages as artboards and ALL animation states (idle, running, celebration, sleeping, stretching, evolution-transition) in a single state machine.

**Inputs:** `mood` (number), `stage` (number), `isRunning` (bool), `evolve` (trigger), `tap` (trigger)

This means: NO separate animation files per state. The state machine handles all transitions. The app just sets inputs and fires triggers.

### 5. No Guilt Mechanics, Ever
The pet NEVER dies, gets sick, or suffers from missed runs. Loss aversion comes from streak psychology, not pet punishment. Rest days show the pet recovering positively (stretching, reading, meditating). This is a firm design constraint — do not add negative pet states for inactivity.

---

## Project Structure

```
runpets/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout
│   ├── (tabs)/
│   │   ├── index.tsx             # Home (pet + stats + streak)
│   │   ├── history.tsx           # Run history list
│   │   ├── collection.tsx        # Pet collection (Phase 3)
│   │   └── settings.tsx          # Settings (Phase 2)
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   ├── healthkit-permission.tsx
│   │   ├── choose-pet.tsx
│   │   ├── name-pet.tsx
│   │   └── complete.tsx
│   ├── pet/[id].tsx              # Pet detail + evolution progress
│   ├── celebration.tsx           # Post-run modal
│   └── evolution.tsx             # Evolution animation screen
│
├── components/                   # Reusable UI
│   ├── PetView.tsx               # Rive animation wrapper
│   ├── StatCard.tsx
│   ├── ProgressBar.tsx
│   ├── RunListItem.tsx
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── StreakFlame.tsx
│
├── lib/                          # Business logic
│   ├── engine/
│   │   ├── evolution.ts          # Evolution engine (reads JSON configs)
│   │   ├── streaks.ts            # Streak calculator
│   │   ├── mood.ts               # Mood system
│   │   └── xp.ts                 # XP calculation per pet archetype
│   ├── health/
│   │   ├── sync.ts               # HealthKit sync manager
│   │   ├── permissions.ts
│   │   └── types.ts
│   ├── storage/
│   │   ├── db.ts                 # SQLite setup
│   │   ├── pets.ts               # Pet CRUD
│   │   ├── runs.ts               # Run CRUD
│   │   ├── profile.ts
│   │   └── migrations/
│   ├── notifications/            # Phase 2
│   │   ├── manager.ts
│   │   └── templates.ts
│   ├── animations/
│   │   └── controller.ts         # Rive state machine controller
│   └── utils/
│       ├── date.ts
│       ├── pace.ts
│       └── units.ts
│
├── assets/
│   ├── pets/                     # Rive files (one per species)
│   │   └── endurance-wolf.riv    # MVP: only this one
│   ├── ui/icons/
│   ├── ui/backgrounds/
│   ├── ui/badges/                # Phase 3
│   └── sounds/                   # Phase 2
│
├── content/
│   └── pets/                     # JSON species configs
│       ├── endurance-wolf.json
│       ├── sprint-hare.json      # Phase 3
│       ├── trail-fox.json        # Phase 3
│       └── steady-turtle.json    # Phase 3
│
├── types/                        # TypeScript interfaces
│   ├── pet.ts
│   ├── run.ts
│   ├── profile.ts
│   └── evolution.ts
│
├── hooks/
│   ├── usePet.ts
│   ├── useRuns.ts
│   ├── useStreak.ts
│   └── useEvolution.ts
│
├── store/                        # Zustand stores
│   ├── petStore.ts
│   ├── runStore.ts
│   └── profileStore.ts
│
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
│
├── app.json
├── package.json
├── tsconfig.json
└── eas.json
```

---

## Data Models

### Core interfaces (defined in `types/`):

**Pet** — id, speciesId, name, level, xp, personality traits, stats (totalRuns, totalDistance, currentStreak, PRs), mood, isActive

**PetSpecies** (JSON config) — id, name, archetype, rarity, unlock type, stages[] with evolution requirements, riveAsset, reactions map, statWeights

**RunSession** — id, source (healthkit/manual), distance (meters), duration (seconds), pace, startTime, endTime, heartRate?, splits?, isRace, xpAwarded, externalId for dedup

**UserProfile** — streaks (current/longest), totals (runs/distance/time), milestones[], preferences (units, notifications, sounds), purchases[]

**EvolutionEvent** — petId, fromLevel, toLevel, triggeredBy (runId or milestone), timestamp

See ARCHITECTURE.md for full TypeScript interface definitions.

---

## MVP Scope (Phase 1)

### Ships With
- 1 pet: Endurance Wolf, 3 evolution stages (pup → runner → alpha)
- HealthKit sync (iOS, running workouts only)
- Distance-based progression (50km → evolve, 200km → evolve again)
- Streak tracking (visual flame, 1 rest day/week allowed)
- XP system: `(distance_km × 10) + min(streak_days, 30)`
- Onboarding: HealthKit permission → name your wolf
- Home screen: pet animation + today's stats + streak
- Run history: list of synced runs with pet reactions
- Celebration modal: post-run XP gain + evolution check
- Local SQLite storage, no backend

### Explicitly NOT in MVP
- Multiple pet types (Phase 3)
- Apple Watch (Phase 2)
- Notifications (Phase 2)
- Settings screen (hardcode preferences)
- In-app purchases (validate retention first)
- Social/sharing features (Phase 3)
- Advanced analytics (Pro subscription, Phase 4)
- Android (V2)
- Sound effects (Phase 2)
- Collection screen (Phase 3)
- Mood system beyond basic (happy/neutral/waiting)
- Personality traits (Phase 2)

### Success Criteria
- 50 beta users complete onboarding
- 40%+ Day 7 retention
- Qualitative: "I ran today because I wanted to see my pet evolve"

---

## Phase Roadmap

### Phase 1 (Week 1-2): Core Loop
Onboarding, home screen, HealthKit sync, evolution engine (1 pet, 3 stages), run history, celebration modal, SQLite.

### Phase 2 (Week 3-4): Polish
Notifications, Apple Watch complication, mood system, settings, streak polish, evolution stages 4-5, run detail modal.

### Phase 3 (Week 5-6): Growth
3 more pet species, collection screen, Strava integration, share features, achievement badges, referral program.

### Phase 4 (Week 7-8): Monetization
IAP (pet slots, cosmetics), subscription tier (RunPets Pro: analytics, exclusive pets, unlimited slots), paywall, RevenueCat.

### Post-MVP
V2: Android + backend + social features
V3: Apple Watch standalone + live run animations + race predictions
V4: AR mode + 3D pets + multiplayer

---

## Animation Strategy

### MVP (if Rive assets not ready)
Use AI-generated animated clips (APNG/video) as placeholders:
- Generate wolf character at 3 stages via Gemini/Flux
- Animate with fal.ai (Kling/Wan) → idle loop clips
- Remove backgrounds → optimized format for RN

### Target (when Rive animator delivers)
Single `.riv` file per species with state machine. Drop in and replace placeholder animations. The `AnimationController` class abstracts this — components don't care if it's video or Rive underneath.

### Rive Spec for Animator
- 1 file per species, all 5 stages as artboards
- State machine: idle (loop), running (loop), celebration (one-shot), sleeping (loop), stretching (one-shot), evolution (one-shot cross-artboard)
- Inputs: mood (number), stage (number), isRunning (bool), evolve (trigger), tap (trigger)
- Style: illustrated/flat 2D, Finch-like aesthetic
- Budget: $1,500-3,000

---

## Key Design Decisions (Do Not Violate)

1. **Pets are JSON configs, not code.** The evolution engine is generic. New pets = new JSON + assets.
2. **No guilt mechanics.** Pet never dies/suffers from inactivity. Positive reinforcement only.
3. **Real data only.** Evolution from HealthKit runs, not manual check-ins. Can't fake a marathon.
4. **Local-first.** No backend until social features justify it. Privacy by default.
5. **Running-specific.** This is for runners, not generic fitness. PRs, pace, races, training patterns matter.
6. **Premium feel.** No ads, ever. Monetize via subscriptions + cosmetics.
7. **Streaks allow rest.** 1-2 rest days per week don't break streaks. Healthy training > hustle culture.
8. **XP weighted by archetype.** Endurance Wolf rewards distance. Sprint Hare rewards pace. Steady Turtle rewards consistency. Same formula, different weights.

---

## Competitive Context

**Direct competitors:** DigiBuddy (tiny, generic fitness pet), PillPets (health habit pet, different category)
**Adjacent:** Finch ($100M/yr, broad wellness), Zombies Run ($5M/yr, narrative running), Strava (social, no pet)
**Our niche:** "Virtual pet for runners" — nobody owns this. Strava is social, Finch is wellness, we're emotional motivation tied to real athletic achievement.
**Moat:** Running-specific depth (PRs, archetypes, race integrations) + Strava integration + premium positioning.

---

## Useful Components & References

### `asc` — App Store Connect CLI
- **Source:** [asccli.sh](https://asccli.sh)
- **Via:** [@rudrank on X](https://x.com/rudrank/status/2023145666030264506)
- **Install:** `brew install rudrankriyam/tap/asc`
- **What it is:** Fast CLI for App Store Connect — Xcode to TestFlight in minutes, 1210+ API endpoints, 60+ command groups, single binary
- **Agent skills:** `npx skills add rudrankriyam/app-store-connect-cli-skills` — pre-built skills for builds, signing, TestFlight, submissions, metadata, screenshots, PPP pricing, subscription localization
- **Key skills:** CLI Usage, Xcode Build, Release Flow, TestFlight, Signing Setup, Metadata Sync, Submission Health, Build Lifecycle, Screenshots, ID Resolver, PPP Pricing, Subscription Localization, Notarization
- **Use case:** Automate the entire App Store submission pipeline from terminal/CI. No more clicking around in App Store Connect.

### Calendar/Agenda Component (for run tracking UI)
- **Source:** [React Native Components — Calendar Template](https://reactnativecomponents.com/templates/defa78e4-833c-4395-8d1f-df62c7fa4bbc)
- **Via:** [@rncomponents on X](https://x.com/rncomponents/status/2023089213068247535)
- **What it is:** Interactive calendar + daily agenda, Expo-compatible, month/week view toggle, swipeable days, dark mode, reanimated animations, haptic feedback
- **Use case:** Run history screen — show runs on a calendar with daily agenda view instead of a flat list. Could replace or augment `history.tsx`.
- **Stack:** Expo, react-native-reanimated, functional components, custom hooks
- **Key features:** CRUD for goals/tasks, color-coded badges (category + priority), custom month picker

---

## Reference Docs

All detailed docs live in the obsidian vault at `~/clawd/obsidian-vault/01-Projects/runpet/`:
- `VISION.md` — Full product vision, pet system design, monetization, growth strategy
- `ARCHITECTURE.md` — Complete technical architecture, all TypeScript interfaces, screen map, core systems, asset requirements
- `SPRINT-PLAN.md` — Day-by-day 1-week build plan
- `COMPETITORS.md` — Deep teardowns of Finch, Zombies Run, Walkr, Strava, DigiBuddy
- `GROWTH-TACTICS.md` — Build-in-public playbook, TikTok strategy, ASO
- `NATHAN-GECKLER-ANALYSIS.md` — Lessons from PillPets creator

**For full TypeScript interfaces, screen layouts, and system designs, read ARCHITECTURE.md.**
