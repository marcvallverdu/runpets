export function calculateXP(distanceKm: number, currentStreak: number): number {
  const base = Math.round(distanceKm * 10);
  const streakBonus = Math.min(currentStreak, 30);
  return base + streakBonus;
}
