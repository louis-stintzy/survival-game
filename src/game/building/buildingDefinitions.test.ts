import { describe, expect, test } from "vitest";
import { BUILDING_DEFINITIONS } from "./buildingDefinitions";

describe("BUILDING_DEFINITIONS", () => {
  test("protège le coût et l'empreinte de l'Abri", () => {
    const shelter = BUILDING_DEFINITIONS.shelter;

    expect(shelter.cost).toEqual({
      wood: 4,
      stone: 2,
    });
    expect(shelter.width).toBe(4);
    expect(shelter.depth).toBe(3);
  });

  test("protège le coût et l'empreinte de l'Établi", () => {
    const workbench = BUILDING_DEFINITIONS.workbench;

    expect(workbench.cost).toEqual({
      wood: 2,
      stone: 1,
    });
    expect(workbench.width).toBe(2.5);
    expect(workbench.depth).toBe(1.5);
  });
});
