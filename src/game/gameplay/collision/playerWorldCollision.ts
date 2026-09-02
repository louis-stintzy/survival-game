import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HarvestableResource } from "../../resources/resourceTypes";
import type { CollisionContact, XZPosition } from "./collisionTypes";
import { getCirclesContact } from "./circleCollision";
import { getCircleOrientedBoxContact } from "./orientedBoxCollision";
import { getCircleHorizontalBoundsContact } from "./horizontalBoundsCollision";

/**
 * Rayon horizontal du joueur utilisé pour toutes les collisions
 * dans le plan X/Z.
 */
export const PLAYER_COLLISION_RADIUS = 0.5;

export interface PlayerCollisionQuery {
  /** Position tentée, utilisée pour détecter l'obstacle rencontré. */
  candidate: XZPosition;
  /** Dernière position valide, utilisée pour calculer la normale de sliding. */
  reference: XZPosition;
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
