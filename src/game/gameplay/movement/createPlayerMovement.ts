import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import {
  PLAYER_COLLISION_RADIUS,
  type PlayerCollisionQuery,
} from "../collision/playerWorldCollision";
import type { CollisionContact, XZPosition } from "../collision/collisionTypes";
import { PLAYER_HALF_HEIGHT } from "../../models/createPlayer";
import type {
  TerrainSample,
  TerrainSampler,
} from "../../world/terrain/terrainTypes";
import type { TerracedTerrainData } from "../../world/terrain/terraced/terracedTerrainTypes";
import { getTerracedTerrainCollision } from "../collision/terracedTerrainCollision";

type MoveAttempt =
  | { kind: "moved" }
  | { kind: "collision"; contact: CollisionContact }
  | { kind: "noGround" };

/**
 * Distance horizontale maximale testée en une seule étape.
 *
 * Les déplacements plus grands sont subdivisés afin d'éviter qu'une frame
 * lente permette au joueur de traverser entièrement un obstacle entre deux
 * positions testées.
 */
const MAX_HORIZONTAL_MOVEMENT_STEP = 0.25;
const PLAYER_MOVEMENT_SPEED = 5;
const PLAYER_DIAGONAL_FOOTPRINT_OFFSET = PLAYER_COLLISION_RADIUS / Math.SQRT2;
const PLAYER_FOOTPRINT_OFFSETS = [
  { x: PLAYER_COLLISION_RADIUS, z: 0 },
  { x: -PLAYER_COLLISION_RADIUS, z: 0 },
  { x: 0, z: PLAYER_COLLISION_RADIUS },
  { x: 0, z: -PLAYER_COLLISION_RADIUS },
  { x: PLAYER_DIAGONAL_FOOTPRINT_OFFSET, z: PLAYER_DIAGONAL_FOOTPRINT_OFFSET },
  { x: PLAYER_DIAGONAL_FOOTPRINT_OFFSET, z: -PLAYER_DIAGONAL_FOOTPRINT_OFFSET },
  { x: -PLAYER_DIAGONAL_FOOTPRINT_OFFSET, z: PLAYER_DIAGONAL_FOOTPRINT_OFFSET },
  { x: -PLAYER_DIAGONAL_FOOTPRINT_OFFSET, z: -PLAYER_DIAGONAL_FOOTPRINT_OFFSET },
] as const;
const MOVEMENT_KEYS = new Set([
  "z",
  "w",
  "s",
  "q",
  "a",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

/**
 * Retire d'un mouvement uniquement sa composante dirigée vers une surface.
 *
 * Le produit scalaire mesure la composante du mouvement portée par la normale
 * extérieure. Lorsqu'il est négatif, cette composante entre dans l'obstacle :
 * elle est retirée et le reste constitue le mouvement tangent à la surface.
 *
 * @param movementX Composante X du mouvement demandé.
 * @param movementZ Composante Z du mouvement demandé.
 * @param normalX Composante X de la normale extérieure unitaire.
 * @param normalZ Composante Z de la normale extérieure unitaire.
 * @returns Le mouvement original s'il va vers l'extérieur (`dot >= 0`), sinon
 *          sa projection tangentielle, sans renormalisation.
 */
export function projectMovementAlongSurface(
  movementX: number,
  movementZ: number,
  normalX: number,
  normalZ: number,
): { x: number; z: number } {
  const dot = movementX * normalX + movementZ * normalZ;
  if (dot >= 0) return { x: movementX, z: movementZ };

  return {
    x: movementX - normalX * dot,
    z: movementZ - normalZ * dot,
  };
}

/** Une marche de zéro ou un niveau et toute descente sont franchissables. */
export function canTraverseTerrainLevels(
  currentLevel: number,
  candidateLevel: number,
): boolean {
  return candidateLevel - currentLevel < 2;
}

/**
 * Retarde une descente tant qu'une partie du pourtour repose encore sur une
 * terrasse plus haute. La hauteur courante n'est jamais augmentée ici.
 */
export function resolvePlayerVerticalPosition(
  candidateX: number,
  candidateZ: number,
  currentPlayerY: number,
  candidateGround: TerrainSample,
  sampleTerrain: TerrainSampler,
): number {
  const candidatePlayerY = candidateGround.height + PLAYER_HALF_HEIGHT;
  if (candidatePlayerY >= currentPlayerY) return candidatePlayerY;

  const stillOverHigherGround = PLAYER_FOOTPRINT_OFFSETS.some(({ x, z }) => {
    const ground = sampleTerrain(candidateX + x, candidateZ + z);
    return ground?.isLand === true && ground.height > candidateGround.height;
  });

  return stillOverHigherGround ? currentPlayerY : candidatePlayerY;
}

/**
 * Crée le système de déplacement du joueur.
 *
 * Le déplacement est :
 * - calculé relativement à l'orientation de la caméra ;
 * - indépendant du framerate grâce au delta time ;
 * - subdivisé en petites étapes pour éviter de traverser un obstacle
 *   pendant une frame anormalement longue ;
 * - projeté le long de la surface rencontrée lorsqu'une collision
 *   permet un glissement ;
 * - validé verticalement par la source de vérité logique du terrain.
 *
 * @param player Mesh représentant le joueur.
 * @param camera Caméra utilisée pour convertir les entrées clavier
 *               en directions relatives à l'écran.
 * @param sampleTerrain Échantillonne le terrain à une coordonnée X/Z.
 * @param getCollisionContact Fonction retournant éventuellement la normale
 *                            de l'obstacle rencontré.
 * @param isMovementEnabled Indique si le déplacement à pied est actif.
 * @returns Une fonction d'update à appeler à chaque frame avec le delta time.
 */
export function createPlayerMovement(
  player: Mesh,
  camera: ArcRotateCamera,
  terrainData: TerracedTerrainData,
  sampleTerrain: TerrainSampler,
  getCollisionContact: (
    query: PlayerCollisionQuery,
  ) => CollisionContact | undefined,
  isMovementEnabled: () => boolean = () => true,
) {
  const pressedKeys = new Set<string>();

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (MOVEMENT_KEYS.has(key)) {
      pressedKeys.add(key);
      event.preventDefault();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    pressedKeys.delete(event.key.toLowerCase());
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => pressedKeys.clear());

  return (deltaTimeInSeconds: number) => {
    const movementEnabled = isMovementEnabled();
    if (!movementEnabled) {
      camera.setTarget(player.position, false, false, true);
      return;
    }

    const forwardInput =
      Number(
        pressedKeys.has("z") ||
          pressedKeys.has("w") ||
          pressedKeys.has("arrowup"),
      ) - Number(pressedKeys.has("s") || pressedKeys.has("arrowdown"));
    const rightInput =
      Number(pressedKeys.has("d") || pressedKeys.has("arrowright")) -
      Number(
        pressedKeys.has("q") ||
          pressedKeys.has("a") ||
          pressedKeys.has("arrowleft"),
      );

    if (forwardInput !== 0 || rightInput !== 0) {
      // Les axes de la caméra sont projetés sur X/Z : les touches correspondent
      // ainsi au haut et aux côtés de l'écran malgré la vue isométrique.
      const cameraForward = camera.target.subtract(camera.position);
      cameraForward.y = 0;
      cameraForward.normalize();

      const cameraRight = camera.getDirection(Vector3.Right());
      cameraRight.y = 0;
      cameraRight.normalize();

      const movementDirection = cameraForward
        .scale(forwardInput)
        .add(cameraRight.scale(rightInput));

      // Normaliser conserve la même vitesse lorsque deux touches forment une diagonale.
      movementDirection.normalize();

      // Le delta time rend la distance parcourue indépendante du nombre d'images par seconde.
      const distance = PLAYER_MOVEMENT_SPEED * deltaTimeInSeconds;
      const movement = movementDirection.scale(distance);
      moveHorizontally(movement.x, movement.z);
    }

    camera.setTarget(player.position, false, false, true);
  };

  /**
   * Tente de placer le joueur à une position X/Z précise.
   *
   * La position doit être libre de collision et se trouver au-dessus
   * d'une surface praticable.
   *
   * @param x Position X candidate.
   * @param z Position Z candidate.
   * @param reference Dernière position valide utilisée pour calculer
   *                  la normale en cas de collision.
   * @returns Le résultat explicite de la tentative :
   *          déplacement effectué, collision ou absence de sol.
   */
  function tryMoveTo(x: number, z: number, reference: XZPosition): MoveAttempt {
    const collisionContact = getCollisionContact({
      candidate: { x, z },
      reference,
    });
    if (collisionContact) {
      return { kind: "collision", contact: collisionContact };
    }

    const ground = sampleTerrain(x, z);
    if (!ground?.isLand) return { kind: "noGround" };
    const currentGround = sampleTerrain(reference.x, reference.z);
    if (!currentGround?.isLand) return { kind: "noGround" };

    const terrainCollision = getTerracedTerrainCollision(
      terrainData,
      { x, z },
      reference,
      currentGround.level,
    );
    if (terrainCollision?.kind === "blocked") {
      return { kind: "collision", contact: terrainCollision.contact };
    }

    player.position.x = x;
    player.position.y =
      terrainCollision?.kind === "stepUp"
        ? terrainCollision.height + PLAYER_HALF_HEIGHT
        : resolvePlayerVerticalPosition(
            x,
            z,
            player.position.y,
            ground,
            sampleTerrain,
          );
    player.position.z = z;
    return { kind: "moved" };
  }

  /**
   * Tente une petite étape de déplacement.
   *
   * Si le déplacement direct rencontre un obstacle, le mouvement est projeté
   * sur la tangente de la surface afin de tenter un glissement.
   *
   * @param movementX Déplacement de cette étape sur X.
   * @param movementZ Déplacement de cette étape sur Z.
   * @returns `true` si une position normale ou glissée a été appliquée,
   *          sinon `false` pour arrêter les étapes restantes.
   */
  function tryMovementStep(movementX: number, movementZ: number): boolean {
    const reference = {
      x: player.position.x,
      z: player.position.z,
    };

    const moveAttempt = tryMoveTo(
      player.position.x + movementX,
      player.position.z + movementZ,
      reference,
    );

    if (moveAttempt.kind === "moved") {
      return true;
    }

    if (moveAttempt.kind === "noGround") {
      return false;
    }

    const slideMovement = projectMovementAlongSurface(
      movementX,
      movementZ,
      moveAttempt.contact.normalX,
      moveAttempt.contact.normalZ,
    );

    const slideAttempt = tryMoveTo(
      player.position.x + slideMovement.x,
      player.position.z + slideMovement.z,
      reference,
    );

    return slideAttempt.kind === "moved";
  }

  /**
   * Applique un déplacement horizontal en le découpant en petites étapes.
   *
   * La subdivision évite qu'une frame lente fasse passer le joueur
   * entièrement à travers un obstacle entre deux tests de collision.
   *
   * @param movementX Déplacement total demandé sur X pour cette frame.
   * @param movementZ Déplacement total demandé sur Z pour cette frame.
   */
  function moveHorizontally(movementX: number, movementZ: number): void {
    const movementLength = Math.hypot(movementX, movementZ);

    const stepCount = Math.max(
      1,
      Math.ceil(movementLength / MAX_HORIZONTAL_MOVEMENT_STEP),
    );

    const stepX = movementX / stepCount;
    const stepZ = movementZ / stepCount;

    for (let step = 0; step < stepCount; step += 1) {
      if (!tryMovementStep(stepX, stepZ)) break;
    }
  }
}
