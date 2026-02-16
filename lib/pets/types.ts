export type PetStage = {
  level: number;
  name: string;
  imagePrefix: string;
  requirements: { totalKm: number } | null;
};

export type PetConfig = {
  id: string;
  name: string;
  archetype: string;
  description: string;
  stages: PetStage[];
  statWeights: {
    pace: number;
    distance: number;
    consistency: number;
  };
};
