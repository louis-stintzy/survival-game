import { GAME_PALETTE } from "../constants/gamePalette";
import type {
  TerracedCell,
  TerracedSurface,
} from "./terracedTerrainPrototypeData";

export interface TerracedTerrainGeometry {
  positions: number[];
  indices: number[];
  colors: number[];
  normals: number[];
}

interface TerracedTerrainGeometryOptions {
  cells: readonly (readonly TerracedCell[])[];
  cellSize: number;
  heightStep: number;
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
 * Construit un seul mesh de terrasses à sommets volontairement dupliqués.
 * Chaque face garde ainsi une couleur et une normale constantes, sans lissage
 * entre dessus, côtés, sable, terre ou roche.
 */
export function createTerracedTerrainGeometry(
  options: TerracedTerrainGeometryOptions,
): TerracedTerrainGeometry {
  const { cells, cellSize, heightStep } = options;
  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];
  const rowCount = cells.length;
  const columnCount = cells[0]?.length ?? 0;
  const minimumX = (-columnCount * cellSize) / 2;
  const minimumZ = (-rowCount * cellSize) / 2;

  for (let row = 0; row < rowCount; row += 1) {
    if (cells[row].length !== columnCount) {
      throw new Error("La grille de terrasses doit être rectangulaire.");
    }

    for (let column = 0; column < columnCount; column += 1) {
      const cell = cells[row][column];
      const { level, surface } = cell;
      if (!Number.isInteger(level) || level < 0) {
        throw new Error("Chaque niveau de terrasse doit être un entier positif ou nul.");
      }
      if (surface === "water") continue;

      const x0 = minimumX + column * cellSize;
      const x1 = x0 + cellSize;
      const z0 = minimumZ + row * cellSize;
      const z1 = z0 + cellSize;
      const topY = level * heightStep;

      addQuad(
        [x0, topY, z0, x1, topY, z0, x1, topY, z1, x0, topY, z1],
        getTopColor(surface),
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
        const neighborLevel = cells[neighborRow]?.[neighborColumn]?.level ?? 0;
        if (neighborLevel >= level) return;

        // Seules les couches réellement exposées sont créées : aucun cube
        // complet ni aucune face interne entre deux colonnes n'est conservé.
        for (let layer = neighborLevel; layer < level; layer += 1) {
          const bottomY = layer * heightStep;
          const upperY = (layer + 1) * heightStep;
          const sideColor = getSideColor(surface, level, layer);
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

function getTopColor(surface: TerracedSurface): FaceColor {
  if (surface === "sand") return COLORS.sand;
  if (surface === "rock") return COLORS.rock;
  return COLORS.grass;
}

function getSideColor(
  surface: TerracedSurface,
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
