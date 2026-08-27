import type { ToolModel } from "./createToolModels";
import {
  TOOL_DEFINITIONS,
  TOOL_TYPES,
  type EquippedItem,
  type ToolType,
} from "./toolDefinitions";

interface ToolInventory {
  getCount(type: ToolType): number;
}

export function createToolEquipment(
  toolInventory: ToolInventory,
  models: Record<ToolType, ToolModel>,
) {
  const equippedLabel = getElement("#equipped-tool-label");
  const slots: Record<EquippedItem, HTMLElement> = {
    hands: getElement("#tool-slot-hands"),
    stoneAxe: getElement("#tool-slot-stone-axe"),
    stonePickaxe: getElement("#tool-slot-stone-pickaxe"),
  };
  const countElements: Record<ToolType, HTMLElement> = {
    stoneAxe: getElement("#tool-count-stone-axe"),
    stonePickaxe: getElement("#tool-count-stone-pickaxe"),
  };

  let equippedItem: EquippedItem = "hands";

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;

    const requestedItem: EquippedItem | undefined =
      event.code === "Digit1" || event.key === "1"
        ? "hands"
        : event.code === "Digit2" || event.key === "2"
          ? "stoneAxe"
          : event.code === "Digit3" || event.key === "3"
            ? "stonePickaxe"
            : undefined;
    if (requestedItem) equip(requestedItem);
  });

  function equip(item: EquippedItem): boolean {
    if (item !== "hands" && toolInventory.getCount(item) === 0) return false;

    equippedItem = item;
    updatePresentation();
    return true;
  }

  function updatePresentation() {
    TOOL_TYPES.forEach((type) => {
      const count = toolInventory.getCount(type);
      countElements[type].textContent = String(count);
      slots[type].classList.toggle("is-unavailable", count === 0);
      models[type].root.setEnabled(equippedItem === type);
    });

    (Object.keys(slots) as EquippedItem[]).forEach((item) => {
      slots[item].classList.toggle("is-equipped", equippedItem === item);
    });
    equippedLabel.textContent = `Équipé : ${getEquippedLabel(equippedItem)}`;
  }

  updatePresentation();

  return {
    equip,
    getEquippedItem: () => equippedItem,
    onToolCrafted: (type: ToolType) => equip(type),
  };
}

function getEquippedLabel(item: EquippedItem): string {
  return item === "hands" ? "Mains" : TOOL_DEFINITIONS[item].label;
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`L'élément ${selector} est absent.`);
  return element;
}
