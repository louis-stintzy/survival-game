import { GAME_PALETTE } from "../../../constants/gamePalette";
import {
  COASTAL_SEABED_MAX_DISTANCE,
  createCoastalWaterDepthData,
} from "./createCoastalWaterDepthData";
import type { TerracedTerrainData } from "./terracedTerrainTypes";

export const SEABED_FIRST_DEPTH = 0.15;
export const SEABED_DEPTH_STEP = 0.2;

const SEABED_COLOR_VARIATION = 0.0125;
const UINT32_RANGE = 0x1_0000_0000;

type FaceColor = readonly [number, number, number, number];
type FaceNormal = readonly [number, number, number];

const COLORS = {
  top: hexToRgba(GAME_PALETTE.terrain.seabedSandTop),
  side: hexToRgba(GAME_PALETTE.terrain.seabedSandSide),
  deep: hexToRgba(GAME_PALETTE.terrain.seabedDeep),
} as const;

export interface CoastalSeabedGeometry {
  positions: number[];
  indices: number[];
  colors: number[];
  normals: number[];
  topQuadCount: number;
}

/** Construit le fond marin visuel côtier sans modifier le terrain logique. */
export function createCoastalSeabedGeometry(
  terrain: TerracedTerrainData,
): CoastalSeabedGeometry {
  const depthData = createCoastalWaterDepthData(terrain);
  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];
  const minimumX = (-terrain.columnCount * terrain.cellSize) / 2;
  const minimumZ = (-terrain.rowCount * terrain.cellSize) / 2;
  let topQuadCount = 0;

  depthData.distances.forEach((distance, index) => {
    if (distance === 0) return;
    const row = Math.floor(index / terrain.columnCount);
    const column = index % terrain.columnCount;
    const x0 = minimumX + column * terrain.cellSize;
    const x1 = x0 + terrain.cellSize;
    const z0 = minimumZ + row * terrain.cellSize;
    const z1 = z0 + terrain.cellSize;
    const height = getSeabedHeight(terrain.waterHeight, distance);
    addQuad(
      [x0, height, z0, x1, height, z0, x1, height, z1, x0, height, z1],
      varyColor(getTopColor(distance), row, column, distance),
      [0, 1, 0],
    );
    topQuadCount += 1;
  });

  depthData.distances.forEach((distance, index) => {
    if (distance === 0) return;
    const row = Math.floor(index / terrain.columnCount);
    const column = index % terrain.columnCount;
    const x0 = minimumX + column * terrain.cellSize;
    const x1 = x0 + terrain.cellSize;
    const z0 = minimumZ + row * terrain.cellSize;
    const z1 = z0 + terrain.cellSize;
    const upperY = getSeabedHeight(terrain.waterHeight, distance);

    addSide(row - 1, column, "north");
    addSide(row + 1, column, "south");
    addSide(row, column + 1, "east");
    addSide(row, column - 1, "west");

    function addSide(
      neighborRow: number,
      neighborColumn: number,
      direction: "north" | "south" | "east" | "west",
    ): void {
      if (
        neighborRow < 0 ||
        neighborRow >= terrain.rowCount ||
        neighborColumn < 0 ||
        neighborColumn >= terrain.columnCount
      ) {
        return;
      }
      const neighborDistance =
        depthData.distances[
          neighborRow * terrain.columnCount + neighborColumn
        ];
      if (neighborDistance === 0) return;
      const lowerY = getSeabedHeight(
        terrain.waterHeight,
        neighborDistance,
      );
      if (lowerY >= upperY) return;
      const color = varyColor(
        getSideColor(distance),
        row,
        column,
        distance + 10,
      );

      switch (direction) {
        case "north":
          addQuad(
            [x0, lowerY, z0, x1, lowerY, z0, x1, upperY, z0, x0, upperY, z0],
            color,
            [0, 0, -1],
          );
          break;
        case "south":
          addQuad(
            [x1, lowerY, z1, x0, lowerY, z1, x0, upperY, z1, x1, upperY, z1],
            color,
            [0, 0, 1],
          );
          break;
        case "east":
          addQuad(
            [x1, lowerY, z0, x1, lowerY, z1, x1, upperY, z1, x1, upperY, z0],
            color,
            [1, 0, 0],
          );
          break;
        case "west":
          addQuad(
            [x0, lowerY, z1, x0, lowerY, z0, x0, upperY, z0, x0, upperY, z1],
            color,
            [-1, 0, 0],
          );
          break;
      }
    }
  });

  return { positions, indices, colors, normals, topQuadCount };

  function addQuad(
    coordinates: readonly number[],
    color: FaceColor,
    normal: FaceNormal,
  ): void {
    const firstVertex = positions.length / 3;
    positions.push(...coordinates);
    indices.push(
      firstVertex,
      firstVertex + 1,
      firstVertex + 2,
      firstVertex,
      firstVertex + 2,
      firstVertex + 3,
    );
    for (let vertex = 0; vertex < 4; vertex += 1) {
      colors.push(...color);
      normals.push(...normal);
    }
  }
}

export function getSeabedHeight(
  waterHeight: number,
  distance: number,
): number {
  return (
    waterHeight -
    SEABED_FIRST_DEPTH -
    (distance - 1) * SEABED_DEPTH_STEP
  );
}

function getTopColor(distance: number): FaceColor {
  return interpolateColor(
    COLORS.top,
    COLORS.deep,
    (distance - 1) / (COASTAL_SEABED_MAX_DISTANCE - 1),
  );
}

function getSideColor(distance: number): FaceColor {
  return interpolateColor(
    COLORS.side,
    COLORS.deep,
    (distance - 1) / (COASTAL_SEABED_MAX_DISTANCE - 1),
  );
}

function interpolateColor(
  start: FaceColor,
  end: FaceColor,
  amount: number,
): FaceColor {
  return [
    start[0] + (end[0] - start[0]) * amount,
    start[1] + (end[1] - start[1]) * amount,
    start[2] + (end[2] - start[2]) * amount,
    1,
  ];
}

function varyColor(
  color: FaceColor,
  row: number,
  column: number,
  salt: number,
): FaceColor {
  let hash =
    Math.imul(row + 1, 0x1f12_3bb5) ^
    Math.imul(column + 1, 0x5f35_6495) ^
    Math.imul(salt + 1, 0x6c8e_9cf5);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb_352d);
  hash ^= hash >>> 15;
  const variation = ((hash >>> 0) / UINT32_RANGE) * 2 - 1;
  const factor = 1 + variation * SEABED_COLOR_VARIATION;
  return [
    clampColor(color[0] * factor),
    clampColor(color[1] * factor),
    clampColor(color[2] * factor),
    1,
  ];
}

function clampColor(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hexToRgba(hexColor: string): FaceColor {
  const value = Number.parseInt(hexColor.slice(1), 16);
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
    1,
  ];
}
