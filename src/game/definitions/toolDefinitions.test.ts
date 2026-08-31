import { describe, expect, test } from "vitest";
import { TOOL_DEFINITIONS } from "./toolDefinitions";

describe("TOOL_DEFINITIONS", () => {
  test("protège les règles de la Hache de pierre", () => {
    expect(TOOL_DEFINITIONS.stoneAxe).toEqual({
      label: "Hache de pierre",
      cost: { wood: 2, stone: 1 },
      craftingDurationSeconds: 2,
      effectiveOn: "wood",
      harvestSpeedMultiplier: 2,
    });
  });

  test("protège les règles de la Pioche de pierre", () => {
    expect(TOOL_DEFINITIONS.stonePickaxe).toEqual({
      label: "Pioche de pierre",
      cost: { wood: 1, stone: 2 },
      craftingDurationSeconds: 2,
      effectiveOn: "stone",
      harvestSpeedMultiplier: 2,
    });
  });
});
