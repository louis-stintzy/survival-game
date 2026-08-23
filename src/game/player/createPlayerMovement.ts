import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

const PLAYER_MOVEMENT_SPEED = 5;
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
) {
  const pressedKeys = new Set<string>();
  const walkableSurfaceSet = new Set(walkableSurfaces);

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
      const nextPosition = player.position.add(
        movementDirection.scale(distance),
      );

      // Ce rayon vertical cherche la vraie surface praticable sous la prochaine
      // position, afin d'en déduire sa hauteur sans tester des zones X/Z en dur.
      const groundRay = new Ray(
        new Vector3(nextPosition.x, GROUND_RAY_START_HEIGHT, nextPosition.z),
        Vector3.Down(),
        GROUND_RAY_LENGTH,
      );
      const groundHit = player.getScene().pickWithRay(
        groundRay,
        (mesh) => walkableSurfaceSet.has(mesh),
      );

      if (groundHit?.pickedPoint) {
        player.position.set(
          nextPosition.x,
          groundHit.pickedPoint.y + PLAYER_HALF_HEIGHT,
          nextPosition.z,
        );
      }
    }

    camera.setTarget(player.position);
  };
}
