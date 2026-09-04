import type { Scene } from "@babylonjs/core/scene";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Island } from "../world/island/createIsland";
import type { ToolModel } from "../models/createToolModels";
import type { ToolType } from "../definitions/toolDefinitions";
import {
  type BuildingMaterials,
  type PlacementMaterials,
  createBuildingPlacement,
} from "./building/createBuildingPlacement";
import { createWorldInteraction } from "./interaction/createWorldInteraction";
import { createResourceInventory } from "./inventory/createResourceInventory";
import { createToolInventory } from "./inventory/createToolInventory";
import { createToolEquipment } from "./equipment/createToolEquipment";
import { createCameraRotation } from "./movement/createCameraRotation";
import { createPlayerMovement } from "./movement/createPlayerMovement";
import { createResourceInteraction } from "./interaction/createResourceInteraction";
import { createWorkbenchCrafting } from "./crafting/createWorkbenchCrafting";
import { createPlayerWorldCollision } from "./collision/playerWorldCollision";
import { createWorldClock } from "./time/createWorldClock";

const WORLD_DAY_DURATION_SECONDS = 15 * 60;
const INITIAL_WORLD_DAY = 1;
const INITIAL_WORLD_HOUR = 8;

interface GameplaySystemsOptions {
  scene: Scene;
  camera: ArcRotateCamera;
  player: Mesh;
  island: Island;
  toolModels: Record<ToolType, ToolModel>;
  buildingMaterials: BuildingMaterials;
  placementMaterials: PlacementMaterials;
  addShadowCasters: (meshes: readonly Mesh[]) => void;
}

export function createGameplaySystems(options: GameplaySystemsOptions) {
  const {
    scene,
    camera,
    player,
    island,
    toolModels,
    buildingMaterials,
    placementMaterials,
    addShadowCasters,
  } = options;

  // ----- Etat -----

  const resourceInventory = createResourceInventory();
  const toolInventory = createToolInventory();
  const toolEquipment = createToolEquipment(toolInventory, toolModels);
  const builtWorkbenches: TransformNode[] = [];
  const builtCollisionMeshes: Mesh[] = [];

  // ----- Temps -----

  const worldClock = createWorldClock({
    dayDurationSeconds: WORLD_DAY_DURATION_SECONDS,
    initialDay: INITIAL_WORLD_DAY,
    initialHour: INITIAL_WORLD_HOUR,
  });

  // ----- Mouvement -----

  const updateCameraRotation = createCameraRotation(camera);
  const getPlayerWorldCollision = createPlayerWorldCollision(
    island.harvestableResources,
    builtCollisionMeshes,
  );
  const updatePlayerMovement = createPlayerMovement(
    player,
    camera,
    island.walkableSurfaces,
    getPlayerWorldCollision,
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
    resourceInventory,
    buildingMaterials,
    placementMaterials,
    isCraftingOpen: workbenchCrafting.isOpen,
    onBuildingBuilt: (building) => {
      addShadowCasters(building.meshes);
      builtCollisionMeshes.push(...building.collisionMeshes);
      if (building.type === "workbench") {
        builtWorkbenches.push(building.root);
      }
    },
  });

  return {
    getWorldTime() {
      return worldClock.getTime();
    },

    update(deltaTimeInSeconds: number) {
      worldClock.update(deltaTimeInSeconds);
      updateCameraRotation(deltaTimeInSeconds);
      updatePlayerMovement(deltaTimeInSeconds);
      updateWorldInteraction(deltaTimeInSeconds);
      updateBuildingPlacement();
    },
  };
}
