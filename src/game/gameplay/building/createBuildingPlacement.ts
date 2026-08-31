import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { Ray } from "@babylonjs/core/Culling/ray";
import type { HarvestableResource } from "../../resources/resourceTypes";
import {
  BUILDING_DEFINITIONS,
  type BuildingType,
} from "../../definitions/buildingDefinitions";
import { createShelter } from "../../models/createShelter";
import { createWorkbench } from "../../models/createWorkbench";
import { ResourceCost } from "../../definitions/resourceDefinitions";

const GRID_SIZE = 1;
const MAX_BUILD_DISTANCE = 6;
const TERRAIN_RAY_HEIGHT = 10;
const TERRAIN_RAY_LENGTH = 20;
const GHOST_ALPHA_INDEX = Number.POSITIVE_INFINITY;

interface ResourceInventory {
  canAfford(cost: ResourceCost): boolean;
  spend(cost: ResourceCost): boolean;
}

export interface BuildingMaterials {
  shelter: {
    posts: StandardMaterial;
    roof: StandardMaterial;
  };

  workbench: {
    top: StandardMaterial;
    legs: StandardMaterial;
    stonePlate: StandardMaterial;
  };
}

export interface PlacementMaterials {
  valid: StandardMaterial;
  invalid: StandardMaterial;
}

interface BuildingPlacementOptions {
  scene: Scene;
  player: Mesh;
  placementSurfaces: readonly AbstractMesh[];
  buildableSurfaces: readonly AbstractMesh[];
  resources: readonly HarvestableResource[];
  resourceInventory: ResourceInventory;
  buildingMaterials: BuildingMaterials;
  placementMaterials: PlacementMaterials;
  isCraftingOpen: () => boolean;
  onBuildingBuilt: (building: BuiltBuilding) => void;
}

interface BuildingGeometry {
  root: TransformNode;
  meshes: Mesh[];
}

