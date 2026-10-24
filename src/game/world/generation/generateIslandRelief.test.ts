import { describe, expect, test } from "vitest";
import { generateIslandRelief } from "./generateIslandRelief";
import { generateIslandShape } from "./generateIslandShape";

const ROW_COUNT = 101;
const COLUMN_COUNT = 101;
const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;

describe("generateIslandRelief", () => {
  test("est déterministe et utilise une séquence propre à la seed", () => {
    const shape = createShape(12345);

    expect(generateIslandRelief({ seed: 12345, shape })).toEqual(
      generateIslandRelief({ seed: 12345, shape }),
    );
    expect(generateIslandRelief({ seed: 1, shape }).levels).not.toEqual(
      generateIslandRelief({ seed: 42, shape }).levels,
    );
  });

  test.each(REPRESENTATIVE_SEEDS)(
    "produit des zones intérieures valides pour la seed %i",
    (seed) => {
      const shape = createShape(seed);
      const relief = generateIslandRelief({ seed, shape });

      expect(relief.rowCount).toBe(shape.rowCount);
      expect(relief.columnCount).toBe(shape.columnCount);
      expect(relief.levels).toHaveLength(shape.values.length);
      expect(relief.areaCount).toBeGreaterThanOrEqual(2);
      expect(relief.areaCount).toBeLessThanOrEqual(4);
      expect(relief.areas).toHaveLength(relief.areaCount);
      expect(relief.areas.some(({ targetLevel }) => targetLevel === 4)).toBe(
        true,
      );
      expect(relief.levels.every((level) => [0, 3, 4].includes(level))).toBe(
        true,
      );

      for (const area of relief.areas) {
        const centerIndex =
          area.centerRow * shape.columnCount + area.centerColumn;
        expect(shape.values[centerIndex]).toBeGreaterThanOrEqual(0.4);
      }
    },
  );
});

function createShape(seed: number) {
  return generateIslandShape({
    seed,
    rowCount: ROW_COUNT,
    columnCount: COLUMN_COUNT,
  });
}
