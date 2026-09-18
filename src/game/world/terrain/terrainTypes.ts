export type TerrainSurface = "water" | "beach" | "grass" | "rock";

/** Heightfield régulier dont les triangles sont dérivés implicitement. */
export interface TerrainData {
  halfSize: number;
  gridStep: number;
  gridSize: number;
  waterHeight: number;
  heights: readonly number[];
}

export interface TerrainSample {
  height: number;
  /** Norme du gradient Y sur le plan X/Z du triangle échantillonné. */
  slope: number;
  surface: TerrainSurface;
  isLand: boolean;
}

export type TerrainSampler = (
  x: number,
  z: number,
) => TerrainSample | undefined;
