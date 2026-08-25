import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import { Ray } from "@babylonjs/core/Culling/ray";
import type { InventoryCost } from "../inventory/createInventory";
import type { HarvestableResource } from "../resources/resourceTypes";
import {
  createShelter,
  SHELTER_DEPTH,
  SHELTER_WIDTH,
} from "./createShelter";

const GRID_SIZE = 1;
const MAX_BUILD_DISTANCE = 6;
const TERRAIN_RAY_HEIGHT = 10;
const TERRAIN_RAY_LENGTH = 20;
const SHELTER_COST: InventoryCost = { wood: 4, stone: 2 };

interface BuildingInventory {
  canAfford(cost: InventoryCost): boolean;
  spend(cost: InventoryCost): boolean;
}

interface ShelterMaterials {
  wood: StandardMaterial;
  roof: StandardMaterial;
}

interface BuildingPlacementOptions {
  scene: Scene;
  player: Mesh;
  walkableSurfaces: readonly AbstractMesh[];
  buildableSurfaces: readonly AbstractMesh[];
  resources: readonly HarvestableResource[];
  inventory: BuildingInventory;
  shelterMaterials: ShelterMaterials;
  onShelterBuilt: (meshes: readonly Mesh[]) => void;
}

interface Footprint {
  x: number;
  z: number;
  width: number;
  depth: number;
}

interface Placement extends Footprint {
  y: number;
  rotation: number;
  valid: boolean;
}

