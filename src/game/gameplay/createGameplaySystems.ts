import type { Scene } from "@babylonjs/core/scene";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Island } from "../world/createIsland";
import type { ToolModel } from "../tools/createToolModels";
import type { ToolType } from "../tools/toolDefinitions";
import {
  BuildingMaterials,
  createBuildingPlacement,
  PlacementMaterials,
} from "../building/createBuildingPlacement";
import { createWorldInteraction } from "../interaction/createWorldInteraction";
import { createResourceInventory } from "../resources/createResourceInventory";
import { createToolInventory } from "../tools/createToolInventory";
import { createToolEquipment } from "../tools/createToolEquipment";
import { createCameraRotation } from "../camera/createCameraRotation";
import { createPlayerMovement } from "../player/createPlayerMovement";
import { createResourceInteraction } from "../resources/createResourceInteraction";
import { createWorkbenchCrafting } from "../crafting/createWorkbenchCrafting";

export function createGameplaySystems(
  scene: Scene,
  camera: ArcRotateCamera,
  player: Mesh,
  island: Island,
  toolModels: Record<ToolType, ToolModel>,
  buildingMaterials: BuildingMaterials,
  placementMaterials: PlacementMaterials,
  addShadowCasters: (meshes: readonly Mesh[]) => void,
) {
  // ----- Etat -----

  const resourceInventory = createResourceInventory();
  const toolInventory = createToolInventory();
  const toolEquipment = createToolEquipment(toolInventory, toolModels);
  const builtWorkbenches: TransformNode[] = [];

  // ----- Mouvement -----

  const updateCameraRotation = createCameraRotation(camera);
  const updatePlayerMovement = createPlayerMovement(
    player,
    camera,
    island.walkableSurfaces,
  );

  // ----- Système -----

  const resourceInteraction = createResourceInteraction((resourceType) =>
    resourceInventory.add(resourceType, 1),
  );
  const workbenchCrafting = createWorkbenchCrafting(
    resourceInventory,
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

    resourceInventory: resourceInventory,

    buildingMaterials,
    placementMaterials,

    isCraftingOpen: workbenchCrafting.isOpen,

    onBuildingBuilt: (building) => {
      addShadowCasters(building.meshes);

      if (building.type === "workbench") {
        builtWorkbenches.push(building.root);
      }
    },
  });

  return {
    update(deltaTimeInSeconds: number) {
      updateCameraRotation(deltaTimeInSeconds);
      updatePlayerMovement(deltaTimeInSeconds);
      updateWorldInteraction(deltaTimeInSeconds);
      updateBuildingPlacement();
    },
  };
}
