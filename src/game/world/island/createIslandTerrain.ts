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

    terrainData.triangles.forEach((triangle) => {
      if (triangle.category !== category) return;
      const firstIndex = positions.length / 3;
      triangle.vertexIndices.forEach((vertexIndex) => {
        const vertex = terrainData.vertices[vertexIndex];
        positions.push(vertex.x, vertex.height, vertex.z);
      });
      // L'ordre logique produit des normales +Y avec ComputeNormals et garde
      // donc les faces avant visibles depuis le dessus avec le culling normal.
      indices.push(firstIndex, firstIndex + 1, firstIndex + 2);
    });

    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
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
