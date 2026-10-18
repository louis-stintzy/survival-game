import { describe, expect, test } from "vitest";
import { createTerracedTerrainGeometry } from "./createTerracedTerrainGeometry";
import {
  BASE_TERRACED_COLUMN_COUNT,
  BASE_TERRACED_ROW_COUNT,
  createBaseTerracedTerrainData,
} from "./createBaseTerracedTerrainData";

describe("createBaseTerracedTerrainData", () => {
  test("crée une grille déterministe de 101 × 101 cellules", () => {
    const terrain = createBaseTerracedTerrainData();

    expect(terrain.rowCount).toBe(101);
    expect(terrain.columnCount).toBe(101);
    expect(terrain.rowCount * terrain.cellSize).toBeCloseTo(166.65);
    expect(terrain.columnCount * terrain.cellSize).toBeCloseTo(166.65);
    expect(terrain.cells).toHaveLength(
      BASE_TERRACED_ROW_COUNT * BASE_TERRACED_COLUMN_COUNT,
    );
    expect(createBaseTerracedTerrainData()).toEqual(terrain);
  });

  test("contient toutes les surfaces et plusieurs niveaux terrestres", () => {
    const { cells } = createBaseTerracedTerrainData();
    const surfaces = new Set(cells.map((cell) => cell.surface));
    const landLevels = new Set(
      cells
        .filter((cell) => cell.surface !== "water")
        .map((cell) => cell.level),
    );

    expect(surfaces).toEqual(new Set(["water", "sand", "grass", "rock"]));
    expect(landLevels.size).toBeGreaterThan(1);
    expect(cells).toContainEqual({ level: 4, surface: "grass" });
    expect(cells).toContainEqual({ level: 2, surface: "rock" });
  });

  test("ne produit que des niveaux entiers positifs ou nuls", () => {
    const { cells } = createBaseTerracedTerrainData();

    expect(
      cells.every(({ level }) => Number.isInteger(level) && level >= 0),
    ).toBe(true);
  });

  test("produit une géométrie terrassée non vide et finie", () => {
    const geometry = createTerracedTerrainGeometry(
      createBaseTerracedTerrainData(),
    );

    expect(geometry.positions.length).toBeGreaterThan(0);
    expect(geometry.indices.length).toBeGreaterThan(0);
    expect(
      [
        ...geometry.positions,
        ...geometry.indices,
        ...geometry.colors,
        ...geometry.normals,
      ].every(Number.isFinite),
    ).toBe(true);
  });
});
