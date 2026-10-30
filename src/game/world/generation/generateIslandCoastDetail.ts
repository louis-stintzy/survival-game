import { createSeededRandom } from "./createSeededRandom";
import type { IslandShape } from "./generateIslandShape";

const COAST_DETAIL_SEED_SALT = 0x9e37_79b9;
export const COAST_DETAIL_CONTROL_SPACING = 8;
export const COAST_DETAIL_AMPLITUDE = 0.039;
export const COAST_DETAIL_SIGNAL_RANGE = 0.18;

export interface CoastDetailControlGrid {
  rowCount: number;
  columnCount: number;
  spacing: number;
  values: readonly number[];
}

interface GenerateIslandCoastDetailOptions {
  seed: number;
  shape: IslandShape;
}

/** Ajoute une modulation locale lissée uniquement autour du signal côtier. */
export function generateIslandCoastDetail(
  options: GenerateIslandCoastDetailOptions,
): IslandShape {
  const { seed, shape } = options;
  assertShape(shape);
  const detailSeed = (seed ^ COAST_DETAIL_SEED_SALT) >>> 0;
  const controlGrid = createCoastDetailControlGrid(
    shape.rowCount,
    shape.columnCount,
    COAST_DETAIL_CONTROL_SPACING,
    detailSeed,
  );

  const detailedValues = shape.values.map((baseSignal, index) => {
    const row = Math.floor(index / shape.columnCount);
    const column = index % shape.columnCount;
    const detail = sampleSmoothedCoastDetail(controlGrid, row, column);
    const coastWeight = calculateCoastWeight(baseSignal);
    return baseSignal + detail * COAST_DETAIL_AMPLITUDE * coastWeight;
  });
  const values = repairClosedWaterPockets(
    detailedValues,
    shape.rowCount,
    shape.columnCount,
  );

  return { ...shape, values };
}

/**
 * Remplit uniquement les poches d'eau sans connexion cardinale au bord.
 * Le signal positif minimal de leur contour prolonge localement la côte sans
 * introduire de niveau de terrain arbitraire dans ce domaine de génération.
 */
function repairClosedWaterPockets(
  sourceValues: readonly number[],
  rowCount: number,
  columnCount: number,
): number[] {
  const values = [...sourceValues];
  const ocean = new Uint8Array(values.length);
  const pending: number[] = [];

  for (let column = 0; column < columnCount; column += 1) {
    enqueueWater(column, values, ocean, pending);
    enqueueWater((rowCount - 1) * columnCount + column, values, ocean, pending);
  }
  for (let row = 1; row + 1 < rowCount; row += 1) {
    enqueueWater(row * columnCount, values, ocean, pending);
    enqueueWater(row * columnCount + columnCount - 1, values, ocean, pending);
  }
  floodWater(values, rowCount, columnCount, ocean, pending);

  const visitedPocket = new Uint8Array(values.length);
  for (let start = 0; start < values.length; start += 1) {
    if (values[start] > 0 || ocean[start] === 1 || visitedPocket[start] === 1) {
      continue;
    }

    const pocket: number[] = [];
    const pocketPending = [start];
    visitedPocket[start] = 1;
    let repairSignal = Number.POSITIVE_INFINITY;

    while (pocketPending.length > 0) {
      const index = pocketPending.pop()!;
      pocket.push(index);
      for (const neighbor of getCardinalNeighborIndices(
        index,
        rowCount,
        columnCount,
      )) {
        if (values[neighbor] > 0) {
          repairSignal = Math.min(repairSignal, values[neighbor]);
        } else if (ocean[neighbor] === 0 && visitedPocket[neighbor] === 0) {
          visitedPocket[neighbor] = 1;
          pocketPending.push(neighbor);
        }
      }
    }

    const positiveFill = Number.isFinite(repairSignal)
      ? repairSignal
      : Number.EPSILON;
    for (const index of pocket) values[index] = positiveFill;
  }

  return values;
}

function enqueueWater(
  index: number,
  values: readonly number[],
  visited: Uint8Array,
  pending: number[],
): void {
  if (values[index] <= 0 && visited[index] === 0) {
    visited[index] = 1;
    pending.push(index);
  }
}

function floodWater(
  values: readonly number[],
  rowCount: number,
  columnCount: number,
  visited: Uint8Array,
  pending: number[],
): void {
  while (pending.length > 0) {
    const index = pending.pop()!;
    for (const neighbor of getCardinalNeighborIndices(
      index,
      rowCount,
      columnCount,
    )) {
      enqueueWater(neighbor, values, visited, pending);
    }
  }
}

function getCardinalNeighborIndices(
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

/** Crée les valeurs seedées de la grille grossière, indépendamment du shape. */
export function createCoastDetailControlGrid(
  rowCount: number,
  columnCount: number,
  spacing: number,
  seed: number,
): CoastDetailControlGrid {
  assertPositiveInteger(rowCount, "rowCount");
  assertPositiveInteger(columnCount, "columnCount");
  assertPositiveInteger(spacing, "spacing");
  const controlRowCount = Math.ceil((rowCount - 1) / spacing) + 1;
  const controlColumnCount = Math.ceil((columnCount - 1) / spacing) + 1;
  const random = createSeededRandom(seed);
  const values = Array.from(
    { length: controlRowCount * controlColumnCount },
    () => random.float(-1, 1),
  );

  return {
    rowCount: controlRowCount,
    columnCount: controlColumnCount,
    spacing,
    values,
  };
}

/** Interpolation bilinéaire avec transition cubique entre quatre contrôles. */
export function sampleSmoothedCoastDetail(
  grid: CoastDetailControlGrid,
  row: number,
  column: number,
): number {
  const controlRow = row / grid.spacing;
  const controlColumn = column / grid.spacing;
  const firstRow = clamp(Math.floor(controlRow), 0, grid.rowCount - 1);
  const firstColumn = clamp(Math.floor(controlColumn), 0, grid.columnCount - 1);
  const secondRow = Math.min(firstRow + 1, grid.rowCount - 1);
  const secondColumn = Math.min(firstColumn + 1, grid.columnCount - 1);
  const rowBlend = smooth(controlRow - firstRow);
  const columnBlend = smooth(controlColumn - firstColumn);
  const top = interpolate(
    getControlValue(grid, firstRow, firstColumn),
    getControlValue(grid, firstRow, secondColumn),
    columnBlend,
  );
  const bottom = interpolate(
    getControlValue(grid, secondRow, firstColumn),
    getControlValue(grid, secondRow, secondColumn),
    columnBlend,
  );
  return interpolate(top, bottom, rowBlend);
}

/** Poids maximal sur la côte, nul à partir de la limite d'influence. */
export function calculateCoastWeight(baseSignal: number): number {
  const distance = clamp(
    Math.abs(baseSignal) / COAST_DETAIL_SIGNAL_RANGE,
    0,
    1,
  );
  return 1 - smooth(distance);
}

function getControlValue(
  grid: CoastDetailControlGrid,
  row: number,
  column: number,
): number {
  return grid.values[row * grid.columnCount + column];
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function assertShape(shape: IslandShape): void {
  assertPositiveInteger(shape.rowCount, "shape.rowCount");
  assertPositiveInteger(shape.columnCount, "shape.columnCount");
  if (
    shape.values.length !== shape.rowCount * shape.columnCount ||
    !shape.values.every(Number.isFinite)
  ) {
    throw new RangeError("Le signal IslandShape est invalide.");
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} doit être un entier strictement positif.`);
  }
}
