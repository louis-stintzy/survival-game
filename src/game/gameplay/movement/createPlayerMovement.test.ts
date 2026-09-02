import { describe, expect, test } from "vitest";
import { projectMovementAlongSurface } from "./createPlayerMovement";

describe("projectMovementAlongSurface", () => {
  test("arrête un mouvement frontal contre un mur", () => {
    expect(projectMovementAlongSurface(1, 0, -1, 0)).toEqual({ x: 0, z: 0 });
  });

  test("conserve uniquement la composante tangentielle d'un mouvement oblique", () => {
    expect(projectMovementAlongSurface(1, 1, -1, 0)).toEqual({ x: 0, z: 1 });
  });

  test("conserve un mouvement déjà dirigé vers l'extérieur", () => {
    expect(projectMovementAlongSurface(-1, 0.5, -1, 0)).toEqual({
      x: -1,
      z: 0.5,
    });
  });
});
