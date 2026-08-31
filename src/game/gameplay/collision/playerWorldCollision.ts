import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { HarvestableResource } from "../../resources/resourceTypes";

export const PLAYER_COLLISION_RADIUS = 0.5;

export interface HorizontalBounds {
  minimumX: number;
  maximumX: number;
  minimumZ: number;
  maximumZ: number;
}

export function circleOverlapsHorizontalBounds(
  x: number,
  z: number,
  radius: number,
  bounds: HorizontalBounds,
): boolean {
  const nearestX = Math.max(bounds.minimumX, Math.min(x, bounds.maximumX));
  const nearestZ = Math.max(bounds.minimumZ, Math.min(z, bounds.maximumZ));
  const distanceX = x - nearestX;
  const distanceZ = z - nearestZ;

  return distanceX ** 2 + distanceZ ** 2 <= radius ** 2;
}

export function createPlayerWorldCollision(
  resources: readonly HarvestableResource[],
  builtCollisionMeshes: readonly Mesh[],
) {
  return (x: number, z: number): boolean => {
    for (const resource of resources) {
      if (
        !resource.harvested &&
        resource.collisionMeshes.some((mesh) => meshBlocksPosition(mesh, x, z))
      ) {
        return true;
      }
    }

    return builtCollisionMeshes.some((mesh) => meshBlocksPosition(mesh, x, z));
  };
}

function meshBlocksPosition(mesh: Mesh, x: number, z: number): boolean {
  mesh.computeWorldMatrix(true);
  const boundingBox = mesh.getBoundingInfo().boundingBox;

  return circleOverlapsHorizontalBounds(x, z, PLAYER_COLLISION_RADIUS, {
    minimumX: boundingBox.minimumWorld.x,
    maximumX: boundingBox.maximumWorld.x,
    minimumZ: boundingBox.minimumWorld.z,
    maximumZ: boundingBox.maximumWorld.z,
  });
}
