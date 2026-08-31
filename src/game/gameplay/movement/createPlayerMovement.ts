import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

const PLAYER_MOVEMENT_SPEED = 5;
const PLAYER_VERTICAL_SPEED = 4;
const PLAYER_HALF_HEIGHT = 1.1;
const GROUND_RAY_START_HEIGHT = 10;
const GROUND_RAY_LENGTH = 20;
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

export function createPlayerMovement(
  player: Mesh,
  camera: ArcRotateCamera,
  walkableSurfaces: readonly AbstractMesh[],
  isPositionBlocked: (x: number, z: number) => boolean,
) {
  const pressedKeys = new Set<string>();
  const walkableSurfaceSet = new Set(walkableSurfaces);
  let targetPlayerHeight = player.position.y;

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (MOVEMENT_KEYS.has(key)) {
      pressedKeys.add(key);
      event.preventDefault();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    pressedKeys.delete(event.key.toLowerCase());
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
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
      // Les axes de la caméra sont projetés sur X/Z : les touches correspondent
      // ainsi au haut et aux côtés de l'écran malgré la vue isométrique.
      const cameraForward = camera.target.subtract(camera.position);
      cameraForward.y = 0;
      cameraForward.normalize();

      const cameraRight = camera.getDirection(Vector3.Right());
      cameraRight.y = 0;
      cameraRight.normalize();

      const movementDirection = cameraForward
        .scale(forwardInput)
        .add(cameraRight.scale(rightInput));

      // Normaliser conserve la même vitesse lorsque deux touches forment une diagonale.
      movementDirection.normalize();

      // Le delta time rend la distance parcourue indépendante du nombre d'images par seconde.
      const distance = PLAYER_MOVEMENT_SPEED * deltaTimeInSeconds;
      const movement = movementDirection.scale(distance);
      const nextX = player.position.x + movement.x;
      const nextZ = player.position.z + movement.z;

      if (!tryMoveTo(nextX, nextZ)) {
        // Tester séparément les axes conserve la composante libre du mouvement
        // lorsqu'une diagonale rencontre un obstacle.
        tryMoveTo(nextX, player.position.z);
        tryMoveTo(player.position.x, nextZ);
      }
    }

    // Une vitesse multipliée par le delta time lisse Y de la même manière,
    // quel que soit le nombre d'images affichées chaque seconde.
    const remainingHeight = targetPlayerHeight - player.position.y;
    const maximumVerticalStep = PLAYER_VERTICAL_SPEED * deltaTimeInSeconds;
    if (Math.abs(remainingHeight) <= maximumVerticalStep) {
      player.position.y = targetPlayerHeight;
    } else {
      player.position.y += Math.sign(remainingHeight) * maximumVerticalStep;
    }

    camera.setTarget(player.position);
  };

  function tryMoveTo(x: number, z: number): boolean {
    if (isPositionBlocked(x, z)) return false;

    // Ce rayon vertical cherche la vraie surface praticable sous chaque position
    // candidate : collision et ancrage au terrain valident le même déplacement.
    const groundRay = new Ray(
      new Vector3(x, GROUND_RAY_START_HEIGHT, z),
      Vector3.Down(),
      GROUND_RAY_LENGTH,
    );
    const groundHit = player
      .getScene()
      .pickWithRay(groundRay, (mesh) => walkableSurfaceSet.has(mesh));
    if (!groundHit?.pickedPoint) return false;

    player.position.x = x;
    player.position.z = z;
    targetPlayerHeight = groundHit.pickedPoint.y + PLAYER_HALF_HEIGHT;
    return true;
  }
}
