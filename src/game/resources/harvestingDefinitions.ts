import type { HarvestableResourceType } from "../definitions/resourceDefinitions";
import {
  isToolType,
  TOOL_DEFINITIONS,
} from "../definitions/toolDefinitions";
import type { EquippedItem } from "../definitions/equipmentDefinitions";

export const HARVEST_DURATION_SECONDS: Record<HarvestableResourceType, number> =
  {
    wood: 3,
    stone: 4,
  };

export function getHarvestDurationSeconds(
  resourceType: HarvestableResourceType,
  equippedItem: EquippedItem,
): number | undefined {
  const baseDuration = HARVEST_DURATION_SECONDS[resourceType];
  if (equippedItem === "hands") return baseDuration;
  if (!isToolType(equippedItem)) return undefined;

  const tool = TOOL_DEFINITIONS[equippedItem];
  if (tool.effectiveOn !== resourceType) return undefined;
  return baseDuration / tool.harvestSpeedMultiplier;
}
