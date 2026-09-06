import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

export interface TorchMaterials {
  handle: StandardMaterial;
  flame: StandardMaterial;
}

export interface TorchModel {
  root: TransformNode;
  meshes: Mesh[];
}

/** Crée une torche low-poly autonome, réutilisable comme modèle tenu ou posé. */
export function createTorchModel(
  scene: Scene,
  name: string,
  materials: TorchMaterials,
): TorchModel {
  const root = new TransformNode(name, scene);

  const handle = MeshBuilder.CreateBox(
    `${name}-handle`,
    { width: 0.13, height: 1.15, depth: 0.13 },
    scene,
  );
  handle.material = materials.handle;
  handle.parent = root;

  const flame = MeshBuilder.CreatePolyhedron(
    `${name}-flame`,
    { type: 1, size: 0.28 },
    scene,
  );
  flame.position.y = 0.72;
  flame.scaling.y = 1.35;
  flame.material = materials.flame;
  flame.parent = root;

  return { root, meshes: [handle, flame] };
}
