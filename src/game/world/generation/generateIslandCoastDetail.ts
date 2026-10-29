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

  const values = shape.values.map((baseSignal, index) => {
    const row = Math.floor(index / shape.columnCount);
    const column = index % shape.columnCount;
    const detail = sampleSmoothedCoastDetail(controlGrid, row, column);
    const coastWeight = calculateCoastWeight(baseSignal);
    return baseSignal + detail * COAST_DETAIL_AMPLITUDE * coastWeight;
  });

  return { ...shape, values };
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
  const firstRow = clamp(
    Math.floor(controlRow),
    0,
    grid.rowCount - 1,
  );
  const firstColumn = clamp(
    Math.floor(controlColumn),
    0,
    grid.columnCount - 1,
  );
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
