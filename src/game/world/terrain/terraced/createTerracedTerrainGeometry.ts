import { GAME_PALETTE } from "../../../constants/gamePalette";
import type {
  TerracedSurface,
  TerracedTerrainData,
} from "./terracedTerrainTypes";

export interface TerracedTerrainGeometry {
  positions: number[];
  indices: number[];
  colors: number[];
  normals: number[];
}

type FaceColor = readonly [number, number, number, number];
type FaceNormal = readonly [number, number, number];

const UINT32_RANGE = 0x1_0000_0000;
const SIDE_COLOR_VARIATION = 0.02;
const TOP_COLOR_VARIATION = {
  sand: 0.015,
  grass: 0.015,
  rock: 0.03,
} as const;

const COLORS = {
  sandTop: hexToRgba(GAME_PALETTE.terrain.sandTop),
  sandSide: hexToRgba(GAME_PALETTE.terrain.sandSide),
  grassTop: hexToRgba(GAME_PALETTE.terrain.grassTop),
  dirtSide: hexToRgba(GAME_PALETTE.terrain.dirtSide),
  rockTop: hexToRgba(GAME_PALETTE.terrain.rockTop),
  rockSide: hexToRgba(GAME_PALETTE.terrain.rockSide),
  deepRockSide: hexToRgba(GAME_PALETTE.terrain.deepRockSide),
} as const;

/**
 * Construit les buffers d'un terrain terrassé unique. Les sommets sont
 * dupliqués par face afin de conserver couleurs nettes et normales planes.
 * Seuls les dessus terrestres et les côtés réellement exposés sont produits.
 */
export function createTerracedTerrainGeometry(
  terrain: TerracedTerrainData,
): TerracedTerrainGeometry {
  if (terrain.cells.length !== terrain.rowCount * terrain.columnCount) {
    throw new Error(
      "Le nombre de cellules doit correspondre à rowCount * columnCount.",
    );
  }

  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];
  const minimumX = (-terrain.columnCount * terrain.cellSize) / 2;
  const minimumZ = (-terrain.rowCount * terrain.cellSize) / 2;

  for (let row = 0; row < terrain.rowCount; row += 1) {
    for (let column = 0; column < terrain.columnCount; column += 1) {
      const cell = getCell(row, column);
      if (!cell) continue;

      const { level, surface } = cell;
      if (!Number.isInteger(level) || level < 0) {
        throw new Error(
          "Chaque niveau de terrasse doit être un entier positif ou nul.",
        );
      }
      if (surface === "water") continue;
      const landSurface = surface;

      const x0 = minimumX + column * terrain.cellSize;
      const x1 = x0 + terrain.cellSize;
      const z0 = minimumZ + row * terrain.cellSize;
      const z1 = z0 + terrain.cellSize;
      const topY = level * terrain.heightStep;

      addQuad(
        [x0, topY, z0, x1, topY, z0, x1, topY, z1, x0, topY, z1],
        getTopColor(landSurface, row, column),
        [0, 1, 0],
      );

      addExposedSide(row - 1, column, "north");
      addExposedSide(row + 1, column, "south");
      addExposedSide(row, column + 1, "east");
      addExposedSide(row, column - 1, "west");

      function addExposedSide(
        neighborRow: number,
        neighborColumn: number,
        direction: "north" | "south" | "east" | "west",
      ): void {
        const neighborLevel = getCell(neighborRow, neighborColumn)?.level ?? 0;
        if (neighborLevel >= level) return;

        for (let layer = neighborLevel; layer < level; layer += 1) {
          const bottomY = layer * terrain.heightStep;
          const upperY = (layer + 1) * terrain.heightStep;
          const sideColor = getSideColor(
            landSurface,
            level,
            layer,
            row,
            column,
          );
          switch (direction) {
            case "north":
              addQuad(
                [
                  x0,
                  bottomY,
                  z0,
                  x1,
                  bottomY,
                  z0,
                  x1,
                  upperY,
                  z0,
                  x0,
                  upperY,
                  z0,
                ],
                sideColor,
                [0, 0, -1],
              );
              break;
            case "south":
              addQuad(
                [
                  x1,
                  bottomY,
                  z1,
                  x0,
                  bottomY,
                  z1,
                  x0,
                  upperY,
                  z1,
                  x1,
                  upperY,
                  z1,
                ],
                sideColor,
                [0, 0, 1],
              );
              break;
            case "east":
              addQuad(
                [
                  x1,
                  bottomY,
                  z0,
                  x1,
                  bottomY,
                  z1,
                  x1,
                  upperY,
                  z1,
                  x1,
                  upperY,
                  z0,
                ],
                sideColor,
                [1, 0, 0],
              );
              break;
            case "west":
              addQuad(
                [
                  x0,
                  bottomY,
                  z1,
                  x0,
                  bottomY,
                  z0,
                  x0,
                  upperY,
                  z0,
                  x0,
                  upperY,
                  z1,
                ],
                sideColor,
                [-1, 0, 0],
              );
              break;
          }
        }
      }
    }
  }

  return { positions, indices, colors, normals };

  function getCell(row: number, column: number) {
    if (
      row < 0 ||
      row >= terrain.rowCount ||
      column < 0 ||
      column >= terrain.columnCount
    ) {
      return undefined;
    }
    return terrain.cells[row * terrain.columnCount + column];
  }

  function addQuad(
    coordinates: readonly number[],
    color: FaceColor,
    normal: FaceNormal,
  ): void {
    const firstVertex = positions.length / 3;
    positions.push(...coordinates);
    indices.push(
      firstVertex,
      firstVertex + 1,
      firstVertex + 2,
      firstVertex,
      firstVertex + 2,
      firstVertex + 3,
    );
    for (let vertex = 0; vertex < 4; vertex += 1) {
      colors.push(...color);
      normals.push(...normal);
    }
  }
}

