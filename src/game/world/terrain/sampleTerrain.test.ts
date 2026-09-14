import { describe, expect, test } from "vitest";
import type { TerrainData } from "./terrainTypes";
import { sampleTerrain } from "./sampleTerrain";

describe("sampleTerrain", () => {
  test("retourne undefined hors de la grille", () => {
    const terrain = createTerrain([0, 0, 0, 0]);

    expect(sampleTerrain(terrain, -0.51, 0)).toBeUndefined();
    expect(sampleTerrain(terrain, 0.51, 0)).toBeUndefined();
    expect(sampleTerrain(terrain, 0, -0.51)).toBeUndefined();
    expect(sampleTerrain(terrain, 0, 0.51)).toBeUndefined();
  });

  test("échantillonne exactement un sommet", () => {
    const terrain = createTerrain([0, 2, 4, 5]);

    expect(sampleTerrain(terrain, -0.5, -0.5)?.height).toBe(0);
    expect(sampleTerrain(terrain, 0.5, 0.5)?.height).toBe(5);
  });

  test("interpole le triangle A-B-D", () => {
    const sample = sampleTerrain(
      createTerrain([0, 2, 4, 5]),
      0.25,
      -0.25,
    );

    expect(sample?.height).toBeCloseTo(2.25);
    expect(sample?.slope).toBeCloseTo(Math.sqrt(13));
  });

  test("interpole le triangle A-D-C", () => {
    const sample = sampleTerrain(
      createTerrain([0, 2, 4, 5]),
      -0.25,
      0.25,
    );

    expect(sample?.height).toBeCloseTo(3.25);
    expect(sample?.slope).toBeCloseTo(Math.sqrt(17));
    expect(Number.isNaN(sample?.slope)).toBe(false);
  });

  test.each([
    { height: -0.25, surface: "water", isLand: false },
    { height: 0, surface: "beach", isLand: true },
    { height: 0.75, surface: "grass", isLand: true },
    { height: 1.5, surface: "rock", isLand: true },
  ] as const)(
    "classe $surface et maintient isLand=$isLand",
    ({ height, surface, isLand }) => {
      const sample = sampleTerrain(
        createTerrain([height, height, height, height]),
        0,
        0,
      );

      expect(sample?.surface).toBe(surface);
      expect(sample?.isLand).toBe(isLand);
      expect(sample?.slope).toBe(0);
    },
  );

  test("classe en roche une pente importante", () => {
    const sample = sampleTerrain(createTerrain([0.5, 1, 0.5, 1]), 0, 0);

    expect(sample?.surface).toBe("rock");
    expect(sample?.isLand).toBe(true);
    expect(sample?.slope).toBeCloseTo(0.5);
  });
});

function createTerrain(heights: readonly number[]): TerrainData {
  return {
    halfSize: 0.5,
    gridStep: 1,
    gridSize: 2,
    waterHeight: -0.25,
    heights,
  };
}
