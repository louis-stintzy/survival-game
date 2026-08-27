import { describe, expect, test } from "vitest";
import { getHarvestDurationSeconds } from "./harvestingDefinitions";
import type { HarvestableResourceType } from "./resourceTypes";
import type { EquippedItem } from "../tools/toolDefinitions";

describe("getHarvestDurationSeconds", () => {
  test.each<
    [string, HarvestableResourceType, EquippedItem, number | undefined]
  >([
    ["récolte le bois en 3 secondes avec les mains", "wood", "hands", 3],
    ["récolte la pierre en 4 secondes avec les mains", "stone", "hands", 4],
    ["récolte le bois en 1,5 seconde avec la hache", "wood", "stoneAxe", 1.5],
    ["rend la pierre incompatible avec la hache", "stone", "stoneAxe", undefined],
    ["rend le bois incompatible avec la pioche", "wood", "stonePickaxe", undefined],
    ["récolte la pierre en 2 secondes avec la pioche", "stone", "stonePickaxe", 2],
  ])("%s", (_description, resourceType, equippedItem, expectedDuration) => {
    expect(getHarvestDurationSeconds(resourceType, equippedItem)).toBe(
      expectedDuration,
    );
  });
});
