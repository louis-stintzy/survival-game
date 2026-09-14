import { RAFT_NAVIGATION_FOOTPRINT } from "../../models/raftGeometry";
import { createSeededRandom } from "./createSeededRandom";
import { createValueNoise2D } from "./valueNoise2D";

export const WATER_HEIGHT = -0.25;
export const TERRAIN_HALF_SIZE = 40;
export const TERRAIN_GRID_STEP = 1;
export const TERRAIN_MIN_HEIGHT = -1.5;
export const TERRAIN_MAX_HEIGHT = 4;
export const BEACH_MAX_HEIGHT = 0.25;
export const ROCK_MIN_HEIGHT = 1.5;
export const ROCK_MIN_SLOPE = 0.32;

const MAJOR_RADIUS_RANGE = [20, 30] as const;
const MINOR_TO_MAJOR_RATIO_RANGE = [0.45, 0.95] as const;
const SECONDARY_LOBE_COUNT_RANGE = [0, 2] as const;
const LOBE_DISTANCE_RATIO_RANGE = [0.35, 0.7] as const;
const LOBE_RADIUS_RATIO_RANGE = [0.28, 0.42] as const;
const LOBE_ASPECT_RATIO_RANGE = [0.65, 1] as const;
const PRIMARY_COAST_FREQUENCY = 0.025;
const PRIMARY_COAST_AMPLITUDE = 0.14;
const SECONDARY_COAST_FREQUENCY = 0.065;
const SECONDARY_COAST_AMPLITUDE = 0.055;
const SHORE_TRANSITION_SIGNAL = 0.32;
const RELIEF_START_SIGNAL = 0.28;
const RELIEF_FULL_STRENGTH_SIGNAL = 0.58;
const LAND_BASE_HEIGHT = 0.8;
const RELIEF_FREQUENCY = 0.045;
const RELIEF_AMPLITUDE = 1.8;
const DETAIL_FREQUENCY = 0.15;
const DETAIL_AMPLITUDE = 0.14;
const SPAWN_MAX_SLOPE = 0.22;
const RAFT_MIN_DISTANCE = 2;
const RAFT_MAX_DISTANCE = 2.75;
const RAFT_DISTANCE_STEP = 0.25;

export type TerrainCategory = "beach" | "grass" | "rock";

export interface TerrainVertex {
  x: number;
  z: number;
  height: number;
}

export interface TerrainTriangle {
  vertexIndices: readonly [number, number, number];
  category: TerrainCategory;
  slope: number;
}

export interface TerrainSample {
  height: number;
  category: TerrainCategory;
  slope: number;
}

export interface GeneratedIslandTerrain {
  seed: number;
  gridSize: number;
  vertices: TerrainVertex[];
  triangles: TerrainTriangle[];
  playerSpawn: { x: number; z: number; groundHeight: number };
  raftSpawn: { x: number; z: number; groundHeight: number; rotation: number };
}

