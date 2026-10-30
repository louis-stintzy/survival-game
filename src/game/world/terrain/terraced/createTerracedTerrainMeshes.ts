import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import { GAME_PALETTE } from "../../../constants/gamePalette";
import { createCoastalSeabedGeometry } from "./createCoastalSeabedGeometry";
import { createTerracedTerrainGeometry } from "./createTerracedTerrainGeometry";
import type { TerracedTerrainData } from "./terracedTerrainTypes";

const MAX_SIMULTANEOUS_LIGHTS = 8;
const WATER_VISUAL_SIZE_MULTIPLIER = 1.5;
const WATER_ALPHA = 0.55;

export interface TerracedTerrainMeshes {
  terrainMesh: Mesh;
  waterMesh: Mesh;
}

/** Crée le terrain, son fond marin visuel et son plan d'eau indépendant. */
export function createTerracedTerrainMeshes(
  scene: Scene,
  terrain: TerracedTerrainData,
): TerracedTerrainMeshes {
  const geometry = createTerracedTerrainGeometry(terrain);
  const vertexData = new VertexData();
  vertexData.positions = geometry.positions;
  vertexData.indices = geometry.indices;
  vertexData.colors = geometry.colors;
  vertexData.normals = geometry.normals;

  const terrainMesh = new Mesh("terraced-terrain", scene);
  vertexData.applyToMesh(terrainMesh);
  terrainMesh.material = createTerrainMaterial(scene);
  terrainMesh.useVertexColors = true;
  terrainMesh.hasVertexAlpha = false;
  terrainMesh.receiveShadows = true;
  terrainMesh.isPickable = true;

  const logicalWidth = terrain.columnCount * terrain.cellSize;
  const logicalDepth = terrain.rowCount * terrain.cellSize;
  const waterVisualSize =
    Math.max(logicalWidth, logicalDepth) * WATER_VISUAL_SIZE_MULTIPLIER;
  const waterMesh = MeshBuilder.CreateGround(
    "terraced-water",
    { width: waterVisualSize, height: waterVisualSize, subdivisions: 1 },
    scene,
  );
  waterMesh.position.y = terrain.waterHeight;
  waterMesh.material = createWaterMaterial(scene);
  waterMesh.receiveShadows = true;
  waterMesh.isPickable = false;
  createCoastalSeabedMesh(scene, terrain);

  return { terrainMesh, waterMesh };
}

function createCoastalSeabedMesh(
  scene: Scene,
  terrain: TerracedTerrainData,
): void {
  const geometry = createCoastalSeabedGeometry(terrain);
  const vertexData = new VertexData();
  vertexData.positions = geometry.positions;
  vertexData.indices = geometry.indices;
  vertexData.colors = geometry.colors;
  vertexData.normals = geometry.normals;
  const seabedMesh = new Mesh("terraced-coastal-seabed", scene);
  vertexData.applyToMesh(seabedMesh);
  seabedMesh.material = createSeabedMaterial(scene);
  seabedMesh.useVertexColors = true;
  seabedMesh.hasVertexAlpha = false;
  seabedMesh.receiveShadows = true;
  seabedMesh.isPickable = false;
}

function createTerrainMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial(
    "terraced-terrain-vertex-color-material",
    scene,
  );
  material.diffuseColor = Color3.White();
  material.specularColor = Color3.Black();
  material.maxSimultaneousLights = MAX_SIMULTANEOUS_LIGHTS;
  return material;
}

function createWaterMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial("terraced-water-material", scene);
  material.diffuseColor = Color3.FromHexString(GAME_PALETTE.world.water);
  material.specularColor = Color3.Black();
  material.alpha = WATER_ALPHA;
  material.maxSimultaneousLights = MAX_SIMULTANEOUS_LIGHTS;
  return material;
}

function createSeabedMaterial(scene: Scene): StandardMaterial {
  const material = new StandardMaterial(
    "terraced-coastal-seabed-material",
    scene,
  );
  material.diffuseColor = Color3.White();
  material.specularColor = Color3.Black();
  material.maxSimultaneousLights = MAX_SIMULTANEOUS_LIGHTS;
  return material;
}
