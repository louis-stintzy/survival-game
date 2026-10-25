import { generateIslandShape } from "../../generation/generateIslandShape";
import { generateIslandTopography } from "../../generation/generateIslandTopography";
import { generateIslandRockMask } from "../../generation/generateIslandRockMask";
import {
  BASE_TERRACED_CELL_SIZE,
  BASE_TERRACED_COLUMN_COUNT,
  BASE_TERRACED_HEIGHT_STEP,
  BASE_TERRACED_ROW_COUNT,
  BASE_TERRACED_WATER_HEIGHT,
} from "./createBaseTerracedTerrainData";
import type {
  TerracedCell,
  TerracedTerrainData,
} from "./terracedTerrainTypes";

export const SEEDED_SAND_MAX_SIGNAL = 0.12;
export const SEEDED_COASTAL_GRASS_MAX_SIGNAL = 0.29;

/** Convertit une silhouette seedée pure en cellules terrassées de production. */
export function createSeededTerracedTerrainData(
  seed: number,
): TerracedTerrainData {
  const shape = generateIslandShape({
    seed,
    rowCount: BASE_TERRACED_ROW_COUNT,
    columnCount: BASE_TERRACED_COLUMN_COUNT,
  });
  const topography = generateIslandTopography({ seed, shape });
  const rockMask = generateIslandRockMask({ seed, shape });

  return {
    rowCount: shape.rowCount,
    columnCount: shape.columnCount,
    cellSize: BASE_TERRACED_CELL_SIZE,
    heightStep: BASE_TERRACED_HEIGHT_STEP,
    waterHeight: BASE_TERRACED_WATER_HEIGHT,
    cells: shape.values.map((signal, index) =>
      createTerracedCellFromTopography(
        signal,
        topography.heights[index],
        rockMask.values[index],
      ),
    ),
  };
}

export function createTerracedCellFromTopography(
  signal: number,
  continuousHeight: number,
  isRock = false,
): TerracedCell {
  if (signal <= 0) return { level: 0, surface: "water" };
  if (signal <= SEEDED_SAND_MAX_SIGNAL) {
    return { level: 1, surface: "sand" };
  }
  if (signal <= SEEDED_COASTAL_GRASS_MAX_SIGNAL) {
    return { level: 2, surface: "grass" };
  }
  return {
    level: quantizeTopographyHeight(
      continuousHeight,
      BASE_TERRACED_HEIGHT_STEP,
    ),
    surface: isRock ? "rock" : "grass",
  };
}

export function quantizeTopographyHeight(height: number, heightStep: number) {
  if (
    !Number.isFinite(height) ||
    !Number.isFinite(heightStep) ||
    heightStep <= 0
  ) {
    throw new RangeError(
      "La hauteur doit être finie et le pas de quantification strictement positif.",
    );
  }

  // Math.round choisit la terrasse la plus proche de la hauteur théorique.
  return Math.max(2, Math.round(height / heightStep));
}
