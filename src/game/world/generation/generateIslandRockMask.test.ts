import { describe, expect, test } from "vitest";
import { generateIslandShape } from "./generateIslandShape";
import {
  generateIslandRockMask,
  ROCK_MIN_SHAPE_SIGNAL,
} from "./generateIslandRockMask";

const GRID_SIZE = 101;
const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;

describe("generateIslandRockMask", () => {
  test("est déterministe pour une seed et une silhouette identiques", () => {
    const shape = createShape(12345);
    expect(generateIslandRockMask({ seed: 12345, shape })).toEqual(
      generateIslandRockMask({ seed: 12345, shape }),
    );
  });

  test("utilise une séquence propre à la seed", () => {
    const shape = createShape(12345);
    expect(generateIslandRockMask({ seed: 1, shape }).values).not.toEqual(
      generateIslandRockMask({ seed: 42, shape }).values,
    );
  });

  test.each(REPRESENTATIVE_SEEDS)(
    "produit un masque rocheux valide pour la seed %i",
    (seed) => {
      const shape = createShape(seed);
      const mask = generateIslandRockMask({ seed, shape });

      expect(mask.rowCount).toBe(shape.rowCount);
      expect(mask.columnCount).toBe(shape.columnCount);
      expect(mask.values).toHaveLength(shape.values.length);
      expect(mask.areaCount).toBeGreaterThanOrEqual(1);
      expect(mask.areaCount).toBeLessThanOrEqual(3);
      expect(mask.areas).toHaveLength(mask.areaCount);
      expect(mask.values).toContain(true);
      expect(mask.values).toContain(false);

      for (const area of mask.areas) {
        const centerIndex =
          area.centerRow * shape.columnCount + area.centerColumn;
        expect(shape.values[centerIndex]).toBeGreaterThanOrEqual(0.35);
        expect(Number.isFinite(area.radiusX)).toBe(true);
        expect(area.radiusX).toBeGreaterThanOrEqual(4);
        expect(area.radiusX).toBeLessThanOrEqual(9);
        expect(Number.isFinite(area.radiusZ)).toBe(true);
        expect(area.radiusZ).toBeGreaterThanOrEqual(4);
        expect(area.radiusZ).toBeLessThanOrEqual(9);
        expect(Number.isFinite(area.rotation)).toBe(true);
        expect(area.rotation).toBeGreaterThanOrEqual(0);
        expect(area.rotation).toBeLessThan(Math.PI * 2);
      }

      mask.values.forEach((isRock, index) => {
        if (isRock) {
          expect(shape.values[index]).toBeGreaterThan(
            ROCK_MIN_SHAPE_SIGNAL,
          );
        }
      });
    },
  );
});

function createShape(seed: number) {
  return generateIslandShape({
    seed,
    rowCount: GRID_SIZE,
    columnCount: GRID_SIZE,
  });
}
