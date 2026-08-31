import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HarvestableResourceType } from "../definitions/resourceDefinitions";

export interface HarvestableResource {
  type: HarvestableResourceType;
  position: Vector3;
  meshes: Mesh[];
  harvested: boolean;
}
