import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { ToolType } from "./toolDefinitions";

interface ToolMaterials {
  wood: StandardMaterial;
  stone: StandardMaterial;
}

export interface ToolModel {
  root: TransformNode;
  meshes: Mesh[];
}

export function createToolModels(
  scene: Scene,
  player: Mesh,
  materials: ToolMaterials,
): Record<ToolType, ToolModel> {
  const anchor = new TransformNode("player-equipment-anchor", scene);
  anchor.parent = player;
  anchor.position.set(0.8, 0.15, 0.8);

  const stoneAxe = createStoneAxe(scene, materials);
  const stonePickaxe = createStonePickaxe(scene, materials);
  stoneAxe.root.parent = anchor;
  stonePickaxe.root.parent = anchor;

  const models = { stoneAxe, stonePickaxe };
  Object.values(models).forEach((model) => {
    model.root.setEnabled(false);
    model.meshes.forEach((mesh) => {
      mesh.isPickable = false;
      mesh.receiveShadows = true;
    });
  });
  return models;
}

function createStoneAxe(scene: Scene, materials: ToolMaterials): ToolModel {
  const root = new TransformNode("equipped-stone-axe", scene);
  root.rotation.z = -0.22;

  const handle = MeshBuilder.CreateBox(
    "equipped-stone-axe-handle",
    { width: 0.12, height: 1.25, depth: 0.12 },
    scene,
  );
  handle.material = materials.wood;
  handle.parent = root;

  const head = MeshBuilder.CreateBox(
    "equipped-stone-axe-head",
    { width: 0.62, height: 0.3, depth: 0.2 },
    scene,
  );
  head.position.set(0.2, 0.5, 0);
  head.material = materials.stone;
  head.parent = root;

  return { root, meshes: [handle, head] };
}

function createStonePickaxe(scene: Scene, materials: ToolMaterials): ToolModel {
  const root = new TransformNode("equipped-stone-pickaxe", scene);
  root.rotation.z = -0.22;

  const handle = MeshBuilder.CreateBox(
    "equipped-stone-pickaxe-handle",
    { width: 0.12, height: 1.25, depth: 0.12 },
    scene,
  );
  handle.material = materials.wood;
  handle.parent = root;

  const head = MeshBuilder.CreateBox(
    "equipped-stone-pickaxe-head",
    { width: 0.95, height: 0.16, depth: 0.16 },
    scene,
  );
  head.position.y = 0.56;
  head.material = materials.stone;
  head.parent = root;

  return { root, meshes: [handle, head] };
}
