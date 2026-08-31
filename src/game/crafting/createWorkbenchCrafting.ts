import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { ResourceInventoryCost } from "../resources/createResourceInventory";
import type { ToolType } from "../tools/toolDefinitions";
import { TOOL_DEFINITIONS, TOOL_TYPES } from "../tools/toolDefinitions";

interface ResourceInventory {
  canAfford(cost: ResourceInventoryCost): boolean;
  spend(cost: ResourceInventoryCost): boolean;
}

interface ToolInventory {
  add(type: ToolType, amount: number): void;
  getCount(type: ToolType): number;
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
  toolInventory: ToolInventory,
  onToolCrafted: (type: ToolType) => void,
) {
  const panel = getElement("#crafting-panel");
  const status = getElement("#crafting-status");
  const progress = getElement("#crafting-progress");
  const progressLabel = getElement("#crafting-progress-label");
  const progressBar = getElement<HTMLProgressElement>("#crafting-progress-bar");
  const recipeElements: Record<ToolType, RecipeElements> = {
    stoneAxe: getRecipeElements("stone-axe"),
    stonePickaxe: getRecipeElements("stone-pickaxe"),
  };

  let menuOpen = false;
  let activeWorkbench: TransformNode | undefined;
  let selectedToolType: ToolType = "stoneAxe";
  let craftingTarget: ToolType | undefined;
  let craftingElapsedSeconds = 0;
  let selectionChangeRequested = false;
  let closeRequested = false;

  TOOL_TYPES.forEach((type) => {
    const definition = TOOL_DEFINITIONS[type];
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
    selectedToolType = "stoneAxe";
    selectionChangeRequested = false;
    closeRequested = false;
    resetCraftingProgress();
    setStatus("");
    updateSelection();
    TOOL_TYPES.forEach(updateOwnedCount);
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
      selectedToolType =
        selectedToolType === "stoneAxe" ? "stonePickaxe" : "stoneAxe";
      updateSelection();
      setStatus("");
    }

    if (craftingTarget) {
      const definition = TOOL_DEFINITIONS[craftingTarget];
      craftingElapsedSeconds += deltaTimeInSeconds;
      progressBar.value = Math.min(
        craftingElapsedSeconds / definition.craftingDurationSeconds,
        1,
      );

      if (craftingElapsedSeconds >= definition.craftingDurationSeconds) {
        const completedToolType = craftingTarget;
        resetCraftingProgress();

        // Le paiement à la fin évite tout remboursement lors d'une annulation.
        if (resourceInventory.spend(definition.cost)) {
          toolInventory.add(completedToolType, 1);
          updateOwnedCount(completedToolType);
          onToolCrafted(completedToolType);
          setStatus(`${definition.label} fabriquée`);
        } else {
          setStatus("Ressources insuffisantes");
        }
      }
      return;
    }

    if (!interactionPressed) return;

    const definition = TOOL_DEFINITIONS[selectedToolType];
    if (!resourceInventory.canAfford(definition.cost)) {
      setStatus("Ressources insuffisantes");
      return;
    }

    craftingTarget = selectedToolType;
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
    TOOL_TYPES.forEach((type) => {
      recipeElements[type].container.classList.toggle(
        "is-selected",
        type === selectedToolType,
      );
    });
  }

  function updateOwnedCount(type: ToolType) {
    recipeElements[type].ownedCount.textContent = String(
      toolInventory.getCount(type),
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
