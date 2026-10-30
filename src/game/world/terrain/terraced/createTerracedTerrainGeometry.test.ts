import { describe, expect, test } from "vitest";
import { createTerracedTerrainGeometry } from "./createTerracedTerrainGeometry";
import type {
  TerracedCell,
  TerracedTerrainData,
} from "./terracedTerrainTypes";

describe("createTerracedTerrainGeometry", () => {
  test("une colonne isolée génère un dessus et quatre côtés", () => {
    const geometry = createGeometry([[1]]);

    expect(geometry.positions).toHaveLength(5 * 4 * 3);
    expect(geometry.indices).toHaveLength(5 * 2 * 3);
  });

  test("deux colonnes identiques ne génèrent aucune face entre elles", () => {
    const geometry = createGeometry([[1, 1]]);

    // Deux dessus et six côtés extérieurs, mais aucune face interne.
    expect(geometry.positions).toHaveLength(8 * 4 * 3);
    expect(geometry.indices).toHaveLength(8 * 2 * 3);
  });

  test("un niveau 3 voisin d'un niveau 1 expose exactement deux couches", () => {
    const geometry = createGeometry([[3, 1]]);
    let interfaceVertexCount = 0;

    for (let index = 0; index < geometry.positions.length; index += 3) {
      const x = geometry.positions[index];
      const normalX = geometry.normals[index];
      if (x === 0 && normalX === 1) interfaceVertexCount += 1;
    }

    expect(interfaceVertexCount).toBe(2 * 4);
  });

  test("produit des nombres finis et des indices valides", () => {
    const geometry = createGeometry([
      [0, 1, 0],
      [1, 3, 1],
    ]);
    const vertexCount = geometry.positions.length / 3;

    expect(geometry.colors).toHaveLength(vertexCount * 4);
    expect(geometry.normals).toHaveLength(vertexCount * 3);
    expect(
      [...geometry.positions, ...geometry.colors, ...geometry.normals].every(
        Number.isFinite,
      ),
    ).toBe(true);
    expect(
      geometry.indices.every(
        (index) => Number.isInteger(index) && index >= 0 && index < vertexCount,
      ),
    ).toBe(true);
  });

  test("conserve une couleur nette par face et par surface", () => {
    const grass = createTerracedTerrainGeometry(
      createTerrain([[{ level: 4, surface: "grass" }]]),
    );
    const rock = createTerracedTerrainGeometry(
      createTerrain([[{ level: 4, surface: "rock" }]]),
    );

    expect(grass.colors.slice(0, 4)).not.toEqual(rock.colors.slice(0, 4));
    for (let vertex = 1; vertex < 4; vertex += 1) {
      expect(grass.colors.slice(vertex * 4, vertex * 4 + 4)).toEqual(
        grass.colors.slice(0, 4),
      );
    }
  });

  test("stratifie une colonne grass entre top, dirt et roche profonde", () => {
    const geometry = createSurfaceColumn("grass");
    const top = getFaceColor(geometry.colors, 0);
    const deepRock = getFaceColor(geometry.colors, 1);
    const dirt = getFaceColor(geometry.colors, 3);

    expect(top).not.toEqual(dirt);
    expect(dirt).not.toEqual(deepRock);
    expect(top).not.toEqual(deepRock);
    expectFaceHasConstantColor(geometry.colors, 0);
    expectFaceHasConstantColor(geometry.colors, 1);
    expectFaceHasConstantColor(geometry.colors, 3);
  });

  test("stratifie une colonne sand entre top, côté sable et roche profonde", () => {
    const geometry = createSurfaceColumn("sand");
    const top = getFaceColor(geometry.colors, 0);
    const deepRock = getFaceColor(geometry.colors, 1);
    const sandSide = getFaceColor(geometry.colors, 3);

    expect(top).not.toEqual(sandSide);
    expect(sandSide).not.toEqual(deepRock);
    expect(top).not.toEqual(deepRock);
    expectFaceHasConstantColor(geometry.colors, 0);
    expectFaceHasConstantColor(geometry.colors, 1);
    expectFaceHasConstantColor(geometry.colors, 3);
  });

  test("différencie le dessus et les côtés d'une colonne rock", () => {
    const geometry = createSurfaceColumn("rock");
    const top = getFaceColor(geometry.colors, 0);
    const rockSide = getFaceColor(geometry.colors, 1);

    expect(top).not.toEqual(rockSide);
    expectFaceHasConstantColor(geometry.colors, 0);
    expectFaceHasConstantColor(geometry.colors, 1);
    expect(geometry.colors.every(Number.isFinite)).toBe(true);
  });
});

function createSurfaceColumn(
  surface: Exclude<TerracedCell["surface"], "water">,
) {
  return createTerracedTerrainGeometry(
    createTerrain([[{ level: 3, surface }]]),
  );
}

function getFaceColor(colors: readonly number[], faceIndex: number): number[] {
  const colorStart = faceIndex * 4 * 4;
  return colors.slice(colorStart, colorStart + 4);
}

function expectFaceHasConstantColor(
  colors: readonly number[],
  faceIndex: number,
): void {
  const expected = getFaceColor(colors, faceIndex);
  const colorStart = faceIndex * 4 * 4;
  for (let vertex = 1; vertex < 4; vertex += 1) {
    const vertexStart = colorStart + vertex * 4;
    expect(colors.slice(vertexStart, vertexStart + 4)).toEqual(expected);
  }
}

function createGeometry(levels: readonly (readonly number[])[]) {
  return createTerracedTerrainGeometry(
    createTerrain(
      levels.map((row) =>
        row.map(
          (level): TerracedCell => ({
            level,
            surface: level === 0 ? "water" : "grass",
          }),
        ),
      ),
    ),
  );
}

function createTerrain(
  rows: readonly (readonly TerracedCell[])[],
): TerracedTerrainData {
  return {
    rowCount: rows.length,
    columnCount: rows[0]?.length ?? 0,
    cellSize: 1,
    heightStep: 1,
    waterHeight: 0.3,
    cells: rows.flat(),
  };
}
