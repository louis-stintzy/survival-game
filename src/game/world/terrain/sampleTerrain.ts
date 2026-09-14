import {
  BEACH_MAX_HEIGHT,
  ROCK_MIN_HEIGHT,
  ROCK_MIN_SLOPE,
} from "./terrainDefinitions";
import type {
  TerrainData,
  TerrainSample,
  TerrainSurface,
} from "./terrainTypes";

/** Échantillonne directement l'un des deux triangles de la cellule concernée. */
export function sampleTerrain(
  terrain: TerrainData,
  x: number,
  z: number,
): TerrainSample | undefined {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(z) ||
    x < -terrain.halfSize ||
    x > terrain.halfSize ||
    z < -terrain.halfSize ||
    z > terrain.halfSize
  ) {
    return undefined;
  }

  const gridX = (x + terrain.halfSize) / terrain.gridStep;
  const gridZ = (z + terrain.halfSize) / terrain.gridStep;
  const xIndex = Math.min(Math.floor(gridX), terrain.gridSize - 2);
  const zIndex = Math.min(Math.floor(gridZ), terrain.gridSize - 2);
  const xAmount = gridX - xIndex;
  const zAmount = gridZ - zIndex;
  const firstIndex = zIndex * terrain.gridSize + xIndex;
  const heightA = terrain.heights[firstIndex];
  const heightB = terrain.heights[firstIndex + 1];
  const heightC = terrain.heights[firstIndex + terrain.gridSize];
  const heightD = terrain.heights[firstIndex + terrain.gridSize + 1];

  let height: number;
  let heightChangeX: number;
  let heightChangeZ: number;
  if (xAmount >= zAmount) {
    // Triangle A-B-D, au-dessus de la diagonale A-D dans la cellule.
    height =
      heightA +
      (heightB - heightA) * xAmount +
      (heightD - heightB) * zAmount;
    heightChangeX = heightB - heightA;
    heightChangeZ = heightD - heightB;
  } else {
    // Triangle A-D-C, sous la diagonale A-D dans la cellule.
    height =
      heightA +
      (heightD - heightC) * xAmount +
      (heightC - heightA) * zAmount;
    heightChangeX = heightD - heightC;
    heightChangeZ = heightC - heightA;
  }

  const slope = Math.hypot(heightChangeX, heightChangeZ) / terrain.gridStep;
  const surface = classifyTerrainSurface(
    height,
    slope,
    terrain.waterHeight,
  );
  return {
    height,
    slope,
    surface,
    isLand: surface !== "water",
  };
}

function classifyTerrainSurface(
  height: number,
  slope: number,
  waterHeight: number,
): TerrainSurface {
  if (height <= waterHeight) return "water";
  if (height <= BEACH_MAX_HEIGHT) return "beach";
  if (height >= ROCK_MIN_HEIGHT || slope >= ROCK_MIN_SLOPE) return "rock";
  return "grass";
}
