import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

const QUARTER_TURN = Math.PI / 2;
const CAMERA_ROTATION_DURATION_SECONDS = 0.25;

export function createCameraRotation(camera: ArcRotateCamera) {
  let requestedDirection = 0;
  let rotationInProgress = false;
  let rotationStartAlpha = camera.alpha;
  let rotationTargetAlpha = camera.alpha;
  let rotationElapsed = 0;

  window.addEventListener("keydown", (event) => {
    if (
      event.repeat ||
      event.key.toLowerCase() !== "c" ||
      rotationInProgress ||
      requestedDirection !== 0
    ) {
      return;
    }

    requestedDirection = event.shiftKey ? -1 : 1;
    event.preventDefault();
  });

  window.addEventListener("blur", () => {
    requestedDirection = 0;
  });

  return (deltaTimeInSeconds: number) => {
    if (!rotationInProgress && requestedDirection !== 0) {
      rotationStartAlpha = camera.alpha;
      rotationTargetAlpha =
        rotationStartAlpha + requestedDirection * QUARTER_TURN;
      rotationElapsed = 0;
      rotationInProgress = true;
      requestedDirection = 0;
    }

    if (!rotationInProgress) return;

    rotationElapsed = Math.min(
      rotationElapsed + deltaTimeInSeconds,
      CAMERA_ROTATION_DURATION_SECONDS,
    );
    const progress = rotationElapsed / CAMERA_ROTATION_DURATION_SECONDS;
    const smoothProgress = progress * progress * (3 - 2 * progress);

    // alpha est l'angle horizontal de l'ArcRotateCamera : seul cet angle
    // change, tandis que l'inclinaison, le rayon et le zoom restent intacts.
    camera.alpha =
      rotationStartAlpha +
      (rotationTargetAlpha - rotationStartAlpha) * smoothProgress;
    // L'ArcRotateCamera dérive sa position de ses angles. La recalculer ici
    // permet au déplacement du même frame d'utiliser l'orientation affichée.
    camera.getViewMatrix(true);

    if (rotationElapsed === CAMERA_ROTATION_DURATION_SECONDS) {
      camera.alpha = rotationTargetAlpha;
      rotationInProgress = false;
    }
  };
}
