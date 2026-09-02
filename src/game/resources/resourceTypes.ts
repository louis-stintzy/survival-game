import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HarvestableResourceType } from "../definitions/resourceDefinitions";

export type ResourceMovementCollider =
  | { kind: "circle"; radius: number }
  | {
      kind: "orientedBox";
      halfWidth: number;
      halfDepth: number;
      rotation: number;
    };

export interface HarvestableResource {
  type: HarvestableResourceType;
  position: Vector3;
  meshes: Mesh[];

  /**
   * Meshes physiques utilisés notamment pour empêcher la construction
   * d'un bâtiment sur cette ressource.
   */
  collisionMeshes: Mesh[];

  /** Forme gameplay X/Z dédiée au déplacement du joueur. */
  movementCollider: ResourceMovementCollider;

  harvested: boolean;
}
