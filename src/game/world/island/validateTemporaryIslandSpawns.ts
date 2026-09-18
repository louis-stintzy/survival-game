import type { TerrainSampler } from "../terrain/terrainTypes";
import { PLAYER_SPAWN, RAFT_SPAWN } from "./islandLayout";

const INTERACTION_DISTANCE = 2.75;

interface RaftFootprint {
  halfWidth: number;
  halfLength: number;
}

/** Valide les coordonnées fixes conservées jusqu'aux futurs spawns procéduraux. */
export function validateTemporaryIslandSpawns(
  sampleTerrain: TerrainSampler,
  footprint: RaftFootprint,
) {
  const playerGround = sampleTerrain(PLAYER_SPAWN.x, PLAYER_SPAWN.z);
  if (playerGround?.surface !== "beach") {
    throw new Error("Le spawn joueur temporaire doit être sur la plage.");
  }

  const spawnDistance = Math.hypot(
    RAFT_SPAWN.x - PLAYER_SPAWN.x,
    RAFT_SPAWN.z - PLAYER_SPAWN.z,
  );
  if (spawnDistance > INTERACTION_DISTANCE) {
    throw new Error("Le radeau temporaire doit être à portée d'interaction.");
  }

  const checkpoints = [
    [0, 0],
    [-footprint.halfWidth, -footprint.halfLength],
    [-footprint.halfWidth, footprint.halfLength],
    [footprint.halfWidth, -footprint.halfLength],
    [footprint.halfWidth, footprint.halfLength],
    [0, -footprint.halfLength],
    [0, footprint.halfLength],
  ];
  const cosine = Math.cos(RAFT_SPAWN.rotation);
  const sine = Math.sin(RAFT_SPAWN.rotation);
  const raftOnWater = checkpoints.every(([localX, localZ]) => {
    const x = RAFT_SPAWN.x + localX * cosine + localZ * sine;
    const z = RAFT_SPAWN.z - localX * sine + localZ * cosine;
    return sampleTerrain(x, z)?.surface === "water";
  });
  if (!raftOnWater) {
    throw new Error("Toute l'empreinte du radeau temporaire doit être sur l'eau.");
  }

  return { playerGround, spawnDistance };
}
