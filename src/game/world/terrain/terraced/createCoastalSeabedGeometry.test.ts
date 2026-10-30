import { describe, expect, test } from "vitest";
import {
  createCoastalSeabedGeometry,
  getSeabedHeight,
} from "./createCoastalSeabedGeometry";
import type {
  TerracedCell,
  TerracedTerrainData,
} from "./terracedTerrainTypes";

describe("createCoastalSeabedGeometry", () => {
  test("produit quatre niveaux de fond marin puis aucune géométrie", () => {
    const geometry = createCoastalSeabedGeometry(createTerrain(["LWWWWW"]));
    const topHeights = [0, 1, 2, 3].map(
      (quad) => geometry.positions[quad * 4 * 3 + 1],
    );

    expect(geometry.topQuadCount).toBe(4);
    expect(topHeights[0]).toBeCloseTo(0.15);
    expect(topHeights[1]).toBeCloseTo(-0.05);
    expect(topHeights[2]).toBeCloseTo(-0.25);
    expect(topHeights[3]).toBeCloseTo(-0.45);
    expect(getSeabedHeight(0.3, 1)).toBeCloseTo(0.15);
    expect(getSeabedHeight(0.3, 4)).toBeCloseTo(-0.45);
  });

  test("ajoute une face verticale uniquement entre hauteurs différentes", () => {
    const stepped = createCoastalSeabedGeometry(createTerrain(["LWW"]));
    const flat = createCoastalSeabedGeometry(createTerrain(["LL", "WW"]));
    const steppedQuadCount = stepped.positions.length / 3 / 4;
    const flatQuadCount = flat.positions.length / 3 / 4;

    expect(stepped.topQuadCount).toBe(2);
    expect(steppedQuadCount - stepped.topQuadCount).toBe(1);
    expect(flat.topQuadCount).toBe(2);
    expect(flatQuadCount - flat.topQuadCount).toBe(0);
  });

  test("produit des buffers déterministes, finis et valides", () => {
    const terrain = createTerrain(["LLL", "LWW", "LWW"]);
    const originalCells = terrain.cells.map((cell) => ({ ...cell }));
    const first = createCoastalSeabedGeometry(terrain);
    const second = createCoastalSeabedGeometry(terrain);
    const vertexCount = first.positions.length / 3;

    expect(first).toEqual(second);
    expect(terrain.cells).toEqual(originalCells);
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
  });
});

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
