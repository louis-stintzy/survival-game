import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { HarvestableResource } from "../../resources/resourceTypes";
import { createIslandResources } from "./createIslandResources";
import {
  createRaft,
  type Raft,
} from "../../models/createRaft";
import { RAFT_NAVIGATION_FOOTPRINT } from "../../models/raftGeometry";
import { createSeededTerracedTerrainData } from "../terrain/terraced/createSeededTerracedTerrainData";
import { createTerracedTerrainMeshes } from "../terrain/terraced/createTerracedTerrainMeshes";
import { sampleTerracedTerrain } from "../terrain/terraced/sampleTerracedTerrain";
import type { TerrainSampler } from "../terrain/terrainTypes";
import { findTemporaryIslandSpawns } from "./findTemporaryIslandSpawns";
import type { TerracedTerrainData } from "../terrain/terraced/terracedTerrainTypes";

interface IslandMaterials {
  trunk: StandardMaterial;
  leaves: StandardMaterial;
  rock: StandardMaterial;
  raft: StandardMaterial;
}

export interface Island {
  terrainData: TerracedTerrainData;
  terrainMesh: Mesh;
  waterMesh: Mesh;
  sampleTerrain: TerrainSampler;
  waterHeight: number;
  shadowCasters: Mesh[];
  harvestableResources: HarvestableResource[];
  playerSpawnGroundPosition: Vector3;
  raft: Raft;
}

export function createIsland(
  scene: Scene,
  materials: IslandMaterials,
  worldSeed: number,
): Island {
  const terrainData = createSeededTerracedTerrainData(worldSeed);
  const { terrainMesh, waterMesh } = createTerracedTerrainMeshes(
    scene,
    terrainData,
  );
  const sample: TerrainSampler = (x, z) =>
    sampleTerracedTerrain(terrainData, x, z);
  const { playerSpawn, raftSpawn } = findTemporaryIslandSpawns(
    terrainData,
    RAFT_NAVIGATION_FOOTPRINT,
  );
  const playerGround = sample(playerSpawn.x, playerSpawn.z);
  if (!playerGround) {
    throw new Error("Le spawn joueur trouvé ne correspond pas au terrain.");
  }

  const resources = createIslandResources(
    scene,
    {
      trunk: materials.trunk,
      leaves: materials.leaves,
      rock: materials.rock,
    },
    terrainData,
    sample,
  );
  const raft = createRaft(scene, "raft", materials.raft);
  raft.root.position.set(raftSpawn.x, terrainData.waterHeight, raftSpawn.z);
  raft.root.rotation.y = raftSpawn.rotation;

  return {
    terrainData,
    terrainMesh,
    waterMesh,
    sampleTerrain: sample,
    waterHeight: terrainData.waterHeight,
    shadowCasters: [...resources.shadowCasters, ...raft.meshes],
    harvestableResources: resources.harvestableResources,
    playerSpawnGroundPosition: new Vector3(
      playerSpawn.x,
      playerGround.height,
      playerSpawn.z,
    ),
    raft,
  };
}
