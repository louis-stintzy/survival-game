import { describe, expect, test } from "vitest";
import type {
  TerracedCell,
  TerracedTerrainData,
} from "../../world/terrain/terraced/terracedTerrainTypes";
import { getTerracedTerrainCollision } from "./terracedTerrainCollision";

const WATER: TerracedCell = { level: 0, surface: "water" };

function createTerrain(levels: readonly (readonly number[])[]): TerracedTerrainData {
  return {
    rowCount: levels.length,
    columnCount: levels[0].length,
    cellSize: 1,
    heightStep: 0.4,
    waterHeight: 0.3,
    cells: levels.flatMap((row) =>
      row.map((level) =>
        level === 0 ? WATER : { level, surface: "grass" as const },
      ),
    ),
  };
}

describe("getTerracedTerrainCollision", () => {
  test("déclenche un step-up au contact frontal d'une marche +1", () => {
    const terrain = createTerrain([[2, 3, 3]]);
    const collision = getTerracedTerrainCollision(
      terrain,
      { x: -0.55, z: 0 },
      { x: -0.65, z: 0 },
      2,
    );

    expect(collision).toMatchObject({ kind: "stepUp", level: 3 });
    expect(collision?.kind === "stepUp" ? collision.height : undefined).toBeCloseTo(
      1.2,
    );
  });

  test("déclenche un step-up lors d'un contact diagonal avec un coin +1", () => {
    const terrain = createTerrain([
      [2, 2, 2],
      [2, 3, 2],
      [2, 2, 2],
    ]);

    expect(
      getTerracedTerrainCollision(
        terrain,
        { x: -0.88, z: -0.88 },
        { x: -0.95, z: -0.95 },
        2,
      ),
    ).toMatchObject({ kind: "stepUp", level: 3 });
  });

  test("bloque une falaise +2 de face avec une normale de sliding", () => {
    const terrain = createTerrain([[2, 4, 4]]);

    expect(
      getTerracedTerrainCollision(
        terrain,
        { x: -0.55, z: 0 },
        { x: -0.65, z: 0 },
        2,
      ),
    ).toEqual({
      kind: "blocked",
      contact: { normalX: -1, normalZ: 0 },
    });
  });

  test("détecte une falaise +2 touchée uniquement par un coin du cercle", () => {
    const terrain = createTerrain([
      [2, 2, 2],
      [2, 4, 2],
      [2, 2, 2],
    ]);

    expect(
      getTerracedTerrainCollision(
        terrain,
        { x: -0.88, z: -0.88 },
        { x: -0.95, z: -0.95 },
        2,
      )?.kind,
    ).toBe("blocked");
  });

  test("ignore une cellule de même niveau et une descente", () => {
    expect(
      getTerracedTerrainCollision(
        createTerrain([[2, 2, 2]]),
        { x: -0.55, z: 0 },
        { x: -0.65, z: 0 },
        2,
      ),
    ).toBeUndefined();
    expect(
      getTerracedTerrainCollision(
        createTerrain([[4, 2, 2]]),
        { x: 0.55, z: 0 },
        { x: 0.65, z: 0 },
        4,
      ),
    ).toBeUndefined();
  });

  test("ignore un mouvement tangent à une falaise", () => {
    const terrain = createTerrain([
      [2, 4, 4],
      [2, 4, 4],
      [2, 4, 4],
    ]);

    expect(
      getTerracedTerrainCollision(
        terrain,
        { x: -0.55, z: 0.1 },
        { x: -0.55, z: 0 },
        2,
      ),
    ).toBeUndefined();
  });

  test("ignore un mouvement sortant d'une falaise", () => {
    const terrain = createTerrain([[2, 4, 4]]);

    expect(
      getTerracedTerrainCollision(
        terrain,
        { x: -0.65, z: 0 },
        { x: -0.55, z: 0 },
        2,
      ),
    ).toBeUndefined();
  });
});
