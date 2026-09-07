import type { Scene } from "@babylonjs/core/scene";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Island } from "../world/island/createIsland";
import type { EquipmentModel } from "../models/createEquipmentModels";
import type { EquipmentType } from "../definitions/equipmentDefinitions";
import {
  type BuildingMaterials,
  type PlacementMaterials,
  createBuildingPlacement,
} from "./placement/createBuildingPlacement";
import { createWorldInteraction } from "./interaction/createWorldInteraction";
import { createResourceInventory } from "./inventory/createResourceInventory";
import { createEquipmentInventory } from "./inventory/createEquipmentInventory";
import { createEquipment } from "./equipment/createEquipment";
import { createCameraRotation } from "./movement/createCameraRotation";
import { createPlayerMovement } from "./movement/createPlayerMovement";
import { createResourceInteraction } from "./interaction/createResourceInteraction";
import { createWorkbenchCrafting } from "./crafting/createWorkbenchCrafting";
import { createPlayerWorldCollision } from "./collision/playerWorldCollision";
import { createWorldClock } from "./time/createWorldClock";
import { createWorldTimeDevControls } from "./time/createWorldTimeDevControls";
import type { TorchMaterials } from "../models/createTorchModel";
import { createTorchPlacement } from "./placement/createTorchPlacement";

const WORLD_DAY_DURATION_SECONDS = 30 * 60;
const INITIAL_WORLD_DAY = 1;
const INITIAL_WORLD_HOUR = 8;

interface GameplaySystemsOptions {
  scene: Scene;
  camera: ArcRotateCamera;
  player: Mesh;
  island: Island;
  equipmentModels: Record<EquipmentType, EquipmentModel>;
  torchMaterials: TorchMaterials;
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
    equipmentModels,
    torchMaterials,
    buildingMaterials,
    placementMaterials,
    addShadowCasters,
  } = options;

  // ----- Etat -----

  const resourceInventory = createResourceInventory();
  const equipmentInventory = createEquipmentInventory();
  const equipment = createEquipment(equipmentInventory, equipmentModels);
  const builtWorkbenches: TransformNode[] = [];
  const builtCollisionMeshes: Mesh[] = [];

  // ----- Temps -----

  const worldClock = createWorldClock({
    dayDurationSeconds: WORLD_DAY_DURATION_SECONDS,
    initialDay: INITIAL_WORLD_DAY,
    initialHour: INITIAL_WORLD_HOUR,
  });

  createWorldTimeDevControls(worldClock);

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
    equipmentInventory,
    equipment.onEquipmentCrafted,
  );

  const updateWorldInteraction = createWorldInteraction(
    player,
    island.harvestableResources,
    builtWorkbenches,
    resourceInteraction,
    workbenchCrafting,
    equipment.getEquippedItem,
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

  createTorchPlacement({
    scene,
    player,
    placementSurfaces: island.walkableSurfaces,
    equipmentInventory,
    equipment,
    materials: torchMaterials,
    isBuildingModeActive: updateBuildingPlacement.isActive,
    isCraftingOpen: workbenchCrafting.isOpen,
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
      updateBuildingPlacement.update();
    },
  };
}
