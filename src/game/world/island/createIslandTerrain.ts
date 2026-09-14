import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import {
  TERRAIN_HALF_SIZE,
  WATER_HEIGHT,
  type GeneratedIslandTerrain,
  type TerrainCategory,
} from "../generation/generateIslandTerrain";

interface IslandTerrainMaterials {
  water: StandardMaterial;
  sand: StandardMaterial;
  grass: StandardMaterial;
  rock: StandardMaterial;
}

export interface IslandTerrain {
  water: Mesh;
  beach: Mesh;
  grass: Mesh;
  rockyPlateau: Mesh;
}

/** Transforme les données logiques de grille en trois surfaces jointives. */
export function createIslandTerrain(
  scene: Scene,
  terrainData: GeneratedIslandTerrain,
  materials: IslandTerrainMaterials,
): IslandTerrain {
  const water = MeshBuilder.CreateCylinder(
    "water",
    { diameter: TERRAIN_HALF_SIZE * 2 + 20, height: 0.6, tessellation: 48 },
    scene,
  );
  water.position.y = WATER_HEIGHT - 0.3;
  water.material = materials.water;
  water.receiveShadows = true;

  const terrainPositions = terrainData.vertices.flatMap((vertex) => [
    vertex.x,
    vertex.height,
    vertex.z,
  ]);
  const terrainIndices = terrainData.triangles.flatMap((triangle) =>
    Array.from(triangle.vertexIndices),
  );
  const terrainNormals: number[] = [];
  VertexData.ComputeNormals(terrainPositions, terrainIndices, terrainNormals);

  const beach = createCategoryMesh("beach", "beach", materials.sand);
  const grass = createCategoryMesh("grass", "grass", materials.grass);
  const rockyPlateau = createCategoryMesh(
    "rock",
    "rocky-plateau",
    materials.rock,
  );
  return { water, beach, grass, rockyPlateau };

  function createCategoryMesh(
    category: TerrainCategory,
    name: string,
    material: StandardMaterial,
  ): Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const localIndexByVertex = new Map<number, number>();

    terrainData.triangles.forEach((triangle) => {
      if (triangle.category !== category) return;
      triangle.vertexIndices.forEach((vertexIndex) => {
        let localIndex = localIndexByVertex.get(vertexIndex);
        if (localIndex !== undefined) {
          indices.push(localIndex);
          return;
        }

        localIndex = positions.length / 3;
        localIndexByVertex.set(vertexIndex, localIndex);
        const vertex = terrainData.vertices[vertexIndex];
        positions.push(vertex.x, vertex.height, vertex.z);
        const normalOffset = vertexIndex * 3;
        normals.push(
          terrainNormals[normalOffset],
          terrainNormals[normalOffset + 1],
          terrainNormals[normalOffset + 2],
        );
        indices.push(localIndex);
      });
    });

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;

    const mesh = new Mesh(name, scene);
    vertexData.applyToMesh(mesh);
    mesh.material = material;
    mesh.receiveShadows = true;
    return mesh;
  }
}
