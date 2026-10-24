import { generateIslandShape } from "../../generation/generateIslandShape";
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
export const SEEDED_LEVEL_TWO_MAX_SIGNAL = 0.38;
export const SEEDED_LEVEL_THREE_MAX_SIGNAL = 0.68;

/** Convertit une silhouette seedée pure en cellules terrassées de production. */
export function createSeededTerracedTerrainData(
  seed: number,
): TerracedTerrainData {
  const shape = generateIslandShape({
    seed,
    rowCount: BASE_TERRACED_ROW_COUNT,
    columnCount: BASE_TERRACED_COLUMN_COUNT,
  });

  return {
    rowCount: shape.rowCount,
    columnCount: shape.columnCount,
    cellSize: BASE_TERRACED_CELL_SIZE,
    heightStep: BASE_TERRACED_HEIGHT_STEP,
    waterHeight: BASE_TERRACED_WATER_HEIGHT,
    cells: shape.values.map(signalToTerracedCell),
  };
}

function signalToTerracedCell(signal: number): TerracedCell {
  if (signal <= 0) return { level: 0, surface: "water" };
  if (signal <= SEEDED_SAND_MAX_SIGNAL) {
    return { level: 1, surface: "sand" };
  }
  if (signal <= SEEDED_LEVEL_TWO_MAX_SIGNAL) {
    return { level: 2, surface: "grass" };
  }
  if (signal <= SEEDED_LEVEL_THREE_MAX_SIGNAL) {
    return { level: 3, surface: "grass" };
  }
  return { level: 4, surface: "grass" };
}
