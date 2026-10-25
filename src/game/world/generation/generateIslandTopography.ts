import { createSeededRandom } from "./createSeededRandom";
import type { IslandShape } from "./generateIslandShape";

const TOPOGRAPHY_SEED_SALT = 0xa341_316c;
const HILL_COUNT_MIN = 1;
const HILL_COUNT_MAX = 3;
const HILL_RADIUS_MIN = 6;
const HILL_RADIUS_MAX = 14;
const HILL_HEIGHT_MIN = 1.2;
const HILL_HEIGHT_MAX = 3;
const HILL_CENTER_MIN_SIGNAL = 0.4;
const LAND_BLEND_START_SIGNAL = 0;
const LAND_BLEND_END_SIGNAL = 0.35;
export const ISLAND_TOPOGRAPHY_BASE_LAND_HEIGHT = 0.8;
export const ISLAND_TOPOGRAPHY_SEA_FLOOR_HEIGHT = -0.9;

export interface IslandHill {
  centerRow: number;
  centerColumn: number;
  radius: number;
  height: number;
}

export interface IslandTopography {
  rowCount: number;
  columnCount: number;
  hillCount: number;
  hills: readonly IslandHill[];
  heights: readonly number[];
}

interface GenerateIslandTopographyOptions {
  seed: number;
  shape: IslandShape;
}

/** Génère une hauteur continue logique, sans quantification en terrasses. */
export function generateIslandTopography(
  options: GenerateIslandTopographyOptions,
): IslandTopography {
  const { seed, shape } = options;
  assertShape(shape);

  // Le salt isole la séquence topographique de celle de la silhouette.
  const topographySeed = (seed ^ TOPOGRAPHY_SEED_SALT) >>> 0;
  const random = createSeededRandom(topographySeed);
  const interiorCellIndices = shape.values
    .map((shapeSignal, index) => ({ shapeSignal, index }))
    .filter(({ shapeSignal }) => shapeSignal >= HILL_CENTER_MIN_SIGNAL)
    .map(({ index }) => index);

  if (interiorCellIndices.length === 0) {
    throw new RangeError(
      "La silhouette ne contient aucune cellule assez intérieure pour une colline.",
    );
  }

  const hillCount = random.integer(HILL_COUNT_MIN, HILL_COUNT_MAX);
  const hills: IslandHill[] = [];
  for (let index = 0; index < hillCount; index += 1) {
    const centerIndex =
      interiorCellIndices[random.integer(0, interiorCellIndices.length - 1)];
    hills.push({
      centerRow: Math.floor(centerIndex / shape.columnCount),
      centerColumn: centerIndex % shape.columnCount,
      radius: random.float(HILL_RADIUS_MIN, HILL_RADIUS_MAX),
      height: random.float(HILL_HEIGHT_MIN, HILL_HEIGHT_MAX),
    });
  }

  const heights = shape.values.map((shapeSignal, index) => {
    if (shapeSignal <= 0) return ISLAND_TOPOGRAPHY_SEA_FLOOR_HEIGHT;

    const row = Math.floor(index / shape.columnCount);
    const column = index % shape.columnCount;
    const landBlend = smoothstep(
      LAND_BLEND_START_SIGNAL,
      LAND_BLEND_END_SIGNAL,
      shapeSignal,
    );
    const baseHeight = ISLAND_TOPOGRAPHY_BASE_LAND_HEIGHT * landBlend;
    let hillContribution = 0;

    for (const hill of hills) {
      const hillDistance = Math.hypot(
        column - hill.centerColumn,
        row - hill.centerRow,
      );
      const hillBlend = 1 - smoothstep(0, hill.radius, hillDistance);
      hillContribution = Math.max(
        hillContribution,
        hill.height * hillBlend,
      );
    }

    // Le second landBlend fait disparaître les collines près de la mer.
    return baseHeight + hillContribution * landBlend;
  });

  return {
    rowCount: shape.rowCount,
    columnCount: shape.columnCount,
    hillCount,
    hills,
    heights,
  };
}

/** Interpolation cubique bornée entre deux seuils. */
export function smoothstep(edge0: number, edge1: number, value: number) {
  if (
    !Number.isFinite(edge0) ||
    !Number.isFinite(edge1) ||
    !Number.isFinite(value) ||
    edge0 >= edge1
  ) {
    throw new RangeError(
      "smoothstep() attend des valeurs finies avec edge0 < edge1.",
    );
  }

  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function assertShape(shape: IslandShape) {
  if (
    !Number.isSafeInteger(shape.rowCount) ||
    shape.rowCount <= 0 ||
    !Number.isSafeInteger(shape.columnCount) ||
    shape.columnCount <= 0 ||
    shape.values.length !== shape.rowCount * shape.columnCount ||
    !shape.values.every(Number.isFinite)
  ) {
    throw new RangeError("La grille IslandShape est invalide.");
  }
}
