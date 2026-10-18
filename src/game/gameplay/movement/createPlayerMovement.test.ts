import { describe, expect, test } from "vitest";
import {
  canTraverseTerrainLevels,
  isPlayerFootprintBlockedByCliff,
  projectMovementAlongSurface,
  resolvePlayerVerticalPosition,
} from "./createPlayerMovement";
import type { TerrainSampler } from "../../world/terrain/terrainTypes";
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

describe("canTraverseTerrainLevels", () => {
  test.each([
    [2, 2, true],
    [2, 3, true],
    [2, 4, false],
    [2, 1, true],
    [4, 2, true],
    [4, 1, true],
  ])(
    "niveau courant %i vers niveau candidat %i retourne %s",
    (currentLevel, candidateLevel, expected) => {
      expect(canTraverseTerrainLevels(currentLevel, candidateLevel)).toBe(
        expected,
      );
    },
  );
});

describe("isPlayerFootprintBlockedByCliff", () => {
  test("bloque une falaise +2 devant le mouvement", () => {
    const sampleTerrain: TerrainSampler = (x) => ({
      height: x >= 0.4 ? 1.6 : 0.8,
      level: x >= 0.4 ? 4 : 2,
      surface: "grass",
      isLand: true,
    });

    expect(sampleTerrain(0, 0)?.level).toBe(2);
    expect(
      isPlayerFootprintBlockedByCliff(0, 0, 2, 1, 0, sampleTerrain),
    ).toBe(true);
  });

  test("ignore une falaise +2 derrière le mouvement", () => {
    const sampleTerrain: TerrainSampler = (x) => ({
      height: x >= 0.4 ? 1.6 : 0.8,
      level: x >= 0.4 ? 4 : 2,
      surface: "grass",
      isLand: true,
    });

    expect(
      isPlayerFootprintBlockedByCliff(0, 0, 2, -1, 0, sampleTerrain),
    ).toBe(false);
  });

  test("n'empêche ni une marche +1 ni une descente importante", () => {
    const levelThree: TerrainSampler = () => ({
      height: 1.2,
      level: 3,
      surface: "grass",
      isLand: true,
    });
    const levelOne: TerrainSampler = () => ({
      height: 0.4,
      level: 1,
      surface: "grass",
      isLand: true,
    });

    expect(
      isPlayerFootprintBlockedByCliff(0, 0, 2, 1, 0, levelThree),
    ).toBe(false);
    expect(
      isPlayerFootprintBlockedByCliff(0, 0, 4, 1, 0, levelOne),
    ).toBe(false);
  });
});

describe("resolvePlayerVerticalPosition", () => {
  const highPlayerY = 2.7;
  const lowGround = {
    height: 0.8,
    level: 2,
    surface: "grass",
    isLand: true,
  } as const;
  const sampleLedge: TerrainSampler = (x) => ({
    height: x < 0 ? 1.6 : 0.8,
    level: x < 0 ? 4 : 2,
    surface: "grass",
    isLand: true,
  });

  test("conserve le Y haut tant que l'empreinte recouvre le plateau", () => {
    expect(
      resolvePlayerVerticalPosition(
        0.25,
        0,
        highPlayerY,
        lowGround,
        sampleLedge,
      ),
    ).toBe(highPlayerY);
  });

  test("applique le Y bas lorsque l'empreinte a entièrement quitté le plateau", () => {
    expect(
      resolvePlayerVerticalPosition(
        0.6,
        0,
        highPlayerY,
        lowGround,
        sampleLedge,
      ),
    ).toBeCloseTo(1.9);
  });
});
