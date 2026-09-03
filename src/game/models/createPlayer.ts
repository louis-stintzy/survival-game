import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

const PLAYER_HEIGHT = 2.2;

export function createPlayer(
  scene: Scene,
  playerMaterial: StandardMaterial,
  spawnGroundPosition: Vector3,
) {
  const player = MeshBuilder.CreateCapsule(
    "player",
    { height: PLAYER_HEIGHT, radius: 0.55, tessellation: 8 },
    scene,
  );
  player.position = player.position = new Vector3(
    spawnGroundPosition.x,
    spawnGroundPosition.y + PLAYER_HEIGHT / 2,
    spawnGroundPosition.z,
  );
  player.material = playerMaterial;
  return player;
}
