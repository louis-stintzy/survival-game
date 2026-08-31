import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { createToolModels } from "./models/createToolModels";
import { createIsland } from "./world/createIsland";
import { createGameMaterials } from "./rendering/createGameMaterials";
import { createPlayer } from "./models/createPlayer";
import { createGameCamera } from "./camera/createGameCamera";
import { createLighting } from "./rendering/createLighting";
import { createPlacementMaterials } from "./rendering/createPlacementMaterials";
import { createGameplaySystems } from "./gameplay/createGameplaySystems";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

export function createScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.56, 0.84, 0.91, 1);

  const camera = createGameCamera(scene, engine);

  // ----- Environnement -----

  const shadows = createLighting(scene);
  const addShadowCasters = (meshes: readonly Mesh[]) => {
    meshes.forEach((mesh) => shadows.addShadowCaster(mesh));
  };

  const materials = createGameMaterials(scene);
  const placementMaterials = createPlacementMaterials(scene);

  const island = createIsland(scene, {
    water: materials.world.water,
    sand: materials.world.sand,
    grass: materials.world.grass,
    trunk: materials.world.trunk,
    leaves: materials.world.leaves,
    rock: materials.world.rock,
  });

  const player = createPlayer(scene, materials.player.body);

  const toolModels = createToolModels(scene, player, {
    handle: materials.tools.handle,
    head: materials.tools.head,
  });

  // Seuls les éléments au-dessus du sol projettent une ombre ; les surfaces
  // de l'île les reçoivent pour mieux ancrer les formes dans le diorama.
  addShadowCasters([
    player,
    ...island.shadowCasters,
    ...toolModels.stoneAxe.meshes,
    ...toolModels.stonePickaxe.meshes,
  ]);

  // ----- Gameplay -----

  const gameplay = createGameplaySystems({
    scene,
    camera,
    player,
    island,
    toolModels,
    buildingMaterials: materials.building,
    placementMaterials,
    addShadowCasters,
  });

  // ----- Game loop ----

  scene.onBeforeRenderObservable.add(() => {
    const deltaTimeInSeconds = engine.getDeltaTime() / 1000;
    gameplay.update(deltaTimeInSeconds);
  });

  return scene;
}
