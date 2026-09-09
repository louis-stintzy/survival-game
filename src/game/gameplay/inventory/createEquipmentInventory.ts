import {
  EQUIPMENT_TYPES,
  type EquipmentType,
} from "../../definitions/equipmentDefinitions";

export function createEquipmentInventory() {
  const counts = Object.fromEntries(
    EQUIPMENT_TYPES.map((type) => [type, 0]),
  ) as Record<EquipmentType, number>;

  return {
    add(type: EquipmentType, amount: number) {
      validateAmount(amount);

      counts[type] += amount;
    },

    remove(type: EquipmentType, amount: number): boolean {
      validateAmount(amount);
      if (counts[type] < amount) return false;

      counts[type] -= amount;
      return true;
    },

    getCount(type: EquipmentType) {
      return counts[type];
    },
  };
}

function validateAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      "La quantité d'équipements doit être un entier strictement positif.",
    );
  }
}
