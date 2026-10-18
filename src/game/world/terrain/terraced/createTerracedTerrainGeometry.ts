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

const COLORS = {
  sand: hexToRgba(GAME_PALETTE.world.sand),
  grass: hexToRgba(GAME_PALETTE.world.grass),
  rock: hexToRgba(GAME_PALETTE.world.rock),
  dirt: hexToRgba("#85502A"),
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
        getTopColor(landSurface),
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
          const sideColor = getSideColor(landSurface, level, layer);
          switch (direction) {
            case "north":
              addQuad(
                [x0, bottomY, z0, x1, bottomY, z0, x1, upperY, z0, x0, upperY, z0],
                sideColor,
                [0, 0, -1],
              );
              break;
            case "south":
              addQuad(
                [x1, bottomY, z1, x0, bottomY, z1, x0, upperY, z1, x1, upperY, z1],
                sideColor,
                [0, 0, 1],
              );
              break;
            case "east":
              addQuad(
                [x1, bottomY, z0, x1, bottomY, z1, x1, upperY, z1, x1, upperY, z0],
                sideColor,
                [1, 0, 0],
              );
              break;
            case "west":
              addQuad(
                [x0, bottomY, z1, x0, bottomY, z0, x0, upperY, z0, x0, upperY, z1],
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

function getTopColor(surface: Exclude<TerracedSurface, "water">): FaceColor {
  if (surface === "sand") return COLORS.sand;
  if (surface === "rock") return COLORS.rock;
  return COLORS.grass;
}

function getSideColor(
  surface: Exclude<TerracedSurface, "water">,
  level: number,
  layer: number,
): FaceColor {
  if (surface === "rock") return COLORS.rock;
  if (surface === "sand" && layer === level - 1) return COLORS.sand;
  if (surface === "grass" && layer === level - 1) return COLORS.dirt;
  return COLORS.rock;
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
