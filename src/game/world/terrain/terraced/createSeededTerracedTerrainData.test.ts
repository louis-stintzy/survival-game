import { describe, expect, test } from "vitest";
import { createTerracedTerrainGeometry } from "./createTerracedTerrainGeometry";
import {
  createTerracedCellFromTopography,
  createSeededTerracedTerrainData,
  quantizeTopographyHeight,
  SEEDED_COASTAL_GRASS_MAX_SIGNAL,
  SEEDED_SAND_MAX_SIGNAL,
} from "./createSeededTerracedTerrainData";
import { findTerracedLandTrapIndices } from "./repairTerracedLandTraps";

const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;

describe("quantizeTopographyHeight", () => {
  test.each([
    [0.8, 2],
    [1.2, 3],
    [1.6, 4],
    [2, 5],
    [3.2, 8],
  ])("quantifie la hauteur %f au level %i", (height, expectedLevel) => {
    expect(quantizeTopographyHeight(height, 0.4)).toBe(expectedLevel);
  });

  test("utilise l'arrondi au niveau le plus proche", () => {
    expect(quantizeTopographyHeight(1.44, 0.4)).toBe(4);
  });

  test("ne descend jamais une cellule grass sous le level 2", () => {
    expect(quantizeTopographyHeight(0.2, 0.4)).toBe(2);
  });
});

describe("createTerracedCellFromTopography", () => {
  test("conserve les règles explicites de surface et de niveau", () => {
    expect(createTerracedCellFromTopography(0, 4)).toEqual({
      level: 0,
      surface: "water",
    });
    expect(
      createTerracedCellFromTopography(SEEDED_SAND_MAX_SIGNAL, 4),
    ).toEqual({ level: 1, surface: "sand" });
    expect(
      createTerracedCellFromTopography(
        (SEEDED_SAND_MAX_SIGNAL + SEEDED_COASTAL_GRASS_MAX_SIGNAL) / 2,
        4,
        true,
      ),
    ).toEqual({ level: 2, surface: "grass" });
    expect(
      createTerracedCellFromTopography(
        SEEDED_COASTAL_GRASS_MAX_SIGNAL + 0.01,
        1.6,
      ),
    ).toEqual({ level: 4, surface: "grass" });
    expect(
      createTerracedCellFromTopography(
        SEEDED_COASTAL_GRASS_MAX_SIGNAL + 0.01,
        1.6,
        true,
      ),
    ).toEqual({ level: 4, surface: "rock" });
  });

  test("conserve le même level pour grass et rock", () => {
    const grass = createTerracedCellFromTopography(0.5, 2.4, false);
    const rock = createTerracedCellFromTopography(0.5, 2.4, true);
    expect(rock.level).toBe(grass.level);
  });
});

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
      const grassLevels = new Set(
        terrain.cells
          .filter((cell) => cell.surface === "grass")
          .map((cell) => cell.level),
      );

      expect(terrain.rowCount).toBe(101);
      expect(terrain.columnCount).toBe(101);
      expect(terrain.cells).toHaveLength(101 * 101);
      expect(surfaces).toContain("water");
      expect(surfaces).toContain("sand");
      expect(surfaces).toContain("grass");
      expect(surfaces).toContain("rock");
      expect(grassLevels.size).toBeGreaterThan(1);
      expect(grassLevels).toContain(2);
      expect(Math.max(...grassLevels)).toBeGreaterThan(4);
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
          .every((cell) => cell.level === 1),
      ).toBe(true);
      expect(
        terrain.cells
          .filter(
            (cell) => cell.surface === "grass" || cell.surface === "rock",
          )
          .every((cell) => cell.level >= 2),
      ).toBe(true);

      const adjacencyCounts = countLandAdjacenciesByDelta(
        terrain.cells,
        terrain.rowCount,
        terrain.columnCount,
      );
      expect(
        adjacencyCounts.flat +
          adjacencyCounts.step +
          adjacencyCounts.cliff,
      ).toBeGreaterThan(0);

      const maximumLandLevel = Math.max(
        ...terrain.cells
          .filter((cell) => cell.surface !== "water")
          .map((cell) => cell.level),
      );
      const maximumReachableLevel = findMaximumReachableLevelFromCoast(
        terrain.cells,
        terrain.rowCount,
        terrain.columnCount,
      );
      expect(maximumReachableLevel).toBeGreaterThanOrEqual(2);
      expect(maximumReachableLevel).toBe(maximumLandLevel);
      expect(findTerracedLandTrapIndices(terrain)).toEqual([]);
      expect(
        countUnsafeSandToLandAdjacencies(
          terrain.cells,
          terrain.rowCount,
          terrain.columnCount,
        ),
      ).toBe(0);
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

function countLandAdjacenciesByDelta(
  cells: readonly { level: number; surface: string }[],
  rowCount: number,
  columnCount: number,
) {
  const counts = { flat: 0, step: 0, cliff: 0 };
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const index = row * columnCount + column;
      const cell = cells[index];
      if (cell.surface === "water") continue;

      for (const neighborIndex of [index + 1, index + columnCount]) {
        const crossesRightEdge =
          neighborIndex === index + 1 && column + 1 >= columnCount;
        if (crossesRightEdge || neighborIndex >= cells.length) continue;
        const neighbor = cells[neighborIndex];
        if (neighbor.surface === "water") continue;

        const delta = Math.abs(cell.level - neighbor.level);
        if (delta === 0) counts.flat += 1;
        else if (delta === 1) counts.step += 1;
        else counts.cliff += 1;
      }
    }
  }
  return counts;
}

function findMaximumReachableLevelFromCoast(
  cells: readonly { level: number; surface: string }[],
  rowCount: number,
  columnCount: number,
) {
  const visited = new Set<number>();
  const queue: number[] = [];
  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    if (cell.surface !== "grass" || cell.level !== 2) continue;
    if (
      getCardinalNeighbors(index, rowCount, columnCount).some(
        (neighborIndex) => cells[neighborIndex].surface === "sand",
      )
    ) {
      visited.add(index);
      queue.push(index);
    }
  }

  let maximumLevel = 0;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const cell = cells[index];
    maximumLevel = Math.max(maximumLevel, cell.level);

    for (const neighborIndex of getCardinalNeighbors(
      index,
      rowCount,
      columnCount,
    )) {
      const neighbor = cells[neighborIndex];
      if (
        !visited.has(neighborIndex) &&
        neighbor.surface !== "water" &&
        neighbor.level - cell.level < 2
      ) {
        visited.add(neighborIndex);
        queue.push(neighborIndex);
      }
    }
  }
  return maximumLevel;
}

function getCardinalNeighbors(
  index: number,
  rowCount: number,
  columnCount: number,
) {
  const row = Math.floor(index / columnCount);
  const column = index % columnCount;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(index - columnCount);
  if (row + 1 < rowCount) neighbors.push(index + columnCount);
  if (column > 0) neighbors.push(index - 1);
  if (column + 1 < columnCount) neighbors.push(index + 1);
  return neighbors;
}

function countUnsafeSandToLandAdjacencies(
  cells: readonly { level: number; surface: string }[],
  rowCount: number,
  columnCount: number,
) {
  let count = 0;
  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index].surface !== "sand") continue;
    for (const neighborIndex of getCardinalNeighbors(
      index,
      rowCount,
      columnCount,
    )) {
      const neighbor = cells[neighborIndex];
      if (neighbor.surface !== "water" && neighbor.level >= 3) count += 1;
    }
  }
  return count;
}
