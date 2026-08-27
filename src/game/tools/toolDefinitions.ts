import type { InventoryCost } from "../inventory/createInventory";

export const TOOL_TYPES = ["stoneAxe", "stonePickaxe"] as const;
export type ToolType = (typeof TOOL_TYPES)[number];

interface ToolDefinition {
  label: string;
  cost: InventoryCost;
  craftingDurationSeconds: number;
}

export const TOOL_DEFINITIONS: Record<ToolType, ToolDefinition> = {
  stoneAxe: {
    label: "Hache de pierre",
    cost: { wood: 2, stone: 1 },
    craftingDurationSeconds: 2,
  },
  stonePickaxe: {
    label: "Pioche de pierre",
    cost: { wood: 1, stone: 2 },
    craftingDurationSeconds: 2,
  },
};
