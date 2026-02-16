import type { PetConfig } from './types';

const petConfig = require('../../content/pets/endurance-wolf.json') as PetConfig;

export const enduranceWolf = petConfig;

export function getStageForLevel(level: number) {
  const stages = enduranceWolf.stages;
  return stages.find((stage) => stage.level === level) ?? stages[0];
}
