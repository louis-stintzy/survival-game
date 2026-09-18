import { describe, expect, test } from "vitest";
import { createBaseTerrainData } from "./createBaseTerrainData";
import { createTerrainMeshData } from "./createTerrainMeshData";
import type { TerrainData } from "./terrainTypes";

describe("createTerrainMeshData", () => {
  test("reconstruit une mini-grille sans dupliquer ses sommets", () => {
    const terrain = createMiniTerrain();
    const meshData = createTerrainMeshData(terrain);

    expect(meshData.positions).toHaveLength(3 * 3 * 3);
    expect(meshData.positions.slice(0, 3)).toEqual([-1, 0, -1]);
    expect(meshData.positions.slice(12, 15)).toEqual([0, 4, 0]);
    expect(meshData.positions.slice(-3)).toEqual([1, 8, 1]);

    const xzPositions = new Set<string>();
    for (let index = 0; index < meshData.positions.length; index += 3) {
      xzPositions.add(
        `${meshData.positions[index]},${meshData.positions[index + 2]}`,
      );
    }
    expect(xzPositions.size).toBe(9);
  });

  test("utilise strictement A-B-D puis A-D-C dans chaque cellule", () => {
    const meshData = createTerrainMeshData(createMiniTerrain());

    expect(meshData.indices).toHaveLength(2 * 2 * 2 * 3);
    expect(meshData.indices.slice(0, 6)).toEqual([0, 1, 4, 0, 4, 3]);
  });

  test("produit une couleur RGBA par sommet et uniquement des nombres finis", () => {
    const meshData = createTerrainMeshData(createMiniTerrain());

    expect(meshData.colors).toHaveLength(3 * 3 * 4);
    expect(
      [...meshData.positions, ...meshData.indices, ...meshData.colors].every(
        Number.isFinite,
      ),
    ).toBe(true);
  });

  test("produit 6561 sommets et 12800 triangles pour le terrain de base", () => {
    const meshData = createTerrainMeshData(createBaseTerrainData());

    expect(meshData.positions).toHaveLength(6_561 * 3);
    expect(meshData.indices).toHaveLength(12_800 * 3);
    expect(meshData.colors).toHaveLength(6_561 * 4);
  });
});

function createMiniTerrain(): TerrainData {
  return {
    halfSize: 1,
    gridStep: 1,
    gridSize: 3,
    waterHeight: -0.25,
    heights: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  };
}
