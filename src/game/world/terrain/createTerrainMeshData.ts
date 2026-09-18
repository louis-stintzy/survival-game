import { GAME_PALETTE } from "../../constants/gamePalette";
import {
  BEACH_MAX_HEIGHT,
  ROCK_MIN_HEIGHT,
} from "./terrainDefinitions";
import type { TerrainData } from "./terrainTypes";

export interface TerrainMeshData {
  positions: number[];
  indices: number[];
  colors: number[];
}

const TERRAIN_COLORS = {
  seabed: hexToRgba("#766B55"),
  beach: hexToRgba(GAME_PALETTE.world.sand),
  grass: hexToRgba(GAME_PALETTE.world.grass),
  rock: hexToRgba(GAME_PALETTE.world.rock),
} as const;

/**
 * Convertit le heightfield en buffers de mesh sans dupliquer ses sommets.
 *
 * TerrainData, le mesh et sampleTerrain doivent impérativement conserver le
 * même ordre de sommets, le même gridSize, la diagonale A-D et les triangles
 * A-B-D / A-D-C. Sinon rendu et sampling décriraient des plans différents.
 */
export function createTerrainMeshData(
  terrain: TerrainData,
): TerrainMeshData {
  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  for (let zIndex = 0; zIndex < terrain.gridSize; zIndex += 1) {
    const z = -terrain.halfSize + zIndex * terrain.gridStep;
    for (let xIndex = 0; xIndex < terrain.gridSize; xIndex += 1) {
      const x = -terrain.halfSize + xIndex * terrain.gridStep;
      const height = terrain.heights[zIndex * terrain.gridSize + xIndex];
      positions.push(x, height, z);
      colors.push(...getTerrainVertexColor(height, terrain.waterHeight));
    }
  }

  for (let zIndex = 0; zIndex < terrain.gridSize - 1; zIndex += 1) {
    for (let xIndex = 0; xIndex < terrain.gridSize - 1; xIndex += 1) {
      const vertexA = zIndex * terrain.gridSize + xIndex;
      const vertexB = vertexA + 1;
      const vertexC = vertexA + terrain.gridSize;
      const vertexD = vertexC + 1;
      indices.push(vertexA, vertexB, vertexD, vertexA, vertexD, vertexC);
    }
  }

  return { positions, indices, colors };
}

function getTerrainVertexColor(
  height: number,
  waterHeight: number,
): readonly [number, number, number, number] {
  if (height <= waterHeight) return TERRAIN_COLORS.seabed;
  if (height <= BEACH_MAX_HEIGHT) return TERRAIN_COLORS.beach;
  if (height >= ROCK_MIN_HEIGHT) return TERRAIN_COLORS.rock;
  return TERRAIN_COLORS.grass;
}

function hexToRgba(hexColor: string): readonly [number, number, number, number] {
  const value = Number.parseInt(hexColor.slice(1), 16);
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
    1,
  ];
}
