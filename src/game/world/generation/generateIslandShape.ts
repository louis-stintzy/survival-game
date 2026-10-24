import {
  createSeededRandom,
  type SeededRandom,
} from "./createSeededRandom";

const MAIN_MAJOR_RADIUS_MIN = 17;
const MAIN_MAJOR_RADIUS_MAX = 24;
const MAIN_MINOR_RATIO_MIN = 0.55;
const MAIN_MINOR_RATIO_MAX = 0.95;
const MAIN_CENTER_OFFSET = 2;
const LEVEL_ONE_MASS_COUNT_MIN = 1;
const LEVEL_ONE_MASS_COUNT_MAX = 3;
const LEVEL_ONE_SCALE_MIN = 0.4;
const LEVEL_ONE_SCALE_MAX = 0.7;
const LEVEL_ONE_OFFSET_MIN = 0.68;
const LEVEL_ONE_OFFSET_MAX = 0.92;
const LEVEL_TWO_MASS_COUNT_MIN = 0;
const LEVEL_TWO_MASS_COUNT_MAX = 2;
const LEVEL_TWO_SCALE_MIN = 0.3;
const LEVEL_TWO_SCALE_MAX = 0.55;
const LEVEL_TWO_OFFSET_MIN = 0.65;
const LEVEL_TWO_OFFSET_MAX = 0.95;
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
  levelOneMassCount: number;
  levelTwoMassCount: number;
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
  const majorRadius = random.float(
    MAIN_MAJOR_RADIUS_MIN,
    MAIN_MAJOR_RADIUS_MAX,
  );
  const mainMass: EllipticalMass = {
    centerX: random.float(-MAIN_CENTER_OFFSET, MAIN_CENTER_OFFSET),
    centerZ: random.float(-MAIN_CENTER_OFFSET, MAIN_CENTER_OFFSET),
    radiusX: majorRadius,
    radiusZ:
      majorRadius *
      random.float(MAIN_MINOR_RATIO_MIN, MAIN_MINOR_RATIO_MAX),
    rotation: random.float(0, FULL_ROTATION),
  };
  const levelOneMassCount = random.integer(
    LEVEL_ONE_MASS_COUNT_MIN,
    LEVEL_ONE_MASS_COUNT_MAX,
  );
  const masses = [mainMass];
  const levelOneMasses: EllipticalMass[] = [];
  let levelTwoMassCount = 0;

  for (let index = 0; index < levelOneMassCount; index += 1) {
    const child = createChildMass(mainMass, random, {
      scaleMin: LEVEL_ONE_SCALE_MIN,
      scaleMax: LEVEL_ONE_SCALE_MAX,
      offsetMin: LEVEL_ONE_OFFSET_MIN,
      offsetMax: LEVEL_ONE_OFFSET_MAX,
    });
    levelOneMasses.push(child);
    masses.push(child);
  }

  for (const parent of levelOneMasses) {
    const childCount = random.integer(
      LEVEL_TWO_MASS_COUNT_MIN,
      LEVEL_TWO_MASS_COUNT_MAX,
    );
    levelTwoMassCount += childCount;
    for (let index = 0; index < childCount; index += 1) {
      masses.push(
        createChildMass(parent, random, {
          scaleMin: LEVEL_TWO_SCALE_MIN,
          scaleMax: LEVEL_TWO_SCALE_MAX,
          offsetMin: LEVEL_TWO_OFFSET_MIN,
          offsetMax: LEVEL_TWO_OFFSET_MAX,
        }),
      );
    }
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

  return {
    rowCount,
    columnCount,
    massCount: masses.length,
    levelOneMassCount,
    levelTwoMassCount,
    values,
  };
}

interface ChildMassRanges {
  scaleMin: number;
  scaleMax: number;
  offsetMin: number;
  offsetMax: number;
}

function createChildMass(
  parent: EllipticalMass,
  random: SeededRandom,
  ranges: ChildMassRanges,
): EllipticalMass {
  const angle = random.float(0, FULL_ROTATION);
  const offsetFactor = random.float(ranges.offsetMin, ranges.offsetMax);
  const localOffsetX = Math.cos(angle) * parent.radiusX * offsetFactor;
  const localOffsetZ = Math.sin(angle) * parent.radiusZ * offsetFactor;
  const cosine = Math.cos(parent.rotation);
  const sine = Math.sin(parent.rotation);

  // L'offset local suit l'ellipse du parent, puis sa rotation dans la grille.
  const worldOffsetX = localOffsetX * cosine - localOffsetZ * sine;
  const worldOffsetZ = localOffsetX * sine + localOffsetZ * cosine;
  return {
    centerX: parent.centerX + worldOffsetX,
    centerZ: parent.centerZ + worldOffsetZ,
    radiusX: parent.radiusX * random.float(ranges.scaleMin, ranges.scaleMax),
    radiusZ: parent.radiusZ * random.float(ranges.scaleMin, ranges.scaleMax),
    rotation: random.float(0, FULL_ROTATION),
  };
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
