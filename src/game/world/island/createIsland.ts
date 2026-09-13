import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { HarvestableResource } from "../../resources/resourceTypes";
import { createIslandTerrain } from "./createIslandTerrain";
import { createIslandResources } from "./createIslandResources";
import { PLAYER_SPAWN, RAFT_SPAWN } from "./islandLayout";
import { createRaft, type Raft } from "../../models/createRaft";

interface IslandMaterials {
  water: StandardMaterial;
  sand: StandardMaterial;
  grass: StandardMaterial;
  trunk: StandardMaterial;
  leaves: StandardMaterial;
  rock: StandardMaterial;
  raft: StandardMaterial;
}

export interface Island {
  walkableSurfaces: Mesh[];
  navigableSurfaces: Mesh[];
  buildableSurfaces: Mesh[];
  placementSurfaces: Mesh[];
  shadowCasters: Mesh[];
  harvestableResources: HarvestableResource[];
  playerSpawnGroundPosition: Vector3;
  raft: Raft;
}

export function createIsland(scene: Scene, materials: IslandMaterials): Island {
  const terrain = createIslandTerrain(scene, {
    water: materials.water,
    sand: materials.sand,
    grass: materials.grass,
    rock: materials.rock,
  });

  const resources = createIslandResources(scene, {
    trunk: materials.trunk,
    leaves: materials.leaves,
    rock: materials.rock,
  });
  const raft = createRaft(scene, "raft", materials.raft);
  raft.root.position.set(
    RAFT_SPAWN.x,
    RAFT_SPAWN.groundHeight,
    RAFT_SPAWN.z,
  );

  return {
    walkableSurfaces: [terrain.grass, terrain.beach, terrain.rockyPlateau],
    navigableSurfaces: [terrain.water],
    buildableSurfaces: [terrain.grass],
    placementSurfaces: [
      terrain.grass,
      terrain.beach,
      terrain.rockyPlateau,
      terrain.water,
    ],
    shadowCasters: [
      terrain.rockyPlateau,
      ...resources.shadowCasters,
      ...raft.meshes,
    ],
    harvestableResources: resources.harvestableResources,
    playerSpawnGroundPosition: new Vector3(
      PLAYER_SPAWN.x,
      PLAYER_SPAWN.groundHeight,
      PLAYER_SPAWN.z,
    ),
    raft,
  };
}
