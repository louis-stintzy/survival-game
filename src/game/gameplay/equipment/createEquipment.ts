import type { EquipmentModel } from "../../models/createEquipmentModels";
import {
  EQUIPMENT_DEFINITIONS,
  EQUIPMENT_TYPES,
  type EquippedItem,
  type EquipmentType,
} from "../../definitions/equipmentDefinitions";

interface EquipmentInventory {
  getCount(type: EquipmentType): number;
}

const QUICKBAR_ITEMS: Record<string, EquippedItem> = {
  Digit1: "hands",
  Digit2: "stoneAxe",
  Digit3: "stonePickaxe",
  Digit4: "torch",
  "1": "hands",
  "2": "stoneAxe",
  "3": "stonePickaxe",
  "4": "torch",
};

export function createEquipment(
  equipmentInventory: EquipmentInventory,
  models: Record<EquipmentType, EquipmentModel>,
) {
  const equippedLabel = getElement("#equipped-tool-label");
  const slots: Record<EquippedItem, HTMLElement> = {
    hands: getElement("#tool-slot-hands"),
    stoneAxe: getElement("#tool-slot-stone-axe"),
    stonePickaxe: getElement("#tool-slot-stone-pickaxe"),
    torch: getElement("#tool-slot-torch"),
  };
  const countElements: Record<EquipmentType, HTMLElement> = {
    stoneAxe: getElement("#tool-count-stone-axe"),
    stonePickaxe: getElement("#tool-count-stone-pickaxe"),
    torch: getElement("#tool-count-torch"),
  };

  let equippedItem: EquippedItem = "hands";

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const requestedItem = QUICKBAR_ITEMS[event.code] ?? QUICKBAR_ITEMS[event.key];
    if (requestedItem) equip(requestedItem);
  });

  function equip(item: EquippedItem): boolean {
    if (item !== "hands" && equipmentInventory.getCount(item) === 0) {
      return false;
    }

    equippedItem = item;
    updatePresentation();
    return true;
  }

  function updatePresentation() {
    EQUIPMENT_TYPES.forEach((type) => {
      const count = equipmentInventory.getCount(type);
      countElements[type].textContent = String(count);
      slots[type].classList.toggle("is-unavailable", count === 0);
      models[type].root.setEnabled(equippedItem === type);
    });

    (Object.keys(slots) as EquippedItem[]).forEach((item) => {
      slots[item].classList.toggle("is-equipped", equippedItem === item);
    });
    equippedLabel.textContent = `Équipé : ${getEquippedLabel(equippedItem)}`;
  }

  function refresh() {
    if (
      equippedItem !== "hands" &&
      equipmentInventory.getCount(equippedItem) === 0
    ) {
      equippedItem = "hands";
    }
    updatePresentation();
  }

  updatePresentation();

  return {
    equip,
    refresh,
    getEquippedItem: () => equippedItem,
    onEquipmentCrafted: (type: EquipmentType) => equip(type),
  };
}

function getEquippedLabel(item: EquippedItem): string {
  return item === "hands" ? "Mains" : EQUIPMENT_DEFINITIONS[item].label;
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`L'élément ${selector} est absent.`);
  return element;
}
