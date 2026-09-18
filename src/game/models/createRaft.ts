import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { PLAYER_HALF_HEIGHT } from "./createPlayer";
import {
  RAFT_LOG_LENGTH,
  RAFT_NAVIGATION_FOOTPRINT,
  RAFT_WIDTH,
} from "./raftGeometry";

export interface Raft {
  root: TransformNode;
  meshes: Mesh[];
  riderOffsetY: number;
  navigationFootprint: {
    halfWidth: number;
    halfLength: number;
  };
}

const LOG_DIAMETER = 0.45;
const DECK_HEIGHT = 0.16;
const DECK_Y = LOG_DIAMETER + DECK_HEIGHT / 2;

/** Crée le modèle low-poly autonome du radeau de navigation. */
export function createRaft(
  scene: Scene,
  name: string,
  material: StandardMaterial,
): Raft {
  const root = new TransformNode(name, scene);

  const logs = [-0.72, 0, 0.72].map((x, index) => {
    const log = MeshBuilder.CreateCylinder(
      `${name}-log-${index}`,
      {
        height: RAFT_LOG_LENGTH,
        diameter: LOG_DIAMETER,
        tessellation: 8,
      },
      scene,
    );
    log.position.set(x, LOG_DIAMETER / 2, 0);
    log.rotation.x = Math.PI / 2;
    log.material = material;
    log.parent = root;
    return log;
  });

  const crossPlanks = [-1.05, 1.05].map((z, index) => {
    const plank = MeshBuilder.CreateBox(
      `${name}-cross-plank-${index}`,
      { width: RAFT_WIDTH, height: DECK_HEIGHT, depth: 0.28 },
      scene,
    );
    plank.position.set(0, DECK_Y, z);
    plank.material = material;
    plank.parent = root;
    return plank;
  });

  const meshes = [...logs, ...crossPlanks];
  meshes.forEach((mesh) => {
    mesh.isPickable = false;
    mesh.receiveShadows = true;
  });

  return {
    root,
    meshes,
    riderOffsetY: LOG_DIAMETER + DECK_HEIGHT + PLAYER_HALF_HEIGHT,
    navigationFootprint: RAFT_NAVIGATION_FOOTPRINT,
  };
}
