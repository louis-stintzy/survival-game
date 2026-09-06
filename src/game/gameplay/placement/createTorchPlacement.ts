import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type {
  EquippedItem,
  EquipmentType,
} from "../../definitions/equipmentDefinitions";
import {
  createTorchModel,
  type TorchMaterials,
} from "../../models/createTorchModel";

const MAX_TORCH_PLACEMENT_DISTANCE = 5;

interface EquipmentInventory {
  getCount(type: EquipmentType): number;
  remove(type: EquipmentType, amount: number): boolean;
}

interface Equipment {
  getEquippedItem(): EquippedItem;
  refresh(): void;
}

interface TorchPlacementOptions {
  scene: Scene;
  player: Mesh;
  placementSurfaces: readonly AbstractMesh[];
  equipmentInventory: EquipmentInventory;
  equipment: Equipment;
  materials: TorchMaterials;
  isBuildingModeActive: () => boolean;
  isCraftingOpen: () => boolean;
}

export function createTorchPlacement(options: TorchPlacementOptions) {
  const {
    scene,
    player,
    placementSurfaces,
    equipmentInventory,
    equipment,
    materials,
    isBuildingModeActive,
    isCraftingOpen,
  } = options;
  const canvas = scene.getEngine().getRenderingCanvas();
  if (!canvas) throw new Error("Le canvas Babylon.js est introuvable.");

  const placementSurfaceSet = new Set(placementSurfaces);
  let placedTorchCount = 0;

  canvas.addEventListener("pointerdown", (event) => {
    if (
      event.button !== 0 ||
      equipment.getEquippedItem() !== "torch" ||
      isBuildingModeActive() ||
      isCraftingOpen()
    ) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const hit = scene.pick(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      (mesh) => placementSurfaceSet.has(mesh),
    );
    if (!hit?.pickedPoint) return;

    const distanceX = hit.pickedPoint.x - player.position.x;
    const distanceZ = hit.pickedPoint.z - player.position.z;
    if (
      distanceX ** 2 + distanceZ ** 2 >
      MAX_TORCH_PLACEMENT_DISTANCE ** 2
    ) {
      return;
    }

    if (!equipmentInventory.remove("torch", 1)) {
      equipment.refresh();
      return;
    }

    const torch = createTorchModel(
      scene,
      `placed-torch-${placedTorchCount++}`,
      materials,
    );
    torch.root.position.copyFrom(hit.pickedPoint);
    torch.root.position.y += torch.baseOffsetY;
    torch.meshes.forEach((mesh) => {
      mesh.isPickable = false;
      mesh.receiveShadows = true;
    });

    equipment.refresh();
    event.preventDefault();
  });
}
