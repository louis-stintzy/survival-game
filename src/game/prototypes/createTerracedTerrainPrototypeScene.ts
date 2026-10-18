import type { Engine } from "@babylonjs/core/Engines/engine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { createGameCamera } from "../camera/createGameCamera";
import { GAME_PALETTE } from "../constants/gamePalette";
import { createCameraRotation } from "../gameplay/movement/createCameraRotation";
import { createPlayer } from "../models/createPlayer";
import { createLighting } from "../rendering/createLighting";
import { createBaseTerracedTerrainData } from "../world/terrain/terraced/createBaseTerracedTerrainData";
import { createTerracedTerrainMeshes } from "../world/terrain/terraced/createTerracedTerrainMeshes";
import { sampleTerracedTerrain } from "../world/terrain/terraced/sampleTerracedTerrain";
import type { TerracedTerrainData } from "../world/terrain/terraced/terracedTerrainTypes";
import { createTerracedPlayerMovement } from "./createTerracedPlayerMovement";
import { TERRACED_TERRAIN_DATA } from "./terracedTerrainPrototypeData";

const MAX_SIMULTANEOUS_LIGHTS = 8;

export function createTerracedTerrainPrototypeScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.56, 0.84, 0.91, 1);
  const camera = createGameCamera(scene, engine);
  const lighting = createLighting(scene);
  const showBaseTerrain =
    new URLSearchParams(window.location.search).get("terrain") === "base";
  const terrainData = showBaseTerrain
    ? createBaseTerracedTerrainData()
    : TERRACED_TERRAIN_DATA;

  createTerracedTerrainMeshes(scene, terrainData);

  const references = createScaleReferences(scene, terrainData, showBaseTerrain);
  references.shadowCasters.forEach((mesh) =>
    lighting.shadows.addShadowCaster(mesh),
  );

  const sampleTerrain = (x: number, z: number) =>
    sampleTerracedTerrain(terrainData, x, z);
  const updateCameraRotation = createCameraRotation(camera);
  const updatePlayerMovement = createTerracedPlayerMovement(
    references.player,
    camera,
    sampleTerrain,
  );
  scene.onBeforeRenderObservable.add(() => {
    const deltaTimeInSeconds = engine.getDeltaTime() / 1000;
    updateCameraRotation(deltaTimeInSeconds);
    updatePlayerMovement(deltaTimeInSeconds);
  });

  return scene;
}

function createScaleReferences(
  scene: Scene,
  terrain: TerracedTerrainData,
  playerOnly: boolean,
): {
  player: Mesh;
  shadowCasters: Mesh[];
} {
  const playerMaterial = createMaterial(
    scene,
    "terraced-player-material",
    GAME_PALETTE.player.body,
  );
  const playerGround = playerOnly
    ? findCentralLandCell(terrain)
    : getCellCenter(terrain, 3, 6);
  const player = createPlayer(
    scene,
    playerMaterial,
    new Vector3(playerGround.x, playerGround.y, playerGround.z),
  );
  const meshes: Mesh[] = [player];
  if (playerOnly) return { player, shadowCasters: meshes };

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
  [
    [4, 3, 0.85],
    [3, 7, 1],
    [8, 8, 0.75],
  ].forEach(([column, row, scale], index) => {
    const ground = getCellCenter(terrain, column, row);
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
    const ground = getCellCenter(terrain, column, row);
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

  return { player, shadowCasters: meshes };
}

function findCentralLandCell(terrain: TerracedTerrainData) {
  const centerColumn = (terrain.columnCount - 1) / 2;
  const centerRow = (terrain.rowCount - 1) / 2;
  let closest: { column: number; row: number; distance: number } | undefined;

  terrain.cells.forEach((cell, index) => {
    if (cell.surface === "water") return;
    const row = Math.floor(index / terrain.columnCount);
    const column = index % terrain.columnCount;
    const distance = Math.hypot(column - centerColumn, row - centerRow);
    if (!closest || distance < closest.distance) {
      closest = { column, row, distance };
    }
  });

  if (!closest) throw new Error("Le terrain terrassé ne contient aucune terre.");
  return getCellCenter(terrain, closest.column, closest.row);
}

function getCellCenter(
  terrain: TerracedTerrainData,
  column: number,
  row: number,
) {
  const {
    columnCount,
    rowCount,
    cellSize,
    heightStep,
    cells,
  } = terrain;
  const cell = cells[row * columnCount + column];
  return {
    x: (-columnCount * cellSize) / 2 + (column + 0.5) * cellSize,
    y: cell.level * heightStep,
    z: (-rowCount * cellSize) / 2 + (row + 0.5) * cellSize,
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
