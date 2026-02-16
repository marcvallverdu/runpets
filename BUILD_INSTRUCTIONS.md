# Build Instructions for Codex

The Expo project is already scaffolded with all dependencies installed. Just write the code.

## Installed Dependencies
- expo (SDK 54), expo-router, expo-sqlite, zustand, expo-haptics
- react-native-reanimated, date-fns, expo-image, expo-linear-gradient
- @react-native-async-storage/async-storage, react-native-health

## What to Build (MVP — 4 screens)

### 1. Onboarding Flow (app/onboarding/)
Two screens shown on first launch:
- **welcome.tsx**: Hero screen with wolf illustration, "Your running brings them to life" tagline, "Get Started" button that requests HealthKit permissions via react-native-health
- **name-pet.tsx**: Text input to name your wolf, "Let's Go!" button saves pet to SQLite and marks onboarding complete

Store onboarding state in AsyncStorage. Root layout checks this and routes to onboarding or tabs.

### 2. Home Screen (app/(tabs)/index.tsx)
- Dark navy gradient background (#0a0e27 → #1a1f3a)
- Streak flame at top with count
- Large pet image centered (280×280) — selects correct stage × mood image
- Pet name + "Level X • Stage Name" below image  
- XP progress bar toward next evolution
- Today's stats card: distance, pace, duration
- Weekly + lifetime distance stats
- Pull-to-refresh syncs HealthKit

### 3. History Tab (app/(tabs)/history.tsx — replace "explore" tab)
- FlatList of runs sorted by date descending
- Each row: date, distance (km), pace (min:sec/km), duration, XP earned
- Empty state when no runs
- Pull-to-refresh syncs HealthKit
- Section headers by month

### 4. Celebration Modal (app/celebration.tsx)
- Full-screen modal overlay
- Run stats display
- Animated XP bar fill (reanimated)
- Pet reaction image
- Evolution check — if threshold met, show "YOUR PET EVOLVED!" with stage transition
- Haptic feedback on XP gain and evolution
- Dismiss button

## Core Systems to Implement

### Pet Config (content/pets/endurance-wolf.json)
```json
{
  "id": "endurance-wolf",
  "name": "Endurance Wolf",
  "archetype": "endurance",
  "description": "A loyal companion that thrives on long distances.",
  "stages": [
    { "level": 1, "name": "Pup", "imagePrefix": "wolf-pup", "requirements": null },
    { "level": 2, "name": "Runner", "imagePrefix": "wolf-runner", "requirements": { "totalKm": 50 } },
    { "level": 3, "name": "Alpha", "imagePrefix": "wolf-alpha", "requirements": { "totalKm": 200 } }
  ],
  "statWeights": { "pace": 0.2, "distance": 0.6, "consistency": 0.2 }
}
```

### Pet Images
Images are in assets/pets/endurance-wolf/:
- Per stage (pup/runner/alpha): idle (.png), celebrating, sleeping/resting, waiting
- Import them as require() in a mapping object

Image mapping:
```typescript
const PET_IMAGES = {
  'wolf-pup': {
    idle: require('../assets/pets/endurance-wolf/wolf-pup.png'),
    celebrating: require('../assets/pets/endurance-wolf/wolf-pup-celebrating.png'),
    sleeping: require('../assets/pets/endurance-wolf/wolf-pup-sleeping.png'),
    waiting: require('../assets/pets/endurance-wolf/wolf-pup-waiting.png'),
  },
  'wolf-runner': {
    idle: require('../assets/pets/endurance-wolf/wolf-runner.png'),
    celebrating: require('../assets/pets/endurance-wolf/wolf-runner-celebrating.png'),
    sleeping: require('../assets/pets/endurance-wolf/wolf-runner-resting.png'),
    waiting: require('../assets/pets/endurance-wolf/wolf-runner-waiting.png'),
  },
  'wolf-alpha': {
    idle: require('../assets/pets/endurance-wolf/wolf-alpha.png'),
    celebrating: require('../assets/pets/endurance-wolf/wolf-alpha-celebrating.png'),
    sleeping: require('../assets/pets/endurance-wolf/wolf-alpha-sleeping.png'),
    waiting: require('../assets/pets/endurance-wolf/wolf-alpha-waiting.png'),
  },
};
```

### SQLite Database (lib/storage/db.ts)
```sql
CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  species_id TEXT NOT NULL DEFAULT 'endurance-wolf',
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  external_id TEXT UNIQUE,
  distance_meters REAL NOT NULL,
  duration_seconds REAL NOT NULL,
  pace_seconds_per_km REAL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  calories REAL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY DEFAULT 'default',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_run_date TEXT,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_distance_meters REAL NOT NULL DEFAULT 0,
  total_time_seconds REAL NOT NULL DEFAULT 0,
  units TEXT NOT NULL DEFAULT 'metric',
  onboarding_complete INTEGER NOT NULL DEFAULT 0
);
```

### Evolution Engine (lib/engine/evolution.ts)
```typescript
const EVOLUTION_THRESHOLDS = { 1: 0, 2: 50, 3: 200 }; // total km

function getEvolutionStage(totalKm: number): 1 | 2 | 3 {
  if (totalKm >= 200) return 3;
  if (totalKm >= 50) return 2;
  return 1;
}

function getProgressToNextStage(totalKm: number, currentLevel: number) {
  if (currentLevel >= 3) return { progress: 1, remaining: 0, nextThreshold: 200 };
  const nextThreshold = currentLevel === 1 ? 50 : 200;
  const prevThreshold = currentLevel === 1 ? 0 : 50;
  const progress = (totalKm - prevThreshold) / (nextThreshold - prevThreshold);
  return { progress: Math.min(progress, 1), remaining: nextThreshold - totalKm, nextThreshold };
}
```

### XP System (lib/engine/xp.ts)
```typescript
function calculateXP(distanceKm: number, currentStreak: number): number {
  const base = Math.round(distanceKm * 10);
  const streakBonus = Math.min(currentStreak, 30);
  return base + streakBonus;
}
```

### Streak Calculator (lib/engine/streaks.ts)
- Count consecutive days with runs
- Allow 1 rest day per week without breaking streak
- >2 consecutive rest days = streak resets

### Mood System (lib/engine/mood.ts)
```typescript
type PetMood = 'idle' | 'celebrating' | 'sleeping' | 'waiting';

function calculateMood(lastRunDate: Date | null, currentStreak: number): PetMood {
  if (!lastRunDate) return 'waiting';
  const daysSince = differenceInDays(new Date(), lastRunDate);
  if (daysSince === 0) return 'celebrating';
  if (daysSince <= 1) return 'idle';  
  if (daysSince <= 2) return 'sleeping'; // rest day
  return 'waiting'; // been a while
}
```

### HealthKit Sync (lib/health/sync.ts)
Use react-native-health to:
1. Initialize with permissions for running workouts
2. Query running workouts (distance, duration, start/end date)
3. Deduplicate by start_time (since external_id may not be available)
4. Calculate pace from distance/duration
5. Save new runs to SQLite
6. Update profile totals
7. Check evolution after sync
8. NOTE: On simulator/dev, provide mock data option

### Zustand Stores
- **petStore**: current pet, level, xp, name, mood
- **runStore**: runs array, sync status, today's runs
- **profileStore**: streak, totals, onboarding status

## Design System (theme/)
```typescript
// colors.ts
export const colors = {
  background: '#0a0e27',
  backgroundLight: '#1a1f3a',
  card: '#1e2442',
  cardBorder: '#2a3158',
  accent: '#4f8fff',
  accentLight: '#7aabff',
  secondary: '#c0c7d6',
  text: '#ffffff',
  textSecondary: '#8892b0',
  textMuted: '#5a6380',
  streak: '#ff6b35',
  streakGlow: '#ff8f5e',
  success: '#4ade80',
  xpBar: '#4f8fff',
  xpBarBg: '#1a2744',
  danger: '#ef4444',
};

// typography.ts
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  stat: { fontSize: 32, fontWeight: '700' as const },
};

// spacing.ts
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};
```

## Tab Bar Configuration
- 2 tabs: Home (house icon) and History (clock/list icon)
- Dark tab bar matching background
- Active tab: accent blue, inactive: muted grey
- Remove the existing "explore" tab from the template

## IMPORTANT RULES
1. Use expo-image (Image from expo-image) for all images, NOT React Native Image
2. Use expo-sqlite with the synchronous API (useSQLiteDatabase hook or openDatabaseSync)
3. Dark theme everywhere — no white backgrounds
4. TypeScript strict — no `any` types
5. Use Expo Router file-based routing
6. Make it look BEAUTIFUL and premium
7. Handle empty states gracefully
8. The wolf images use require() — they're local assets
9. For HealthKit: wrap in try/catch, gracefully handle simulator (provide mock data fallback)
10. Use react-native-reanimated for the XP bar animation in celebration modal

When completely finished, run this command:
openclaw system event --text "Done: RunPets MVP built — all screens, systems, and wolf images wired up" --mode now
