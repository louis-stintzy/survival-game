import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

interface WorkbenchMaterials {
  wood: StandardMaterial;
  stone: StandardMaterial;
}

export interface Workbench {
  root: TransformNode;
  meshes: Mesh[];
}

export function createWorkbench(
  scene: Scene,
  name: string,
  materials: WorkbenchMaterials,
): Workbench {
  const root = new TransformNode(name, scene);
  const top = MeshBuilder.CreateBox(
    `${name}-top`,
    { width: 2.3, height: 0.18, depth: 1.2 },
    scene,
  );
  top.position.y = 1;
  top.material = materials.wood;
  top.parent = root;

  const legPositions = [
    [-0.95, -0.43],
    [-0.95, 0.43],
    [0.95, -0.43],
    [0.95, 0.43],
  ];
  const legs = legPositions.map(([x, z], index) => {
    const leg = MeshBuilder.CreateBox(
      `${name}-leg-${index}`,
      { width: 0.18, height: 0.9, depth: 0.18 },
      scene,
    );
    leg.position.set(x, 0.45, z);
    leg.material = materials.wood;
    leg.parent = root;
    return leg;
  });

  const stonePlate = MeshBuilder.CreateBox(
    `${name}-stone-plate`,
    { width: 0.65, height: 0.16, depth: 0.48 },
    scene,
  );
  stonePlate.position.set(0.55, 1.17, 0);
  stonePlate.material = materials.stone;
  stonePlate.parent = root;

  const meshes = [top, ...legs, stonePlate];
  meshes.forEach((mesh) => {
    mesh.isPickable = false;
    mesh.receiveShadows = true;
  });

  return { root, meshes };
}
