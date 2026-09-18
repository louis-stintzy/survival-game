import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import { GAME_PALETTE } from "../../constants/gamePalette";
import { createTerrainMeshData } from "./createTerrainMeshData";
import type { TerrainData } from "./terrainTypes";

export interface TerrainMeshes {
  terrainMesh: Mesh;
  waterMesh: Mesh;
}

/** Crée le terrain coloré unique et son plan d'eau indépendant. */
export function createTerrainMeshes(
  scene: Scene,
  terrain: TerrainData,
): TerrainMeshes {
  const meshData = createTerrainMeshData(terrain);
  const normals: number[] = [];
  VertexData.ComputeNormals(meshData.positions, meshData.indices, normals);

  const vertexData = new VertexData();
  vertexData.positions = meshData.positions;
  vertexData.indices = meshData.indices;
  vertexData.colors = meshData.colors;
  vertexData.normals = normals;

  const terrainMesh = new Mesh("terrain-heightfield", scene);
  vertexData.applyToMesh(terrainMesh);
  terrainMesh.material = createTerrainMaterial(scene);
  terrainMesh.useVertexColors = true;
  terrainMesh.hasVertexAlpha = false;
  terrainMesh.receiveShadows = true;

  const terrainSize = terrain.halfSize * 2;
  const waterMesh = MeshBuilder.CreateGround(
    "terrain-water",
    { width: terrainSize, height: terrainSize, subdivisions: 1 },
    scene,
  );
  waterMesh.position.y = terrain.waterHeight;
  waterMesh.material = createWaterMaterial(scene);
  waterMesh.receiveShadows = true;

  return { terrainMesh, waterMesh };
}

function createTerrainMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial("terrain-vertex-color-material", scene);
  material.diffuseColor = Color3.White();
  material.specularColor = Color3.Black();
  return material;
}

function createWaterMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial("terrain-water-material", scene);
  material.diffuseColor = Color3.FromHexString(GAME_PALETTE.world.water);
  material.specularColor = Color3.Black();
  material.alpha = 0.92;
  return material;
}
