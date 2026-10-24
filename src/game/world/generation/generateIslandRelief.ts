import { createSeededRandom } from "./createSeededRandom";
import type { IslandShape } from "./generateIslandShape";

const RELIEF_SEED_SALT = 0x9e37_79b9;
const RELIEF_AREA_COUNT_MIN = 2;
const RELIEF_AREA_COUNT_MAX = 4;
const RELIEF_RADIUS_MIN = 4;
const RELIEF_RADIUS_MAX = 10;
const RELIEF_CENTER_MIN_SIGNAL = 0.4;
const FULL_ROTATION = Math.PI * 2;

export type IslandReliefTargetLevel = 4 | 5 | 6 | 7 | 8;
export type IslandReliefLevel = 0 | IslandReliefTargetLevel;

export interface IslandReliefArea {
  centerRow: number;
  centerColumn: number;
  radiusX: number;
  radiusZ: number;
  rotation: number;
  targetLevel: IslandReliefTargetLevel;
}

export interface IslandRelief {
  rowCount: number;
  columnCount: number;
  areaCount: number;
  areas: readonly IslandReliefArea[];
  levels: readonly IslandReliefLevel[];
}

interface GenerateIslandReliefOptions {
  seed: number;
  shape: IslandShape;
}

/** Génère de grandes terrasses indépendantes de la silhouette de l'île. */
export function generateIslandRelief(
  options: GenerateIslandReliefOptions,
): IslandRelief {
  const { seed, shape } = options;
  assertShape(shape);

  // Le salt sépare la séquence du relief de celle de la silhouette.
  const reliefSeed = (seed ^ RELIEF_SEED_SALT) >>> 0;
  const random = createSeededRandom(reliefSeed);
  const interiorCellIndices = shape.values
    .map((signal, index) => ({ signal, index }))
    .filter(({ signal }) => signal >= RELIEF_CENTER_MIN_SIGNAL)
    .map(({ index }) => index);

  if (interiorCellIndices.length === 0) {
    throw new RangeError(
      "La silhouette ne contient aucune cellule assez intérieure pour le relief.",
    );
  }

  const areaCount = random.integer(
    RELIEF_AREA_COUNT_MIN,
    RELIEF_AREA_COUNT_MAX,
  );
  const areas: IslandReliefArea[] = [];
  for (let index = 0; index < areaCount; index += 1) {
    const centerIndex =
      interiorCellIndices[random.integer(0, interiorCellIndices.length - 1)];
    areas.push({
      centerRow: Math.floor(centerIndex / shape.columnCount),
      centerColumn: centerIndex % shape.columnCount,
      radiusX: random.float(RELIEF_RADIUS_MIN, RELIEF_RADIUS_MAX),
      radiusZ: random.float(RELIEF_RADIUS_MIN, RELIEF_RADIUS_MAX),
      rotation: random.float(0, FULL_ROTATION),
      // Le premier plateau garantit une amplitude nettement visible.
      targetLevel: random.integer(
        index === 0 ? 6 : 4,
        8,
      ) as IslandReliefTargetLevel,
    });
  }

  const levels: IslandReliefLevel[] = [];
  for (let row = 0; row < shape.rowCount; row += 1) {
    for (let column = 0; column < shape.columnCount; column += 1) {
      let level: IslandReliefLevel = 0;
      for (const area of areas) {
        if (isInsideArea(row, column, area)) {
          level = Math.max(level, area.targetLevel) as IslandReliefLevel;
        }
      }
      levels.push(level);
    }
  }

  return {
    rowCount: shape.rowCount,
    columnCount: shape.columnCount,
    areaCount,
    areas,
    levels,
  };
}

function isInsideArea(
  row: number,
  column: number,
  area: IslandReliefArea,
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
