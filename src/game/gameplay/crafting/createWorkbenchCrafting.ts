import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import {
  EQUIPMENT_DEFINITIONS,
  EQUIPMENT_TYPES,
  type EquipmentType,
} from "../../definitions/equipmentDefinitions";
import type { ResourceCost } from "../../definitions/resourceDefinitions";

interface ResourceInventory {
  canAfford(cost: ResourceCost): boolean;
  spend(cost: ResourceCost): boolean;
}

interface EquipmentInventory {
  add(type: EquipmentType, amount: number): void;
  getCount(type: EquipmentType): number;
}

interface RecipeElements {
  container: HTMLElement;
  label: HTMLElement;
  woodCost: HTMLElement;
  stoneCost: HTMLElement;
  ownedCount: HTMLElement;
}

export function createWorkbenchCrafting(
  resourceInventory: ResourceInventory,
  equipmentInventory: EquipmentInventory,
  onEquipmentCrafted: (type: EquipmentType) => void,
) {
  const panel = getElement("#crafting-panel");
  const status = getElement("#crafting-status");
  const progress = getElement("#crafting-progress");
  const progressLabel = getElement("#crafting-progress-label");
  const progressBar = getElement<HTMLProgressElement>("#crafting-progress-bar");
  const recipeElements: Record<EquipmentType, RecipeElements> = {
    stoneAxe: getRecipeElements("stone-axe"),
    stonePickaxe: getRecipeElements("stone-pickaxe"),
    torch: getRecipeElements("torch"),
  };

  let menuOpen = false;
  let activeWorkbench: TransformNode | undefined;
  let selectedEquipmentType: EquipmentType = "stoneAxe";
  let craftingTarget: EquipmentType | undefined;
  let craftingElapsedSeconds = 0;
  let selectionChangeRequested = false;
  let closeRequested = false;

  EQUIPMENT_TYPES.forEach((type) => {
    const definition = EQUIPMENT_DEFINITIONS[type];
    const elements = recipeElements[type];
    elements.label.textContent = definition.label;
    elements.woodCost.textContent = String(definition.cost.wood ?? 0);
    elements.stoneCost.textContent = String(definition.cost.stone ?? 0);
  });

  window.addEventListener("keydown", (event) => {
    if (!menuOpen) return;

    if (event.key === "Tab") {
      event.preventDefault();
      if (!event.repeat && !craftingTarget) selectionChangeRequested = true;
    } else if (event.key.toLowerCase() === "escape" && !event.repeat) {
      closeRequested = true;
    }
  });

  window.addEventListener("blur", () => close());

  function open(workbench: TransformNode) {
    activeWorkbench = workbench;
    menuOpen = true;
    selectedEquipmentType = EQUIPMENT_TYPES[0];
    selectionChangeRequested = false;
    closeRequested = false;
    resetCraftingProgress();
    setStatus("");
    updateSelection();
    EQUIPMENT_TYPES.forEach(updateOwnedCount);
    panel.hidden = false;
  }

  function close() {
    menuOpen = false;
    activeWorkbench = undefined;
    selectionChangeRequested = false;
    closeRequested = false;
    resetCraftingProgress();
    setStatus("");
    panel.hidden = true;
  }

  function update(deltaTimeInSeconds: number, interactionPressed: boolean) {
    if (!menuOpen) return;

    if (closeRequested) {
      close();
      return;
    }

    if (selectionChangeRequested) {
      selectionChangeRequested = false;
      const selectedIndex = EQUIPMENT_TYPES.indexOf(selectedEquipmentType);
      selectedEquipmentType =
        EQUIPMENT_TYPES[(selectedIndex + 1) % EQUIPMENT_TYPES.length];
      updateSelection();
      setStatus("");
    }

    if (craftingTarget) {
      const definition = EQUIPMENT_DEFINITIONS[craftingTarget];
      craftingElapsedSeconds += deltaTimeInSeconds;
      progressBar.value = Math.min(
        craftingElapsedSeconds / definition.craftingDurationSeconds,
        1,
      );

      if (craftingElapsedSeconds >= definition.craftingDurationSeconds) {
        const completedEquipmentType = craftingTarget;
        resetCraftingProgress();

        // Le paiement à la fin évite tout remboursement lors d'une annulation.
        if (resourceInventory.spend(definition.cost)) {
          equipmentInventory.add(completedEquipmentType, 1);
          updateOwnedCount(completedEquipmentType);
          onEquipmentCrafted(completedEquipmentType);
          setStatus(`${definition.label} fabriquée`);
        } else {
          setStatus("Ressources insuffisantes");
        }
      }
      return;
    }

    if (!interactionPressed) return;

    const definition = EQUIPMENT_DEFINITIONS[selectedEquipmentType];
    if (!resourceInventory.canAfford(definition.cost)) {
      setStatus("Ressources insuffisantes");
      return;
    }

    craftingTarget = selectedEquipmentType;
    craftingElapsedSeconds = 0;
    progressLabel.textContent = `Fabrication de ${definition.label}`;
    progressBar.value = 0;
    progress.hidden = false;
    setStatus("");
  }

  function resetCraftingProgress() {
    craftingTarget = undefined;
    craftingElapsedSeconds = 0;
    progressBar.value = 0;
    progress.hidden = true;
  }

  function updateSelection() {
    EQUIPMENT_TYPES.forEach((type) => {
      recipeElements[type].container.classList.toggle(
        "is-selected",
        type === selectedEquipmentType,
      );
    });
  }

  function updateOwnedCount(type: EquipmentType) {
    recipeElements[type].ownedCount.textContent = String(
      equipmentInventory.getCount(type),
    );
  }

  function setStatus(message: string) {
    if (status.textContent !== message) status.textContent = message;
  }

  return {
    open,
    close,
    update,
    isOpen: () => menuOpen,
    getActiveWorkbench: () => activeWorkbench,
  };
}

function getRecipeElements(idPart: string): RecipeElements {
  return {
    container: getElement(`#crafting-recipe-${idPart}`),
    label: getElement(`#crafting-recipe-${idPart}-label`),
    woodCost: getElement(`#crafting-recipe-${idPart}-wood`),
    stoneCost: getElement(`#crafting-recipe-${idPart}-stone`),
    ownedCount: getElement(`#crafting-recipe-${idPart}-owned`),
  };
}

function getElement<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`L'élément ${selector} est absent.`);
  return element;
}