/** Génère les données logiques déterministes de l'unique île. */
export function generateIslandTerrain(seed: number): GeneratedIslandTerrain {
  const random = createSeededRandom(seed);
  const primaryCoastNoise = createValueNoise2D(
    random.integer(0, 0xffff_ffff),
  );
  const secondaryCoastNoise = createValueNoise2D(
    random.integer(0, 0xffff_ffff),
  );
  const reliefNoise = createValueNoise2D(random.integer(0, 0xffff_ffff));
  const detailNoise = createValueNoise2D(random.integer(0, 0xffff_ffff));
  const majorRadius = random.float(...MAJOR_RADIUS_RANGE);
  const minorRadius =
    majorRadius * random.float(...MINOR_TO_MAJOR_RATIO_RANGE);
  const rotation = random.float(0, Math.PI * 2);
  const lobeCount = random.integer(...SECONDARY_LOBE_COUNT_RANGE);
  const lobes = Array.from({ length: lobeCount }, () => {
    const angle = random.float(0, Math.PI * 2);
    const distance = minorRadius * random.float(...LOBE_DISTANCE_RATIO_RANGE);
    const radius = majorRadius * random.float(...LOBE_RADIUS_RATIO_RANGE);
    return {
      centerX: Math.cos(angle) * distance,
      centerZ: Math.sin(angle) * distance,
      radiusX: radius,
      radiusZ: radius * random.float(...LOBE_ASPECT_RATIO_RANGE),
      rotation: random.float(0, Math.PI * 2),
    };
  });
  const gridSize = (TERRAIN_HALF_SIZE * 2) / TERRAIN_GRID_STEP + 1;
  const vertices: TerrainVertex[] = [];

  for (let zIndex = 0; zIndex < gridSize; zIndex += 1) {
    const z = -TERRAIN_HALF_SIZE + zIndex * TERRAIN_GRID_STEP;
    for (let xIndex = 0; xIndex < gridSize; xIndex += 1) {
      const x = -TERRAIN_HALF_SIZE + xIndex * TERRAIN_GRID_STEP;
      vertices.push({
        x,
        z,
        height: calculateHeight(x, z),
      });
    }
  }

  const triangles: TerrainTriangle[] = [];
  for (let zIndex = 0; zIndex < gridSize - 1; zIndex += 1) {
    for (let xIndex = 0; xIndex < gridSize - 1; xIndex += 1) {
      const topLeft = zIndex * gridSize + xIndex;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + gridSize;
      const bottomRight = bottomLeft + 1;
      addTriangle(topLeft, topRight, bottomRight);
      addTriangle(topLeft, bottomRight, bottomLeft);
    }
  }

  const terrain: GeneratedIslandTerrain = {
    seed,
    gridSize,
    vertices,
    triangles,
    playerSpawn: { x: 0, z: 0, groundHeight: 0 },
    raftSpawn: { x: 0, z: 0, groundHeight: WATER_HEIGHT, rotation: 0 },
  };
  const spawns = findIslandSpawns(terrain);
  terrain.playerSpawn = spawns.playerSpawn;
  terrain.raftSpawn = spawns.raftSpawn;
  return terrain;

  function calculateHeight(x: number, z: number): number {
    const coastScale =
      1 +
      (primaryCoastNoise.sample(
        x * PRIMARY_COAST_FREQUENCY,
        z * PRIMARY_COAST_FREQUENCY,
      ) -
        0.5) *
        2 *
        PRIMARY_COAST_AMPLITUDE +
      (secondaryCoastNoise.sample(
        x * SECONDARY_COAST_FREQUENCY,
        z * SECONDARY_COAST_FREQUENCY,
      ) -
        0.5) *
        2 *
        SECONDARY_COAST_AMPLITUDE;
    // Le maximum unit l'ellipse principale et ses lobes chevauchants sans
    // introduire de masses terrestres isolées.
    const islandSignal = Math.max(
      calculateEllipseSignal(
        x,
        z,
        0,
        0,
        majorRadius,
        minorRadius,
        rotation,
        coastScale,
      ),
      ...lobes.map((lobe) =>
        calculateEllipseSignal(
          x,
          z,
          lobe.centerX,
          lobe.centerZ,
          lobe.radiusX,
          lobe.radiusZ,
          lobe.rotation,
          coastScale,
        ),
      ),
    );
    const shoreBlend = smoothstep(0, SHORE_TRANSITION_SIGNAL, islandSignal);
    const reliefStrength = smoothstep(
      RELIEF_START_SIGNAL,
      RELIEF_FULL_STRENGTH_SIGNAL,
      islandSignal,
    );
    const relief =
      (reliefNoise.sample(x * RELIEF_FREQUENCY, z * RELIEF_FREQUENCY) - 0.5) *
        2 *
        RELIEF_AMPLITUDE +
      (detailNoise.sample(x * DETAIL_FREQUENCY, z * DETAIL_FREQUENCY) - 0.5) *
        2 *
        DETAIL_AMPLITUDE;
    if (islandSignal <= 0) return WATER_HEIGHT;

    return clamp(
      WATER_HEIGHT +
        (LAND_BASE_HEIGHT - WATER_HEIGHT) * shoreBlend +
        relief * reliefStrength,
      WATER_HEIGHT + Number.EPSILON,
      TERRAIN_MAX_HEIGHT,
    );
  }

  function addTriangle(first: number, second: number, third: number): void {
    const triangleVertices = [vertices[first], vertices[second], vertices[third]];
    if (triangleVertices.some((vertex) => vertex.height <= WATER_HEIGHT)) return;

    const heights = triangleVertices.map((vertex) => vertex.height);
    const averageHeight = heights.reduce((sum, height) => sum + height, 0) / 3;
    const slope =
      (Math.max(...heights) - Math.min(...heights)) / TERRAIN_GRID_STEP;
    triangles.push({
      vertexIndices: [first, second, third],
      category: classifyTerrain(averageHeight, slope),
      slope,
    });
  }
}

export function classifyTerrain(
  height: number,
  slope: number,
): TerrainCategory {
  if (height <= BEACH_MAX_HEIGHT) return "beach";
  if (height >= ROCK_MIN_HEIGHT || slope >= ROCK_MIN_SLOPE) return "rock";
  return "grass";
}

