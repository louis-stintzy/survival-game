import { describe, expect, test } from "vitest";
import { sampleTerracedTerrain } from "./sampleTerracedTerrain";
import type { TerracedTerrainData } from "./terracedTerrainTypes";

const TERRAIN: TerracedTerrainData = {
  rowCount: 2,
  columnCount: 2,
  cellSize: 1,
  heightStep: 0.5,
  waterHeight: 0.3,
  cells: [
    { level: 0, surface: "water" },
    { level: 4, surface: "grass" },
    { level: 2, surface: "rock" },
    { level: 1, surface: "sand" },
  ],
};

describe("sampleTerracedTerrain", () => {
  test("utilise l'index row-major au centre d'une cellule", () => {
    const sample = sampleAt(-0.5, 0.5);

    expect(sample).toEqual({
      row: 1,
      column: 0,
      level: 2,
      height: 1,
      surface: "rock",
      isLand: true,
    });
  });

  test("conserve une surface indépendante du niveau", () => {
    const sample = sampleAt(0.5, -0.5);

    expect(sample?.level).toBe(4);
    expect(sample?.surface).toBe("grass");
    expect(sample?.height).toBe(2);
  });

  test("identifie une cellule d'eau comme non terrestre", () => {
    const sample = sampleAt(-0.5, -0.5);

    expect(sample?.surface).toBe("water");
    expect(sample?.isLand).toBe(false);
  });

  test("retourne undefined hors de la grille", () => {
    expect(sampleAt(-1.01, 0)).toBeUndefined();
    expect(sampleAt(1.01, 0)).toBeUndefined();
    expect(sampleAt(0, -1.01)).toBeUndefined();
    expect(sampleAt(0, 1.01)).toBeUndefined();
  });
});

function sampleAt(x: number, z: number) {
  return sampleTerracedTerrain(TERRAIN, x, z);
}
