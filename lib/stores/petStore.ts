import { create } from 'zustand';
import { getActivePet, insertPet, updatePet, getProfile, type PetRow } from '../storage/db';
import { getEvolutionStage, getProgressToNextStage } from '../engine/evolution';
import { calculateMood, type PetMood } from '../engine/mood';
import { getStageForLevel } from '../pets/config';

type PetState = {
  pet: PetRow | null;
  level: number;
  xp: number;
  mood: PetMood;
  stageName: string;
  imagePrefix: string;
  progress: number;
  remaining: number;
  nextThreshold: number;
  totalKm: number;

  loadPet: () => void;
  createPet: (name: string) => void;
  refreshMood: () => void;
  checkEvolution: () => boolean;
};

export const usePetStore = create<PetState>((set, get) => ({
  pet: null,
  level: 1,
  xp: 0,
  mood: 'waiting' as PetMood,
  stageName: 'Pup',
  imagePrefix: 'wolf-pup',
  progress: 0,
  remaining: 50,
  nextThreshold: 50,
  totalKm: 0,

  loadPet: () => {
    const pet = getActivePet();
    if (!pet) return;

    const profile = getProfile();
    const totalKm = profile.total_distance_meters / 1000;
    const newLevel = getEvolutionStage(totalKm);
    const stage = getStageForLevel(newLevel);
    const prog = getProgressToNextStage(totalKm, newLevel);

    const lastRunDate = profile.last_run_date ? new Date(profile.last_run_date) : null;
    const mood = calculateMood(lastRunDate, profile.current_streak);

    // Update pet level if evolved
    if (newLevel !== pet.level) {
      updatePet(pet.id, { level: newLevel });
    }

    set({
      pet: { ...pet, level: newLevel },
      level: newLevel,
      xp: pet.xp,
      mood,
      stageName: stage.name,
      imagePrefix: stage.imagePrefix,
      progress: prog.progress,
      remaining: prog.remaining,
      nextThreshold: prog.nextThreshold,
      totalKm,
    });
  },

  createPet: (name: string) => {
    const pet = insertPet(name);
    if (pet) {
      set({
        pet,
        level: 1,
        xp: 0,
        mood: 'waiting',
        stageName: 'Pup',
        imagePrefix: 'wolf-pup',
        progress: 0,
        remaining: 50,
        nextThreshold: 50,
        totalKm: 0,
      });
    }
  },

  refreshMood: () => {
    const profile = getProfile();
    const lastRunDate = profile.last_run_date ? new Date(profile.last_run_date) : null;
    const mood = calculateMood(lastRunDate, profile.current_streak);
    set({ mood });
  },

  checkEvolution: () => {
    const { pet } = get();
    if (!pet) return false;

    const profile = getProfile();
    const totalKm = profile.total_distance_meters / 1000;
    const newLevel = getEvolutionStage(totalKm);

    if (newLevel > pet.level) {
      updatePet(pet.id, { level: newLevel });
      const stage = getStageForLevel(newLevel);
      const prog = getProgressToNextStage(totalKm, newLevel);

      set({
        pet: { ...pet, level: newLevel },
        level: newLevel,
        stageName: stage.name,
        imagePrefix: stage.imagePrefix,
        progress: prog.progress,
        remaining: prog.remaining,
        nextThreshold: prog.nextThreshold,
        totalKm,
      });
      return true;
    }
    return false;
  },
}));
