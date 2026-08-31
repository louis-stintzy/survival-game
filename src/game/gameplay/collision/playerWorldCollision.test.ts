import { describe, expect, test } from "vitest";
import { circleOverlapsHorizontalBounds } from "./playerWorldCollision";

const obstacle = {
  minimumX: -1,
  maximumX: 1,
  minimumZ: -1,
  maximumZ: 1,
};
const radius = 0.5;

describe("circleOverlapsHorizontalBounds", () => {
  test("ne détecte pas un cercle éloigné", () => {
    expect(circleOverlapsHorizontalBounds(3, 3, radius, obstacle)).toBe(false);
  });

  test("détecte un centre situé dans le rectangle", () => {
    expect(circleOverlapsHorizontalBounds(0, 0, radius, obstacle)).toBe(true);
  });

  test("détecte un cercle proche d'un bord", () => {
    expect(circleOverlapsHorizontalBounds(1.4, 0, radius, obstacle)).toBe(true);
  });

  test("détecte un cercle proche d'un coin", () => {
    expect(circleOverlapsHorizontalBounds(1.3, 1.3, radius, obstacle)).toBe(
      true,
    );
  });

  test("ignore un cercle juste au-delà d'un coin", () => {
    expect(circleOverlapsHorizontalBounds(1.36, 1.36, radius, obstacle)).toBe(
      false,
    );
  });
});
