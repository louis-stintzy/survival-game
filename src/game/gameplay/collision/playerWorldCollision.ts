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

/** Normale unitaire d'une surface bloquant la position candidate du joueur. */
export interface CollisionContact {
  normalX: number;
  normalZ: number;
}

/**
 * Indique si deux cercles horizontaux se chevauchent.
 *
 * Cette fonction est utilisée pour les collisions joueur ↔ arbres :
 * le joueur et le tronc sont représentés par des cercles dans le plan X/Z.
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
 * Calcule le contact entre deux cercles horizontaux.
 *
 * La normale retournée pointe du second cercle (l'obstacle) vers le premier
 * cercle (le joueur). Si les centres sont confondus, l'axe +X fournit une
 * normale déterministe sans division par zéro.
 *
 * @param firstX Position X du cercle représentant le joueur.
 * @param firstZ Position Z du cercle représentant le joueur.
 * @param firstRadius Rayon du cercle représentant le joueur.
 * @param secondX Position X du cercle obstacle.
 * @param secondZ Position Z du cercle obstacle.
 * @param secondRadius Rayon du cercle obstacle.
 * @returns Le contact avec sa normale extérieure, ou `undefined` sans contact.
 */
export function getCirclesContact(
  firstX: number,
  firstZ: number,
  firstRadius: number,
  secondX: number,
  secondZ: number,
  secondRadius: number,
): CollisionContact | undefined {
  if (
    !circlesOverlap(
      firstX,
      firstZ,
      firstRadius,
      secondX,
      secondZ,
      secondRadius,
    )
  ) {
    return undefined;
  }

  const normalX = firstX - secondX;
  const normalZ = firstZ - secondZ;
  const normalLength = Math.hypot(normalX, normalZ);
  if (normalLength === 0) return { normalX: 1, normalZ: 0 };

  return {
    normalX: normalX / normalLength,
    normalZ: normalZ / normalLength,
  };
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
  return getCircleHorizontalBoundsContact(x, z, radius, bounds) !== undefined;
}

/**
 * Calcule le contact entre un cercle et un rectangle aligné avec X/Z.
 *
 * À l'extérieur, la normale va du point du rectangle le plus proche vers le
 * centre du cercle. Si le centre est dans le rectangle, la face la plus proche
 * est choisie de manière déterministe.
 *
 * @param x Position X du centre du cercle.
 * @param z Position Z du centre du cercle.
 * @param radius Rayon du cercle.
 * @param bounds Limites du rectangle dans le même repère.
 * @returns Le contact avec sa normale extérieure, ou `undefined` sans contact.
 */
export function getCircleHorizontalBoundsContact(
  x: number,
  z: number,
  radius: number,
  bounds: HorizontalBounds,
): CollisionContact | undefined {
  const nearestX = Math.max(bounds.minimumX, Math.min(x, bounds.maximumX));
  const nearestZ = Math.max(bounds.minimumZ, Math.min(z, bounds.maximumZ));
  const normalX = x - nearestX;
  const normalZ = z - nearestZ;
  const normalLengthSquared = normalX ** 2 + normalZ ** 2;
  if (normalLengthSquared > radius ** 2) return undefined;

  if (normalLengthSquared > 0) {
    const normalLength = Math.sqrt(normalLengthSquared);
    return {
      normalX: normalX / normalLength,
      normalZ: normalZ / normalLength,
    };
  }

  const distancesToFaces = [
    { distance: x - bounds.minimumX, normalX: -1, normalZ: 0 },
    { distance: bounds.maximumX - x, normalX: 1, normalZ: 0 },
    { distance: z - bounds.minimumZ, normalX: 0, normalZ: -1 },
    { distance: bounds.maximumZ - z, normalX: 0, normalZ: 1 },
  ];
  const nearestFace = distancesToFaces.reduce((nearest, face) =>
    face.distance < nearest.distance ? face : nearest,
  );
  return { normalX: nearestFace.normalX, normalZ: nearestFace.normalZ };
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
  return (
    getCircleOrientedBoxContact(
      circleX,
      circleZ,
      circleRadius,
      boxX,
      boxZ,
      halfWidth,
      halfDepth,
      rotation,
    ) !== undefined
  );
}

