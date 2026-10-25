import { createSeededRandom } from "./createSeededRandom";
import type { IslandShape } from "./generateIslandShape";

const ROCK_MASK_SEED_SALT = 0xc2b2_ae35;
const ROCK_AREA_COUNT_MIN = 1;
const ROCK_AREA_COUNT_MAX = 3;
const ROCK_RADIUS_MIN = 4;
const ROCK_RADIUS_MAX = 9;
const ROCK_CENTER_MIN_SHAPE_SIGNAL = 0.35;
export const ROCK_MIN_SHAPE_SIGNAL = 0.3;
const FULL_ROTATION = Math.PI * 2;

export interface IslandRockArea {
  centerRow: number;
  centerColumn: number;
  radiusX: number;
  radiusZ: number;
  rotation: number;
}

export interface IslandRockMask {
  rowCount: number;
  columnCount: number;
  areaCount: number;
  areas: readonly IslandRockArea[];
  values: readonly boolean[];
}

interface GenerateIslandRockMaskOptions {
  seed: number;
  shape: IslandShape;
}

/** Génère uniquement des zones rocheuses discrètes, sans notion d'altitude. */
export function generateIslandRockMask(
  options: GenerateIslandRockMaskOptions,
): IslandRockMask {
  const { seed, shape } = options;
  assertShape(shape);

  // Le salt permet au masque d'évoluer sans consommer les séquences des
  // générateurs de silhouette ou de topographie.
  const rockSeed = (seed ^ ROCK_MASK_SEED_SALT) >>> 0;
  const random = createSeededRandom(rockSeed);
  const centerCellIndices = shape.values
    .map((shapeSignal, index) => ({ shapeSignal, index }))
    .filter(
      ({ shapeSignal }) => shapeSignal >= ROCK_CENTER_MIN_SHAPE_SIGNAL,
    )
    .map(({ index }) => index);

  if (centerCellIndices.length === 0) {
    throw new RangeError(
      "La silhouette ne contient aucune cellule assez intérieure pour une zone rocheuse.",
    );
  }

  const areaCount = random.integer(
    ROCK_AREA_COUNT_MIN,
    ROCK_AREA_COUNT_MAX,
  );
  const areas: IslandRockArea[] = [];
  for (let index = 0; index < areaCount; index += 1) {
    const centerIndex =
      centerCellIndices[random.integer(0, centerCellIndices.length - 1)];
    areas.push({
      centerRow: Math.floor(centerIndex / shape.columnCount),
      centerColumn: centerIndex % shape.columnCount,
      radiusX: random.float(ROCK_RADIUS_MIN, ROCK_RADIUS_MAX),
      radiusZ: random.float(ROCK_RADIUS_MIN, ROCK_RADIUS_MAX),
      rotation: random.float(0, FULL_ROTATION),
    });
  }

  const values = shape.values.map((shapeSignal, index) => {
    if (shapeSignal <= ROCK_MIN_SHAPE_SIGNAL) return false;

    const row = Math.floor(index / shape.columnCount);
    const column = index % shape.columnCount;
    return areas.some((area) => isInsideRockArea(row, column, area));
  });

  return {
    rowCount: shape.rowCount,
    columnCount: shape.columnCount,
    areaCount,
    areas,
    values,
  };
}

function isInsideRockArea(
  row: number,
  column: number,
  area: IslandRockArea,
) {
  const x = column - area.centerColumn;
  const z = row - area.centerRow;
  const cosine = Math.cos(area.rotation);
  const sine = Math.sin(area.rotation);
  const localX = x * cosine + z * sine;
  const localZ = -x * sine + z * cosine;
  return Math.hypot(localX / area.radiusX, localZ / area.radiusZ) <= 1;
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
