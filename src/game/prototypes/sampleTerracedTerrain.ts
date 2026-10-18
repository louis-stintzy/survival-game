import type {
  TerracedCell,
  TerracedSurface,
} from "./terracedTerrainPrototypeData";

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

/** Convertit directement une coordonnée monde en cellule de la grille fixe. */
export function sampleTerracedTerrain(
  cells: readonly (readonly TerracedCell[])[],
  cellSize: number,
  heightStep: number,
  x: number,
  z: number,
): TerracedTerrainSample | undefined {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return undefined;

  const rowCount = cells.length;
  const columnCount = cells[0]?.length ?? 0;
  const minimumX = (-columnCount * cellSize) / 2;
  const minimumZ = (-rowCount * cellSize) / 2;
  const column = Math.floor((x - minimumX) / cellSize);
  const row = Math.floor((z - minimumZ) / cellSize);
  const cell = cells[row]?.[column];
  if (!cell) return undefined;

  return {
    row,
    column,
    level: cell.level,
    height: cell.level * heightStep,
    surface: cell.surface,
    isLand: cell.surface !== "water",
  };
}
