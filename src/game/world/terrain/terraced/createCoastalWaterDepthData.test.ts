import { describe, expect, test } from "vitest";
import { createCoastalWaterDepthData } from "./createCoastalWaterDepthData";
import type {
  TerracedCell,
  TerracedTerrainData,
} from "./terracedTerrainTypes";

describe("createCoastalWaterDepthData", () => {
  test("propage la distance cardinale depuis une côte", () => {
    const terrain = createTerrain([
      "LLLL",
      "LWWW",
      "LWWW",
      "LWWW",
    ]);

    expect(createCoastalWaterDepthData(terrain).distances).toEqual([
      0, 0, 0, 0,
      0, 1, 1, 1,
      0, 1, 2, 2,
      0, 1, 2, 3,
    ]);
  });

  test("mesure l'eau autour d'une avancée terrestre", () => {
    const terrain = createTerrain([
      "WWWWW",
      "WWLWW",
      "WWWWW",
    ]);

    expect(createCoastalWaterDepthData(terrain).distances).toEqual([
      3, 2, 1, 2, 3,
      2, 1, 0, 1, 2,
      3, 2, 1, 2, 3,
    ]);
  });

  test("gère une côte située au bord de la grille", () => {
    const terrain = createTerrain(["LWWWWWWWWW"]);

    expect(createCoastalWaterDepthData(terrain).distances).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 0,
    ]);
  });

  test("ne calcule aucune distance côtière sans cellule terrestre", () => {
    const terrain = createTerrain(["WW", "WW"]);

    expect(createCoastalWaterDepthData(terrain).distances).toEqual([0, 0, 0, 0]);
  });

  test("est déterministe et ne modifie pas le terrain source", () => {
    const terrain = createTerrain(["LWW", "LWW"]);
    const originalCells = terrain.cells.map((cell) => ({ ...cell }));

    const first = createCoastalWaterDepthData(terrain);
    const second = createCoastalWaterDepthData(terrain);

    expect(first).toEqual(second);
    expect(terrain.cells).toEqual(originalCells);
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
