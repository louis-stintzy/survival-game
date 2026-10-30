import { describe, expect, test } from "vitest";
import {
  createCoastalSeabedGeometry,
  DEEP_SEABED_DEPTH,
  getSeabedDepth,
  getSeabedHeight,
  SHORE_SEABED_DEPTH,
} from "./createCoastalSeabedGeometry";
import type {
  TerracedCell,
  TerracedTerrainData,
} from "./terracedTerrainTypes";

describe("createCoastalSeabedGeometry", () => {
  test("utilise un profil continu et monotone vers le large", () => {
    const depths = Array.from({ length: 9 }, (_, distance) =>
      getSeabedDepth(distance),
    );

    expect(depths[0]).toBeCloseTo(SHORE_SEABED_DEPTH);
    expect(depths[8]).toBeCloseTo(DEEP_SEABED_DEPTH);
    for (let index = 1; index < depths.length; index += 1) {
      expect(depths[index]).toBeGreaterThan(depths[index - 1]);
    }
    expect(getSeabedHeight(0.3, 0)).toBeLessThan(0.3);
    expect(getSeabedHeight(0.3, 0)).toBeCloseTo(0.2);
    expect(getSeabedHeight(0.3, 8)).toBeCloseTo(-0.8);
  });

  test("partage les sommets et ne crée aucune paroi verticale interne", () => {
    const geometry = createCoastalSeabedGeometry(createTerrain(["LWW"]));

    expect(geometry.positions).toHaveLength(6 * 3);
    expect(geometry.indices).toHaveLength(4 * 3);
    expect(new Set(getHorizontalVertexKeys(geometry.positions)).size).toBe(6);
  });

  test("prolonge le fond à profondeur clampée au-delà de la côte", () => {
    const geometry = createCoastalSeabedGeometry(createTerrain(["LWWWWWWWWW"]));
    const minimumY = Math.min(
      ...geometry.positions.filter((_, index) => index % 3 === 1),
    );

    expect(geometry.indices).toHaveLength(9 * 2 * 3);
    expect(minimumY).toBeCloseTo(-0.8);
  });

  test("produit des buffers déterministes, finis et valides", () => {
    const terrain = createTerrain(["LLL", "LWW", "LWW"]);
    const originalCells = terrain.cells.map((cell) => ({ ...cell }));
    const first = createCoastalSeabedGeometry(terrain);
    const second = createCoastalSeabedGeometry(terrain);
    const vertexCount = first.positions.length / 3;

    expect(first).toEqual(second);
    expect(terrain.cells).toEqual(originalCells);
    expect(first.colors).toHaveLength(vertexCount * 4);
    expect(first.normals).toHaveLength(vertexCount * 3);
    expect(
      [...first.positions, ...first.colors, ...first.normals].every(
        Number.isFinite,
      ),
    ).toBe(true);
    expect(first.colors.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(
      first.indices.every(
        (index) => Number.isInteger(index) && index >= 0 && index < vertexCount,
      ),
    ).toBe(true);
    for (let index = 0; index < first.normals.length; index += 3) {
      expect(
        Math.hypot(
          first.normals[index],
          first.normals[index + 1],
          first.normals[index + 2],
        ),
      ).toBeCloseTo(1);
      expect(first.normals[index + 1]).toBeGreaterThan(0);
    }
  });
});

function getHorizontalVertexKeys(positions: readonly number[]): string[] {
  const keys: string[] = [];
  for (let index = 0; index < positions.length; index += 3) {
    keys.push(`${positions[index]},${positions[index + 2]}`);
  }
  return keys;
}

function createTerrain(rows: readonly string[]): TerracedTerrainData {
  const cells: TerracedCell[] = [...rows.join("")].map((surface) =>
    surface === "W"
      ? { level: 0, surface: "water" }
      : { level: 1, surface: "sand" },
  );
  return {
    rowCount: rows.length,
    columnCount: rows[0]?.length ?? 0,
    cellSize: 1,
    heightStep: 0.4,
    waterHeight: 0.3,
    cells,
  };
}
