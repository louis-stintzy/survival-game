export type TerrainSurface = "water" | "sand" | "grass" | "rock";

export interface TerrainSample {
  height: number;
  level: number;
  surface: TerrainSurface;
  isLand: boolean;
}

export type TerrainSampler = (
  x: number,
  z: number,
) => TerrainSample | undefined;
