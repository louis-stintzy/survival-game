import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

export type ResourceType = "wood" | "stone";

export interface HarvestableResource {
  type: ResourceType;
  position: Vector3;
  meshes: Mesh[];
  harvested: boolean;
}
