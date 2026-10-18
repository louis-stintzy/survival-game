import type { TerrainSample } from "../../world/terrain/terrainTypes";

/** Tous les points d'une construction doivent partager une terrasse d'herbe. */
export function isBuildableTerrace(
  grounds: readonly (TerrainSample | undefined)[],
): boolean {
  const firstGround = grounds[0];
  if (firstGround?.surface !== "grass") return false;

  return grounds.every(
    (ground) =>
      ground?.surface === "grass" && ground.level === firstGround.level,
  );
}
