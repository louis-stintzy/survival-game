import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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
  flameAnchor: TransformNode;
  light: PointLight;
}

const TORCH_LIGHT_COLOR = new Color3(1, 0.55, 0.25);
const TORCH_LIGHT_INTENSITY = 1.5;
const TORCH_LIGHT_RANGE = 8;

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

  const flameAnchor = new TransformNode(`${name}-flame-anchor`, scene);
  flameAnchor.position.y = 0.72;
  flameAnchor.parent = root;

  const flame = MeshBuilder.CreatePolyhedron(
    `${name}-flame`,
    { type: 1, size: 0.28 },
    scene,
  );
  flame.scaling.y = 1.35;
  flame.material = materials.flame;
  flame.parent = flameAnchor;

  const light = new PointLight(`${name}-light`, Vector3.Zero(), scene);
  light.diffuse = TORCH_LIGHT_COLOR;
  light.intensity = TORCH_LIGHT_INTENSITY;
  light.range = TORCH_LIGHT_RANGE;
  light.parent = flameAnchor;

  return { root, meshes: [handle, flame], flameAnchor, light };
}
