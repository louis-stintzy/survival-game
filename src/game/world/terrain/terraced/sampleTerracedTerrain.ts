import type {
  TerracedTerrainData,
  TerracedTerrainSample,
} from "./terracedTerrainTypes";

/** Convertit directement une coordonnée monde en cellule de la grille centrée. */
export function sampleTerracedTerrain(
  terrain: TerracedTerrainData,
  x: number,
  z: number,
): TerracedTerrainSample | undefined {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return undefined;

  const minimumX = (-terrain.columnCount * terrain.cellSize) / 2;
  const minimumZ = (-terrain.rowCount * terrain.cellSize) / 2;
  const column = Math.floor((x - minimumX) / terrain.cellSize);
  const row = Math.floor((z - minimumZ) / terrain.cellSize);

  if (
    row < 0 ||
    row >= terrain.rowCount ||
    column < 0 ||
    column >= terrain.columnCount
  ) {
    return undefined;
  }

  const cell = terrain.cells[row * terrain.columnCount + column];
  if (!cell) return undefined;

  return {
    row,
    column,
    level: cell.level,
    height: cell.level * terrain.heightStep,
    surface: cell.surface,
    isLand: cell.surface !== "water",
  };
}
