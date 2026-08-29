import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { createBuildingPlacement } from "./building/createBuildingPlacement";
import { createCameraRotation } from "./camera/createCameraRotation";
import { createWorkbenchCrafting } from "./crafting/createWorkbenchCrafting";
import { createInventory } from "./inventory/createInventory";
import { createWorldInteraction } from "./interaction/createWorldInteraction";
import { createPlayerMovement } from "./player/createPlayerMovement";
import { createResourceInteraction } from "./resources/createResourceInteraction";
import { createToolEquipment } from "./tools/createToolEquipment";
import { createToolInventory } from "./tools/createToolInventory";
import { createToolModels } from "./tools/createToolModels";
import { createIsland } from "./world/createIsland";
import { createGameMaterials } from "./rendering/createGameMaterials";
import { createPlayer } from "./player/createPlayer";
import { createGameCamera } from "./camera/createGameCamera";
import { createLighting } from "./rendering/createLighting";

export function createScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.56, 0.84, 0.91, 1);

  const camera = createGameCamera(scene, engine);

  // ----- Environnement -----

  const shadows = createLighting(scene);
  const materials = createGameMaterials(scene);

  const island = createIsland(scene, {
    water: materials.water,
    sand: materials.sand,
    grass: materials.grass,
    trunk: materials.trunk,
    leaves: materials.leaves,
    rock: materials.rock,
  });

  const player = createPlayer(scene, materials.player);

  const toolModels = createToolModels(scene, player, {
    wood: materials.trunk,
    stone: materials.rock,
  });

  // Seuls les éléments au-dessus du sol projettent une ombre ; les surfaces
  // de l'île les reçoivent pour mieux ancrer les formes dans le diorama.
  [
    player,
    ...island.shadowCasters,
    ...toolModels.stoneAxe.meshes,
    ...toolModels.stonePickaxe.meshes,
  ].forEach((mesh) => shadows.addShadowCaster(mesh));

  // ----- Systèmes de jeu -----

  const inventory = createInventory();
  const toolInventory = createToolInventory();
  const toolEquipment = createToolEquipment(toolInventory, toolModels);
  const builtWorkbenches: TransformNode[] = [];

  const updateCameraRotation = createCameraRotation(camera);
  const updatePlayerMovement = createPlayerMovement(
    player,
    camera,
    island.walkableSurfaces,
  );

  const resourceInteraction = createResourceInteraction((resourceType) =>
    inventory.add(resourceType, 1),
  );
  const workbenchCrafting = createWorkbenchCrafting(
    inventory,
    toolInventory,
    toolEquipment.onToolCrafted,
  );
  const updateWorldInteraction = createWorldInteraction(
    player,
    island.harvestableResources,
    builtWorkbenches,
    resourceInteraction,
    workbenchCrafting,
    toolEquipment.getEquippedItem,
  );
  const updateBuildingPlacement = createBuildingPlacement({
    scene,
    player,
    placementSurfaces: island.placementSurfaces,
    buildableSurfaces: island.buildableSurfaces,
    resources: island.harvestableResources,
    inventory,
    buildingMaterials: {
      wood: materials.trunk,
      roof: materials.shelterRoof,
      stone: materials.rock,
    },
    isCraftingOpen: workbenchCrafting.isOpen,
    onBuildingBuilt: (building) => {
      building.meshes.forEach((mesh) => shadows.addShadowCaster(mesh));
      if (building.type === "workbench") {
        // Le tableau partagé rend immédiatement chaque nouvel établi visible
        // par le coordinateur d'interactions, sans registre global.
        builtWorkbenches.push(building.root);
      }
    },
  });

  // ----- Game loop ----

  scene.onBeforeRenderObservable.add(() => {
    const deltaTimeInSeconds = engine.getDeltaTime() / 1000;
    updateCameraRotation(deltaTimeInSeconds);
    updatePlayerMovement(deltaTimeInSeconds);
    updateWorldInteraction(deltaTimeInSeconds);
    updateBuildingPlacement();
  });

  return scene;
}
