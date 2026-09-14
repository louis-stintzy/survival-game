import {
  TERRAIN_GRID_STEP,
  TERRAIN_HALF_SIZE,
  WATER_HEIGHT,
} from "./terrainDefinitions";
import type { TerrainData } from "./terrainTypes";

const ISLAND_RADIUS_X = 30;
const ISLAND_RADIUS_Z = 26;
const SEABED_HEIGHT = -0.9;
const INTERIOR_HEIGHT = 0.75;
const COAST_TRANSITION_START = -0.18;
const COAST_TRANSITION_END = 0.2;
const EAST_HILL_CENTER_X = 12;
const EAST_HILL_CENTER_Z = -4;
const EAST_HILL_RADIUS = 7;
const EAST_HILL_HEIGHT = 1;

/**
 * Crée le heightfield fixe utilisé pour valider le futur contrat du terrain.
 * Cette forme volontairement simple sera remplacée par la génération seedée.
 */
export function createBaseTerrainData(): TerrainData {
  const gridSize = (TERRAIN_HALF_SIZE * 2) / TERRAIN_GRID_STEP + 1;
  const heights: number[] = [];

  for (let zIndex = 0; zIndex < gridSize; zIndex += 1) {
    const z = -TERRAIN_HALF_SIZE + zIndex * TERRAIN_GRID_STEP;
    for (let xIndex = 0; xIndex < gridSize; xIndex += 1) {
      const x = -TERRAIN_HALF_SIZE + xIndex * TERRAIN_GRID_STEP;
      heights.push(calculateBaseHeight(x, z));
    }
  }

  return {
    halfSize: TERRAIN_HALF_SIZE,
    gridStep: TERRAIN_GRID_STEP,
    gridSize,
    waterHeight: WATER_HEIGHT,
    heights,
  };
}

function calculateBaseHeight(x: number, z: number): number {
  const islandSignal =
    1 - Math.hypot(x / ISLAND_RADIUS_X, z / ISLAND_RADIUS_Z);
  const landBlend = smoothstep(
    COAST_TRANSITION_START,
    COAST_TRANSITION_END,
    islandSignal,
  );
  const baseHeight =
    SEABED_HEIGHT + (INTERIOR_HEIGHT - SEABED_HEIGHT) * landBlend;

  // Une bosse douce et fixe fournit quelques surfaces rocheuses de test.
  const hillDistance = Math.hypot(
    x - EAST_HILL_CENTER_X,
    z - EAST_HILL_CENTER_Z,
  );
  const hillBlend = 1 - smoothstep(0, EAST_HILL_RADIUS, hillDistance);
  return baseHeight + EAST_HILL_HEIGHT * hillBlend * landBlend;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
