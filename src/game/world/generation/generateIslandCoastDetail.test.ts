import { describe, expect, test } from "vitest";
import {
  calculateCoastWeight,
  COAST_DETAIL_AMPLITUDE,
  COAST_DETAIL_CONTROL_SPACING,
  COAST_DETAIL_SIGNAL_RANGE,
  createCoastDetailControlGrid,
  generateIslandCoastDetail,
  sampleSmoothedCoastDetail,
  type CoastDetailControlGrid,
} from "./generateIslandCoastDetail";
import { generateIslandShape, type IslandShape } from "./generateIslandShape";

const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;
const REGRESSION_SEED = 103;
const GRID_SIZE = 101;
const SIMPLE_CONTROL_GRID: CoastDetailControlGrid = {
  rowCount: 2,
  columnCount: 2,
  spacing: 8,
  values: [-1, 1, 1, -1],
};

describe("sampleSmoothedCoastDetail", () => {
  test("retrouve exactement une valeur sur un point de contrôle", () => {
    expect(sampleSmoothedCoastDetail(SIMPLE_CONTROL_GRID, 0, 0)).toBe(-1);
    expect(sampleSmoothedCoastDetail(SIMPLE_CONTROL_GRID, 8, 8)).toBe(-1);
  });

  test("interpole au milieu de deux points de contrôle", () => {
    expect(sampleSmoothedCoastDetail(SIMPLE_CONTROL_GRID, 0, 4)).toBe(0);
  });

  test("interpole au centre des quatre points de contrôle", () => {
    expect(sampleSmoothedCoastDetail(SIMPLE_CONTROL_GRID, 4, 4)).toBe(0);
  });

  test("fait évoluer deux cellules voisines sans rupture", () => {
    const first = sampleSmoothedCoastDetail(SIMPLE_CONTROL_GRID, 2, 2);
    const neighbor = sampleSmoothedCoastDetail(SIMPLE_CONTROL_GRID, 2, 3);
    expect(Math.abs(neighbor - first)).toBeLessThan(0.5);
  });
});

describe("calculateCoastWeight", () => {
  test("est maximal à zéro, symétrique puis nul à la limite", () => {
    expect(calculateCoastWeight(0)).toBe(1);
    expect(calculateCoastWeight(0.09)).toBe(
      calculateCoastWeight(-0.09),
    );
    expect(calculateCoastWeight(COAST_DETAIL_SIGNAL_RANGE)).toBe(0);
    expect(calculateCoastWeight(1)).toBe(0);
  });
});

describe("generateIslandCoastDetail", () => {
  test("est déterministe et conserve les métadonnées du shape", () => {
    const shape = createShape(12345);
    const first = generateIslandCoastDetail({ seed: 12345, shape });
    const second = generateIslandCoastDetail({ seed: 12345, shape });

    expect(first).toEqual(second);
    expect(first.rowCount).toBe(shape.rowCount);
    expect(first.columnCount).toBe(shape.columnCount);
    expect(first.massCount).toBe(shape.massCount);
    expect(first.levelOneMassCount).toBe(shape.levelOneMassCount);
    expect(first.levelTwoMassCount).toBe(shape.levelTwoMassCount);
  });

  test("fait varier le détail sans modifier le shape source", () => {
    const shape = createShape(12345);
    const originalValues = [...shape.values];
    const first = generateIslandCoastDetail({ seed: 1, shape });
    const second = generateIslandCoastDetail({ seed: 2, shape });

    expect(first.values).not.toEqual(second.values);
    expect(shape.values).toEqual(originalValues);
  });

  test("ne modifie pas les signaux hors de la zone côtière", () => {
    const shape = createShape(12345);
    const detailed = generateIslandCoastDetail({ seed: 12345, shape });
    shape.values.forEach((value, index) => {
      if (Math.abs(value) >= COAST_DETAIL_SIGNAL_RANGE) {
        expect(detailed.values[index]).toBe(value);
      }
    });
  });

  test.each(REPRESENTATIVE_SEEDS)(
    "préserve les invariants côtiers pour la seed %i",
    (seed) => {
      const detailed = generateIslandCoastDetail({
        seed,
        shape: createShape(seed),
      });

      expect(detailed.values.every(Number.isFinite)).toBe(true);
      expect(countLandComponents(detailed)).toBe(1);
      expect(countClosedWaterPockets(detailed)).toBe(0);
      expect(getBorderValues(detailed).every((value) => value <= 0)).toBe(true);
    },
  );

  test("répare la poche d'eau fermée créée pour la seed 103", () => {
    const shape = createShape(REGRESSION_SEED);
    const uncorrected = createUncorrectedDetailedShape(REGRESSION_SEED, shape);
    const detailed = generateIslandCoastDetail({
      seed: REGRESSION_SEED,
      shape,
    });

    expect(getClosedWaterPockets(uncorrected)).toHaveLength(1);
    expect(getClosedWaterPockets(uncorrected)[0]).toHaveLength(1);
    expect(uncorrected.values[2976]).toBeLessThanOrEqual(0);
    expect(detailed.values[2976]).toBeGreaterThan(0);
    expect(countClosedWaterPockets(detailed)).toBe(0);
    expect(countLandComponents(detailed)).toBe(1);
    expect(getBorderValues(detailed).every((value) => value <= 0)).toBe(true);
  });

  test(
    "préserve les invariants topologiques pour les seeds 1 à 250",
    () => {
      for (let seed = 1; seed <= 250; seed += 1) {
        const detailed = generateIslandCoastDetail({
          seed,
          shape: createShape(seed),
        });

        expect(detailed.values.every(Number.isFinite), `seed ${seed}`).toBe(
          true,
        );
        expect(countLandComponents(detailed), `seed ${seed}`).toBe(1);
        expect(countClosedWaterPockets(detailed), `seed ${seed}`).toBe(0);
        expect(
          getBorderValues(detailed).every((value) => value <= 0),
          `seed ${seed}`,
        ).toBe(true);
      }
    },
    10_000,
  );
});

