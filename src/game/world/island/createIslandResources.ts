import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { HarvestableResource } from "../../resources/resourceTypes";
import type { TerrainSampler } from "../terrain/terrainTypes";
import {
  ROCK_PLACEMENTS,
  TREE_PLACEMENTS,
  type RockPlacement,
  type TreePlacement,
} from "./islandLayout";

interface IslandResourceMaterials {
  trunk: StandardMaterial;
  leaves: StandardMaterial;
  rock: StandardMaterial;
}

export interface IslandResources {
  harvestableResources: HarvestableResource[];
  shadowCasters: Mesh[];
}

const ROCK_GROUND_SINK_RATIO = 0.45;
const ROCK_COLLISION_HALF_WIDTH_RATIO = 0.85;
const ROCK_COLLISION_HALF_DEPTH_RATIO = 0.7;

export function isRockPlacementTerrainValid(
  placement: RockPlacement,
  sampleTerrain: TerrainSampler,
) {
  const center = sampleTerrain(placement.x, placement.z);
  if (
    !center?.isLand ||
    (center.surface !== "grass" && center.surface !== "rock")
  ) {
    return false;
  }

  const halfWidth = ROCK_COLLISION_HALF_WIDTH_RATIO * placement.scale;
  const halfDepth = ROCK_COLLISION_HALF_DEPTH_RATIO * placement.scale;
  const localCheckpoints = [
    { x: 0, z: 0 },
    { x: -halfWidth, z: 0 },
    { x: halfWidth, z: 0 },
    { x: 0, z: -halfDepth },
    { x: 0, z: halfDepth },
    { x: -halfWidth, z: -halfDepth },
    { x: -halfWidth, z: halfDepth },
    { x: halfWidth, z: -halfDepth },
    { x: halfWidth, z: halfDepth },
  ];
  const cosine = Math.cos(placement.rotation);
  const sine = Math.sin(placement.rotation);

  return localCheckpoints.every((checkpoint) => {
    const x =
      placement.x + checkpoint.x * cosine + checkpoint.z * sine;
    const z =
      placement.z - checkpoint.x * sine + checkpoint.z * cosine;
    const ground = sampleTerrain(x, z);
    return ground?.isLand === true && ground.level === center.level;
  });
}

function createTree(
  scene: Scene,
  placement: TreePlacement,
  index: number,
  groundHeight: number,
  materials: IslandResourceMaterials,
): { meshes: Mesh[]; collisionMeshes: Mesh[] } {
  const trunk = MeshBuilder.CreateCylinder(
    `tree-trunk-${index}`,
    {
      height: 2.2 * placement.scale,
      diameterTop: 0.42 * placement.scale,
      diameterBottom: 0.6 * placement.scale,
      tessellation: 7,
    },
    scene,
  );
  trunk.position = new Vector3(
    placement.x,
    groundHeight + 1.1 * placement.scale,
    placement.z,
  );
  trunk.rotation.y = placement.rotation;
  trunk.material = materials.trunk;

  const crown = MeshBuilder.CreatePolyhedron(
    `tree-crown-${index}`,
    { type: 2, size: 1.65 * placement.scale },
    scene,
  );
  crown.position = new Vector3(
    placement.x,
    groundHeight + 3 * placement.scale,
    placement.z,
  );
  crown.scaling = new Vector3(0.9, 1.2, 0.9);
  crown.rotation.y = placement.rotation;
  crown.material = materials.leaves;

  return { meshes: [trunk, crown], collisionMeshes: [trunk] };
}

function createRock(
  scene: Scene,
  placement: RockPlacement,
  index: number,
  groundHeight: number,
  material: StandardMaterial,
): Mesh {
  const rock = MeshBuilder.CreatePolyhedron(
    `rock-${index}`,
    { type: 2, size: 1 },
    scene,
  );
  rock.position = new Vector3(placement.x, 0, placement.z);
  rock.scaling = new Vector3(
    placement.scale,
    placement.scale * 0.75,
    placement.scale * 0.85,
  );
  rock.rotation = new Vector3(0.12, placement.rotation, -0.08);
  rock.material = material;

  rock.computeWorldMatrix(true);
  const boundingBox = rock.getBoundingInfo().boundingBox;
  const lowestPoint = boundingBox.minimumWorld.y;
  const rockHeight = boundingBox.maximumWorld.y - lowestPoint;
  // On pose d'abord le point le plus bas sur le terrain,
  // puis on enfonce légèrement le rocher pour qu'il paraisse naturellement ancré.
  rock.position.y += groundHeight - lowestPoint;
  rock.position.y -= rockHeight * ROCK_GROUND_SINK_RATIO;
  rock.computeWorldMatrix(true);

  return rock;
}

/**
 * Crée les ressources naturelles initialement présentes sur l'île.
 *
 * Les placements définis dans `islandLayout` sont transformés en ressources
 * récoltables complètes : meshes visuels, meshes de collision, collider de
 * déplacement et état de récolte.
 *
 * @param scene Scène Babylon dans laquelle créer les ressources.
 * @param materials Matériaux utilisés pour les arbres et les rochers.
 * @param sampleTerrain Source des surfaces autorisées et hauteurs réelles.
 * @returns Les ressources récoltables et les meshes devant projeter une ombre.
 */
export function createIslandResources(
  scene: Scene,
  materials: IslandResourceMaterials,
  sampleTerrain: TerrainSampler,
): IslandResources {
  const treeResources: HarvestableResource[] = TREE_PLACEMENTS.flatMap(
    (placement, index) => {
      const ground = sampleTerrain(placement.x, placement.z);
      if (ground?.surface !== "grass") return [];

      const tree = createTree(
        scene,
        placement,
        index,
        ground.height,
        materials,
      );
      return [
        {
          type: "wood",
          position: new Vector3(placement.x, ground.height, placement.z),
          meshes: tree.meshes,
          collisionMeshes: tree.collisionMeshes,
          movementCollider: {
            kind: "circle",
            radius: 0.3 * placement.scale,
          },
          harvested: false,
        },
      ];
    },
  );

  const rockResources: HarvestableResource[] = ROCK_PLACEMENTS.flatMap(
    (placement, index) => {
      if (!isRockPlacementTerrainValid(placement, sampleTerrain)) return [];
      const ground = sampleTerrain(placement.x, placement.z);
      if (!ground) return [];

      const rock = createRock(
        scene,
        placement,
        index,
        ground.height,
        materials.rock,
      );
      return [
        {
          type: "stone",
          position: new Vector3(placement.x, ground.height, placement.z),
          meshes: [rock],
          collisionMeshes: [rock],
          movementCollider: {
            kind: "orientedBox",
            halfWidth: ROCK_COLLISION_HALF_WIDTH_RATIO * placement.scale,
            halfDepth: ROCK_COLLISION_HALF_DEPTH_RATIO * placement.scale,
            rotation: placement.rotation,
          },
          harvested: false,
        },
      ];
    },
  );

  const harvestableResources = [...treeResources, ...rockResources];

  const shadowCasters = harvestableResources.flatMap(
    (resource) => resource.meshes,
  );

  return {
    harvestableResources,
    shadowCasters,
  };
}
