import { differenceInDays } from 'date-fns';

export type PetMood = 'idle' | 'celebrating' | 'sleeping' | 'waiting';

export function calculateMood(lastRunDate: Date | null, _currentStreak: number): PetMood {
  if (!lastRunDate) return 'waiting';
  const daysSince = differenceInDays(new Date(), lastRunDate);
  if (daysSince === 0) return 'celebrating';
  if (daysSince <= 1) return 'idle';
  if (daysSince <= 2) return 'sleeping';
  return 'waiting';
}