export interface BuiltBuilding {
  type: BuildingType;
  root: TransformNode;
  meshes: readonly Mesh[];
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
    placementSurfaces,
    buildableSurfaces,
    resources,
    resourceInventory,
    buildingMaterials,
    placementMaterials,
    isCraftingOpen,
    onBuildingBuilt,
  } = options;
  const canvas = scene.getEngine().getRenderingCanvas();
  if (!canvas) throw new Error("Le canvas Babylon.js est introuvable.");

  const buildingPanel = getElement("#building-panel");
  const buildingName = getElement("#building-name");
  const buildingCostWood = getElement("#building-cost-wood");
  const buildingCostStone = getElement("#building-cost-stone");
  const buildingStatus = getElement("#building-status");
  const placementSurfaceSet = new Set(placementSurfaces);
  const buildableSurfaceSet = new Set(buildableSurfaces);
  const builtFootprints: Footprint[] = [];

  const ghosts: Record<BuildingType, BuildingGeometry> = {
    shelter: createShelter(scene, "shelter-ghost", {
      posts: placementMaterials.invalid,
      roof: placementMaterials.invalid,
    }),
    workbench: createWorkbench(scene, "workbench-ghost", {
      top: placementMaterials.invalid,
      legs: placementMaterials.invalid,
      stonePlate: placementMaterials.invalid,
    }),
  };
  Object.values(ghosts).forEach((ghost) => {
    ghost.meshes.forEach((mesh) => {
      mesh.alphaIndex = GHOST_ALPHA_INDEX;
    });
    ghost.root.setEnabled(false);
  });

  let buildingModeActive = false;
  let selectedBuildingType: BuildingType = "shelter";
  let activationRequested = false;
  let cancellationRequested = false;
  let selectionChangeRequested = false;
  let rotationRequested = false;
  let buildRequested = false;
  let rotationStep = 0;
  let pointerPosition: { x: number; y: number } | undefined;
  let currentPlacement: Placement | undefined;
  let lastGhostValidity: boolean | undefined;
  let lastStatus = "";

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (isCraftingOpen() && key === "b") {
      event.preventDefault();
      return;
    }

    if (isCraftingOpen() && (event.key === "Tab" || key === "escape")) {
      return;
    }

    if (event.key === "Tab" && buildingModeActive) {
      event.preventDefault();
      if (!event.repeat) selectionChangeRequested = true;
      return;
    }

    if (event.repeat) return;

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
    if (isCraftingOpen()) {
      if (buildingModeActive || activationRequested) closeBuildingMode();
      return;
    }

    if (activationRequested) {
      activationRequested = false;
      if (!buildingModeActive) {
        buildingModeActive = true;
        selectedBuildingType = "shelter";
        rotationStep = 0;
        currentPlacement = undefined;
        lastGhostValidity = undefined;
        disableGhosts();
        updateBuildingPanel();
        buildingPanel.hidden = false;
      }
    }

    if (cancellationRequested) {
      closeBuildingMode();
    }

    if (selectionChangeRequested) {
      selectionChangeRequested = false;
      if (buildingModeActive) {
        selectedBuildingType =
          selectedBuildingType === "shelter" ? "workbench" : "shelter";
        rotationStep = 0;
        currentPlacement = undefined;
        lastGhostValidity = undefined;
        disableGhosts();
        updateBuildingPanel();
      }
    }

    if (rotationRequested) {
      rotationRequested = false;
      if (buildingModeActive) rotationStep = (rotationStep + 1) % 4;
    }

    if (!buildingModeActive) return;

    currentPlacement = updateGhostPlacement();

    if (buildRequested) {
      buildRequested = false;
      const definition = BUILDING_DEFINITIONS[selectedBuildingType];
      if (currentPlacement?.valid && resourceInventory.spend(definition.cost)) {
        const building = createBuilding(
          scene,
          `${selectedBuildingType}-${builtFootprints.length}`,
          selectedBuildingType,
          buildingMaterials,
        );
        building.root.position.set(
          currentPlacement.x,
          currentPlacement.y,
          currentPlacement.z,
        );
        building.root.rotation.y = currentPlacement.rotation;
        builtFootprints.push(currentPlacement);
        onBuildingBuilt({
          type: selectedBuildingType,
          root: building.root,
          meshes: building.meshes,
        });

        // Une construction termine volontairement la session de placement.
        // Le joueur doit appuyer de nouveau sur B pour construire à nouveau.
        closeBuildingMode();
      }
    }
  };

  function updateGhostPlacement(): Placement | undefined {
    const ghost = ghosts[selectedBuildingType];
    if (!pointerPosition) {
      ghost.root.setEnabled(false);
      updateStatus("Terrain introuvable", false);
      return undefined;
    }

    const pointerHit = scene.pick(
      pointerPosition.x,
      pointerPosition.y,
      (mesh) => placementSurfaceSet.has(mesh),
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
    const definition = BUILDING_DEFINITIONS[selectedBuildingType];
    const width = rotationStep % 2 === 0 ? definition.width : definition.depth;
    const depth = rotationStep % 2 === 0 ? definition.depth : definition.width;
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

    const definition = BUILDING_DEFINITIONS[selectedBuildingType];
    if (!resourceInventory.canAfford(definition.cost)) {
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
    const hit = scene.pickWithRay(ray, (mesh) => placementSurfaceSet.has(mesh));
    if (!hit?.pickedPoint || !hit.pickedMesh) return undefined;
    return { point: hit.pickedPoint, surface: hit.pickedMesh };
  }

  function resourceBlocks(resource: HarvestableResource, footprint: Footprint) {
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
    const material = valid
      ? placementMaterials.valid
      : placementMaterials.invalid;
    ghosts[selectedBuildingType].meshes.forEach((mesh) => {
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

  function updateBuildingPanel() {
    const definition = BUILDING_DEFINITIONS[selectedBuildingType];
    buildingName.textContent = definition.label.toUpperCase();
    buildingCostWood.textContent = String(definition.cost.wood ?? 0);
    buildingCostStone.textContent = String(definition.cost.stone ?? 0);
  }

  function disableGhosts() {
    Object.values(ghosts).forEach((ghost) => ghost.root.setEnabled(false));
  }

  function closeBuildingMode() {
    buildingModeActive = false;
    activationRequested = false;
    cancellationRequested = false;
    selectionChangeRequested = false;
    rotationRequested = false;
    buildRequested = false;
    currentPlacement = undefined;
    disableGhosts();
    buildingPanel.hidden = true;
  }
}

function createBuilding(
  scene: Scene,
  name: string,
  type: BuildingType,
  materials: BuildingMaterials,
): BuildingGeometry {
  switch (type) {
    case "shelter":
      return createShelter(scene, name, materials.shelter);
    case "workbench":
      return createWorkbench(scene, name, materials.workbench);
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

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`L'élément ${selector} est absent.`);
  return element;
}
