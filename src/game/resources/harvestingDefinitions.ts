import { HarvestableResourceType } from "../definitions/resourceDefinitions";
import {
  TOOL_DEFINITIONS,
  type EquippedItem,
} from "../definitions/toolDefinitions";

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

  const tool = TOOL_DEFINITIONS[equippedItem];
  if (tool.effectiveOn !== resourceType) return undefined;
  return baseDuration / tool.harvestSpeedMultiplier;
}
