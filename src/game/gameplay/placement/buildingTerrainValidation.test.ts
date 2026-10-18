import { describe, expect, test } from "vitest";
import type { TerrainSample } from "../../world/terrain/terrainTypes";
import { isBuildableTerrace } from "./buildingTerrainValidation";

describe("isBuildableTerrace", () => {
  test("accepte uniquement des points d'herbe de même niveau", () => {
    expect(isBuildableTerrace([grass(2), grass(2), grass(2)])).toBe(true);
  });

  test("refuse des niveaux différents", () => {
    expect(isBuildableTerrace([grass(2), grass(3)])).toBe(false);
  });

  test("refuse une autre surface ou un sample absent", () => {
    expect(
      isBuildableTerrace([grass(2), { ...grass(2), surface: "rock" }]),
    ).toBe(false);
    expect(isBuildableTerrace([grass(2), undefined])).toBe(false);
  });
});

function grass(level: number): TerrainSample {
  return {
    height: level * 0.4,
    level,
    surface: "grass",
    isLand: true,
  };
}
