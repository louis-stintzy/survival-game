import { describe, expect, test } from "vitest";
import { generateIslandShape } from "./generateIslandShape";
import {
  generateIslandTopography,
  ISLAND_TOPOGRAPHY_BASE_LAND_HEIGHT,
  ISLAND_TOPOGRAPHY_SEA_FLOOR_HEIGHT,
  smoothstep,
} from "./generateIslandTopography";

const GRID_SIZE = 101;
const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;

describe("smoothstep", () => {
  test("est borné avant et après ses seuils", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  test("retourne la valeur attendue au milieu", () => {
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
  });
});

describe("generateIslandTopography", () => {
  test("est déterministe pour une seed et une silhouette identiques", () => {
    const shape = createShape(12345);
    expect(generateIslandTopography({ seed: 12345, shape })).toEqual(
      generateIslandTopography({ seed: 12345, shape }),
    );
  });

  test("utilise une séquence propre à la seed", () => {
    const shape = createShape(12345);
    expect(generateIslandTopography({ seed: 1, shape }).heights).not.toEqual(
      generateIslandTopography({ seed: 42, shape }).heights,
    );
  });

  test.each(REPRESENTATIVE_SEEDS)(
    "produit une topographie continue valide pour la seed %i",
    (seed) => {
      const shape = createShape(seed);
      const topography = generateIslandTopography({ seed, shape });
      const landHeights = topography.heights.filter(
        (_, index) => shape.values[index] > 0,
      );
      const seaHeights = topography.heights.filter(
        (_, index) => shape.values[index] <= 0,
      );

      expect(topography.rowCount).toBe(shape.rowCount);
      expect(topography.columnCount).toBe(shape.columnCount);
      expect(topography.heights).toHaveLength(GRID_SIZE * GRID_SIZE);
      expect(topography.heights.every(Number.isFinite)).toBe(true);
      expect(topography.hillCount).toBeGreaterThanOrEqual(1);
      expect(topography.hillCount).toBeLessThanOrEqual(3);
      expect(topography.hills).toHaveLength(topography.hillCount);
      expect(landHeights.some((height) => height > 0)).toBe(true);
      expect(
        landHeights.some(
          (height) => height > ISLAND_TOPOGRAPHY_BASE_LAND_HEIGHT,
        ),
      ).toBe(true);
      expect(
        seaHeights.every(
          (height) => height === ISLAND_TOPOGRAPHY_SEA_FLOOR_HEIGHT,
        ),
      ).toBe(true);

      for (const hill of topography.hills) {
        const centerIndex =
          hill.centerRow * shape.columnCount + hill.centerColumn;
        expect(shape.values[centerIndex]).toBeGreaterThanOrEqual(0.4);
        expect(Number.isFinite(hill.radiusX)).toBe(true);
        expect(hill.radiusX).toBeGreaterThanOrEqual(6);
        expect(hill.radiusX).toBeLessThanOrEqual(14);
        expect(Number.isFinite(hill.radiusZ)).toBe(true);
        expect(hill.radiusZ).toBeGreaterThanOrEqual(6);
        expect(hill.radiusZ).toBeLessThanOrEqual(14);
        expect(Number.isFinite(hill.rotation)).toBe(true);
        expect(hill.rotation).toBeGreaterThanOrEqual(0);
        expect(hill.rotation).toBeLessThan(Math.PI * 2);
        expect(hill.height).toBeGreaterThanOrEqual(1.2);
        expect(hill.height).toBeLessThanOrEqual(3);
      }
    },
  );

  test("produit plusieurs proportions de collines non circulaires", () => {
    const ratios = REPRESENTATIVE_SEEDS.flatMap((seed) => {
      const shape = createShape(seed);
      return generateIslandTopography({ seed, shape }).hills.map(
        ({ radiusX, radiusZ }) => radiusX / radiusZ,
      );
    });

    expect(
      new Set(ratios.map((ratio) => ratio.toFixed(3))).size,
    ).toBeGreaterThan(1);
    expect(ratios.some((ratio) => Math.abs(ratio - 1) > 0.05)).toBe(true);
  });
});

function createShape(seed: number) {
  return generateIslandShape({
    seed,
    rowCount: GRID_SIZE,
    columnCount: GRID_SIZE,
  });
}
