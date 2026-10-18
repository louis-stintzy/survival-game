import { describe, expect, test } from "vitest";
import { generateIslandShape, type IslandShape } from "./generateIslandShape";

const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;
const GRID_SIZE = 101;

describe("generateIslandShape", () => {
  test("est déterministe pour une seed et des dimensions identiques", () => {
    expect(createShape(12345)).toEqual(createShape(12345));
  });

  test("fait varier le signal avec la seed", () => {
    expect(createShape(1).values).not.toEqual(createShape(2).values);
  });

  test("produit un signal row-major complet, fini, terrestre et maritime", () => {
    const shape = createShape(12345);

    expect(shape.values).toHaveLength(GRID_SIZE * GRID_SIZE);
    expect(shape.values.every(Number.isFinite)).toBe(true);
    expect(shape.values.some((value) => value > 0)).toBe(true);
    expect(shape.values.some((value) => value < 0)).toBe(true);
    expect(shape.massCount).toBeGreaterThanOrEqual(2);
    expect(shape.massCount).toBeLessThanOrEqual(4);
  });

  test.each(REPRESENTATIVE_SEEDS)(
    "maintient une marge maritime pour la seed %i",
    (seed) => {
      const shape = createShape(seed);
      expect(getBorderValues(shape).every((value) => value <= 0)).toBe(true);
    },
  );

  test.each(REPRESENTATIVE_SEEDS)(
    "produit une unique composante terrestre pour la seed %i",
    (seed) => {
      const shape = createShape(seed);
      expect(countLandComponents(shape)).toBe(1);
    },
  );

  test("fait varier la surface et les dimensions de la silhouette", () => {
    const metrics = REPRESENTATIVE_SEEDS.map((seed) => getMetrics(createShape(seed)));

    expect(new Set(metrics.map(({ landCount }) => landCount)).size).toBeGreaterThan(1);
    expect(
      new Set(metrics.map(({ width, height }) => `${width}x${height}`)).size,
    ).toBeGreaterThan(1);
  });
});

function createShape(seed: number) {
  return generateIslandShape({
    seed,
    rowCount: GRID_SIZE,
    columnCount: GRID_SIZE,
  });
}

function getBorderValues(shape: IslandShape) {
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

function countLandComponents(shape: IslandShape) {
  const land = new Set<number>();
  shape.values.forEach((value, index) => {
    if (value > 0) land.add(index);
  });

  let componentCount = 0;
  while (land.size > 0) {
    componentCount += 1;
    const first = land.values().next().value;
    if (first === undefined) break;
    const pending = [first];
    land.delete(first);

    while (pending.length > 0) {
      const index = pending.pop()!;
      const row = Math.floor(index / shape.columnCount);
      const column = index % shape.columnCount;
      const neighbors = [
        [row - 1, column],
        [row + 1, column],
        [row, column - 1],
        [row, column + 1],
      ];
      for (const [neighborRow, neighborColumn] of neighbors) {
        if (
          neighborRow < 0 ||
          neighborRow >= shape.rowCount ||
          neighborColumn < 0 ||
          neighborColumn >= shape.columnCount
        ) {
          continue;
        }
        const neighborIndex =
          neighborRow * shape.columnCount + neighborColumn;
        if (!land.delete(neighborIndex)) continue;
        pending.push(neighborIndex);
      }
    }
  }
  return componentCount;
}

function getMetrics(shape: IslandShape) {
  let minimumRow = shape.rowCount;
  let maximumRow = -1;
  let minimumColumn = shape.columnCount;
  let maximumColumn = -1;
  let landCount = 0;

  shape.values.forEach((value, index) => {
    if (value <= 0) return;
    landCount += 1;
    const row = Math.floor(index / shape.columnCount);
    const column = index % shape.columnCount;
    minimumRow = Math.min(minimumRow, row);
    maximumRow = Math.max(maximumRow, row);
    minimumColumn = Math.min(minimumColumn, column);
    maximumColumn = Math.max(maximumColumn, column);
  });

  return {
    landCount,
    width: maximumColumn - minimumColumn + 1,
    height: maximumRow - minimumRow + 1,
  };
}
