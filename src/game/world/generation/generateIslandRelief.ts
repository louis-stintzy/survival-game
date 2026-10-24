import { createSeededRandom } from "./createSeededRandom";
import type { IslandShape } from "./generateIslandShape";

const RELIEF_SEED_SALT = 0x9e37_79b9;
const RELIEF_AREA_COUNT_MIN = 2;
const RELIEF_AREA_COUNT_MAX = 4;
const RELIEF_RADIUS_MIN = 4;
const RELIEF_RADIUS_MAX = 10;
const RELIEF_CENTER_MIN_SIGNAL = 0.4;
const RELIEF_ACCESS_CORRIDOR_HALF_WIDTH = 1.5;
const FULL_ROTATION = Math.PI * 2;

export type IslandReliefTargetLevel = 4 | 5 | 6 | 7 | 8;
export type IslandReliefLevel = 0 | 3 | IslandReliefTargetLevel;

export interface IslandReliefArea {
  centerRow: number;
  centerColumn: number;
  radiusX: number;
  radiusZ: number;
  rotation: number;
  accessAngle: number;
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
    const radiusX = random.float(RELIEF_RADIUS_MIN, RELIEF_RADIUS_MAX);
    const radiusZ = random.float(RELIEF_RADIUS_MIN, RELIEF_RADIUS_MAX);
    const accessAngle = random.float(0, FULL_ROTATION);
    const accessRadius = getEllipseRadiusAtAngle(
      radiusX,
      radiusZ,
      accessAngle,
    );
    const requestedTargetLevel = random.integer(index === 0 ? 6 : 4, 8);
    const feasibleTargetLevel = Math.min(
      requestedTargetLevel,
      Math.floor(accessRadius) + 3,
    );
    areas.push({
      centerRow: Math.floor(centerIndex / shape.columnCount),
      centerColumn: centerIndex % shape.columnCount,
      radiusX,
      radiusZ,
      rotation: random.float(0, FULL_ROTATION),
      accessAngle,
      // Le niveau est borné pour laisser assez de place à chaque marche +1.
      targetLevel: feasibleTargetLevel as IslandReliefTargetLevel,
    });
  }

  const levels: IslandReliefLevel[] = [];
  for (let row = 0; row < shape.rowCount; row += 1) {
    for (let column = 0; column < shape.columnCount; column += 1) {
      let level: IslandReliefLevel = 0;
      for (const area of areas) {
        level = Math.max(
          level,
          sampleAreaLevel(row, column, area),
        ) as IslandReliefLevel;
      }
      const primaryAccessLevel = sampleAccessCorridorLevel(
        row,
        column,
        areas[0],
      );
      if (primaryAccessLevel !== undefined) {
        // Une superposition ne doit pas reboucher l'accès du plateau principal.
        level = primaryAccessLevel;
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

function sampleAreaLevel(
  row: number,
  column: number,
  area: IslandReliefArea,
): IslandReliefLevel {
  const x = column - area.centerColumn;
  const z = row - area.centerRow;
  const cosine = Math.cos(area.rotation);
  const sine = Math.sin(area.rotation);
  const localX = x * cosine + z * sine;
  const localZ = -x * sine + z * cosine;
  if (Math.hypot(localX / area.radiusX, localZ / area.radiusZ) > 1) {
    return 0;
  }

  return sampleAccessCorridorLevel(row, column, area) ?? area.targetLevel;
}

function sampleAccessCorridorLevel(
  row: number,
  column: number,
  area: IslandReliefArea,
): IslandReliefLevel | undefined {
  const x = column - area.centerColumn;
  const z = row - area.centerRow;
  const cosine = Math.cos(area.rotation);
  const sine = Math.sin(area.rotation);
  const localX = x * cosine + z * sine;
  const localZ = -x * sine + z * cosine;
  if (Math.hypot(localX / area.radiusX, localZ / area.radiusZ) > 1) {
    return undefined;
  }

  const accessCosine = Math.cos(area.accessAngle);
  const accessSine = Math.sin(area.accessAngle);
  const distanceTowardAccess =
    localX * accessCosine + localZ * accessSine;
  const distanceAcrossAccess =
    -localX * accessSine + localZ * accessCosine;
  if (
    distanceTowardAccess < 0 ||
    Math.abs(distanceAcrossAccess) > RELIEF_ACCESS_CORRIDOR_HALF_WIDTH
  ) {
    return undefined;
  }

  const accessEdgeDistance = getEllipseAccessEdgeDistance(
    area.radiusX,
    area.radiusZ,
    area.accessAngle,
    distanceAcrossAccess,
  );
  const distanceFromEdge = Math.max(
    0,
    accessEdgeDistance - distanceTowardAccess,
  );
  return Math.min(
    area.targetLevel,
    3 + Math.floor(distanceFromEdge),
  ) as IslandReliefLevel;
}

function getEllipseAccessEdgeDistance(
  radiusX: number,
  radiusZ: number,
  angle: number,
  distanceAcrossAccess: number,
) {
  const directionX = Math.cos(angle);
  const directionZ = Math.sin(angle);
  const perpendicularX = -directionZ;
  const perpendicularZ = directionX;
  const inverseRadiusXSquared = 1 / (radiusX * radiusX);
  const inverseRadiusZSquared = 1 / (radiusZ * radiusZ);
  const quadraticA =
    directionX * directionX * inverseRadiusXSquared +
    directionZ * directionZ * inverseRadiusZSquared;
  const quadraticB =
    2 *
    distanceAcrossAccess *
    (directionX * perpendicularX * inverseRadiusXSquared +
      directionZ * perpendicularZ * inverseRadiusZSquared);
  const quadraticC =
    distanceAcrossAccess *
      distanceAcrossAccess *
      (perpendicularX * perpendicularX * inverseRadiusXSquared +
        perpendicularZ * perpendicularZ * inverseRadiusZSquared) -
    1;
  const discriminant =
    quadraticB * quadraticB - 4 * quadraticA * quadraticC;
  return (-quadraticB + Math.sqrt(discriminant)) / (2 * quadraticA);
}

function getEllipseRadiusAtAngle(
  radiusX: number,
  radiusZ: number,
  angle: number,
) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return 1 / Math.hypot(cosine / radiusX, sine / radiusZ);
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
