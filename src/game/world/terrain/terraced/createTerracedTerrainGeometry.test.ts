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
});

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
