import { describe, expect, test } from "vitest";
import { RAFT_NAVIGATION_FOOTPRINT } from "../../models/raftGeometry";
import { createSeededTerracedTerrainData } from "../terrain/terraced/createSeededTerracedTerrainData";
import { sampleTerracedTerrain } from "../terrain/terraced/sampleTerracedTerrain";
import { findTemporaryIslandSpawns } from "./findTemporaryIslandSpawns";

const REPRESENTATIVE_SEEDS = [1, 42, 12345, 54321, 99999] as const;
const DEPARTURE_CHECK_DISTANCE = 0.25;

describe("findTemporaryIslandSpawns", () => {
  test.each(REPRESENTATIVE_SEEDS)(
    "trouve des spawns valides et déterministes pour la seed %i",
    (seed) => {
      const terrain = createSeededTerracedTerrainData(seed);
      const spawns = findTemporaryIslandSpawns(
        terrain,
        RAFT_NAVIGATION_FOOTPRINT,
      );

      expect(
        findTemporaryIslandSpawns(terrain, RAFT_NAVIGATION_FOOTPRINT),
      ).toEqual(spawns);
      expect(
        sampleTerracedTerrain(
          terrain,
          spawns.playerSpawn.x,
          spawns.playerSpawn.z,
        )?.surface,
      ).toBe("sand");
      const playerToRaftX = spawns.raftSpawn.x - spawns.playerSpawn.x;
      const playerToRaftZ = spawns.raftSpawn.z - spawns.playerSpawn.z;
      const distance = Math.hypot(playerToRaftX, playerToRaftZ);

      expect(distance).toBeLessThanOrEqual(2.75);

      const outwardDirection = {
        x: playerToRaftX / distance,
        z: playerToRaftZ / distance,
      };

      expect(spawns.raftSpawn.rotation).toBeCloseTo(
        Math.atan2(outwardDirection.x, outwardDirection.z),
      );
      expect(
        getRaftCheckpointSurfaces(terrain, spawns.raftSpawn),
      ).toEqual(Array(7).fill("water"));
      expect(
        getRaftCheckpointSurfaces(terrain, {
          ...spawns.raftSpawn,
          x:
            spawns.raftSpawn.x +
            outwardDirection.x * DEPARTURE_CHECK_DISTANCE,
          z:
            spawns.raftSpawn.z +
            outwardDirection.z * DEPARTURE_CHECK_DISTANCE,
        }),
      ).toEqual(Array(7).fill("water"));
    },
  );
});

function getRaftCheckpointSurfaces(
  terrain: ReturnType<typeof createSeededTerracedTerrainData>,
  spawn: { x: number; z: number; rotation: number },
) {
  const { halfWidth, halfLength } = RAFT_NAVIGATION_FOOTPRINT;
  const checkpoints = [
    [0, 0],
    [-halfWidth, -halfLength],
    [-halfWidth, halfLength],
    [halfWidth, -halfLength],
    [halfWidth, halfLength],
    [0, -halfLength],
    [0, halfLength],
  ];
  const cosine = Math.cos(spawn.rotation);
  const sine = Math.sin(spawn.rotation);
  return checkpoints.map(([localX, localZ]) =>
    sampleTerracedTerrain(
      terrain,
      spawn.x + localX * cosine + localZ * sine,
      spawn.z - localX * sine + localZ * cosine,
    )?.surface,
  );
}
