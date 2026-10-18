import { describe, expect, test } from "vitest";
import { createBaseTerracedTerrainData } from "../terrain/terraced/createBaseTerracedTerrainData";
import { sampleTerracedTerrain } from "../terrain/terraced/sampleTerracedTerrain";
import { ROCK_PLACEMENTS, TREE_PLACEMENTS } from "./islandLayout";

describe("placements temporaires des ressources", () => {
  test("conserve assez d'arbres et de rochers sur le terrain terrassé", () => {
    const terrain = createBaseTerracedTerrainData();
    const sample = (x: number, z: number) =>
      sampleTerracedTerrain(terrain, x, z);
    const treeCount = TREE_PLACEMENTS.filter(
      ({ x, z }) => sample(x, z)?.surface === "grass",
    ).length;
    const rockCount = ROCK_PLACEMENTS.filter(({ x, z }) => {
      const surface = sample(x, z)?.surface;
      return surface === "grass" || surface === "rock";
    }).length;

    expect(treeCount).toBeGreaterThanOrEqual(6);
    expect(rockCount).toBeGreaterThanOrEqual(3);
  });
});
