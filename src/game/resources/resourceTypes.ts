import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

export type ResourceType = "wood" | "stone" | "food";
export type HarvestableResourceType = Exclude<ResourceType, "food">;

export interface HarvestableResource {
  type: HarvestableResourceType;
  position: Vector3;
  meshes: Mesh[];
  harvested: boolean;
}
