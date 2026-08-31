import type { ResourceInventoryCost } from "../resources/createResourceInventory";
import type { HarvestableResourceType } from "../resources/resourceTypes";

export const TOOL_TYPES = ["stoneAxe", "stonePickaxe"] as const;
export type ToolType = (typeof TOOL_TYPES)[number];
export type EquippedItem = "hands" | ToolType;

interface ToolDefinition {
  label: string;
  cost: ResourceInventoryCost;
  craftingDurationSeconds: number;
  effectiveOn: HarvestableResourceType;
  harvestSpeedMultiplier: number;
}

export const TOOL_DEFINITIONS: Record<ToolType, ToolDefinition> = {
  stoneAxe: {
    label: "Hache de pierre",
    cost: { wood: 2, stone: 1 },
    craftingDurationSeconds: 2,
    effectiveOn: "wood",
    harvestSpeedMultiplier: 2,
  },
  stonePickaxe: {
    label: "Pioche de pierre",
    cost: { wood: 1, stone: 2 },
    craftingDurationSeconds: 2,
    effectiveOn: "stone",
    harvestSpeedMultiplier: 2,
  },
};
