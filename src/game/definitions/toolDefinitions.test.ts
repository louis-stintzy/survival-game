import { describe, expect, test } from "vitest";
import { TOOL_DEFINITIONS } from "./toolDefinitions";

describe("TOOL_DEFINITIONS", () => {
  test("protège les règles de la Hache de pierre", () => {
    expect(TOOL_DEFINITIONS.stoneAxe).toEqual({
      effectiveOn: "wood",
      harvestSpeedMultiplier: 2,
    });
  });

  test("protège les règles de la Pioche de pierre", () => {
    expect(TOOL_DEFINITIONS.stonePickaxe).toEqual({
      effectiveOn: "stone",
      harvestSpeedMultiplier: 2,
    });
  });
});