/** Échantillonne exactement les plans triangulés utilisés par les meshes. */
export function sampleIslandTerrain(
  terrain: GeneratedIslandTerrain,
  x: number,
  z: number,
): TerrainSample | undefined {
  const gridX = (x + TERRAIN_HALF_SIZE) / TERRAIN_GRID_STEP;
  const gridZ = (z + TERRAIN_HALF_SIZE) / TERRAIN_GRID_STEP;
  const xIndex = Math.floor(gridX);
  const zIndex = Math.floor(gridZ);
  if (
    xIndex < 0 ||
    zIndex < 0 ||
    xIndex >= terrain.gridSize - 1 ||
    zIndex >= terrain.gridSize - 1
  ) {
    return undefined;
  }

  const xAmount = gridX - xIndex;
  const zAmount = gridZ - zIndex;
  const topLeft = zIndex * terrain.gridSize + xIndex;
  const topRight = topLeft + 1;
  const bottomLeft = topLeft + terrain.gridSize;
  const bottomRight = bottomLeft + 1;
  const indices: [number, number, number] =
    xAmount >= zAmount
      ? [topLeft, topRight, bottomRight]
      : [topLeft, bottomRight, bottomLeft];
  const triangle = terrain.triangles.find(
    (candidate) =>
      candidate.vertexIndices[0] === indices[0] &&
      candidate.vertexIndices[1] === indices[1] &&
      candidate.vertexIndices[2] === indices[2],
  );
  if (!triangle) return undefined;

  const [topLeftVertex, secondVertex, thirdVertex] = indices.map(
    (index) => terrain.vertices[index],
  );
  const height =
    xAmount >= zAmount
      ? (1 - xAmount) * topLeftVertex.height +
        (xAmount - zAmount) * secondVertex.height +
        zAmount * thirdVertex.height
      : (1 - zAmount) * topLeftVertex.height +
        (zAmount - xAmount) * thirdVertex.height +
        xAmount * secondVertex.height;
  return { height, category: triangle.category, slope: triangle.slope };
}

function findIslandSpawns(terrain: GeneratedIslandTerrain) {
  const beachCandidates = terrain.triangles
    .filter(
      (triangle) =>
        triangle.category === "beach" && triangle.slope <= SPAWN_MAX_SLOPE,
    )
    .map((triangle) => {
      const points = triangle.vertexIndices.map(
        (index) => terrain.vertices[index],
      );
      return {
        x: points.reduce((sum, point) => sum + point.x, 0) / 3,
        z: points.reduce((sum, point) => sum + point.z, 0) / 3,
        groundHeight:
          points.reduce((sum, point) => sum + point.height, 0) / 3,
      };
    })
    .sort((first, second) => second.z - first.z);

  for (const playerSpawn of beachCandidates) {
    const outwardLength = Math.hypot(playerSpawn.x, playerSpawn.z);
    if (outwardLength === 0) continue;
    const outwardX = playerSpawn.x / outwardLength;
    const outwardZ = playerSpawn.z / outwardLength;
    const raftRotation = Math.atan2(-outwardZ, outwardX);

    for (
      let distance = RAFT_MIN_DISTANCE;
      distance <= RAFT_MAX_DISTANCE;
      distance += RAFT_DISTANCE_STEP
    ) {
      const raftSpawn = {
        x: playerSpawn.x + outwardX * distance,
        z: playerSpawn.z + outwardZ * distance,
        groundHeight: WATER_HEIGHT,
        rotation: raftRotation,
      };
      if (isRaftFootprintAtSea(terrain, raftSpawn)) {
        return { playerSpawn, raftSpawn };
      }
    }
  }

  throw new Error(
    `Aucun spawn plage/radeau valide pour la seed ${terrain.seed}.`,
  );
}

export function isRaftFootprintAtSea(
  terrain: GeneratedIslandTerrain,
  spawn: { x: number; z: number; rotation: number },
): boolean {
  const { halfWidth, halfLength } = RAFT_NAVIGATION_FOOTPRINT;
  const checkpoints = [
    [0, 0],
    [-halfWidth, -halfLength],
    [-halfWidth, halfLength],
    [halfWidth, -halfLength],
    [halfWidth, halfLength],
    [0, -halfLength],
    [0, halfLength],
  ];
  const cosine = Math.cos(spawn.rotation);
  const sine = Math.sin(spawn.rotation);
  return checkpoints.every(([localX, localZ]) => {
    const x = spawn.x + localX * cosine + localZ * sine;
    const z = spawn.z - localX * sine + localZ * cosine;
    return sampleIslandTerrain(terrain, x, z) === undefined;
  });
}

function calculateEllipseSignal(
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  radiusX: number,
  radiusZ: number,
  rotation: number,
  coastScale: number,
): number {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const offsetX = x - centerX;
  const offsetZ = z - centerZ;
  const rotatedX = offsetX * cosine + offsetZ * sine;
  const rotatedZ = -offsetX * sine + offsetZ * cosine;
  return 1 - Math.hypot(rotatedX / radiusX, rotatedZ / radiusZ) / coastScale;
}

function smoothstep(minimum: number, maximum: number, value: number): number {
  const amount = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
