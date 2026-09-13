import { describe, expect, test } from "vitest";
import {
  DEFAULT_WORLD_SEED,
  resolveWorldSeed,
} from "./worldSeed";

describe("resolveWorldSeed", () => {
  test("retourne une seed valide depuis la query string", () => {
    expect(resolveWorldSeed("?seed=0")).toBe(0);
    expect(resolveWorldSeed("?seed=12345")).toBe(12345);
    expect(resolveWorldSeed("?mode=dev&seed=4294967295")).toBe(4294967295);
  });

  test("utilise la seed par défaut lorsqu'elle est absente", () => {
    expect(resolveWorldSeed("")).toBe(DEFAULT_WORLD_SEED);
    expect(resolveWorldSeed("?mode=dev")).toBe(DEFAULT_WORLD_SEED);
  });

  test("refuse une seed négative", () => {
    expect(resolveWorldSeed("?seed=-1")).toBe(DEFAULT_WORLD_SEED);
  });

  test("refuse une seed décimale", () => {
    expect(resolveWorldSeed("?seed=12.5")).toBe(DEFAULT_WORLD_SEED);
  });

  test("refuse une seed supérieure à la plage uint32", () => {
    expect(resolveWorldSeed("?seed=4294967296")).toBe(DEFAULT_WORLD_SEED);
  });

  test("refuse une seed non numérique", () => {
    expect(resolveWorldSeed("?seed=survival")).toBe(DEFAULT_WORLD_SEED);
  });
});
