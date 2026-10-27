import { createSeededRandom } from "./createSeededRandom";
import type { IslandShape } from "./generateIslandShape";

const TOPOGRAPHY_SEED_SALT = 0xa341_316c;
const HILL_COUNT_MIN = 2;
const HILL_COUNT_MAX = 4;
const HILL_RADIUS_MIN = 6;
const HILL_RADIUS_MAX = 14;
const HILL_HEIGHT_MIN = 1.2;
const HILL_HEIGHT_MAX = 3;
const HILL_CENTER_MIN_SIGNAL = 0.4;
const MOUNTAIN_CHANCE = 0.6;
const MOUNTAIN_RADIUS_MIN = 20;
const MOUNTAIN_RADIUS_MAX = 28;
const MOUNTAIN_HEIGHT_MIN = 6;
const MOUNTAIN_HEIGHT_MAX = 8;
const MOUNTAIN_CENTER_MIN_SIGNAL = 0.5;
const LAND_BLEND_START_SIGNAL = 0;
const LAND_BLEND_END_SIGNAL = 0.35;
const FULL_ROTATION = Math.PI * 2;
export const ISLAND_TOPOGRAPHY_BASE_LAND_HEIGHT = 0.8;
export const ISLAND_TOPOGRAPHY_SEA_FLOOR_HEIGHT = -0.9;

export interface IslandHill {
  centerRow: number;
  centerColumn: number;
  radiusX: number;
  radiusZ: number;
  rotation: number;
  height: number;
}

export interface IslandTopography {
  rowCount: number;
  columnCount: number;
  hillCount: number;
  mountainCount: 0 | 1;
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
    hills.push(
      createHill(random, interiorCellIndices, shape.columnCount, {
        radiusMin: HILL_RADIUS_MIN,
        radiusMax: HILL_RADIUS_MAX,
        heightMin: HILL_HEIGHT_MIN,
        heightMax: HILL_HEIGHT_MAX,
      }),
    );
  }

  // La montagne est décidée après toutes les collines ordinaires afin de ne
  // pas perturber leur séquence de paramètres.
  const mountainCount: 0 | 1 = random.next() < MOUNTAIN_CHANCE ? 1 : 0;
  if (mountainCount === 1) {
    const mountainCellIndices = shape.values
      .map((shapeSignal, index) => ({ shapeSignal, index }))
      .filter(({ shapeSignal }) => shapeSignal >= MOUNTAIN_CENTER_MIN_SIGNAL)
      .map(({ index }) => index);
    hills.push(
      createHill(
        random,
        mountainCellIndices.length > 0
          ? mountainCellIndices
          : interiorCellIndices,
        shape.columnCount,
        {
          radiusMin: MOUNTAIN_RADIUS_MIN,
          radiusMax: MOUNTAIN_RADIUS_MAX,
          heightMin: MOUNTAIN_HEIGHT_MIN,
          heightMax: MOUNTAIN_HEIGHT_MAX,
        },
      ),
    );
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
      const x = column - hill.centerColumn;
      const z = row - hill.centerRow;
      const cosine = Math.cos(hill.rotation);
      const sine = Math.sin(hill.rotation);

      // La cellule est tournée dans le repère local de l'ellipse avant de
      // mesurer sa distance normalisée selon les deux rayons indépendants.
      const localX = x * cosine + z * sine;
      const localZ = -x * sine + z * cosine;
      const hillDistance = Math.hypot(
        localX / hill.radiusX,
        localZ / hill.radiusZ,
      );
      const hillBlend = 1 - smoothstep(0, 1, hillDistance);
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
    mountainCount,
    hills,
    heights,
  };
}

interface HillRanges {
  radiusMin: number;
  radiusMax: number;
  heightMin: number;
  heightMax: number;
}

function createHill(
  random: ReturnType<typeof createSeededRandom>,
  centerCellIndices: readonly number[],
  columnCount: number,
  ranges: HillRanges,
): IslandHill {
  const centerIndex =
    centerCellIndices[random.integer(0, centerCellIndices.length - 1)];
  return {
    centerRow: Math.floor(centerIndex / columnCount),
    centerColumn: centerIndex % columnCount,
    radiusX: random.float(ranges.radiusMin, ranges.radiusMax),
    radiusZ: random.float(ranges.radiusMin, ranges.radiusMax),
    rotation: random.float(0, FULL_ROTATION),
    height: random.float(ranges.heightMin, ranges.heightMax),
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
