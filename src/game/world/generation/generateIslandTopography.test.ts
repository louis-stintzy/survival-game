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
      expect(topography.hillCount).toBeGreaterThanOrEqual(2);
      expect(topography.hillCount).toBeLessThanOrEqual(4);
      expect(topography.mountainCount).toBeGreaterThanOrEqual(0);
      expect(topography.mountainCount).toBeLessThanOrEqual(1);
      expect(topography.hills).toHaveLength(
        topography.hillCount + topography.mountainCount,
      );
      expect(topography.hills.length).toBeGreaterThanOrEqual(2);
      expect(topography.hills.length).toBeLessThanOrEqual(5);
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

      for (const hill of topography.hills.slice(0, topography.hillCount)) {
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

      const mountains = topography.hills.slice(topography.hillCount);
      expect(mountains).toHaveLength(topography.mountainCount);
      for (const mountain of mountains) {
        const centerIndex =
          mountain.centerRow * shape.columnCount + mountain.centerColumn;
        const hasDeepInterior = shape.values.some((signal) => signal >= 0.5);
        expect(shape.values[centerIndex]).toBeGreaterThanOrEqual(
          hasDeepInterior ? 0.5 : 0.4,
        );
        expect(Number.isFinite(mountain.radiusX)).toBe(true);
        expect(mountain.radiusX).toBeGreaterThanOrEqual(12);
        expect(mountain.radiusX).toBeLessThanOrEqual(20);
        expect(Number.isFinite(mountain.radiusZ)).toBe(true);
        expect(mountain.radiusZ).toBeGreaterThanOrEqual(12);
        expect(mountain.radiusZ).toBeLessThanOrEqual(20);
        expect(Number.isFinite(mountain.rotation)).toBe(true);
        expect(mountain.rotation).toBeGreaterThanOrEqual(0);
        expect(mountain.rotation).toBeLessThan(Math.PI * 2);
        expect(mountain.height).toBeGreaterThanOrEqual(3.2);
        expect(mountain.height).toBeLessThanOrEqual(4.8);
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
