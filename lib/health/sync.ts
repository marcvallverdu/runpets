import { Platform } from 'react-native';
import { insertRuns, getRuns, getProfile, updateProfile, type RunInsert } from '../storage/db';
import { calculateXP } from '../engine/xp';
import { calculateStreaks } from '../engine/streaks';

// Mock data for simulator/development
function generateMockRuns(): RunInsert[] {
  const now = new Date();
  const runs: RunInsert[] = [];

  // Generate 15 mock runs over the past 30 days
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const hour = 6 + Math.floor(Math.random() * 12);
    date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

    const distanceKm = 3 + Math.random() * 12; // 3-15km
    const paceMinPerKm = 4.5 + Math.random() * 2.5; // 4:30 - 7:00 min/km
    const durationSeconds = distanceKm * paceMinPerKm * 60;
    const endDate = new Date(date.getTime() + durationSeconds * 1000);

    runs.push({
      id: `mock_${date.getTime()}_${i}`,
      external_id: `mock_ext_${i}`,
      distance_meters: distanceKm * 1000,
      duration_seconds: durationSeconds,
      pace_seconds_per_km: paceMinPerKm * 60,
      start_time: date.toISOString(),
      end_time: endDate.toISOString(),
      calories: Math.round(distanceKm * 65),
      xp_awarded: 0,
    });
  }

  return runs;
}

let healthKitAvailable = false;

export async function initHealthKit(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    console.log('HealthKit not available on this platform');
    return false;
  }

  try {
    const AppleHealthKit = require('react-native-health').default;
    const permissions = {
      permissions: {
        read: ['Workout', 'DistanceWalkingRunning', 'ActiveEnergyBurned'],
        write: [] as string[],
      },
    };

    return new Promise<boolean>((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.log('HealthKit init error:', error);
          resolve(false);
        } else {
          healthKitAvailable = true;
          resolve(true);
        }
      });
    });
  } catch (e) {
    console.log('HealthKit not available:', e);
    return false;
  }
}

async function fetchHealthKitRuns(): Promise<RunInsert[]> {
  if (!healthKitAvailable) return [];

  try {
    const AppleHealthKit = require('react-native-health').default;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);

    const options = {
      startDate: thirtyDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
      type: 'Running' as const,
    };

    return new Promise<RunInsert[]>((resolve) => {
      AppleHealthKit.getSamples(options, (err: unknown, results: Array<{
        id: string;
        distance: number;
        start: string;
        end: string;
        calories: number;
        duration: number;
      }>) => {
        if (err || !results) {
          console.log('HealthKit getSamples error:', err);
          resolve([]);
          return;
        }

        const runs: RunInsert[] = results.map((sample) => {
          const distanceMeters = (sample.distance || 0) * 1609.34; // miles to meters
          const durationSeconds = sample.duration || 0;
          const paceSecondsPerKm = distanceMeters > 0
            ? (durationSeconds / (distanceMeters / 1000))
            : null;

          return {
            id: `hk_${sample.id || sample.start}`,
            external_id: sample.id || null,
            distance_meters: distanceMeters,
            duration_seconds: durationSeconds,
            pace_seconds_per_km: paceSecondsPerKm,
            start_time: sample.start,
            end_time: sample.end,
            calories: sample.calories || null,
            xp_awarded: 0,
          };
        });

        resolve(runs);
      });
    });
  } catch (e) {
    console.log('HealthKit fetch error:', e);
    return [];
  }
}

export async function syncRuns(useMockData: boolean | 'auto' = 'auto'): Promise<{
  newRuns: number;
  totalDistance: number;
  evolved: boolean;
  newLevel: number;
}> {
  let newRunsToInsert: RunInsert[];

  const shouldUseMock = useMockData === true || (useMockData === 'auto' && !healthKitAvailable);

  if (shouldUseMock) {
    const existing = getRuns();
    if (existing.length > 0) {
      newRunsToInsert = [];
    } else {
      newRunsToInsert = generateMockRuns();
    }
  } else {
    newRunsToInsert = await fetchHealthKitRuns();
  }

  // Calculate XP for new runs
  const profile = getProfile();
  newRunsToInsert = newRunsToInsert.map((run) => ({
    ...run,
    xp_awarded: calculateXP(run.distance_meters / 1000, profile.current_streak),
  }));

  // Insert runs
  insertRuns(newRunsToInsert);

  // Recalculate totals
  const allRuns = getRuns();
  const totalDistance = allRuns.reduce((sum, r) => sum + r.distance_meters, 0);
  const totalTime = allRuns.reduce((sum, r) => sum + r.duration_seconds, 0);
  const totalXp = allRuns.reduce((sum, r) => sum + r.xp_awarded, 0);

  // Calculate streaks
  const runDates = allRuns.map((r) => new Date(r.start_time));
  const streakResult = calculateStreaks(runDates, profile.longest_streak);

  // Check evolution
  const { getEvolutionStage } = require('../engine/evolution');
  const totalKm = totalDistance / 1000;
  const newLevel = getEvolutionStage(totalKm);
  const evolved = newLevel > (profile.total_distance_meters / 1000 >= 200 ? 3 : profile.total_distance_meters / 1000 >= 50 ? 2 : 1);

  // Update pet XP
  const { getActivePet, updatePet } = require('../storage/db');
  const activePet = getActivePet();
  if (activePet) {
    updatePet(activePet.id, { xp: totalXp, level: newLevel });
  }

  // Update profile
  updateProfile({
    total_runs: allRuns.length,
    total_distance_meters: totalDistance,
    total_time_seconds: totalTime,
    current_streak: streakResult.currentStreak,
    longest_streak: streakResult.longestStreak,
    last_run_date: streakResult.lastRunDate?.toISOString() ?? null,
  });

  return {
    newRuns: newRunsToInsert.length,
    totalDistance,
    evolved,
    newLevel,
  };
}
