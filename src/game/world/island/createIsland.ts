import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { HarvestableResource } from "../../resources/resourceTypes";
import { createIslandResources } from "./createIslandResources";
import { PLAYER_SPAWN, RAFT_SPAWN } from "./islandLayout";
import {
  createRaft,
  type Raft,
} from "../../models/createRaft";
import { RAFT_NAVIGATION_FOOTPRINT } from "../../models/raftGeometry";
import { createBaseTerrainData } from "../terrain/createBaseTerrainData";
import { sampleTerrain } from "../terrain/sampleTerrain";
import { createTerrainMeshes } from "../terrain/createTerrainMeshes";
import type { TerrainSampler } from "../terrain/terrainTypes";
import { validateTemporaryIslandSpawns } from "./validateTemporaryIslandSpawns";

interface IslandMaterials {
  trunk: StandardMaterial;
  leaves: StandardMaterial;
  rock: StandardMaterial;
  raft: StandardMaterial;
}

export interface Island {
  terrainMesh: Mesh;
  waterMesh: Mesh;
  sampleTerrain: TerrainSampler;
  waterHeight: number;
  shadowCasters: Mesh[];
  harvestableResources: HarvestableResource[];
  playerSpawnGroundPosition: Vector3;
  raft: Raft;
}

export function createIsland(scene: Scene, materials: IslandMaterials): Island {
  const terrainData = createBaseTerrainData();
  const { terrainMesh, waterMesh } = createTerrainMeshes(scene, terrainData);
  const sample: TerrainSampler = (x, z) => sampleTerrain(terrainData, x, z);
  const { playerGround } = validateTemporaryIslandSpawns(
    sample,
    RAFT_NAVIGATION_FOOTPRINT,
  );

  const resources = createIslandResources(
    scene,
    {
      trunk: materials.trunk,
      leaves: materials.leaves,
      rock: materials.rock,
    },
    sample,
  );
  const raft = createRaft(scene, "raft", materials.raft);
  raft.root.position.set(
    RAFT_SPAWN.x,
    terrainData.waterHeight,
    RAFT_SPAWN.z,
  );
  raft.root.rotation.y = RAFT_SPAWN.rotation;

  return {
    terrainMesh,
    waterMesh,
    sampleTerrain: sample,
    waterHeight: terrainData.waterHeight,
    shadowCasters: [terrainMesh, ...resources.shadowCasters, ...raft.meshes],
    harvestableResources: resources.harvestableResources,
    playerSpawnGroundPosition: new Vector3(
      PLAYER_SPAWN.x,
      playerGround.height,
      PLAYER_SPAWN.z,
    ),
    raft,
  };
}
