import type { ResourceType } from "../resources/resourceTypes";

const INITIAL_COUNTS: Record<ResourceType, number> = {
  wood: 0,
  stone: 0,
  food: 0,
};

export function createInventory() {
  const counts = { ...INITIAL_COUNTS };
  const countElements: Record<ResourceType, HTMLElement> = {
    wood: getCountElement("#inventory-wood"),
    stone: getCountElement("#inventory-stone"),
    food: getCountElement("#inventory-food"),
  };

  const updateDisplayedCount = (type: ResourceType) => {
    countElements[type].textContent = String(counts[type]);
  };

  updateDisplayedCount("wood");
  updateDisplayedCount("stone");
  updateDisplayedCount("food");

  return {
    add(type: ResourceType, amount: number) {
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("La quantité ajoutée doit être un entier positif.");
      }

      counts[type] += amount;
      updateDisplayedCount(type);
    },
  };
}

function getCountElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Le compteur d'inventaire ${selector} est absent.`);
  }
  return element;
}
