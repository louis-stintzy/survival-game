import { generateIslandShape } from "../../generation/generateIslandShape";
import { generateIslandRelief } from "../../generation/generateIslandRelief";
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
export const SEEDED_RELIEF_SAFE_COAST_MAX_SIGNAL = 0.28;

/** Convertit une silhouette seedée pure en cellules terrassées de production. */
export function createSeededTerracedTerrainData(
  seed: number,
): TerracedTerrainData {
  const shape = generateIslandShape({
    seed,
    rowCount: BASE_TERRACED_ROW_COUNT,
    columnCount: BASE_TERRACED_COLUMN_COUNT,
  });
  const relief = generateIslandRelief({ seed, shape });

  return {
    rowCount: shape.rowCount,
    columnCount: shape.columnCount,
    cellSize: BASE_TERRACED_CELL_SIZE,
    heightStep: BASE_TERRACED_HEIGHT_STEP,
    waterHeight: BASE_TERRACED_WATER_HEIGHT,
    cells: shape.values.map((signal, index) =>
      signalToTerracedCell(signal, relief.levels[index]),
    ),
  };
}

function signalToTerracedCell(
  signal: number,
  reliefLevel: number,
): TerracedCell {
  if (signal <= 0) return { level: 0, surface: "water" };
  if (signal <= SEEDED_SAND_MAX_SIGNAL) {
    return { level: 1, surface: "sand" };
  }
  const level =
    signal <= SEEDED_RELIEF_SAFE_COAST_MAX_SIGNAL
      ? 2
      : Math.max(2, reliefLevel);
  return { level, surface: "grass" };
}
