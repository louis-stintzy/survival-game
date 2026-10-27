import { describe, expect, test } from "vitest";
import { createSeededTerracedTerrainData } from "../terrain/terraced/createSeededTerracedTerrainData";
import { sampleTerracedTerrain } from "../terrain/terraced/sampleTerracedTerrain";
import {
  isRockPlacementTerrainValid,
  MIN_HARVESTABLE_ROCKS,
  resolveRockPlacements,
} from "./createIslandResources";
import { ROCK_PLACEMENTS, TREE_PLACEMENTS } from "./islandLayout";

describe("placements temporaires des ressources", () => {
  test.each([1, 42, 98, 12345, 54321, 99999])(
    "conserve assez d'arbres et de rochers pour la seed %i",
    (seed) => {
      const terrain = createSeededTerracedTerrainData(seed);
      const sample = (x: number, z: number) =>
        sampleTerracedTerrain(terrain, x, z);
      const treeCount = TREE_PLACEMENTS.filter(
        ({ x, z }) => sample(x, z)?.surface === "grass",
      ).length;
      const validStaticRockPlacements = ROCK_PLACEMENTS.filter((placement) =>
        isRockPlacementTerrainValid(placement, sample),
      );
      const resolvedRockPlacements = resolveRockPlacements(terrain, sample);

      expect(treeCount).toBeGreaterThanOrEqual(6);
      expect(resolvedRockPlacements.length).toBeGreaterThanOrEqual(
        MIN_HARVESTABLE_ROCKS,
      );
      expect(
        resolvedRockPlacements.slice(0, validStaticRockPlacements.length),
      ).toEqual(validStaticRockPlacements);
      expect(resolveRockPlacements(terrain, sample)).toEqual(
        resolvedRockPlacements,
      );
      for (
        let index = validStaticRockPlacements.length;
        index < resolvedRockPlacements.length;
        index += 1
      ) {
        const fallback = resolvedRockPlacements[index];
        expect(
          resolvedRockPlacements
            .slice(0, index)
            .every(
              (other) =>
                Math.hypot(fallback.x - other.x, fallback.z - other.z) >= 2.5,
            ),
        ).toBe(true);
      }
      expect(
        resolvedRockPlacements.every((placement) =>
          isRockPlacementTerrainValid(placement, sample),
        ),
      ).toBe(true);
    },
  );
});
