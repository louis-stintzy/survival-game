import { TOOL_TYPES, ToolType } from "../../definitions/toolDefinitions";

export function createToolInventory() {
  const counts = Object.fromEntries(
    TOOL_TYPES.map((type) => [type, 0]),
  ) as Record<ToolType, number>;

  return {
    add(type: ToolType, amount: number) {
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error(
          "La quantité d'outils ajoutée doit être un entier positif.",
        );
      }

      counts[type] += amount;
    },

    getCount(type: ToolType) {
      return counts[type];
    },
  };
}
