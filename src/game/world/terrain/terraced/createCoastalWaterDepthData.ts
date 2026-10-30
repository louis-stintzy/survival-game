import type { TerracedTerrainData } from "./terracedTerrainTypes";

export const COASTAL_SEABED_MAX_DISTANCE = 4;

export interface CoastalWaterDepthData {
  rowCount: number;
  columnCount: number;
  /** 0 signifie terre ou eau profonde sans fond marin côtier. */
  distances: readonly number[];
}

/**
 * Calcule par propagation cardinale la distance des cellules d'eau à la terre,
 * uniquement jusqu'à la largeur visuelle utile au fond marin côtier.
 */
export function createCoastalWaterDepthData(
  terrain: TerracedTerrainData,
): CoastalWaterDepthData {
  if (terrain.cells.length !== terrain.rowCount * terrain.columnCount) {
    throw new Error(
      "Le nombre de cellules doit correspondre à rowCount * columnCount.",
    );
  }

  const distances = Array<number>(terrain.cells.length).fill(0);
  const pending: number[] = [];

  for (let index = 0; index < terrain.cells.length; index += 1) {
    if (
      terrain.cells[index].surface === "water" &&
      getCardinalNeighbors(index, terrain.rowCount, terrain.columnCount).some(
        (neighbor) => terrain.cells[neighbor].surface !== "water",
      )
    ) {
      distances[index] = 1;
      pending.push(index);
    }
  }

  let nextPendingIndex = 0;
  while (nextPendingIndex < pending.length) {
    const index = pending[nextPendingIndex];
    nextPendingIndex += 1;
    const nextDistance = distances[index] + 1;
    if (nextDistance > COASTAL_SEABED_MAX_DISTANCE) continue;

    for (const neighbor of getCardinalNeighbors(
      index,
      terrain.rowCount,
      terrain.columnCount,
    )) {
      if (
        terrain.cells[neighbor].surface !== "water" ||
        distances[neighbor] !== 0
      ) {
        continue;
      }
      distances[neighbor] = nextDistance;
      pending.push(neighbor);
    }
  }

  return {
    rowCount: terrain.rowCount,
    columnCount: terrain.columnCount,
    distances,
  };
}

function getCardinalNeighbors(
  index: number,
  rowCount: number,
  columnCount: number,
): number[] {
  const row = Math.floor(index / columnCount);
  const column = index % columnCount;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(index - columnCount);
  if (row + 1 < rowCount) neighbors.push(index + columnCount);
  if (column > 0) neighbors.push(index - 1);
  if (column + 1 < columnCount) neighbors.push(index + 1);
  return neighbors;
}
