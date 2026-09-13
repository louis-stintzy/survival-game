import { describe, expect, test } from "vitest";
import {
  ROCK_PLACEMENTS,
  TREE_PLACEMENTS,
} from "../island/islandLayout";
import {
  BEACH_MAX_HEIGHT,
  ROCK_MIN_HEIGHT,
  ROCK_MIN_SLOPE,
  TERRAIN_MAX_HEIGHT,
  TERRAIN_MIN_HEIGHT,
  classifyTerrain,
  generateIslandTerrain,
  isRaftFootprintAtSea,
  sampleIslandTerrain,
} from "./generateIslandTerrain";

describe("generateIslandTerrain", () => {
  test("génère exactement le même terrain avec la même seed", () => {
    const first = generateIslandTerrain(12345);
    const second = generateIslandTerrain(12345);

    expect(first.vertices).toEqual(second.vertices);
    expect(first.triangles).toEqual(second.triangles);
    expect(first.playerSpawn).toEqual(second.playerSpawn);
    expect(first.raftSpawn).toEqual(second.raftSpawn);
  });

  test("génère un terrain différent avec une autre seed", () => {
    expect(generateIslandTerrain(12345).vertices).not.toEqual(
      generateIslandTerrain(54321).vertices,
    );
  });

  test("maintient toutes les hauteurs dans les bornes prévues", () => {
    const terrain = generateIslandTerrain(12345);

    terrain.vertices.forEach((vertex) => {
      expect(vertex.height).toBeGreaterThanOrEqual(TERRAIN_MIN_HEIGHT);
      expect(vertex.height).toBeLessThanOrEqual(TERRAIN_MAX_HEIGHT);
    });
  });

  test("produit des hauteurs proches aux sommets voisins", () => {
    const terrain = generateIslandTerrain(12345);
    let maximumDifference = 0;

    for (let z = 0; z < terrain.gridSize; z += 1) {
      for (let x = 0; x < terrain.gridSize; x += 1) {
        const index = z * terrain.gridSize + x;
        if (x + 1 < terrain.gridSize) {
          maximumDifference = Math.max(
            maximumDifference,
            Math.abs(
              terrain.vertices[index].height -
                terrain.vertices[index + 1].height,
            ),
          );
        }
        if (z + 1 < terrain.gridSize) {
          maximumDifference = Math.max(
            maximumDifference,
            Math.abs(
              terrain.vertices[index].height -
                terrain.vertices[index + terrain.gridSize].height,
            ),
          );
        }
      }
    }

    expect(maximumDifference).toBeLessThan(0.65);
  });

  test("classe plage, herbe et roche selon les seuils", () => {
    expect(classifyTerrain(BEACH_MAX_HEIGHT, 0)).toBe("beach");
    expect(classifyTerrain(BEACH_MAX_HEIGHT + 0.1, 0)).toBe("grass");
    expect(classifyTerrain(ROCK_MIN_HEIGHT, 0)).toBe("rock");
    expect(classifyTerrain(BEACH_MAX_HEIGHT + 0.1, ROCK_MIN_SLOPE)).toBe(
      "rock",
    );

    const categories = new Set(
      generateIslandTerrain(12345).triangles.map(
        (triangle) => triangle.category,
      ),
    );
    expect(categories).toEqual(new Set(["beach", "grass", "rock"]));
  });

  test("détermine des spawns plage et radeau valides pour la seed 12345", () => {
    const terrain = generateIslandTerrain(12345);
    const playerGround = sampleIslandTerrain(
      terrain,
      terrain.playerSpawn.x,
      terrain.playerSpawn.z,
    );

    expect(playerGround?.category).toBe("beach");
    expect(playerGround?.height).toBeCloseTo(
      terrain.playerSpawn.groundHeight,
    );
    expect(isRaftFootprintAtSea(terrain, terrain.raftSpawn)).toBe(true);

    const distance = Math.hypot(
      terrain.raftSpawn.x - terrain.playerSpawn.x,
      terrain.raftSpawn.z - terrain.playerSpawn.z,
    );
    expect(distance).toBeLessThanOrEqual(2.75);
  });

  test("conserve assez de ressources fixes sur la seed de développement", () => {
    const terrain = generateIslandTerrain(12345);
    const treeCount = TREE_PLACEMENTS.filter(
      ({ x, z }) => sampleIslandTerrain(terrain, x, z)?.category === "grass",
    ).length;
    const rockCount = ROCK_PLACEMENTS.filter(({ x, z }) => {
      const sample = sampleIslandTerrain(terrain, x, z);
      return sample && sample.category !== "beach";
    }).length;

    expect(treeCount).toBeGreaterThanOrEqual(20);
    expect(rockCount).toBeGreaterThanOrEqual(5);
  });
});
