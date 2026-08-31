import type { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { GAME_PALETTE } from "../constants/gamePalette";

function createMaterial(
  scene: Scene,
  name: string,
  color: string,
): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(color);
  material.specularColor = Color3.Black();
  return material;
}

export function createGameMaterials(scene: Scene) {
  // ----- World ----
  const water = createMaterial(
    scene,
    "world-water-material",
    GAME_PALETTE.world.water,
  );
  water.alpha = 0.92;
  const sand = createMaterial(
    scene,
    "world-sand-material",
    GAME_PALETTE.world.sand,
  );
  const grass = createMaterial(
    scene,
    "world-grass-material",
    GAME_PALETTE.world.grass,
  );
  const trunk = createMaterial(
    scene,
    "world-trunk-material",
    GAME_PALETTE.world.trunk,
  );
  const leaves = createMaterial(
    scene,
    "world-leaves-material",
    GAME_PALETTE.world.leaves,
  );
  const rock = createMaterial(
    scene,
    "world-rock-material",
    GAME_PALETTE.world.rock,
  );

  // ----- Player -----
  const body = createMaterial(
    scene,
    "player-body-material",
    GAME_PALETTE.player.body,
  );

  // ----- Building ----
  const posts = createMaterial(
    scene,
    "building-shelter-post-material",
    GAME_PALETTE.building.shelter.posts,
  );

  const roof = createMaterial(
    scene,
    "building-shelter-roof-material",
    GAME_PALETTE.building.shelter.roof,
  );

  const top = createMaterial(
    scene,
    "building-workbench-top-material",
    GAME_PALETTE.building.workbench.top,
  );

  const legs = createMaterial(
    scene,
    "building-workbench-legs-material",
    GAME_PALETTE.building.workbench.legs,
  );

  const stonePlate = createMaterial(
    scene,
    "building-workbench-stoneplate-material",
    GAME_PALETTE.building.workbench.stonePlate,
  );

  const handle = createMaterial(
    scene,
    "tools-handle-material",
    GAME_PALETTE.tools.handle,
  );

  const head = createMaterial(
    scene,
    "tools-head-material",
    GAME_PALETTE.tools.head,
  );

  return {
    world: {
      water,
      sand,
      grass,
      trunk,
      leaves,
      rock,
    },
    player: { body },
    building: {
      shelter: {
        posts,
        roof,
      },
      workbench: {
        top,
        legs,
        stonePlate,
      },
    },
    tools: {
      handle,
      head,
    },
  };
}
