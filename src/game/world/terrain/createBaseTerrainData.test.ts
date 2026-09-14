import { describe, expect, test } from "vitest";
import {
  TERRAIN_GRID_STEP,
  TERRAIN_HALF_SIZE,
  WATER_HEIGHT,
} from "./terrainDefinitions";
import { createBaseTerrainData } from "./createBaseTerrainData";

describe("createBaseTerrainData", () => {
  test("crée la grille régulière attendue", () => {
    const terrain = createBaseTerrainData();

    expect(terrain.halfSize).toBe(TERRAIN_HALF_SIZE);
    expect(terrain.gridStep).toBe(TERRAIN_GRID_STEP);
    expect(terrain.gridSize).toBe(81);
    expect(terrain.heights).toHaveLength(81 * 81);
    expect(terrain.heights.every(Number.isFinite)).toBe(true);
  });

  test("reste entièrement déterministe", () => {
    expect(createBaseTerrainData()).toEqual(createBaseTerrainData());
  });

  test("contient un fond marin et une partie émergée", () => {
    const { heights } = createBaseTerrainData();

    expect(heights.some((height) => height <= WATER_HEIGHT)).toBe(true);
    expect(heights.some((height) => height > WATER_HEIGHT)).toBe(true);
  });

  test("évolue continûment entre sommets voisins", () => {
    const terrain = createBaseTerrainData();
    let maximumDifference = 0;

    for (let z = 0; z < terrain.gridSize; z += 1) {
      for (let x = 0; x < terrain.gridSize; x += 1) {
        const index = z * terrain.gridSize + x;
        if (x + 1 < terrain.gridSize) {
          maximumDifference = Math.max(
            maximumDifference,
            Math.abs(terrain.heights[index] - terrain.heights[index + 1]),
          );
        }
        if (z + 1 < terrain.gridSize) {
          maximumDifference = Math.max(
            maximumDifference,
            Math.abs(
              terrain.heights[index] -
                terrain.heights[index + terrain.gridSize],
            ),
          );
        }
      }
    }

    expect(maximumDifference).toBeLessThan(0.25);
  });
});
