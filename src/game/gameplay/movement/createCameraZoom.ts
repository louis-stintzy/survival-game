import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import {
  applyOrthographicViewHeight,
  INITIAL_CAMERA_VIEW_HEIGHT,
} from "../../camera/createGameCamera";

export const CAMERA_VIEW_HEIGHTS = [
  18,
  23,
  INITIAL_CAMERA_VIEW_HEIGHT,
  34,
  40,
] as const;
export const INITIAL_CAMERA_ZOOM_INDEX = CAMERA_VIEW_HEIGHTS.indexOf(
  INITIAL_CAMERA_VIEW_HEIGHT,
);
const CAMERA_ZOOM_DURATION_SECONDS = 0.2;

export function getNextCameraZoomIndex(
  currentIndex: number,
  direction: -1 | 1,
) {
  return Math.max(
    0,
    Math.min(CAMERA_VIEW_HEIGHTS.length - 1, currentIndex + direction),
  );
}

/** Anime les paliers du volume orthographique sans réactiver les inputs natifs. */
export function createCameraZoom(camera: ArcRotateCamera, engine: AbstractEngine) {
  const canvas = engine.getRenderingCanvas();
  let targetIndex = INITIAL_CAMERA_ZOOM_INDEX;
  let startViewHeight = INITIAL_CAMERA_VIEW_HEIGHT;
  let targetViewHeight = INITIAL_CAMERA_VIEW_HEIGHT;
  let elapsed = CAMERA_ZOOM_DURATION_SECONDS;

  canvas?.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (event.deltaY === 0) return;

      const nextIndex = getNextCameraZoomIndex(
        targetIndex,
        event.deltaY < 0 ? -1 : 1,
      );
      if (nextIndex === targetIndex) return;

      targetIndex = nextIndex;
      startViewHeight = getCurrentViewHeight(camera);
      targetViewHeight = CAMERA_VIEW_HEIGHTS[targetIndex];
      elapsed = 0;
    },
    { passive: false },
  );

  return (deltaTimeInSeconds: number) => {
    if (elapsed >= CAMERA_ZOOM_DURATION_SECONDS) return;

    elapsed = Math.min(
      elapsed + deltaTimeInSeconds,
      CAMERA_ZOOM_DURATION_SECONDS,
    );
    const progress = elapsed / CAMERA_ZOOM_DURATION_SECONDS;
    const smoothProgress = progress * progress * (3 - 2 * progress);
    const viewHeight =
      startViewHeight +
      (targetViewHeight - startViewHeight) * smoothProgress;

    applyOrthographicViewHeight(camera, engine, viewHeight);
  };
}

function getCurrentViewHeight(camera: ArcRotateCamera) {
  if (camera.orthoTop === null || camera.orthoBottom === null) {
    return INITIAL_CAMERA_VIEW_HEIGHT;
  }
  return camera.orthoTop - camera.orthoBottom;
}
