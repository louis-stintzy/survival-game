import type { TerracedTerrainData } from "../../world/terrain/terraced/terracedTerrainTypes";
import type { CollisionContact, XZPosition } from "./collisionTypes";
import {
  getCircleHorizontalBoundsContact,
  type XZBounds,
} from "./horizontalBoundsCollision";
import { PLAYER_COLLISION_RADIUS } from "./playerWorldCollision";

export type TerracedTerrainCollision =
  | { kind: "blocked"; contact: CollisionContact }
  | { kind: "stepUp"; level: number; height: number };

/**
 * Recherche uniquement les cellules couvertes par le disque horizontal du
 * joueur et distingue une marche franchissable d'une paroi infranchissable.
 */
export function getTerracedTerrainCollision(
  terrain: TerracedTerrainData,
  candidate: XZPosition,
  reference: XZPosition,
  currentLevel: number,
): TerracedTerrainCollision | undefined {
  const minimumX = (-terrain.columnCount * terrain.cellSize) / 2;
  const minimumZ = (-terrain.rowCount * terrain.cellSize) / 2;
  const minColumn = clampIndex(
    Math.floor(
      (candidate.x - PLAYER_COLLISION_RADIUS - minimumX) / terrain.cellSize,
    ),
    terrain.columnCount,
  );
  const maxColumn = clampIndex(
    Math.floor(
      (candidate.x + PLAYER_COLLISION_RADIUS - minimumX) / terrain.cellSize,
    ),
    terrain.columnCount,
  );
  const minRow = clampIndex(
    Math.floor(
      (candidate.z - PLAYER_COLLISION_RADIUS - minimumZ) / terrain.cellSize,
    ),
    terrain.rowCount,
  );
  const maxRow = clampIndex(
    Math.floor(
      (candidate.z + PLAYER_COLLISION_RADIUS - minimumZ) / terrain.cellSize,
    ),
    terrain.rowCount,
  );
  const movementX = candidate.x - reference.x;
  const movementZ = candidate.z - reference.z;
  let stepUp: TerracedTerrainCollision | undefined;

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let column = minColumn; column <= maxColumn; column += 1) {
      const cell = terrain.cells[row * terrain.columnCount + column];
      if (!cell || cell.surface === "water" || cell.level <= currentLevel) {
        continue;
      }

      for (const bounds of getExposedFaceBounds(
        terrain,
        row,
        column,
        currentLevel,
        minimumX,
        minimumZ,
      )) {
        const contact = getCircleHorizontalBoundsContact(
          candidate.x,
          candidate.z,
          PLAYER_COLLISION_RADIUS,
          bounds,
          reference,
        );
        if (!contact) continue;

        // Un contact arrière ou tangent ne doit pas empêcher de quitter/longer
        // une paroi dans laquelle la capsule est déjà au contact.
        const movementDotNormal =
          movementX * contact.normalX + movementZ * contact.normalZ;
        if (movementDotNormal >= 0) continue;

        if (cell.level - currentLevel >= 2) {
          return { kind: "blocked", contact };
        }

        stepUp = {
          kind: "stepUp",
          level: cell.level,
          height: cell.level * terrain.heightStep,
        };
      }
    }
  }

  return stepUp;
}

function clampIndex(index: number, count: number): number {
  return Math.max(0, Math.min(index, count - 1));
}

