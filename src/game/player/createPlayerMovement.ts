import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

const PLAYER_MOVEMENT_SPEED = 5;
const MOVEMENT_KEYS = new Set(["z", "w", "s", "q", "a", "d"]);

export function createPlayerMovement(player: Mesh, camera: ArcRotateCamera) {
  const pressedKeys = new Set<string>();

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
      Number(pressedKeys.has("z") || pressedKeys.has("w")) -
      Number(pressedKeys.has("s"));
    const rightInput =
      Number(pressedKeys.has("d")) -
      Number(pressedKeys.has("q") || pressedKeys.has("a"));

    if (forwardInput !== 0 || rightInput !== 0) {
      // Les axes de la caméra sont projetés sur X/Z : les touches correspondent
      // ainsi au haut et aux côtés de l'écran malgré la vue isométrique.
      const cameraForward = camera.getForwardRay().direction;
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
      player.position.addInPlace(movementDirection.scale(distance));
    }

    camera.setTarget(player.position);
  };
}
