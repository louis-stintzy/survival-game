import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

export function createPlayer(scene: Scene, playerMaterial: StandardMaterial) {
  const player = MeshBuilder.CreateCapsule(
    "player",
    { height: 2.2, radius: 0.55, tessellation: 8 },
    scene,
  );
  player.position = new Vector3(0, 1.85, 0);
  player.material = playerMaterial;
  return player;
}
