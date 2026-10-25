import { describe, expect, test } from "vitest";
import type {
  TerracedCell,
  TerracedTerrainData,
} from "./terracedTerrainTypes";
import {
  findTerracedLandTrapIndices,
  repairTerracedLandTraps,
} from "./repairTerracedLandTraps";

describe("repairTerracedLandTraps", () => {
  test("relève localement une cellule basse enfermée par des niveaux +2", () => {
    const terrain = createTerrain([
      [1, 4, 4],
      [4, 2, 4],
      [4, 4, 4],
    ]);

    expect(findTerracedLandTrapIndices(terrain)).toEqual([4]);

    const result = repairTerracedLandTraps(terrain);
    expect(result.adjustedCellCount).toBe(1);
    expect(result.terrainData.cells[4]).toEqual({
      level: 3,
      surface: "grass",
    });
    expect(findTerracedLandTrapIndices(result.terrainData)).toEqual([]);
  });

  test("crée plusieurs marches sans modifier les surfaces", () => {
    const terrain = createTerrain([[1, 5, 2, 2]]);
    const result = repairTerracedLandTraps(terrain);

    expect(result.terrainData.cells.map(({ level }) => level)).toEqual([
      1, 5, 4, 3,
    ]);
    expect(result.terrainData.cells.map(({ surface }) => surface)).toEqual(
      terrain.cells.map(({ surface }) => surface),
    );
    expect(findTerracedLandTrapIndices(result.terrainData)).toEqual([]);
  });

  test("est déterministe et laisse intact un terrain sans piège", () => {
    const terrain = createTerrain([[1, 2, 3, 4]]);
    const first = repairTerracedLandTraps(terrain);
    const second = repairTerracedLandTraps(terrain);

    expect(first).toEqual(second);
    expect(first.adjustedCellCount).toBe(0);
    expect(first.terrainData.cells).toEqual(terrain.cells);
  });
});

function createTerrain(levelRows: readonly (readonly number[])[]): TerracedTerrainData {
  const cells: TerracedCell[] = levelRows.flatMap((levels, row) =>
    levels.map((level, column) => ({
      level,
      surface: row === 0 && column === 0 ? "sand" : "grass",
    })),
  );
  return {
    rowCount: levelRows.length,
    columnCount: levelRows[0].length,
    cellSize: 1,
    heightStep: 0.4,
    waterHeight: 0.3,
    cells,
  };
}
