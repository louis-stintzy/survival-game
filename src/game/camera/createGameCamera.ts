import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";

const VIEW_HEIGHT = 28;

export function createGameCamera(scene: Scene, engine: Engine) {
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 4,
    Math.PI / 3.2,
    30,
    Vector3.Zero(),
    scene,
  );
  camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
  camera.inputs.clear();

  // Une caméra orthographique ne rétrécit pas les objets avec la distance.
  // Ses limites doivent suivre le ratio du viewport pour conserver le cadrage.
  const updateOrthographicBounds = () => {
    const aspectRatio = engine.getRenderWidth() / engine.getRenderHeight();
    camera.orthoTop = VIEW_HEIGHT / 2;
    camera.orthoBottom = -VIEW_HEIGHT / 2;
    camera.orthoLeft = (-VIEW_HEIGHT * aspectRatio) / 2;
    camera.orthoRight = (VIEW_HEIGHT * aspectRatio) / 2;
  };

  updateOrthographicBounds();
  engine.onResizeObservable.add(updateOrthographicBounds);

  return camera;
}