function createUncorrectedDetailedShape(
  seed: number,
  shape: IslandShape,
): IslandShape {
  const controlGrid = createCoastDetailControlGrid(
    shape.rowCount,
    shape.columnCount,
    COAST_DETAIL_CONTROL_SPACING,
    (seed ^ 0x9e37_79b9) >>> 0,
  );
  const values = shape.values.map((baseSignal, index) => {
    const row = Math.floor(index / shape.columnCount);
    const column = index % shape.columnCount;
    return (
      baseSignal +
      sampleSmoothedCoastDetail(controlGrid, row, column) *
        COAST_DETAIL_AMPLITUDE *
        calculateCoastWeight(baseSignal)
    );
  });
  return { ...shape, values };
}

function createShape(seed: number): IslandShape {
  return generateIslandShape({
    seed,
    rowCount: GRID_SIZE,
    columnCount: GRID_SIZE,
  });
}

function countLandComponents(shape: IslandShape): number {
  return countComponents(shape, (value) => value > 0, false);
}

function countClosedWaterPockets(shape: IslandShape): number {
  return getClosedWaterPockets(shape).length;
}

function getClosedWaterPockets(shape: IslandShape): number[][] {
  const remaining = new Set<number>();
  shape.values.forEach((value, index) => {
    if (value <= 0) remaining.add(index);
  });
  const pockets: number[][] = [];

  while (remaining.size > 0) {
    const first = remaining.values().next().value;
    if (first === undefined) break;
    remaining.delete(first);
    const pending = [first];
    const component: number[] = [];
    let touchesBorder = false;
    while (pending.length > 0) {
      const index = pending.pop()!;
      component.push(index);
      const row = Math.floor(index / shape.columnCount);
      const column = index % shape.columnCount;
      touchesBorder ||=
        row === 0 ||
        row === shape.rowCount - 1 ||
        column === 0 ||
        column === shape.columnCount - 1;
      for (const neighbor of getCardinalNeighbors(shape, row, column)) {
        if (remaining.delete(neighbor)) pending.push(neighbor);
      }
    }
    if (!touchesBorder) pockets.push(component);
  }
  return pockets;
}

function countComponents(
  shape: IslandShape,
  includes: (value: number) => boolean,
  excludeBorderComponents: boolean,
): number {
  const remaining = new Set<number>();
  shape.values.forEach((value, index) => {
    if (includes(value)) remaining.add(index);
  });
  let count = 0;

  while (remaining.size > 0) {
    const first = remaining.values().next().value;
    if (first === undefined) break;
    remaining.delete(first);
    const pending = [first];
    let touchesBorder = false;

    while (pending.length > 0) {
      const index = pending.pop()!;
      const row = Math.floor(index / shape.columnCount);
      const column = index % shape.columnCount;
      if (
        row === 0 ||
        row === shape.rowCount - 1 ||
        column === 0 ||
        column === shape.columnCount - 1
      ) {
        touchesBorder = true;
      }
      for (const neighbor of getCardinalNeighbors(shape, row, column)) {
        if (!remaining.delete(neighbor)) continue;
        pending.push(neighbor);
      }
    }

    if (!excludeBorderComponents || !touchesBorder) count += 1;
  }

  return count;
}

function getCardinalNeighbors(
  shape: IslandShape,
  row: number,
  column: number,
): number[] {
  const neighbors: number[] = [];
  if (row > 0) neighbors.push((row - 1) * shape.columnCount + column);
  if (row + 1 < shape.rowCount) {
    neighbors.push((row + 1) * shape.columnCount + column);
  }
  if (column > 0) neighbors.push(row * shape.columnCount + column - 1);
  if (column + 1 < shape.columnCount) {
    neighbors.push(row * shape.columnCount + column + 1);
  }
  return neighbors;
}

function getBorderValues(shape: IslandShape): number[] {
  const values: number[] = [];
  for (let column = 0; column < shape.columnCount; column += 1) {
    values.push(shape.values[column]);
    values.push(
      shape.values[(shape.rowCount - 1) * shape.columnCount + column],
    );
  }
  for (let row = 0; row < shape.rowCount; row += 1) {
    values.push(shape.values[row * shape.columnCount]);
    values.push(shape.values[row * shape.columnCount + shape.columnCount - 1]);
  }
  return values;
}
