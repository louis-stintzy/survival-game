import { describe, expect, test } from "vitest";
import { BUILDING_DEFINITIONS } from "./buildingDefinitions";

describe("BUILDING_DEFINITIONS", () => {
  test("protège le coût et l'empreinte de l'Abri", () => {
    expect(BUILDING_DEFINITIONS.shelter).toMatchObject({
      cost: { wood: 4, stone: 2 },
      width: 4,
      depth: 3,
    });
  });

  test("protège le coût et l'empreinte de l'Établi", () => {
    expect(BUILDING_DEFINITIONS.workbench).toMatchObject({
      cost: { wood: 2, stone: 1 },
      width: 2.5,
      depth: 1.5,
    });
  });
});
