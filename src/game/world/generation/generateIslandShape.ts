import { createSeededRandom } from "./createSeededRandom";

const MAIN_RADIUS_MIN = 14;
const MAIN_RADIUS_MAX = 23;
const MAIN_CENTER_OFFSET = 2;
const SECONDARY_MASS_COUNT_MIN = 1;
const SECONDARY_MASS_COUNT_MAX = 3;
const SECONDARY_SCALE_MIN = 0.45;
const SECONDARY_SCALE_MAX = 0.75;
const SECONDARY_OFFSET_MIN = 0.35;
const SECONDARY_OFFSET_MAX = 0.65;
const FULL_ROTATION = Math.PI * 2;

interface EllipticalMass {
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  rotation: number;
}

export interface IslandShape {
  rowCount: number;
  columnCount: number;
  massCount: number;
  values: readonly number[];
}

interface GenerateIslandShapeOptions {
  seed: number;
  rowCount: number;
  columnCount: number;
}

/** Génère uniquement le signal 2D déterministe de la silhouette d'une île. */
export function generateIslandShape(
  options: GenerateIslandShapeOptions,
): IslandShape {
  const { seed, rowCount, columnCount } = options;
  assertGridDimension(rowCount, "rowCount");
  assertGridDimension(columnCount, "columnCount");

  const random = createSeededRandom(seed);
  const mainMass: EllipticalMass = {
    centerX: random.float(-MAIN_CENTER_OFFSET, MAIN_CENTER_OFFSET),
    centerZ: random.float(-MAIN_CENTER_OFFSET, MAIN_CENTER_OFFSET),
    radiusX: random.float(MAIN_RADIUS_MIN, MAIN_RADIUS_MAX),
    radiusZ: random.float(MAIN_RADIUS_MIN, MAIN_RADIUS_MAX),
    rotation: random.float(0, FULL_ROTATION),
  };
  const secondaryMassCount = random.integer(
    SECONDARY_MASS_COUNT_MIN,
    SECONDARY_MASS_COUNT_MAX,
  );
  const masses = [mainMass];

  for (let index = 0; index < secondaryMassCount; index += 1) {
    const scale = random.float(SECONDARY_SCALE_MIN, SECONDARY_SCALE_MAX);
    const offsetAngle = random.float(0, FULL_ROTATION);
    const offsetDistance =
      Math.min(mainMass.radiusX, mainMass.radiusZ) *
      random.float(SECONDARY_OFFSET_MIN, SECONDARY_OFFSET_MAX);

    // Le centre secondaire reste à l'intérieur de l'ellipse principale : les
    // deux masses se chevauchent donc largement malgré leurs rotations.
    masses.push({
      centerX: mainMass.centerX + Math.cos(offsetAngle) * offsetDistance,
      centerZ: mainMass.centerZ + Math.sin(offsetAngle) * offsetDistance,
      radiusX: mainMass.radiusX * scale,
      radiusZ: mainMass.radiusZ * scale,
      rotation: random.float(0, FULL_ROTATION),
    });
  }

  const values: number[] = [];
  const centerColumn = (columnCount - 1) / 2;
  const centerRow = (rowCount - 1) / 2;
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const x = column - centerColumn;
      const z = row - centerRow;
      let finalSignal = Number.NEGATIVE_INFINITY;

      for (const mass of masses) {
        finalSignal = Math.max(finalSignal, sampleMassSignal(mass, x, z));
      }
      values.push(finalSignal);
    }
  }

  return { rowCount, columnCount, massCount: masses.length, values };
}

function sampleMassSignal(mass: EllipticalMass, x: number, z: number) {
  const translatedX = x - mass.centerX;
  const translatedZ = z - mass.centerZ;
  const cosine = Math.cos(mass.rotation);
  const sine = Math.sin(mass.rotation);

  // Passage dans le repère local tourné de l'ellipse avant normalisation.
  const localX = translatedX * cosine + translatedZ * sine;
  const localZ = -translatedX * sine + translatedZ * cosine;
  return 1 - Math.hypot(localX / mass.radiusX, localZ / mass.radiusZ);
}

function assertGridDimension(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} doit être un entier strictement positif.`);
  }
}