export function createBuildingPlacement(options: BuildingPlacementOptions) {
  const {
    scene,
    player,
    walkableSurfaces,
    buildableSurfaces,
    resources,
    inventory,
    shelterMaterials,
    onShelterBuilt,
  } = options;
  const canvas = scene.getEngine().getRenderingCanvas();
  if (!canvas) throw new Error("Le canvas Babylon.js est introuvable.");

  const buildingPanel = getElement("#building-panel");
  const buildingStatus = getElement("#building-status");
  const walkableSurfaceSet = new Set(walkableSurfaces);
  const buildableSurfaceSet = new Set(buildableSurfaces);
  const builtFootprints: Footprint[] = [];

  const validGhostMaterial = createGhostMaterial(
    scene,
    "valid-shelter-ghost-material",
    new Color3(0.2, 0.85, 0.35),
  );
  const invalidGhostMaterial = createGhostMaterial(
    scene,
    "invalid-shelter-ghost-material",
    new Color3(0.9, 0.2, 0.18),
  );
  const ghost = createShelter(scene, "shelter-ghost", {
    wood: invalidGhostMaterial,
    roof: invalidGhostMaterial,
  });
  ghost.root.setEnabled(false);

  let buildingModeActive = false;
  let activationRequested = false;
  let cancellationRequested = false;
  let rotationRequested = false;
  let buildRequested = false;
  let rotationStep = 0;
  let pointerPosition: { x: number; y: number } | undefined;
  let currentPlacement: Placement | undefined;
  let lastGhostValidity: boolean | undefined;
  let lastStatus = "";

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    const key = event.key.toLowerCase();
    if (key === "b") {
      activationRequested = true;
      event.preventDefault();
    } else if (key === "escape") {
      cancellationRequested = true;
    } else if (key === "r" && buildingModeActive) {
      rotationRequested = true;
      event.preventDefault();
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    const bounds = canvas.getBoundingClientRect();
    pointerPosition = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (buildingModeActive && event.button === 0) {
      buildRequested = true;
      event.preventDefault();
    }
  });

  return () => {
    if (activationRequested) {
      activationRequested = false;
      if (!buildingModeActive) {
        buildingModeActive = true;
        buildingPanel.hidden = false;
      }
    }

    if (cancellationRequested) {
      cancellationRequested = false;
      buildingModeActive = false;
      buildRequested = false;
      ghost.root.setEnabled(false);
      buildingPanel.hidden = true;
    }

    if (rotationRequested) {
      rotationRequested = false;
      if (buildingModeActive) rotationStep = (rotationStep + 1) % 4;
    }

    if (!buildingModeActive) return;

    currentPlacement = updateGhostPlacement();

    if (buildRequested) {
      buildRequested = false;
      if (currentPlacement?.valid && inventory.spend(SHELTER_COST)) {
        const shelter = createShelter(
          scene,
          `shelter-${builtFootprints.length}`,
          shelterMaterials,
        );
        shelter.root.position.set(
          currentPlacement.x,
          currentPlacement.y,
          currentPlacement.z,
        );
        shelter.root.rotation.y = currentPlacement.rotation;
        builtFootprints.push(currentPlacement);
        onShelterBuilt(shelter.meshes);
        buildingModeActive = false;
        currentPlacement = undefined;
        ghost.root.setEnabled(false);
        buildingPanel.hidden = true;
      }
    }
  };

  function updateGhostPlacement(): Placement | undefined {
    if (!pointerPosition) {
      ghost.root.setEnabled(false);
      updateStatus("Terrain introuvable", false);
      return undefined;
    }

    const pointerHit = scene.pick(
      pointerPosition.x,
      pointerPosition.y,
      (mesh) => walkableSurfaceSet.has(mesh),
    );
    if (!pointerHit?.pickedPoint) {
      ghost.root.setEnabled(false);
      updateStatus("Terrain introuvable", false);
      return undefined;
    }

    const x = Math.round(pointerHit.pickedPoint.x / GRID_SIZE) * GRID_SIZE;
    const z = Math.round(pointerHit.pickedPoint.z / GRID_SIZE) * GRID_SIZE;
    const centerGround = getGroundAt(x, z);
    if (!centerGround) {
      ghost.root.setEnabled(false);
      updateStatus("Terrain introuvable", false);
      return undefined;
    }

    const rotation = rotationStep * (Math.PI / 2);
    const width = rotationStep % 2 === 0 ? SHELTER_WIDTH : SHELTER_DEPTH;
    const depth = rotationStep % 2 === 0 ? SHELTER_DEPTH : SHELTER_WIDTH;
    const footprint = { x, z, width, depth };
    const validation = validatePlacement(footprint);
    const placement = {
      ...footprint,
      y: centerGround.point.y,
      rotation,
      valid: validation.valid,
    };

    ghost.root.setEnabled(true);
    ghost.root.position.set(x, placement.y, z);
    ghost.root.rotation.y = rotation;
    updateGhostMaterial(validation.valid);
    updateStatus(validation.reason, validation.valid);
    return placement;
  }

  function validatePlacement(footprint: Footprint) {
    if (!isFootprintOnBuildableGround(footprint)) {
      return { valid: false, reason: "Terrain non constructible" };
    }

    const distanceX = footprint.x - player.position.x;
    const distanceZ = footprint.z - player.position.z;
    if (distanceX ** 2 + distanceZ ** 2 > MAX_BUILD_DISTANCE ** 2) {
      return { valid: false, reason: "Hors de portée" };
    }

    if (resources.some((resource) => resourceBlocks(resource, footprint))) {
      return { valid: false, reason: "Emplacement occupé" };
    }

    if (builtFootprints.some((built) => footprintsOverlap(footprint, built))) {
      return { valid: false, reason: "Emplacement occupé" };
    }

    if (!inventory.canAfford(SHELTER_COST)) {
      return { valid: false, reason: "Ressources insuffisantes" };
    }

    return { valid: true, reason: "Emplacement valide" };
  }

  function isFootprintOnBuildableGround(footprint: Footprint) {
    const halfWidth = footprint.width / 2;
    const halfDepth = footprint.depth / 2;
    const points = [
      [footprint.x, footprint.z],
      [footprint.x - halfWidth, footprint.z - halfDepth],
      [footprint.x - halfWidth, footprint.z + halfDepth],
      [footprint.x + halfWidth, footprint.z - halfDepth],
      [footprint.x + halfWidth, footprint.z + halfDepth],
    ];

    return points.every(([x, z]) => {
      const ground = getGroundAt(x, z);
      return ground && buildableSurfaceSet.has(ground.surface);
    });
  }

  function getGroundAt(x: number, z: number) {
    const ray = new Ray(
      new Vector3(x, TERRAIN_RAY_HEIGHT, z),
      Vector3.Down(),
      TERRAIN_RAY_LENGTH,
    );
    const hit = scene.pickWithRay(ray, (mesh) => walkableSurfaceSet.has(mesh));
    if (!hit?.pickedPoint || !hit.pickedMesh) return undefined;
    return { point: hit.pickedPoint, surface: hit.pickedMesh };
  }

  function resourceBlocks(
    resource: HarvestableResource,
    footprint: Footprint,
  ) {
    if (resource.harvested) return false;

    // Le premier mesh est le tronc pour un arbre et le rocher lui-même pour
    // la pierre : sa bounding box représente l'obstacle proche du sol.
    const obstacle = resource.meshes[0];
    obstacle.computeWorldMatrix(true);
    const bounds = obstacle.getBoundingInfo().boundingBox;
    return footprintOverlapsBounds(
      footprint,
      bounds.minimumWorld.x,
      bounds.maximumWorld.x,
      bounds.minimumWorld.z,
      bounds.maximumWorld.z,
    );
  }

  function updateGhostMaterial(valid: boolean) {
    if (lastGhostValidity === valid) return;
    const material = valid ? validGhostMaterial : invalidGhostMaterial;
    ghost.meshes.forEach((mesh) => {
      mesh.material = material;
    });
    lastGhostValidity = valid;
  }

  function updateStatus(message: string, valid: boolean) {
    if (lastStatus !== message) {
      buildingStatus.textContent = message;
      lastStatus = message;
    }
    buildingStatus.classList.toggle("is-valid", valid);
  }
}

function footprintsOverlap(first: Footprint, second: Footprint) {
  return footprintOverlapsBounds(
    first,
    second.x - second.width / 2,
    second.x + second.width / 2,
    second.z - second.depth / 2,
    second.z + second.depth / 2,
  );
}

function footprintOverlapsBounds(
  footprint: Footprint,
  minimumX: number,
  maximumX: number,
  minimumZ: number,
  maximumZ: number,
) {
  return (
    footprint.x - footprint.width / 2 < maximumX &&
    footprint.x + footprint.width / 2 > minimumX &&
    footprint.z - footprint.depth / 2 < maximumZ &&
    footprint.z + footprint.depth / 2 > minimumZ
  );
}

function createGhostMaterial(
  scene: Scene,
  name: string,
  color: Color3,
) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.emissiveColor = color.scale(0.25);
  material.specularColor = Color3.Black();
  material.alpha = 0.45;
  return material;
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`L'élément ${selector} est absent.`);
  return element;
}
