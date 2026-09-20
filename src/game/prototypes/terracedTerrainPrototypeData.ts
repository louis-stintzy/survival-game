export const TERRACED_CELL_SIZE = 1.5;
export const TERRACED_HEIGHT_STEP = 0.55;
export const TERRACED_WATER_HEIGHT = 0.3;

/**
 * Chaque entier est une hauteur de colonne ; zéro représente l'eau sans sol
 * émergé. La hauteur monde vaut exactement `niveau * TERRACED_HEIGHT_STEP`.
 */
export const TERRACED_LEVELS: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0],
  [0, 1, 1, 2, 2, 3, 3, 2, 2, 1, 1, 0],
  [0, 1, 2, 2, 3, 3, 4, 4, 3, 2, 1, 0],
  [0, 1, 2, 3, 3, 4, 5, 5, 4, 2, 1, 0],
  [0, 1, 2, 3, 3, 4, 5, 5, 4, 3, 1, 0],
  [0, 1, 2, 2, 3, 3, 4, 4, 4, 3, 1, 0],
  [0, 1, 1, 2, 2, 2, 3, 4, 4, 2, 1, 0],
  [0, 0, 1, 1, 2, 2, 2, 3, 2, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
] as const;
