import type {
  TerrainSample,
  TerrainSurface,
} from "../terrainTypes";

export type TerracedSurface = TerrainSurface;

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

export interface TerracedTerrainSample extends TerrainSample {
  row: number;
  column: number;
}

export type TerracedTerrainSampler = (
  x: number,
  z: number,
) => TerracedTerrainSample | undefined;
