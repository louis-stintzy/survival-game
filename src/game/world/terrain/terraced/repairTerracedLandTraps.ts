import type {
  TerracedCell,
  TerracedTerrainData,
} from "./terracedTerrainTypes";

export interface TerracedLandTrapRepairResult {
  terrainData: TerracedTerrainData;
  adjustedCellCount: number;
}

/**
 * Relève uniquement les dépressions incapables de rejoindre la plage.
 *
 * La recherche part des cellules de sable puis parcourt les déplacements en
 * sens inverse. Chaque bord encore piégé est relevé au plus bas niveau lui
 * permettant de monter vers une cellule déjà échappable avec un delta de +1.
 */
export function repairTerracedLandTraps(
  terrain: TerracedTerrainData,
): TerracedLandTrapRepairResult {
  assertTerrain(terrain);

  const cells = terrain.cells.map((cell) => ({ ...cell }));
  const escapable = findEscapableLandCells(
    cells,
    terrain.rowCount,
    terrain.columnCount,
  );
  const landCellCount = cells.filter(isLand).length;
  let adjustedCellCount = 0;

  while (escapable.size < landCellCount) {
    const nextEscapable: { index: number; level: number }[] = [];

    for (let index = 0; index < cells.length; index += 1) {
      const cell = cells[index];
      if (!isLand(cell) || escapable.has(index)) continue;

      const escapeLevels = getCardinalNeighbors(
        index,
        terrain.rowCount,
        terrain.columnCount,
      )
        .filter((neighborIndex) => escapable.has(neighborIndex))
        .map((neighborIndex) => cells[neighborIndex].level);
      if (escapeLevels.length === 0) continue;

      const lowestEscapeLevel = Math.min(...escapeLevels);
      nextEscapable.push({
        index,
        level: Math.max(cell.level, lowestEscapeLevel - 1),
      });
    }

    if (nextEscapable.length === 0) {
      throw new RangeError(
        "Le terrain contient une composante terrestre sans accès à la plage.",
      );
    }

    // Une vague entière est appliquée simultanément : le résultat ne dépend
    // ainsi pas de l'ordre de parcours des cellules dans cette vague.
    for (const { index, level } of nextEscapable) {
      if (cells[index].level !== level) {
        cells[index] = { ...cells[index], level };
        adjustedCellCount += 1;
      }
      escapable.add(index);
    }
  }

  return {
    terrainData: { ...terrain, cells },
    adjustedCellCount,
  };
}

/** Retourne les cellules terrestres incapables de rejoindre une plage. */
export function findTerracedLandTrapIndices(
  terrain: TerracedTerrainData,
): number[] {
  assertTerrain(terrain);
  const escapable = findEscapableLandCells(
    terrain.cells,
    terrain.rowCount,
    terrain.columnCount,
  );
  const traps: number[] = [];
  for (let index = 0; index < terrain.cells.length; index += 1) {
    if (isLand(terrain.cells[index]) && !escapable.has(index)) {
      traps.push(index);
    }
  }
  return traps;
}

function findEscapableLandCells(
  cells: readonly TerracedCell[],
  rowCount: number,
  columnCount: number,
): Set<number> {
  const escapable = new Set<number>();
  const queue: number[] = [];

  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index].surface === "sand") {
      escapable.add(index);
      queue.push(index);
    }
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const escapeIndex = queue[cursor];
    const escapeCell = cells[escapeIndex];
    for (const candidateIndex of getCardinalNeighbors(
      escapeIndex,
      rowCount,
      columnCount,
    )) {
      const candidate = cells[candidateIndex];
      if (
        !escapable.has(candidateIndex) &&
        isLand(candidate) &&
        escapeCell.level - candidate.level < 2
      ) {
        escapable.add(candidateIndex);
        queue.push(candidateIndex);
      }
    }
  }

  return escapable;
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

function isLand(cell: TerracedCell): boolean {
  return cell.surface !== "water";
}

function assertTerrain(terrain: TerracedTerrainData): void {
  if (
    !Number.isSafeInteger(terrain.rowCount) ||
    terrain.rowCount <= 0 ||
    !Number.isSafeInteger(terrain.columnCount) ||
    terrain.columnCount <= 0 ||
    terrain.cells.length !== terrain.rowCount * terrain.columnCount
  ) {
    throw new RangeError("La grille de terrain terrassé est invalide.");
  }
  if (!terrain.cells.some((cell) => cell.surface === "sand")) {
    throw new RangeError("Le terrain terrassé ne contient aucune plage sûre.");
  }
}
