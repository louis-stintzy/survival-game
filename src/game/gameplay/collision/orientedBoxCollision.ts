import { CollisionContact, XZPosition } from "./collisionTypes";
import { getCircleHorizontalBoundsContact } from "./horizontalBoundsCollision";

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
  reference: XZPosition = { x: circleX, z: circleZ },
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