/**
 * Calcule le contact entre un cercle et un rectangle orienté.
 *
 * Le cercle est d'abord transformé par la rotation inverse dans le repère local
 * du rectangle. La normale locale obtenue contre des bounds alignés est ensuite
 * tournée vers le repère monde.
 *
 * @param circleX Position X du centre du cercle dans le monde.
 * @param circleZ Position Z du centre du cercle dans le monde.
 * @param circleRadius Rayon du cercle.
 * @param boxX Position X du centre du rectangle dans le monde.
 * @param boxZ Position Z du centre du rectangle dans le monde.
 * @param halfWidth Demi-largeur locale du rectangle sur X.
 * @param halfDepth Demi-profondeur locale du rectangle sur Z.
 * @param rotation Rotation du rectangle autour de Y, en radians.
 * @returns Le contact avec une normale extérieure en coordonnées monde, ou
 *          `undefined` sans contact.
 */
export function getCircleOrientedBoxContact(
  circleX: number,
  circleZ: number,
  circleRadius: number,
  boxX: number,
  boxZ: number,
  halfWidth: number,
  halfDepth: number,
  rotation: number,
): CollisionContact | undefined {
  const relativeX = circleX - boxX;
  const relativeZ = circleZ - boxZ;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const localX = relativeX * cos - relativeZ * sin;
  const localZ = relativeX * sin + relativeZ * cos;

  const localContact = getCircleHorizontalBoundsContact(
    localX,
    localZ,
    circleRadius,
    {
      minimumX: -halfWidth,
      maximumX: halfWidth,
      minimumZ: -halfDepth,
      maximumZ: halfDepth,
    },
  );
  if (!localContact) return undefined;

  const localNormalX = localContact.normalX;
  const localNormalZ = localContact.normalZ;
  const worldNormalX = localNormalX * cos + localNormalZ * sin;
  const worldNormalZ = -localNormalX * sin + localNormalZ * cos;
  return { normalX: worldNormalX, normalZ: worldNormalZ };
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
 * @returns Une fonction qui renvoie la normale extérieure du premier obstacle
 *          rencontré, ou `undefined` lorsque la position est libre.
 */
export function createPlayerWorldCollision(
  resources: readonly HarvestableResource[],
  builtCollisionMeshes: readonly Mesh[],
) {
  return (x: number, z: number): CollisionContact | undefined => {
    for (const resource of resources) {
      if (resource.harvested) continue;
      const contact = getResourceContact(resource, x, z);
      if (contact) return contact;
    }

    for (const mesh of builtCollisionMeshes) {
      const contact = getMeshContact(mesh, x, z);
      if (contact) return contact;
    }

    return undefined;
  };
}

function getResourceContact(
  resource: HarvestableResource,
  x: number,
  z: number,
): CollisionContact | undefined {
  const collider = resource.movementCollider;

  if (collider.kind === "circle") {
    return getCirclesContact(
      x,
      z,
      PLAYER_COLLISION_RADIUS,
      resource.position.x,
      resource.position.z,
      collider.radius,
    );
  }

  return getCircleOrientedBoxContact(
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
function getMeshContact(
  mesh: Mesh,
  x: number,
  z: number,
): CollisionContact | undefined {
  mesh.computeWorldMatrix(true);
  const boundingBox = mesh.getBoundingInfo().boundingBox;

  return getCircleHorizontalBoundsContact(x, z, PLAYER_COLLISION_RADIUS, {
    minimumX: boundingBox.minimumWorld.x,
    maximumX: boundingBox.maximumWorld.x,
    minimumZ: boundingBox.minimumWorld.z,
    maximumZ: boundingBox.maximumWorld.z,
  });
}
