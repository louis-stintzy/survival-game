import type { Engine } from "@babylonjs/core/Engines/engine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Scene } from "@babylonjs/core/scene";
import { createGameCamera } from "../camera/createGameCamera";
import { GAME_PALETTE } from "../constants/gamePalette";
import { createPlayer } from "../models/createPlayer";
import { createLighting } from "../rendering/createLighting";
import { createTerracedTerrainGeometry } from "./createTerracedTerrainGeometry";
import {
  TERRACED_CELL_SIZE,
  TERRACED_HEIGHT_STEP,
  TERRACED_LEVELS,
  TERRACED_WATER_HEIGHT,
} from "./terracedTerrainPrototypeData";

const MAX_SIMULTANEOUS_LIGHTS = 8;
const WATER_VISUAL_SIZE = 60;

export function createTerracedTerrainPrototypeScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.56, 0.84, 0.91, 1);
  createGameCamera(scene, engine);
  const lighting = createLighting(scene);

  const geometry = createTerracedTerrainGeometry({
    levels: TERRACED_LEVELS,
    cellSize: TERRACED_CELL_SIZE,
    heightStep: TERRACED_HEIGHT_STEP,
  });
  const vertexData = new VertexData();
  vertexData.positions = geometry.positions;
  vertexData.indices = geometry.indices;
  vertexData.colors = geometry.colors;
  vertexData.normals = geometry.normals;

  const terrain = new Mesh("terraced-terrain-prototype", scene);
  vertexData.applyToMesh(terrain);
  terrain.material = createMaterial(scene, "terraced-terrain-material", "#FFFFFF");
  terrain.useVertexColors = true;
  terrain.hasVertexAlpha = false;
  terrain.receiveShadows = true;

  const water = MeshBuilder.CreateGround(
    "terraced-water",
    { width: WATER_VISUAL_SIZE, height: WATER_VISUAL_SIZE },
    scene,
  );
  water.position.y = TERRACED_WATER_HEIGHT;
  water.material = createMaterial(
    scene,
    "terraced-water-material",
    GAME_PALETTE.world.water,
    0.7,
  );
  water.receiveShadows = true;

  const shadowCasters = createScaleReferences(scene);
  shadowCasters.forEach((mesh) => lighting.shadows.addShadowCaster(mesh));

  return scene;
}

function createScaleReferences(scene: Scene): Mesh[] {
  const playerMaterial = createMaterial(
    scene,
    "terraced-player-material",
    GAME_PALETTE.player.body,
  );
  const playerGround = getCellCenter(3, 6);
  const player = createPlayer(
    scene,
    playerMaterial,
    new Vector3(playerGround.x, playerGround.y, playerGround.z),
  );

  const trunkMaterial = createMaterial(
    scene,
    "terraced-trunk-material",
    GAME_PALETTE.world.trunk,
  );
  const leavesMaterial = createMaterial(
    scene,
    "terraced-leaves-material",
    GAME_PALETTE.world.leaves,
  );
  const rockMaterial = createMaterial(
    scene,
    "terraced-rock-material",
    GAME_PALETTE.world.rock,
  );
  const meshes: Mesh[] = [player];

  [
    [4, 3, 0.85],
    [3, 7, 1],
    [8, 8, 0.75],
  ].forEach(([column, row, scale], index) => {
    const ground = getCellCenter(column, row);
    const trunk = MeshBuilder.CreateCylinder(
      `terraced-tree-trunk-${index}`,
      {
        height: 2.2 * scale,
        diameterTop: 0.42 * scale,
        diameterBottom: 0.6 * scale,
        tessellation: 7,
      },
      scene,
    );
    trunk.position.set(ground.x, ground.y + 1.1 * scale, ground.z);
    trunk.material = trunkMaterial;

    const crown = MeshBuilder.CreatePolyhedron(
      `terraced-tree-crown-${index}`,
      { type: 2, size: 1.65 * scale },
      scene,
    );
    crown.position.set(ground.x, ground.y + 3 * scale, ground.z);
    crown.scaling.set(0.9, 1.2, 0.9);
    crown.material = leavesMaterial;
    meshes.push(trunk, crown);
  });

  [
    [7, 4, 0.8],
    [8, 6, 1],
    [7, 8, 0.65],
  ].forEach(([column, row, scale], index) => {
    const ground = getCellCenter(column, row);
    const rock = MeshBuilder.CreatePolyhedron(
      `terraced-rock-${index}`,
      { type: 1, size: scale },
      scene,
    );
    rock.position.set(ground.x, ground.y + scale * 0.4, ground.z);
    rock.rotation.set(0.12, index * 0.8, -0.08);
    rock.scaling.set(1, 0.75, 0.85);
    rock.material = rockMaterial;
    meshes.push(rock);
  });

  return meshes;
}

function getCellCenter(column: number, row: number) {
  const columnCount = TERRACED_LEVELS[0].length;
  const rowCount = TERRACED_LEVELS.length;
  return {
    x: (-columnCount * TERRACED_CELL_SIZE) / 2 +
      (column + 0.5) * TERRACED_CELL_SIZE,
    y: TERRACED_LEVELS[row][column] * TERRACED_HEIGHT_STEP,
    z: (-rowCount * TERRACED_CELL_SIZE) / 2 +
      (row + 0.5) * TERRACED_CELL_SIZE,
  };
}

function createMaterial(
  scene: Scene,
  name: string,
  color: string,
  alpha = 1,
): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(color);
  material.specularColor = Color3.Black();
  material.alpha = alpha;
  material.maxSimultaneousLights = MAX_SIMULTANEOUS_LIGHTS;
  return material;
}
