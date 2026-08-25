import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

export const SHELTER_WIDTH = 4;
export const SHELTER_DEPTH = 3;

interface ShelterMaterials {
  wood: StandardMaterial;
  roof: StandardMaterial;
}

export interface Shelter {
  root: TransformNode;
  meshes: Mesh[];
}

export function createShelter(
  scene: Scene,
  name: string,
  materials: ShelterMaterials,
): Shelter {
  const root = new TransformNode(name, scene);
  const postPositions = [
    [-1.7, -1.2],
    [-1.7, 1.2],
    [1.7, -1.2],
    [1.7, 1.2],
  ];

  const posts = postPositions.map(([x, z], index) => {
    const post = MeshBuilder.CreateCylinder(
      `${name}-post-${index}`,
      { height: 2.7, diameter: 0.3, tessellation: 6 },
      scene,
    );
    post.position.set(x, 1.35, z);
    post.material = materials.wood;
    post.parent = root;
    return post;
  });

  const leftRoof = MeshBuilder.CreateBox(
    `${name}-roof-left`,
    { width: 2, height: 0.18, depth: 3 },
    scene,
  );
  leftRoof.position.set(-0.95, 2.9, 0);
  leftRoof.rotation.z = 0.22;
  leftRoof.material = materials.roof;
  leftRoof.parent = root;

  const rightRoof = MeshBuilder.CreateBox(
    `${name}-roof-right`,
    { width: 2, height: 0.18, depth: 3 },
    scene,
  );
  rightRoof.position.set(0.95, 2.9, 0);
  rightRoof.rotation.z = -0.22;
  rightRoof.material = materials.roof;
  rightRoof.parent = root;

  const meshes = [...posts, leftRoof, rightRoof];
  meshes.forEach((mesh) => {
    mesh.isPickable = false;
    mesh.receiveShadows = true;
  });

  return { root, meshes };
}
