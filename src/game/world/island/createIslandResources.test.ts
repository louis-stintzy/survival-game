import { describe, expect, test } from "vitest";
import { createSeededTerracedTerrainData } from "../terrain/terraced/createSeededTerracedTerrainData";
import { sampleTerracedTerrain } from "../terrain/terraced/sampleTerracedTerrain";
import { isRockPlacementTerrainValid } from "./createIslandResources";
import { ROCK_PLACEMENTS, TREE_PLACEMENTS } from "./islandLayout";

describe("placements temporaires des ressources", () => {
  test.each([1, 42, 12345, 54321, 99999])(
    "conserve assez d'arbres et de rochers pour la seed %i",
    (seed) => {
      const terrain = createSeededTerracedTerrainData(seed);
      const sample = (x: number, z: number) =>
        sampleTerracedTerrain(terrain, x, z);
      const treeCount = TREE_PLACEMENTS.filter(
        ({ x, z }) => sample(x, z)?.surface === "grass",
      ).length;
      const validRockPlacements = ROCK_PLACEMENTS.filter((placement) =>
        isRockPlacementTerrainValid(placement, sample),
      );

      expect(treeCount).toBeGreaterThanOrEqual(6);
      expect(validRockPlacements.length).toBeGreaterThanOrEqual(3);
      expect(
        validRockPlacements.every((placement) =>
          isRockPlacementTerrainValid(placement, sample),
        ),
      ).toBe(true);
    },
  );
});
