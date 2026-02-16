import { create } from 'zustand';
import { getRuns, getProfile, type RunRow } from '../storage/db';
import { syncRuns } from '../health/sync';

type RunState = {
  runs: RunRow[];
  todayRuns: RunRow[];
  isSyncing: boolean;
  lastSyncResult: { newRuns: number; evolved: boolean; newLevel: number } | null;
  weeklyDistance: number;
  totalDistance: number;
  currentStreak: number;
  longestStreak: number;

  loadRuns: () => void;
  sync: (useMock?: boolean | 'auto') => Promise<void>;
};

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

export const useRunStore = create<RunState>((set) => ({
  runs: [],
  todayRuns: [],
  isSyncing: false,
  lastSyncResult: null,
  weeklyDistance: 0,
  totalDistance: 0,
  currentStreak: 0,
  longestStreak: 0,

  loadRuns: () => {
    const runs = getRuns();
    const profile = getProfile();
    const todayRuns = runs.filter((r) => isToday(r.start_time));
    const weeklyRuns = runs.filter((r) => isThisWeek(r.start_time));
    const weeklyDistance = weeklyRuns.reduce((sum, r) => sum + r.distance_meters, 0);

    set({
      runs,
      todayRuns,
      weeklyDistance,
      totalDistance: profile.total_distance_meters,
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
    });
  },

  sync: async (useMock: boolean | 'auto' = 'auto') => {
    set({ isSyncing: true });
    try {
      const result = await syncRuns(useMock);
      const runs = getRuns();
      const profile = getProfile();
      const todayRuns = runs.filter((r) => isToday(r.start_time));
      const weeklyRuns = runs.filter((r) => isThisWeek(r.start_time));
      const weeklyDistance = weeklyRuns.reduce((sum, r) => sum + r.distance_meters, 0);

      set({
        runs,
        todayRuns,
        weeklyDistance,
        totalDistance: profile.total_distance_meters,
        currentStreak: profile.current_streak,
        longestStreak: profile.longest_streak,
        lastSyncResult: {
          newRuns: result.newRuns,
          evolved: result.evolved,
          newLevel: result.newLevel,
        },
        isSyncing: false,
      });
    } catch (e) {
      console.error('Sync error:', e);
      set({ isSyncing: false });
    }
  },
}));
