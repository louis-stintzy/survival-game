import type { HarvestableResourceType } from "./resourceDefinitions";

export const TOOL_TYPES = ["stoneAxe", "stonePickaxe"] as const;

export type ToolType = (typeof TOOL_TYPES)[number];

interface ToolDefinition {
  effectiveOn: HarvestableResourceType;
  harvestSpeedMultiplier: number;
}

export const TOOL_DEFINITIONS: Record<ToolType, ToolDefinition> = {
  stoneAxe: {
    effectiveOn: "wood",
    harvestSpeedMultiplier: 2,
  },
  stonePickaxe: {
    effectiveOn: "stone",
    harvestSpeedMultiplier: 2,
  },
};

export function isToolType(type: string): type is ToolType {
  return TOOL_TYPES.some((toolType) => toolType === type);
}