function getTopColor(
  surface: Exclude<TerracedSurface, "water">,
  row: number,
  column: number,
): FaceColor {
  const baseColor =
    surface === "sand"
      ? COLORS.sandTop
      : surface === "rock"
        ? COLORS.rockTop
        : COLORS.grassTop;
  return varyFaceColor(baseColor, row, column, 0, TOP_COLOR_VARIATION[surface]);
}

function getSideColor(
  surface: Exclude<TerracedSurface, "water">,
  level: number,
  layer: number,
  row: number,
  column: number,
): FaceColor {
  const depthFromTop = level - layer;
  let baseColor: FaceColor;

  if (surface === "rock") {
    baseColor = depthFromTop === 1 ? COLORS.rockSide : COLORS.deepRockSide;
  } else if (depthFromTop === 1) {
    baseColor = surface === "sand" ? COLORS.sandSide : COLORS.dirtSide;
  } else if (depthFromTop === 2) {
    baseColor = COLORS.rockSide;
  } else {
    baseColor = COLORS.deepRockSide;
  }

  return varyFaceColor(
    baseColor,
    row,
    column,
    depthFromTop,
    SIDE_COLOR_VARIATION,
  );
}

/** Variation stable par cellule et couche, identique pour les quatre sommets. */
function varyFaceColor(
  color: FaceColor,
  row: number,
  column: number,
  salt: number,
  maximumVariation: number,
): FaceColor {
  let hash =
    Math.imul(row + 1, 0x1f12_3bb5) ^
    Math.imul(column + 1, 0x5f35_6495) ^
    Math.imul(salt + 1, 0x6c8e_9cf5);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb_352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846c_a68b);
  hash ^= hash >>> 16;
  const signedVariation = ((hash >>> 0) / UINT32_RANGE) * 2 - 1;
  const factor = 1 + signedVariation * maximumVariation;

  return [
    clampColor(color[0] * factor),
    clampColor(color[1] * factor),
    clampColor(color[2] * factor),
    color[3],
  ];
}

function clampColor(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hexToRgba(hexColor: string): FaceColor {
  const value = Number.parseInt(hexColor.slice(1), 16);
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
    1,
  ];
}
