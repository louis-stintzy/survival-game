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
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error(
          "La quantité d'équipements ajoutée doit être un entier positif.",
        );
      }

      counts[type] += amount;
    },

    getCount(type: EquipmentType) {
      return counts[type];
    },
  };
}
