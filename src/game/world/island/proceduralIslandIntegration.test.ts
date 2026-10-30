import { describe, expect, test } from "vitest";
import { RAFT_NAVIGATION_FOOTPRINT } from "../../models/raftGeometry";
import { createSeededTerracedTerrainData } from "../terrain/terraced/createSeededTerracedTerrainData";
import { findTerracedLandTrapIndices } from "../terrain/terraced/repairTerracedLandTraps";
import { findTemporaryIslandSpawns } from "./findTemporaryIslandSpawns";

describe("intégration de l'île procédurale", () => {
  test("préserve les invariants fondamentaux pour les seeds 1 à 100", () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const terrain = createSeededTerracedTerrainData(seed);
      const surfaces = new Set(terrain.cells.map(({ surface }) => surface));

      expect(surfaces, `seed ${seed}`).toContain("water");
      expect(surfaces, `seed ${seed}`).toContain("sand");
      expect(
        terrain.cells.some(({ surface }) => surface !== "water"),
        `seed ${seed}`,
      ).toBe(true);
      expect(
        terrain.cells.every(
          ({ level }) => Number.isInteger(level) && level >= 0,
        ),
        `seed ${seed}`,
      ).toBe(true);
      expect(
        countLandComponents(terrain.cells, 101, 101),
        `seed ${seed}`,
      ).toBe(1);
      expect(findTerracedLandTrapIndices(terrain), `seed ${seed}`).toEqual([]);

      expect(() =>
        findTemporaryIslandSpawns(terrain, RAFT_NAVIGATION_FOOTPRINT),
      ).not.toThrow();
    }
  });
});

function countLandComponents(
  cells: readonly { surface: string }[],
  rowCount: number,
  columnCount: number,
): number {
  const remaining = new Set<number>();
  cells.forEach((cell, index) => {
    if (cell.surface !== "water") remaining.add(index);
  });
  let count = 0;

  while (remaining.size > 0) {
    count += 1;
    const first = remaining.values().next().value;
    if (first === undefined) break;
    remaining.delete(first);
    const pending = [first];
    while (pending.length > 0) {
      const index = pending.pop()!;
      for (const neighbor of getCardinalNeighbors(
        index,
        rowCount,
        columnCount,
      )) {
        if (!remaining.delete(neighbor)) continue;
        pending.push(neighbor);
      }
    }
  }

  return count;
}

function getCardinalNeighbors(
  index: number,
  rowCount: number,
  columnCount: number,
): number[] {
  const row = Math.floor(index / columnCount);
  const column = index % columnCount;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push(index - columnCount);
  if (row + 1 < rowCount) neighbors.push(index + columnCount);
  if (column > 0) neighbors.push(index - 1);
  if (column + 1 < columnCount) neighbors.push(index + 1);
  return neighbors;
}