function getExposedFaceBounds(
  terrain: TerracedTerrainData,
  row: number,
  column: number,
  currentLevel: number,
  terrainMinimumX: number,
  terrainMinimumZ: number,
): XZBounds[] {
  const cellMinimumX = terrainMinimumX + column * terrain.cellSize;
  const cellMaximumX = cellMinimumX + terrain.cellSize;
  const cellMinimumZ = terrainMinimumZ + row * terrain.cellSize;
  const cellMaximumZ = cellMinimumZ + terrain.cellSize;
  const faces: XZBounds[] = [];

  if (!isHigherLandCell(terrain, row, column - 1, currentLevel)) {
    const [firstRow, lastRow] = findVerticalFaceRun(
      terrain,
      row,
      column,
      -1,
      currentLevel,
      terrain.cells[row * terrain.columnCount + column].level,
    );
    faces.push({
      minimumX: cellMinimumX,
      maximumX: cellMinimumX,
      minimumZ: terrainMinimumZ + firstRow * terrain.cellSize,
      maximumZ: terrainMinimumZ + (lastRow + 1) * terrain.cellSize,
    });
  }
  if (!isHigherLandCell(terrain, row, column + 1, currentLevel)) {
    const [firstRow, lastRow] = findVerticalFaceRun(
      terrain,
      row,
      column,
      1,
      currentLevel,
      terrain.cells[row * terrain.columnCount + column].level,
    );
    faces.push({
      minimumX: cellMaximumX,
      maximumX: cellMaximumX,
      minimumZ: terrainMinimumZ + firstRow * terrain.cellSize,
      maximumZ: terrainMinimumZ + (lastRow + 1) * terrain.cellSize,
    });
  }
  if (!isHigherLandCell(terrain, row - 1, column, currentLevel)) {
    const [firstColumn, lastColumn] = findHorizontalFaceRun(
      terrain,
      row,
      column,
      -1,
      currentLevel,
      terrain.cells[row * terrain.columnCount + column].level,
    );
    faces.push({
      minimumX: terrainMinimumX + firstColumn * terrain.cellSize,
      maximumX: terrainMinimumX + (lastColumn + 1) * terrain.cellSize,
      minimumZ: cellMinimumZ,
      maximumZ: cellMinimumZ,
    });
  }
  if (!isHigherLandCell(terrain, row + 1, column, currentLevel)) {
    const [firstColumn, lastColumn] = findHorizontalFaceRun(
      terrain,
      row,
      column,
      1,
      currentLevel,
      terrain.cells[row * terrain.columnCount + column].level,
    );
    faces.push({
      minimumX: terrainMinimumX + firstColumn * terrain.cellSize,
      maximumX: terrainMinimumX + (lastColumn + 1) * terrain.cellSize,
      minimumZ: cellMaximumZ,
      maximumZ: cellMaximumZ,
    });
  }

  return faces;
}

function findVerticalFaceRun(
  terrain: TerracedTerrainData,
  row: number,
  column: number,
  side: -1 | 1,
  currentLevel: number,
  sourceLevel: number,
): [number, number] {
  let firstRow = row;
  let lastRow = row;
  while (
    isLandCellAtLevel(terrain, firstRow - 1, column, sourceLevel) &&
    !isHigherLandCell(terrain, firstRow - 1, column + side, currentLevel)
  ) {
    firstRow -= 1;
  }
  while (
    isLandCellAtLevel(terrain, lastRow + 1, column, sourceLevel) &&
    !isHigherLandCell(terrain, lastRow + 1, column + side, currentLevel)
  ) {
    lastRow += 1;
  }
  return [firstRow, lastRow];
}

function findHorizontalFaceRun(
  terrain: TerracedTerrainData,
  row: number,
  column: number,
  side: -1 | 1,
  currentLevel: number,
  sourceLevel: number,
): [number, number] {
  let firstColumn = column;
  let lastColumn = column;
  while (
    isLandCellAtLevel(terrain, row, firstColumn - 1, sourceLevel) &&
    !isHigherLandCell(terrain, row + side, firstColumn - 1, currentLevel)
  ) {
    firstColumn -= 1;
  }
  while (
    isLandCellAtLevel(terrain, row, lastColumn + 1, sourceLevel) &&
    !isHigherLandCell(terrain, row + side, lastColumn + 1, currentLevel)
  ) {
    lastColumn += 1;
  }
  return [firstColumn, lastColumn];
}

function isHigherLandCell(
  terrain: TerracedTerrainData,
  row: number,
  column: number,
  currentLevel: number,
): boolean {
  if (
    row < 0 ||
    row >= terrain.rowCount ||
    column < 0 ||
    column >= terrain.columnCount
  ) {
    return false;
  }

  const cell = terrain.cells[row * terrain.columnCount + column];
  return cell.surface !== "water" && cell.level > currentLevel;
}

function isLandCellAtLevel(
  terrain: TerracedTerrainData,
  row: number,
  column: number,
  level: number,
): boolean {
  if (
    row < 0 ||
    row >= terrain.rowCount ||
    column < 0 ||
    column >= terrain.columnCount
  ) {
    return false;
  }

  const cell = terrain.cells[row * terrain.columnCount + column];
  return cell.surface !== "water" && cell.level === level;
}
