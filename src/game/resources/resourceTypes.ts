import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HarvestableResourceType } from "../definitions/resourceDefinitions";

export interface HarvestableResource {
  type: HarvestableResourceType;
  position: Vector3;
  meshes: Mesh[];

  /**
   * Meshes physiques utilisés notamment pour empêcher la construction
   * d'un bâtiment sur cette ressource.
   */
  collisionMeshes: Mesh[];

  /**
   * Rayon horizontal simplifié utilisé pour les collisions
   * entre le joueur et cette ressource dans le plan X/Z.
   */
  movementCollisionRadius: number;

  harvested: boolean;
}
