import { describe, expect, test } from "vitest";
import { createTerracedTerrainGeometry } from "./createTerracedTerrainGeometry";
import { createSeededTerracedTerrainData } from "./createSeededTerracedTerrainData";

const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;

describe("createSeededTerracedTerrainData", () => {
  test("est déterministe pour une même seed", () => {
    expect(createSeededTerracedTerrainData(12345).cells).toEqual(
      createSeededTerracedTerrainData(12345).cells,
    );
  });

  test("produit des cellules différentes avec des seeds différentes", () => {
    expect(createSeededTerracedTerrainData(1).cells).not.toEqual(
      createSeededTerracedTerrainData(42).cells,
    );
  });

  test.each(REPRESENTATIVE_SEEDS)(
    "produit des cellules valides pour la seed %i",
    (seed) => {
      const terrain = createSeededTerracedTerrainData(seed);
      const surfaces = new Set(terrain.cells.map((cell) => cell.surface));
      const landLevels = new Set(
        terrain.cells
          .filter((cell) => cell.surface !== "water")
          .map((cell) => cell.level),
      );

      expect(terrain.rowCount).toBe(101);
      expect(terrain.columnCount).toBe(101);
      expect(terrain.cells).toHaveLength(101 * 101);
      expect(surfaces).toContain("water");
      expect(surfaces).toContain("sand");
      expect(surfaces).toContain("grass");
      expect(landLevels).toEqual(new Set([1, 2, 3, 4]));
      expect(
        terrain.cells.every(
          ({ level }) => Number.isInteger(level) && level >= 0,
        ),
      ).toBe(true);
      expect(
        terrain.cells
          .filter((cell) => cell.surface === "water")
          .every((cell) => cell.level === 0),
      ).toBe(true);
      expect(
        terrain.cells
          .filter((cell) => cell.surface === "sand")
          .every((cell) => cell.level > 0),
      ).toBe(true);
    },
  );

  test.each(REPRESENTATIVE_SEEDS)(
    "produit des buffers géométriques valides pour la seed %i",
    (seed) => {
      const geometry = createTerracedTerrainGeometry(
        createSeededTerracedTerrainData(seed),
      );
      const vertexCount = geometry.positions.length / 3;

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
      expect(
        geometry.indices.every(
          (index) => index >= 0 && index < vertexCount,
        ),
      ).toBe(true);
    },
  );
});
