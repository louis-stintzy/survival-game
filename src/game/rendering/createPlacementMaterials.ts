import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { GAME_PALETTE } from "../constants/gamePalette";

function createGhostMaterial(
  scene: Scene,
  name: string,
  color: string,
): StandardMaterial {
  const parsedColor = Color3.FromHexString(color);

  const material = new StandardMaterial(name, scene);
  material.diffuseColor = parsedColor;
  material.emissiveColor = parsedColor.scale(0.25);
  material.specularColor = Color3.Black();
  material.alpha = 0.45;

  return material;
}

export function createPlacementMaterials(scene: Scene) {
  const valid = createGhostMaterial(
    scene,
    "valid-building-ghost-material",
    GAME_PALETTE.placement.valid,
  );

  const invalid = createGhostMaterial(
    scene,
    "invalid-building-ghost-material",
    GAME_PALETTE.placement.invalid,
  );

  return {
    valid,
    invalid,
  };
}
