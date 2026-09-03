import { CollisionContact, XZPosition } from "./collisionTypes";

/**
 * Limites rectangulaires d'un obstacle projetées dans le plan X/Z.
 */
export interface XZBounds {
  minimumX: number;
  maximumX: number;
  minimumZ: number;
  maximumZ: number;
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
  bounds: XZBounds,
): boolean {
  return getCircleHorizontalBoundsContact(x, z, radius, bounds) !== undefined;
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
  bounds: XZBounds,
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
  bounds: XZBounds,
  reference: XZPosition = { x, z },
): CollisionContact | undefined {
  const nearestX = Math.max(bounds.minimumX, Math.min(x, bounds.maximumX));
  const nearestZ = Math.max(bounds.minimumZ, Math.min(z, bounds.maximumZ));
  const distanceX = x - nearestX;
  const distanceZ = z - nearestZ;
  if (distanceX ** 2 + distanceZ ** 2 > radius ** 2) return undefined;

  return getHorizontalBoundsNormalAtPoint(reference.x, reference.z, bounds);
}
