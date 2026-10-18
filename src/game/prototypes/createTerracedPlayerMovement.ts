import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PLAYER_HALF_HEIGHT } from "../models/createPlayer";
import type { TerracedTerrainSampler } from "../world/terrain/terraced/terracedTerrainTypes";

export const TERRACED_PLAYER_SPEED = 5;
export const TERRACED_UPHILL_SPEED_MULTIPLIER = 0.5;
const MAX_HORIZONTAL_STEP = 0.25;
const MOVEMENT_KEYS = new Set([
  "z",
  "w",
  "s",
  "q",
  "a",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

/** Déplacement minimal dédié au spike, sans physique ni collision d'objets. */
export function createTerracedPlayerMovement(
  player: Mesh,
  camera: ArcRotateCamera,
  sampleTerrain: TerracedTerrainSampler,
) {
  const pressedKeys = new Set<string>();

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!MOVEMENT_KEYS.has(key)) return;
    pressedKeys.add(key);
    event.preventDefault();
  });
  window.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key.toLowerCase());
  });
  window.addEventListener("blur", () => pressedKeys.clear());

  return (deltaTimeInSeconds: number) => {
    const forwardInput =
      Number(
        pressedKeys.has("z") ||
          pressedKeys.has("w") ||
          pressedKeys.has("arrowup"),
      ) - Number(pressedKeys.has("s") || pressedKeys.has("arrowdown"));
    const rightInput =
      Number(pressedKeys.has("d") || pressedKeys.has("arrowright")) -
      Number(
        pressedKeys.has("q") ||
          pressedKeys.has("a") ||
          pressedKeys.has("arrowleft"),
      );

    if (forwardInput !== 0 || rightInput !== 0) {
      const cameraForward = camera.target.subtract(camera.position);
      cameraForward.y = 0;
      cameraForward.normalize();
      const cameraRight = camera.getDirection(Vector3.Right());
      cameraRight.y = 0;
      cameraRight.normalize();
      const direction = cameraForward
        .scale(forwardInput)
        .add(cameraRight.scale(rightInput));
      direction.normalize();

      moveHorizontally(
        direction.x * TERRACED_PLAYER_SPEED * deltaTimeInSeconds,
        direction.z * TERRACED_PLAYER_SPEED * deltaTimeInSeconds,
      );
    }

    camera.setTarget(player.position, false, false, true);
  };

  function moveHorizontally(movementX: number, movementZ: number): void {
    const distance = Math.hypot(movementX, movementZ);
    const stepCount = Math.max(1, Math.ceil(distance / MAX_HORIZONTAL_STEP));
    const stepX = movementX / stepCount;
    const stepZ = movementZ / stepCount;

    for (let step = 0; step < stepCount; step += 1) {
      if (!tryStep(stepX, stepZ)) break;
    }
  }

  function tryStep(stepX: number, stepZ: number): boolean {
    const current = sampleTerrain(player.position.x, player.position.z);
    if (!current?.isLand) return false;

    const requested = sampleTerrain(
      player.position.x + stepX,
      player.position.z + stepZ,
    );
    if (!requested?.isLand) return false;

    const requestedLevelDifference = requested.level - current.level;
    if (Math.abs(requestedLevelDifference) >= 2) return false;

    const speedMultiplier =
      requestedLevelDifference === 1 ? TERRACED_UPHILL_SPEED_MULTIPLIER : 1;
    const candidateX = player.position.x + stepX * speedMultiplier;
    const candidateZ = player.position.z + stepZ * speedMultiplier;
    const candidate = sampleTerrain(candidateX, candidateZ);
    if (!candidate?.isLand || Math.abs(candidate.level - current.level) >= 2) {
      return false;
    }

    player.position.set(
      candidateX,
      candidate.height + PLAYER_HALF_HEIGHT,
      candidateZ,
    );
    return true;
  }
}
