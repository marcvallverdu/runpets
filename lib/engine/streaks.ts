import { differenceInCalendarDays, startOfDay } from 'date-fns';

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  lastRunDate: Date | null;
};

function toDateKey(date: Date) {
  return startOfDay(date).toISOString();
}

export function calculateStreaks(runDates: Date[], previousLongest: number): StreakResult {
  if (runDates.length === 0) {
    return { currentStreak: 0, longestStreak: previousLongest, lastRunDate: null };
  }

  const sortedDates = [...runDates].sort((a, b) => b.getTime() - a.getTime());
  const dateSet = new Set(sortedDates.map(toDateKey));
  const lastRunDate = sortedDates[0];

  let currentStreak = 0;
  let dayCursor = startOfDay(new Date());
  let restDaysUsed = 0;
  let consecutiveRestDays = 0;
  let daysCounted = 0;

  while (true) {
    const key = toDateKey(dayCursor);
    const hasRun = dateSet.has(key);

    if (hasRun) {
      currentStreak += 1;
      consecutiveRestDays = 0;
    } else {
      consecutiveRestDays += 1;
      if (consecutiveRestDays > 2) break;
      if (restDaysUsed >= 1) break;
      restDaysUsed += 1;
    }

    daysCounted += 1;
    if (daysCounted % 7 === 0) {
      restDaysUsed = 0;
    }

    dayCursor = new Date(dayCursor.getTime() - 24 * 60 * 60 * 1000);

    if (differenceInCalendarDays(new Date(), dayCursor) > 365) break;
  }

  const longestStreak = Math.max(previousLongest, currentStreak);

  return { currentStreak, longestStreak, lastRunDate };
}
