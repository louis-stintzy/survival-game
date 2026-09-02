import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HarvestableResource } from "../../resources/resourceTypes";

/**
 * Rayon horizontal du joueur utilisé pour toutes les collisions
 * dans le plan X/Z.
 */
export const PLAYER_COLLISION_RADIUS = 0.5;

/**
 * Limites rectangulaires d'un obstacle projetées dans le plan X/Z.
 */
export interface HorizontalBounds {
  minimumX: number;
  maximumX: number;
  minimumZ: number;
  maximumZ: number;
}

/**
 * Indique si deux cercles horizontaux se chevauchent.
 *
 * Cette fonction est utilisée pour les collisions joueur ↔ ressources :
 * le joueur et chaque ressource sont représentés par des cercles
 * dans le plan X/Z.
 *
 * @param firstX Position X du centre du premier cercle.
 * @param firstZ Position Z du centre du premier cercle.
 * @param firstRadius Rayon du premier cercle.
 * @param secondX Position X du centre du second cercle.
 * @param secondZ Position Z du centre du second cercle.
 * @param secondRadius Rayon du second cercle.
 * @returns `true` lorsque les deux cercles se touchent ou se chevauchent.
 */
export function circlesOverlap(
  firstX: number,
  firstZ: number,
  firstRadius: number,
  secondX: number,
  secondZ: number,
  secondRadius: number,
): boolean {
  const distanceX = firstX - secondX;
  const distanceZ = firstZ - secondZ;
  const minimumDistance = firstRadius + secondRadius;
  return distanceX ** 2 + distanceZ ** 2 <= minimumDistance ** 2;
}

/**
 * Vérifie si un cercle horizontal touche un rectangle horizontal.
 *
 * Utilisé actuellement pour les collisions joueur ↔ bâtiments.
 *
 * @returns `true` si le cercle touche ou chevauche le rectangle.
 */
export function circleOverlapsHorizontalBounds(
  x: number,
  z: number,
  radius: number,
  bounds: HorizontalBounds,
): boolean {
  const nearestX = Math.max(bounds.minimumX, Math.min(x, bounds.maximumX));
  const nearestZ = Math.max(bounds.minimumZ, Math.min(z, bounds.maximumZ));
  const distanceX = x - nearestX;
  const distanceZ = z - nearestZ;

  return distanceX ** 2 + distanceZ ** 2 <= radius ** 2;
}

/**
 * Vérifie si un cercle touche un rectangle orienté dans le plan X/Z.
 *
 * La position du cercle est ramenée dans le repère local du rectangle par la
 * rotation inverse. Le rectangle y devient alors aligné avec les axes et peut
 * être testé avec {@link circleOverlapsHorizontalBounds}.
 *
 * @param circleX Position X du centre du cercle dans le monde.
 * @param circleZ Position Z du centre du cercle dans le monde.
 * @param circleRadius Rayon du cercle.
 * @param boxX Position X du centre du rectangle dans le monde.
 * @param boxZ Position Z du centre du rectangle dans le monde.
 * @param halfWidth Demi-largeur locale du rectangle sur X.
 * @param halfDepth Demi-profondeur locale du rectangle sur Z.
 * @param rotation Rotation du rectangle autour de Y, en radians.
 * @returns `true` lorsque le cercle touche ou chevauche le rectangle orienté.
 */
export function circleOverlapsOrientedBox(
  circleX: number,
  circleZ: number,
  circleRadius: number,
  boxX: number,
  boxZ: number,
  halfWidth: number,
  halfDepth: number,
  rotation: number,
): boolean {
  const relativeX = circleX - boxX;
  const relativeZ = circleZ - boxZ;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  // La rotation inverse exprime le centre du cercle dans les axes du collider.
  const localX = relativeX * cos - relativeZ * sin;
  const localZ = relativeX * sin + relativeZ * cos;

  return circleOverlapsHorizontalBounds(localX, localZ, circleRadius, {
    minimumX: -halfWidth,
    maximumX: halfWidth,
    minimumZ: -halfDepth,
    maximumZ: halfDepth,
  });
}

/**
 * Crée la fonction chargée de déterminer si une position X/Z
 * candidate du joueur est occupée.
 *
 * Les ressources utilisent leur collider gameplay explicite : cercle pour un
 * arbre ou rectangle orienté pour un rocher.
 * Les bâtiments construits sont testés à partir des limites X/Z
 * de leurs meshes de collision.
 *
 * @param resources Ressources naturelles susceptibles de bloquer le joueur.
 * @param builtCollisionMeshes Meshes de collision des bâtiments construits.
 * @returns Une fonction `(x, z) => boolean` indiquant si une position
 *          candidate du joueur est bloquée.
 */
export function createPlayerWorldCollision(
  resources: readonly HarvestableResource[],
  builtCollisionMeshes: readonly Mesh[],
) {
  return (x: number, z: number): boolean => {
    for (const resource of resources) {
      if (resource.harvested) continue;
      if (resourceBlocksPosition(resource, x, z)) return true;
    }

    return builtCollisionMeshes.some((mesh) => meshBlocksPosition(mesh, x, z));
  };
}

function resourceBlocksPosition(
  resource: HarvestableResource,
  x: number,
  z: number,
): boolean {
  const collider = resource.movementCollider;

  if (collider.kind === "circle") {
    return circlesOverlap(
      x,
      z,
      PLAYER_COLLISION_RADIUS,
      resource.position.x,
      resource.position.z,
      collider.radius,
    );
  }

  return circleOverlapsOrientedBox(
    x,
    z,
    PLAYER_COLLISION_RADIUS,
    resource.position.x,
    resource.position.z,
    collider.halfWidth,
    collider.halfDepth,
    collider.rotation,
  );
}

/**
 * Transforme la bounding box Babylon d'un mesh en obstacle
 * horizontal puis vérifie si elle bloque le joueur.
 */
function meshBlocksPosition(mesh: Mesh, x: number, z: number): boolean {
  mesh.computeWorldMatrix(true);
  const boundingBox = mesh.getBoundingInfo().boundingBox;

  return circleOverlapsHorizontalBounds(x, z, PLAYER_COLLISION_RADIUS, {
    minimumX: boundingBox.minimumWorld.x,
    maximumX: boundingBox.maximumWorld.x,
    minimumZ: boundingBox.minimumWorld.z,
    maximumZ: boundingBox.maximumWorld.z,
  });
}
