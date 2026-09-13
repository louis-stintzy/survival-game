import { describe, expect, test } from "vitest";
import { createValueNoise2D } from "./valueNoise2D";

describe("createValueNoise2D", () => {
  test("est déterministe pour une seed donnée", () => {
    const first = createValueNoise2D(12345);
    const second = createValueNoise2D(12345);

    expect(first.sample(2.4, -7.1)).toBe(second.sample(2.4, -7.1));
  });

  test("varie avec la seed", () => {
    expect(createValueNoise2D(1).sample(2.4, -7.1)).not.toBe(
      createValueNoise2D(2).sample(2.4, -7.1),
    );
  });

  test("varie continûment entre deux points voisins", () => {
    const noise = createValueNoise2D(12345);

    expect(
      Math.abs(noise.sample(4.2, 8.3) - noise.sample(4.21, 8.31)),
    ).toBeLessThan(0.02);
  });
});
