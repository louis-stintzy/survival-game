import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { HarvestableResource } from "../resources/resourceTypes";

interface IslandMaterials {
  water: StandardMaterial;
  sand: StandardMaterial;
  grass: StandardMaterial;
  trunk: StandardMaterial;
  leaves: StandardMaterial;
  rock: StandardMaterial;
}

interface TreePlacement {
  x: number;
  z: number;
  scale: number;
  rotation: number;
}

interface RockPlacement {
  x: number;
  z: number;
  scale: number;
  groundHeight: number;
}

export interface Island {
  walkableSurfaces: Mesh[];
  shadowCasters: Mesh[];
  harvestableResources: HarvestableResource[];
}

const GRASS_HEIGHT = 0.75;
const ROCKY_PLATEAU_HEIGHT = 1.15;
const ROCK_GROUND_SINK_RATIO = 0.45;

function createTree(
  scene: Scene,
  placement: TreePlacement,
  index: number,
  materials: IslandMaterials,
): Mesh[] {
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
    GRASS_HEIGHT + 1.1 * placement.scale,
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
    GRASS_HEIGHT + 3 * placement.scale,
    placement.z,
  );
  crown.scaling = new Vector3(0.9, 1.2, 0.9);
  crown.rotation.y = placement.rotation;
  crown.material = materials.leaves;

  return [trunk, crown];
}

function createRock(
  scene: Scene,
  placement: RockPlacement,
  index: number,
  material: StandardMaterial,
): Mesh {
  const rock = MeshBuilder.CreatePolyhedron(
    `rock-${index}`,
    { type: 1, size: 1 },
    scene,
  );
  rock.position = new Vector3(placement.x, 0, placement.z);
  rock.scaling = new Vector3(
    placement.scale,
    placement.scale * 0.75,
    placement.scale * 0.85,
  );
  rock.rotation = new Vector3(0.12, placement.z, -0.08);
  rock.material = material;

  rock.computeWorldMatrix(true);
  const boundingBox = rock.getBoundingInfo().boundingBox;
  const lowestPoint = boundingBox.minimumWorld.y;
  const rockHeight = boundingBox.maximumWorld.y - lowestPoint;
  // On pose d'abord le point le plus bas sur le terrain,
  // puis on enfonce légèrement le rocher pour qu'il paraisse naturellement ancré.
  rock.position.y += placement.groundHeight - lowestPoint;
  rock.position.y -= rockHeight * ROCK_GROUND_SINK_RATIO;
  rock.computeWorldMatrix(true);

  return rock;
}

export function createIsland(scene: Scene, materials: IslandMaterials): Island {
  const water = MeshBuilder.CreateCylinder(
    "water",
    { diameter: 52, height: 0.6, tessellation: 48 },
    scene,
  );
  water.position.y = -0.55;
  water.material = materials.water;
  water.receiveShadows = true;

  const beach = MeshBuilder.CreateCylinder(
    "beach",
    { diameter: 36, height: 1.1, tessellation: 14 },
    scene,
  );
  beach.position.y = -0.2;
  beach.scaling.z = 0.82;
  beach.rotation.y = 0.08;
  beach.material = materials.sand;
  beach.receiveShadows = true;

  const grass = MeshBuilder.CreateCylinder(
    "grass",
    { diameter: 32, height: 1, tessellation: 13 },
    scene,
  );
  grass.position.y = 0.25;
  grass.scaling.z = 0.8;
  grass.rotation.y = -0.06;
  grass.material = materials.grass;
  grass.receiveShadows = true;

  const rockyPlateau = MeshBuilder.CreateCylinder(
    "rocky-plateau",
    { diameter: 8, height: 0.4, tessellation: 8 },
    scene,
  );
  rockyPlateau.position = new Vector3(8, 0.95, -3.5);
  rockyPlateau.scaling.z = 0.72;
  rockyPlateau.rotation.y = 0.2;
  rockyPlateau.material = materials.rock;
  rockyPlateau.receiveShadows = true;

  const treePlacements: TreePlacement[] = [
    { x: -11.5, z: -1.5, scale: 1.05, rotation: 0.2 },
    { x: -11.8, z: 2.2, scale: 0.9, rotation: 1.1 },
    { x: -10.2, z: 5.5, scale: 1.15, rotation: 0.6 },
    { x: -8.5, z: -2.8, scale: 0.95, rotation: 1.8 },
    { x: -8.7, z: 1.2, scale: 1.1, rotation: 2.5 },
    { x: -8, z: 7.6, scale: 0.88, rotation: 0.9 },
    { x: -6.2, z: 4.8, scale: 1.08, rotation: 2.1 },
    { x: -6, z: 0.2, scale: 0.92, rotation: 1.4 },
    { x: -5.2, z: 7.3, scale: 1, rotation: 2.8 },
    { x: -12.8, z: 5.3, scale: 0.85, rotation: 1.7 },
    { x: -9.8, z: 8.7, scale: 1.02, rotation: 0.4 },
    { x: 4.2, z: 7.4, scale: 0.9, rotation: 2.3 },
    { x: 11.5, z: 1.8, scale: 0.95, rotation: 1.2 },
  ];
  const treeResources: HarvestableResource[] = treePlacements.map(
    (placement, index) => ({
      type: "wood",
      position: new Vector3(placement.x, GRASS_HEIGHT, placement.z),
      meshes: createTree(scene, placement, index, materials),
      harvested: false,
    }),
  );
  const trees = treeResources.flatMap((resource) => resource.meshes);

  const rockPlacements: RockPlacement[] = [
    { x: 6.2, z: -4.2, scale: 1.2, groundHeight: ROCKY_PLATEAU_HEIGHT },
    { x: 8.1, z: -2.7, scale: 0.8, groundHeight: ROCKY_PLATEAU_HEIGHT },
    { x: 9.7, z: -4.5, scale: 1.05, groundHeight: ROCKY_PLATEAU_HEIGHT },
    { x: 7.7, z: -5.2, scale: 0.65, groundHeight: ROCKY_PLATEAU_HEIGHT },
    { x: 10.1, z: -2.4, scale: 0.6, groundHeight: ROCKY_PLATEAU_HEIGHT },
    { x: -2.5, z: -9.8, scale: 1, groundHeight: GRASS_HEIGHT },
    { x: 3.2, z: 9.2, scale: 0.85, groundHeight: GRASS_HEIGHT },
    { x: -13.2, z: -4.4, scale: 0.7, groundHeight: GRASS_HEIGHT },
  ];
  const rockResources: HarvestableResource[] = rockPlacements.map(
    (placement, index) => ({
      type: "stone",
      position: new Vector3(
        placement.x,
        placement.groundHeight,
        placement.z,
      ),
      meshes: [createRock(scene, placement, index, materials.rock)],
      harvested: false,
    }),
  );
  const rocks = rockResources.flatMap((resource) => resource.meshes);

  return {
    walkableSurfaces: [grass, beach, rockyPlateau],
    shadowCasters: [rockyPlateau, ...trees, ...rocks],
    harvestableResources: [...treeResources, ...rockResources],
  };
}
