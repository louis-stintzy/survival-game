import { GAME_PALETTE } from "../../../constants/gamePalette";
import {
  COASTAL_SEABED_MAX_DISTANCE,
  createCoastalWaterDepthData,
} from "./createCoastalWaterDepthData";
import type { TerracedTerrainData } from "./terracedTerrainTypes";

export const SHORE_SEABED_DEPTH = 0.1;
export const DEEP_SEABED_DEPTH = 1.1;

const SEABED_COLOR_VARIATION = 0.0125;
const UINT32_RANGE = 0x1_0000_0000;

type VertexColor = readonly [number, number, number, number];

const COLORS = {
  shallow: hexToRgba(GAME_PALETTE.terrain.seabedShallow),
  deep: hexToRgba(GAME_PALETTE.terrain.seabedDeep),
} as const;

export interface CoastalSeabedGeometry {
  positions: number[];
  indices: number[];
  colors: number[];
  normals: number[];
}

/**
 * Construit une surface sous-marine continue et strictement visuelle. Les
 * cellules d'eau voisines partagent leurs sommets, contrairement au terrain
 * terrestre terrassé ; aucune paroi verticale interne n'est générée.
 */
export function createCoastalSeabedGeometry(
  terrain: TerracedTerrainData,
): CoastalSeabedGeometry {
  const depthData = createCoastalWaterDepthData(terrain);
  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const minimumX = (-terrain.columnCount * terrain.cellSize) / 2;
  const minimumZ = (-terrain.rowCount * terrain.cellSize) / 2;
  const vertexIndices = new Map<number, number>();

  for (let row = 0; row < terrain.rowCount; row += 1) {
    for (let column = 0; column < terrain.columnCount; column += 1) {
      const cellIndex = row * terrain.columnCount + column;
      if (terrain.cells[cellIndex].surface !== "water") continue;

      const first = getOrCreateVertex(row, column);
      const second = getOrCreateVertex(row, column + 1);
      const third = getOrCreateVertex(row + 1, column + 1);
      const fourth = getOrCreateVertex(row + 1, column);
      indices.push(first, second, third, first, third, fourth);
    }
  }

  return {
    positions,
    indices,
    colors,
    normals: computeSmoothNormals(positions, indices),
  };

  function getOrCreateVertex(vertexRow: number, vertexColumn: number): number {
    const vertexKey = vertexRow * (terrain.columnCount + 1) + vertexColumn;
    const existing = vertexIndices.get(vertexKey);
    if (existing !== undefined) return existing;

    const averageDistance = getAverageAdjacentDistance(
      vertexRow,
      vertexColumn,
    );
    const blend = getSeabedBlend(averageDistance);
    const x = minimumX + vertexColumn * terrain.cellSize;
    const z = minimumZ + vertexRow * terrain.cellSize;
    const y = getSeabedHeight(terrain.waterHeight, averageDistance);
    const vertexIndex = positions.length / 3;
    positions.push(x, y, z);
    colors.push(
      ...varyColor(
        interpolateColor(COLORS.shallow, COLORS.deep, blend),
        vertexRow,
        vertexColumn,
      ),
    );
    vertexIndices.set(vertexKey, vertexIndex);
    return vertexIndex;
  }

  function getAverageAdjacentDistance(
    vertexRow: number,
    vertexColumn: number,
  ): number {
    let totalDistance = 0;
    let adjacentCellCount = 0;

    for (const rowOffset of [-1, 0]) {
      for (const columnOffset of [-1, 0]) {
        const cellRow = vertexRow + rowOffset;
        const cellColumn = vertexColumn + columnOffset;
        if (
          cellRow < 0 ||
          cellRow >= terrain.rowCount ||
          cellColumn < 0 ||
          cellColumn >= terrain.columnCount
        ) {
          continue;
        }
        const cellIndex = cellRow * terrain.columnCount + cellColumn;
        const cell = terrain.cells[cellIndex];
        totalDistance +=
          cell.surface === "water"
            ? depthData.distances[cellIndex] || COASTAL_SEABED_MAX_DISTANCE
            : 0;
        adjacentCellCount += 1;
      }
    }

    return totalDistance / adjacentCellCount;
  }
}

export function getSeabedHeight(
  waterHeight: number,
  distance: number,
): number {
  return waterHeight - getSeabedDepth(distance);
}

export function getSeabedDepth(distance: number): number {
  const blend = getSeabedBlend(distance);
  return (
    SHORE_SEABED_DEPTH +
    (DEEP_SEABED_DEPTH - SHORE_SEABED_DEPTH) * blend
  );
}

function getSeabedBlend(distance: number): number {
  const amount = Math.min(
    1,
    Math.max(0, distance / COASTAL_SEABED_MAX_DISTANCE),
  );
  return amount * amount * (3 - 2 * amount);
}

function computeSmoothNormals(
  positions: readonly number[],
  indices: readonly number[],
): number[] {
  const normals = Array<number>(positions.length).fill(0);

  for (let index = 0; index < indices.length; index += 3) {
    const first = indices[index] * 3;
    const second = indices[index + 1] * 3;
    const third = indices[index + 2] * 3;
    const firstEdge = [
      positions[second] - positions[first],
      positions[second + 1] - positions[first + 1],
      positions[second + 2] - positions[first + 2],
    ];
    const secondEdge = [
      positions[third] - positions[first],
      positions[third + 1] - positions[first + 1],
      positions[third + 2] - positions[first + 2],
    ];
    // Ordre inversé adapté au winding Babylon A-B-D / A-D-C.
    const faceNormal = [
      secondEdge[1] * firstEdge[2] - secondEdge[2] * firstEdge[1],
      secondEdge[2] * firstEdge[0] - secondEdge[0] * firstEdge[2],
      secondEdge[0] * firstEdge[1] - secondEdge[1] * firstEdge[0],
    ];
    for (const vertex of [first, second, third]) {
      normals[vertex] += faceNormal[0];
      normals[vertex + 1] += faceNormal[1];
      normals[vertex + 2] += faceNormal[2];
    }
  }

  for (let index = 0; index < normals.length; index += 3) {
    const length = Math.hypot(
      normals[index],
      normals[index + 1],
      normals[index + 2],
    );
    if (length === 0) {
      normals[index + 1] = 1;
      continue;
    }
    normals[index] /= length;
    normals[index + 1] /= length;
    normals[index + 2] /= length;
  }
  return normals;
}

function interpolateColor(
  start: VertexColor,
  end: VertexColor,
  amount: number,
): VertexColor {
  return [
    start[0] + (end[0] - start[0]) * amount,
    start[1] + (end[1] - start[1]) * amount,
    start[2] + (end[2] - start[2]) * amount,
    1,
  ];
}

function varyColor(
  color: VertexColor,
  row: number,
  column: number,
): VertexColor {
  let hash =
    Math.imul(row + 1, 0x1f12_3bb5) ^
    Math.imul(column + 1, 0x5f35_6495);
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

function hexToRgba(hexColor: string): VertexColor {
  const value = Number.parseInt(hexColor.slice(1), 16);
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
    1,
  ];
}
