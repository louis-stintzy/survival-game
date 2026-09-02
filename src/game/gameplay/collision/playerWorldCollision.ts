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

export interface HorizontalPosition {
  x: number;
  z: number;
}

export interface PlayerCollisionQuery {
  /** Position tentée, utilisée pour détecter l'obstacle rencontré. */
  candidate: HorizontalPosition;
  /** Dernière position valide, utilisée pour calculer la normale de sliding. */
  reference: HorizontalPosition;
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
 * La position du premier cercle détecte l'intersection. La normale pointe du
 * second cercle (l'obstacle) vers la référence, qui peut être la dernière
 * position valide du joueur et ne doit donc pas nécessairement collisionner.
 *
 * @param firstX Position X du cercle représentant le joueur.
 * @param firstZ Position Z du cercle représentant le joueur.
 * @param firstRadius Rayon du cercle représentant le joueur.
 * @param secondX Position X du cercle obstacle.
 * @param secondZ Position Z du cercle obstacle.
 * @param secondRadius Rayon du cercle obstacle.
 * @param reference Point utilisé pour calculer la normale ; la candidate est
 *                  utilisée par défaut pour préserver l'usage historique.
 * @returns Le contact avec sa normale extérieure, ou `undefined` sans contact.
 */
export function getCirclesContact(
  firstX: number,
  firstZ: number,
  firstRadius: number,
  secondX: number,
  secondZ: number,
  secondRadius: number,
  reference: HorizontalPosition = { x: firstX, z: firstZ },
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

  return getCircleNormalAtPoint(reference.x, reference.z, secondX, secondZ);
}

/**
 * Calcule la normale extérieure d'un cercle obstacle vers un point de référence.
 *
 * Le point n'a pas besoin d'être en collision : il représente généralement la
 * dernière position valide du joueur. Les centres confondus utilisent +X comme
 * fallback déterministe.
 *
 * @param pointX Position X du point de référence.
 * @param pointZ Position Z du point de référence.
 * @param circleX Position X du centre de l'obstacle.
 * @param circleZ Position Z du centre de l'obstacle.
 * @returns Une normale unitaire pointant du centre de l'obstacle vers le point.
 */
export function getCircleNormalAtPoint(
  pointX: number,
  pointZ: number,
  circleX: number,
  circleZ: number,
): CollisionContact {
  const normalX = pointX - circleX;
  const normalZ = pointZ - circleZ;
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
 * @param reference Point utilisé pour calculer la normale extérieure.
 * @returns Le contact avec sa normale extérieure, ou `undefined` sans contact.
 */
export function getCircleHorizontalBoundsContact(
  x: number,
  z: number,
  radius: number,
  bounds: HorizontalBounds,
  reference: HorizontalPosition = { x, z },
): CollisionContact | undefined {
  const nearestX = Math.max(bounds.minimumX, Math.min(x, bounds.maximumX));
  const nearestZ = Math.max(bounds.minimumZ, Math.min(z, bounds.maximumZ));
  const distanceX = x - nearestX;
  const distanceZ = z - nearestZ;
  if (distanceX ** 2 + distanceZ ** 2 > radius ** 2) return undefined;

  return getHorizontalBoundsNormalAtPoint(reference.x, reference.z, bounds);
}

/**
 * Calcule la normale extérieure d'un rectangle vers un point de référence.
 *
 * À l'extérieur, elle va du point des bounds le plus proche vers la référence.
 * Si la référence est dedans, la face la plus proche fournit un fallback
 * déterministe. La référence n'a pas besoin d'être elle-même en collision.
 *
 * @param x Position X du point de référence.
 * @param z Position Z du point de référence.
 * @param bounds Limites du rectangle dans le même repère.
 * @returns Une normale extérieure unitaire.
 */
export function getHorizontalBoundsNormalAtPoint(
  x: number,
  z: number,
  bounds: HorizontalBounds,
): CollisionContact {
  const nearestX = Math.max(bounds.minimumX, Math.min(x, bounds.maximumX));
  const nearestZ = Math.max(bounds.minimumZ, Math.min(z, bounds.maximumZ));
  const normalX = x - nearestX;
  const normalZ = z - nearestZ;
  const normalLengthSquared = normalX ** 2 + normalZ ** 2;

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
 * @param reference Position monde utilisée pour calculer la normale ; elle est
 *                  transformée indépendamment de la candidate.
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
  reference: HorizontalPosition = { x: circleX, z: circleZ },
): CollisionContact | undefined {
  const relativeX = circleX - boxX;
  const relativeZ = circleZ - boxZ;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const localX = relativeX * cos - relativeZ * sin;
  const localZ = relativeX * sin + relativeZ * cos;
  const relativeReferenceX = reference.x - boxX;
  const relativeReferenceZ = reference.z - boxZ;
  const localReferenceX = relativeReferenceX * cos - relativeReferenceZ * sin;
  const localReferenceZ = relativeReferenceX * sin + relativeReferenceZ * cos;

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
    { x: localReferenceX, z: localReferenceZ },
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
 * La candidate sert uniquement à identifier l'obstacle touché. La reference
 * est la dernière position valide et détermine la normale utilisée au sliding.
 *
 * @returns Une fonction qui renvoie la normale extérieure du premier obstacle
 *          rencontré par la candidate, ou `undefined` si elle est libre.
 */
export function createPlayerWorldCollision(
  resources: readonly HarvestableResource[],
  builtCollisionMeshes: readonly Mesh[],
) {
  return (query: PlayerCollisionQuery): CollisionContact | undefined => {
    for (const resource of resources) {
      if (resource.harvested) continue;
      const contact = getResourceContact(resource, query);
      if (contact) return contact;
    }

    for (const mesh of builtCollisionMeshes) {
      const contact = getMeshContact(mesh, query);
      if (contact) return contact;
    }

    return undefined;
  };
}

function getResourceContact(
  resource: HarvestableResource,
  query: PlayerCollisionQuery,
): CollisionContact | undefined {
  const collider = resource.movementCollider;

  if (collider.kind === "circle") {
    return getCirclesContact(
      query.candidate.x,
      query.candidate.z,
      PLAYER_COLLISION_RADIUS,
      resource.position.x,
      resource.position.z,
      collider.radius,
      query.reference,
    );
  }

  return getCircleOrientedBoxContact(
    query.candidate.x,
    query.candidate.z,
    PLAYER_COLLISION_RADIUS,
    resource.position.x,
    resource.position.z,
    collider.halfWidth,
    collider.halfDepth,
    collider.rotation,
    query.reference,
  );
}

/**
 * Transforme la bounding box Babylon d'un mesh en obstacle
 * horizontal puis vérifie si elle bloque le joueur.
 */
function getMeshContact(
  mesh: Mesh,
  query: PlayerCollisionQuery,
): CollisionContact | undefined {
  mesh.computeWorldMatrix(true);
  const boundingBox = mesh.getBoundingInfo().boundingBox;

  return getCircleHorizontalBoundsContact(
    query.candidate.x,
    query.candidate.z,
    PLAYER_COLLISION_RADIUS,
    {
      minimumX: boundingBox.minimumWorld.x,
      maximumX: boundingBox.maximumWorld.x,
      minimumZ: boundingBox.minimumWorld.z,
      maximumZ: boundingBox.maximumWorld.z,
    },
    query.reference,
  );
}
