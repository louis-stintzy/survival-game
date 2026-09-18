import { describe, expect, test } from "vitest";
import { RAFT_NAVIGATION_FOOTPRINT } from "../../models/raftGeometry";
import { createBaseTerrainData } from "../terrain/createBaseTerrainData";
import { sampleTerrain } from "../terrain/sampleTerrain";
import { validateTemporaryIslandSpawns } from "./validateTemporaryIslandSpawns";

describe("validateTemporaryIslandSpawns", () => {
  test("garde le joueur sur la plage et toute l'empreinte du radeau à portée sur l'eau", () => {
    const terrain = createBaseTerrainData();
    const result = validateTemporaryIslandSpawns(
      (x, z) => sampleTerrain(terrain, x, z),
      RAFT_NAVIGATION_FOOTPRINT,
    );

    expect(result.playerGround.surface).toBe("beach");
    expect(result.playerGround.isLand).toBe(true);
    expect(result.spawnDistance).toBeLessThanOrEqual(2.75);
  });
});
