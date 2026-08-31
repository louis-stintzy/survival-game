import type { ResourceType } from "./resourceTypes";

export type ResourceInventoryCost = Partial<Record<ResourceType, number>>;

const RESOURCE_TYPES: readonly ResourceType[] = ["wood", "stone", "food"];

const INITIAL_COUNTS: Record<ResourceType, number> = {
  wood: 0,
  stone: 0,
  food: 0,
};

export function createResourceInventory() {
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

    canAfford(cost: ResourceInventoryCost) {
      return getValidatedCostEntries(cost).every(
        ([type, amount]) => counts[type] >= amount,
      );
    },

    spend(cost: ResourceInventoryCost) {
      const entries = getValidatedCostEntries(cost);

      // Toutes les quantités sont vérifiées avant la première modification :
      // un coût est donc payé entièrement ou pas du tout.
      if (!entries.every(([type, amount]) => counts[type] >= amount)) {
        return false;
      }

      entries.forEach(([type, amount]) => {
        counts[type] -= amount;
        updateDisplayedCount(type);
      });
      return true;
    },
  };
}

function getValidatedCostEntries(
  cost: ResourceInventoryCost,
): Array<[ResourceType, number]> {
  return RESOURCE_TYPES.flatMap((type) => {
    const amount = cost[type];
    if (amount === undefined) return [];
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Le coût doit contenir des entiers positifs.");
    }
    return [[type, amount]];
  });
}

function getCountElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Le compteur d'inventaire ${selector} est absent.`);
  }
  return element;
}
