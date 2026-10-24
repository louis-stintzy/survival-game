import { describe, expect, test } from "vitest";
import {
  CAMERA_VIEW_HEIGHTS,
  INITIAL_CAMERA_ZOOM_INDEX,
  getNextCameraZoomIndex,
} from "./createCameraZoom";

describe("camera zoom levels", () => {
  test("starts at the 28-unit view height", () => {
    expect(CAMERA_VIEW_HEIGHTS[INITIAL_CAMERA_ZOOM_INDEX]).toBe(28);
  });

  test("moves to the adjacent zoom level", () => {
    expect(getNextCameraZoomIndex(INITIAL_CAMERA_ZOOM_INDEX, -1)).toBe(1);
    expect(getNextCameraZoomIndex(INITIAL_CAMERA_ZOOM_INDEX, 1)).toBe(3);
  });

  test("stays at the closest limit", () => {
    expect(getNextCameraZoomIndex(0, -1)).toBe(0);
    expect(
      getNextCameraZoomIndex(CAMERA_VIEW_HEIGHTS.length - 1, 1),
    ).toBe(CAMERA_VIEW_HEIGHTS.length - 1);
  });
});
