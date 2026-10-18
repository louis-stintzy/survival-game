export type TerracedSurface = "water" | "sand" | "grass" | "rock";

export interface TerracedCell {
  level: number;
  surface: TerracedSurface;
}

/**
 * Grille de cellules stockée à plat en row-major :
 * `index = row * columnCount + column`.
 */
export interface TerracedTerrainData {
  rowCount: number;
  columnCount: number;
  cellSize: number;
  heightStep: number;
  waterHeight: number;
  cells: readonly TerracedCell[];
}

export interface TerracedTerrainSample {
  row: number;
  column: number;
  level: number;
  height: number;
  surface: TerracedSurface;
  isLand: boolean;
}

export type TerracedTerrainSampler = (
  x: number,
  z: number,
) => TerracedTerrainSample | undefined;
