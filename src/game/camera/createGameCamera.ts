import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

const INITIAL_CAMERA_ALPHA = -Math.PI / 2.15;
const INITIAL_CAMERA_BETA = Math.PI / 3.2;
const CAMERA_RADIUS = 30;
export const INITIAL_CAMERA_VIEW_HEIGHT = 28;

/** Applique une hauteur de vue orthographique en conservant les proportions. */
export function applyOrthographicViewHeight(
  camera: ArcRotateCamera,
  engine: AbstractEngine,
  viewHeight: number,
) {
  const aspectRatio = engine.getRenderWidth() / engine.getRenderHeight();
  camera.orthoTop = viewHeight / 2;
  camera.orthoBottom = -viewHeight / 2;
  camera.orthoLeft = (-viewHeight * aspectRatio) / 2;
  camera.orthoRight = (viewHeight * aspectRatio) / 2;
}

export function createGameCamera(scene: Scene, engine: Engine) {
  const camera = new ArcRotateCamera(
    "camera",
    INITIAL_CAMERA_ALPHA,
    INITIAL_CAMERA_BETA,
    CAMERA_RADIUS,
    Vector3.Zero(),
    scene,
  );
  camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
  camera.inputs.clear();

  // Une caméra orthographique ne rétrécit pas les objets avec la distance.
  // Ses limites doivent suivre le ratio du viewport pour conserver le cadrage.
  const updateOrthographicBounds = () =>
    applyOrthographicViewHeight(
      camera,
      engine,
      getOrthographicViewHeight(camera),
    );

  applyOrthographicViewHeight(camera, engine, INITIAL_CAMERA_VIEW_HEIGHT);
  engine.onResizeObservable.add(updateOrthographicBounds);

  return camera;
}

function getOrthographicViewHeight(camera: ArcRotateCamera) {
  if (camera.orthoTop === null || camera.orthoBottom === null) {
    return INITIAL_CAMERA_VIEW_HEIGHT;
  }
  return camera.orthoTop - camera.orthoBottom;
}
