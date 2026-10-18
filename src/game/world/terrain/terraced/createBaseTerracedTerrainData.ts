import type { TerracedCell, TerracedTerrainData } from "./terracedTerrainTypes";

export const BASE_TERRACED_ROW_COUNT = 101;
export const BASE_TERRACED_COLUMN_COUNT = 101;
export const BASE_TERRACED_CELL_SIZE = 1.65;
export const BASE_TERRACED_HEIGHT_STEP = 0.4;
export const BASE_TERRACED_WATER_HEIGHT = 0.3;

const ISLAND_RADIUS_X = 21;
const ISLAND_RADIUS_Z = 18;
const BEACH_START = 0.82;
const MIDDLE_TERRACE_START = 0.58;
const HIGH_TERRACE_START = 0.32;

/**
 * Produit une île fixe et lisible destinée à préparer l'intégration du terrain
 * terrassé. Elle ne constitue pas un générateur procédural.
 */
export function createBaseTerracedTerrainData(): TerracedTerrainData {
  const cells: TerracedCell[] = [];
  const centerRow = (BASE_TERRACED_ROW_COUNT - 1) / 2;
  const centerColumn = (BASE_TERRACED_COLUMN_COUNT - 1) / 2;

  for (let row = 0; row < BASE_TERRACED_ROW_COUNT; row += 1) {
    for (let column = 0; column < BASE_TERRACED_COLUMN_COUNT; column += 1) {
      const x = column - centerColumn;
      const z = row - centerRow;
      const distanceFromCenter = Math.hypot(
        x / ISLAND_RADIUS_X,
        z / ISLAND_RADIUS_Z,
      );

      cells.push(createCell(x, z, distanceFromCenter));
    }
  }

  return {
    rowCount: BASE_TERRACED_ROW_COUNT,
    columnCount: BASE_TERRACED_COLUMN_COUNT,
    cellSize: BASE_TERRACED_CELL_SIZE,
    heightStep: BASE_TERRACED_HEIGHT_STEP,
    waterHeight: BASE_TERRACED_WATER_HEIGHT,
    cells,
  };
}

function createCell(
  x: number,
  z: number,
  distanceFromCenter: number,
): TerracedCell {
  if (distanceFromCenter > 1) return { level: 0, surface: "water" };
  if (distanceFromCenter > BEACH_START) {
    return { level: 1, surface: "sand" };
  }

  let level = 4;
  if (distanceFromCenter > MIDDLE_TERRACE_START) level = 2;
  else if (distanceFromCenter > HIGH_TERRACE_START) level = 3;

  // Une ellipse décentrée démontre qu'une surface rocheuse n'impose pas son niveau.
  const inRockArea = Math.hypot((x - 8) / 6, (z + 3) / 5) <= 1;
  return { level, surface: inRockArea ? "rock" : "grass" };
}
