import type {
  TerracedCell,
  TerracedTerrainData,
} from "../world/terrain/terraced/terracedTerrainTypes";

export const TERRACED_CELL_SIZE = 1.65;
export const TERRACED_HEIGHT_STEP = 0.4;
export const TERRACED_WATER_HEIGHT = 0.3;

const W = { level: 0, surface: "water" } as const;
const S1 = { level: 1, surface: "sand" } as const;
const G1 = { level: 1, surface: "grass" } as const;
const G2 = { level: 2, surface: "grass" } as const;
const G3 = { level: 3, surface: "grass" } as const;
const G4 = { level: 4, surface: "grass" } as const;
const R2 = { level: 2, surface: "rock" } as const;
const R4 = { level: 4, surface: "rock" } as const;
const R5 = { level: 5, surface: "rock" } as const;

/**
 * Carte fixe du spike. Les codes associent explicitement une surface et un
 * niveau indépendants : G4 est de l'herbe haute, R2 de la roche basse.
 */
const TERRACED_CELL_ROWS: readonly (readonly TerracedCell[])[] = [
  [W, W, W, W, W, W, W, W, W, W, W, W],
  [W, W, S1, S1, S1, S1, S1, S1, S1, W, W, W],
  [W, S1, S1, G1, G2, G2, G2, G2, S1, S1, W, W],
  [W, S1, G2, G2, G2, G2, G3, G3, R2, S1, S1, W],
  [W, S1, G2, G2, G2, G2, G4, G4, R2, G2, S1, W],
  [W, S1, G2, G2, G2, G3, G4, G4, R4, R2, S1, W],
  [W, S1, G2, G2, G2, G3, G4, G4, R5, R2, S1, W],
  [W, S1, G2, G2, G2, G3, G3, G4, R4, G2, S1, W],
  [W, S1, G1, G2, G2, G2, G3, G4, R4, G2, S1, W],
  [W, W, S1, G1, G2, G2, G2, G3, G2, S1, W, W],
  [W, W, W, S1, S1, S1, S1, S1, S1, W, W, W],
  [W, W, W, W, W, W, W, W, W, W, W, W],
] as const;

export const TERRACED_TERRAIN_DATA: TerracedTerrainData = {
  rowCount: TERRACED_CELL_ROWS.length,
  columnCount: TERRACED_CELL_ROWS[0].length,
  cellSize: TERRACED_CELL_SIZE,
  heightStep: TERRACED_HEIGHT_STEP,
  waterHeight: TERRACED_WATER_HEIGHT,
  cells: TERRACED_CELL_ROWS.flat(),
};
