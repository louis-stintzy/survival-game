import { describe, expect, test } from "vitest";
import { RAFT_NAVIGATION_FOOTPRINT } from "../../models/raftGeometry";
import { createBaseTerracedTerrainData } from "../terrain/terraced/createBaseTerracedTerrainData";
import { sampleTerracedTerrain } from "../terrain/terraced/sampleTerracedTerrain";
import { validateTemporaryIslandSpawns } from "./validateTemporaryIslandSpawns";

describe("validateTemporaryIslandSpawns", () => {
  test("garde le joueur sur le sable et toute l'empreinte du radeau à portée sur l'eau", () => {
    const terrain = createBaseTerracedTerrainData();
    const result = validateTemporaryIslandSpawns(
      (x, z) => sampleTerracedTerrain(terrain, x, z),
      RAFT_NAVIGATION_FOOTPRINT,
    );

    expect(result.playerGround.surface).toBe("sand");
    expect(result.playerGround.isLand).toBe(true);
    expect(result.spawnDistance).toBeLessThanOrEqual(2.75);
  });
});
