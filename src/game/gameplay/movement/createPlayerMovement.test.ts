import { describe, expect, test } from "vitest";
import { projectMovementAlongSurface } from "./createPlayerMovement";
import {
  circlesOverlap,
  getCirclesContact,
} from "../collision/circleCollision";

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

  test("une référence valide produit un slide qui reste hors d'un obstacle circulaire", () => {
    const obstacle = { x: 0, z: 0, radius: 0.3 };
    const playerRadius = 0.5;
    const reference = { x: -0.81, z: 0.13 };
    const movement = { x: 0.49, z: 0 };
    const candidate = {
      x: reference.x + movement.x,
      z: reference.z + movement.z,
    };

    expect(
      circlesOverlap(
        candidate.x,
        candidate.z,
        playerRadius,
        obstacle.x,
        obstacle.z,
        obstacle.radius,
      ),
    ).toBe(true);

    const contact = getCirclesContact(
      candidate.x,
      candidate.z,
      playerRadius,
      obstacle.x,
      obstacle.z,
      obstacle.radius,
      reference,
    );
    expect(contact).toBeDefined();

    const slide = projectMovementAlongSurface(
      movement.x,
      movement.z,
      contact!.normalX,
      contact!.normalZ,
    );
    const slideCandidate = {
      x: reference.x + slide.x,
      z: reference.z + slide.z,
    };

    expect(
      circlesOverlap(
        slideCandidate.x,
        slideCandidate.z,
        playerRadius,
        obstacle.x,
        obstacle.z,
        obstacle.radius,
      ),
    ).toBe(false);
  });
});
