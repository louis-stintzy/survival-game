import { describe, expect, test } from "vitest";
import { EQUIPMENT_DEFINITIONS } from "./equipmentDefinitions";

describe("EQUIPMENT_DEFINITIONS", () => {
  test("conserve la fabrication de la Hache de pierre", () => {
    expect(EQUIPMENT_DEFINITIONS.stoneAxe).toEqual({
      label: "Hache de pierre",
      cost: { wood: 2, stone: 1 },
      craftingDurationSeconds: 2,
    });
  });

  test("conserve la fabrication de la Pioche de pierre", () => {
    expect(EQUIPMENT_DEFINITIONS.stonePickaxe).toEqual({
      label: "Pioche de pierre",
      cost: { wood: 1, stone: 2 },
      craftingDurationSeconds: 2,
    });
  });

  test("définit la fabrication de la torche", () => {
    expect(EQUIPMENT_DEFINITIONS.torch).toEqual({
      label: "Torche",
      cost: { wood: 1 },
      craftingDurationSeconds: 1.5,
    });
  });
});
