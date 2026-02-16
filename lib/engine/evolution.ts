export const EVOLUTION_THRESHOLDS: Record<number, number> = { 1: 0, 2: 50, 3: 200 };

export function getEvolutionStage(totalKm: number): 1 | 2 | 3 {
  if (totalKm >= 200) return 3;
  if (totalKm >= 50) return 2;
  return 1;
}

export function getProgressToNextStage(totalKm: number, currentLevel: number) {
  if (currentLevel >= 3) return { progress: 1, remaining: 0, nextThreshold: 200 };
  const nextThreshold = currentLevel === 1 ? 50 : 200;
  const prevThreshold = currentLevel === 1 ? 0 : 50;
  const progress = (totalKm - prevThreshold) / (nextThreshold - prevThreshold);
  return { progress: Math.min(Math.max(progress, 0), 1), remaining: Math.max(nextThreshold - totalKm, 0), nextThreshold };
}
