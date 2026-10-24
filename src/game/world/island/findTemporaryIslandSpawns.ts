import type { TerracedTerrainData } from "../terrain/terraced/terracedTerrainTypes";
import { sampleTerracedTerrain } from "../terrain/terraced/sampleTerracedTerrain";

const RAFT_SPAWN_DISTANCE = 2;

interface RaftFootprint {
  halfWidth: number;
  halfLength: number;
}

interface RaftSpawnPoint {
  x: number;
  z: number;
  rotation: number;
}

export interface TemporaryIslandSpawns {
  playerSpawn: { x: number; z: number };
  raftSpawn: RaftSpawnPoint;
}

const CARDINAL_DIRECTIONS = [
  { x: 0, z: 1, rotation: Math.PI / 2 },
  { x: 0, z: -1, rotation: Math.PI / 2 },
  { x: 1, z: 0, rotation: 0 },
  { x: -1, z: 0, rotation: 0 },
] as const;

/** Recherche déterministe provisoire d'une plage et de son radeau voisin. */
export function findTemporaryIslandSpawns(
  terrain: TerracedTerrainData,
  footprint: RaftFootprint,
): TemporaryIslandSpawns {
  const sandCells = terrain.cells
    .map((cell, index) => ({
      cell,
      row: Math.floor(index / terrain.columnCount),
      column: index % terrain.columnCount,
    }))
    .filter(({ cell }) => cell.surface === "sand")
    .sort(
      (first, second) =>
        second.row - first.row ||
        distanceFromCenterColumn(first.column, terrain.columnCount) -
          distanceFromCenterColumn(second.column, terrain.columnCount) ||
        first.column - second.column,
    );

  for (const { row, column } of sandCells) {
    const playerSpawn = getCellCenter(terrain, row, column);
    for (const direction of CARDINAL_DIRECTIONS) {
      const raftSpawn = {
        x: playerSpawn.x + direction.x * RAFT_SPAWN_DISTANCE,
        z: playerSpawn.z + direction.z * RAFT_SPAWN_DISTANCE,
        rotation: direction.rotation,
      };
      if (isRaftFootprintOnWater(terrain, raftSpawn, footprint)) {
        return { playerSpawn, raftSpawn };
      }
    }
  }

  throw new Error(
    "Impossible de trouver un spawn temporaire joueur/radeau valide sur l'île.",
  );
}

function getCellCenter(
  terrain: TerracedTerrainData,
  row: number,
  column: number,
) {
  return {
    x:
      (-terrain.columnCount * terrain.cellSize) / 2 +
      (column + 0.5) * terrain.cellSize,
    z:
      (-terrain.rowCount * terrain.cellSize) / 2 +
      (row + 0.5) * terrain.cellSize,
  };
}

function distanceFromCenterColumn(column: number, columnCount: number) {
  return Math.abs(column - (columnCount - 1) / 2);
}

function isRaftFootprintOnWater(
  terrain: TerracedTerrainData,
  spawn: RaftSpawnPoint,
  footprint: RaftFootprint,
) {
  const checkpoints = [
    [0, 0],
    [-footprint.halfWidth, -footprint.halfLength],
    [-footprint.halfWidth, footprint.halfLength],
    [footprint.halfWidth, -footprint.halfLength],
    [footprint.halfWidth, footprint.halfLength],
    [0, -footprint.halfLength],
    [0, footprint.halfLength],
  ];
  const cosine = Math.cos(spawn.rotation);
  const sine = Math.sin(spawn.rotation);
  return checkpoints.every(([localX, localZ]) => {
    const x = spawn.x + localX * cosine + localZ * sine;
    const z = spawn.z - localX * sine + localZ * cosine;
    return sampleTerracedTerrain(terrain, x, z)?.surface === "water";
  });
}
