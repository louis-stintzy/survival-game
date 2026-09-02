import { describe, expect, test } from "vitest";
import {
  circleOverlapsHorizontalBounds,
  circleOverlapsOrientedBox,
  circlesOverlap,
  getCircleHorizontalBoundsContact,
  getCircleOrientedBoxContact,
  getCirclesContact,
} from "./playerWorldCollision";

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

describe("circlesOverlap", () => {
  test("détecte deux cercles qui se chevauchent", () => {
    expect(circlesOverlap(0, 0, 0.5, 0.8, 0, 0.4)).toBe(true);
  });

  test("ignore deux cercles suffisamment éloignés", () => {
    expect(circlesOverlap(0, 0, 0.5, 1, 0, 0.4)).toBe(false);
  });
});

describe("circleOverlapsOrientedBox", () => {
  test("retrouve le comportement d'un rectangle normal sans rotation", () => {
    expect(circleOverlapsOrientedBox(1.4, 0, 0.5, 0, 0, 1, 0.5, 0)).toBe(
      true,
    );
  });

  test("détecte un cercle proche d'une pointe à 45 degrés", () => {
    expect(
      circleOverlapsOrientedBox(
        0.85,
        -0.85,
        0.25,
        0,
        0,
        1,
        0.4,
        Math.PI / 4,
      ),
    ).toBe(true);
  });

  test("ignore un cercle suffisamment éloigné d'un côté à 45 degrés", () => {
    expect(
      circleOverlapsOrientedBox(
        0.57,
        0.57,
        0.2,
        0,
        0,
        1,
        0.4,
        Math.PI / 4,
      ),
    ).toBe(false);
  });

  test("la rotation change le résultat pour un rectangle non carré", () => {
    const circle = { x: 0.57, z: -0.57, radius: 0.1 };

    expect(
      circleOverlapsOrientedBox(
        circle.x,
        circle.z,
        circle.radius,
        0,
        0,
        1,
        0.4,
        0,
      ),
    ).toBe(false);
    expect(
      circleOverlapsOrientedBox(
        circle.x,
        circle.z,
        circle.radius,
        0,
        0,
        1,
        0.4,
        Math.PI / 4,
      ),
    ).toBe(true);
  });
});

describe("normales de contact", () => {
  test("un contact circulaire frontal pointe de l'obstacle vers le joueur", () => {
    expect(getCirclesContact(-0.8, 0, 0.5, 0, 0, 0.4)).toEqual({
      normalX: -1,
      normalZ: 0,
    });
  });

  test("un contact circulaire oblique produit une normale unitaire", () => {
    const contact = getCirclesContact(0.6, 0.6, 0.5, 0, 0, 0.4);

    expect(contact?.normalX).toBeCloseTo(Math.SQRT1_2);
    expect(contact?.normalZ).toBeCloseTo(Math.SQRT1_2);
  });

  test("les côtés gauche et droit d'un rectangle ont des normales opposées", () => {
    const leftContact = getCircleHorizontalBoundsContact(
      -1.4,
      0,
      radius,
      obstacle,
    );
    const rightContact = getCircleHorizontalBoundsContact(
      1.4,
      0,
      radius,
      obstacle,
    );

    expect(leftContact).toEqual({ normalX: -1, normalZ: 0 });
    expect(rightContact).toEqual({ normalX: 1, normalZ: 0 });
  });

  test("la normale locale d'un rectangle orienté est ramenée dans le monde", () => {
    const contact = getCircleOrientedBoxContact(
      0.85,
      -0.85,
      0.25,
      0,
      0,
      1,
      0.4,
      Math.PI / 4,
    );

    expect(contact?.normalX).toBeCloseTo(Math.SQRT1_2);
    expect(contact?.normalZ).toBeCloseTo(-Math.SQRT1_2);
  });
});
