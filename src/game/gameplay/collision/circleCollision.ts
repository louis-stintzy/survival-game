import { CollisionContact, XZPosition } from "./collisionTypes";

// ------------------------------------------------------------
// circlesOverlap → est-ce qu'ils se touchent ?
// getCircleNormalAtPoint → quelle est la normale du cercle ?
// getCirclesContact → s'ils se touchent, fournir cette normale
// ------------------------------------------------------------

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
  reference: XZPosition = { x: firstX, z: firstZ },
): CollisionContact | undefined {
  if (
    !circlesOverlap(firstX, firstZ, firstRadius, secondX, secondZ, secondRadius)
  ) {
    return undefined;
  }

  return getCircleNormalAtPoint(reference.x, reference.z, secondX, secondZ);
}
