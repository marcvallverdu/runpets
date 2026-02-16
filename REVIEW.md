# RunPets code review

## Findings

1) Mock data is hard-coded for sync flows (real HealthKit runs never used)
- `app/(tabs)/index.tsx:27-39` calls `sync(true)` on mount, forcing mock runs even on iOS devices.
- `app/(tabs)/index.tsx:37-39` and `app/(tabs)/history.tsx:47-49` use `sync(true)` on refresh, so user-initiated syncs also never hit HealthKit.
- Impact: production users always see mock data; HealthKit permissions and real runs are effectively ignored.

2) XP system is computed but never persisted or reflected in pet state
- `lib/health/sync.ts:151-165` computes `xp_awarded` per run and aggregates `totalXp`, but `totalXp` is never stored and `pet.xp` is never updated.
- `lib/stores/petStore.ts:55-58` loads `pet.xp` from DB but there is no code path that updates it based on runs.
- Impact: XP display/progress can never reflect real activity; XP stays at 0 indefinitely.

3) Run count in the UI is not reactive
- `app/(tabs)/index.tsx:160` uses `useRunStore.getState().runs.length` inside render. This bypasses React state subscription, so the count can be stale and will not update when runs change.
- Impact: run count can be wrong after syncs or refresh.

4) Streak logic allows missed days to count as continuous streaks
- `lib/engine/streaks.ts:32-45` permits up to 2 consecutive rest days and 1 rest day per 7 days while still incrementing the streak.
- Impact: the displayed “day streak” is not a true consecutive-day streak; it can stay active after missed days. If the product expects strict daily streaks, this is a logic bug.

5) No recovery path if onboarding flag is true but no pet exists
- `lib/stores/petStore.ts:38-39` returns early when no pet is found; UI still renders a default pet view but there is no flow to recreate a pet if the DB was cleared while the AsyncStorage flag stayed true.
- Impact: users can get stuck without a pet and without a way to fix it in-app.

## Checks completed
- TypeScript: `npx tsc --noEmit` passed.
- Imports/routes/images: no broken import paths or missing asset files found in `app/`, `lib/`, `theme/`, `content/`, and `assets/`.
