import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type {
  EquippedItem,
  EquipmentType,
} from "../../definitions/equipmentDefinitions";
import {
  createTorchModel,
  type TorchModel,
  type TorchMaterials,
} from "../../models/createTorchModel";

const MAX_TORCH_PLACEMENT_DISTANCE = 5;
// Sur les 8 lumières acceptées par matériau, 2 sont réservées au soleil et à
// l'ambiance. La torche tenue utilise un des 6 slots locaux lorsqu'elle l'est.
const MAX_ACTIVE_TORCH_LIGHTS = 6;
const MAX_ACTIVE_PLACED_LIGHTS_WITH_EQUIPPED_TORCH = 5;

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
  const placedTorches: TorchModel[] = [];
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
    placedTorches.push(torch);

    equipment.refresh();
    updateActiveLights();
    event.preventDefault();
  });

  function updateActiveLights() {
    const activeLightLimit =
      equipment.getEquippedItem() === "torch"
        ? MAX_ACTIVE_PLACED_LIGHTS_WITH_EQUIPPED_TORCH
        : MAX_ACTIVE_TORCH_LIGHTS;
    const nearestTorches = placedTorches
      .map((torch) => ({
        torch,
        distanceSquared:
          (torch.root.position.x - player.position.x) ** 2 +
          (torch.root.position.z - player.position.z) ** 2,
      }))
      .sort((first, second) => first.distanceSquared - second.distanceSquared)
      .slice(0, activeLightLimit);
    const activeTorches = new Set(nearestTorches.map(({ torch }) => torch));

    placedTorches.forEach((torch) => {
      torch.light.setEnabled(activeTorches.has(torch));
    });
  }

  return { update: updateActiveLights };
}
