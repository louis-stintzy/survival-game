import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

function createMaterial(
  scene: Scene,
  name: string,
  color: Color3,
): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = Color3.Black();
  return material;
}

export function createGameMaterials(scene: Scene) {
  const water = createMaterial(
    scene,
    "water-material",
    new Color3(0.18, 0.62, 0.78),
  );
  water.alpha = 0.92;
  const sand = createMaterial(
    scene,
    "sand-material",
    new Color3(0.91, 0.75, 0.46),
  );
  const grass = createMaterial(
    scene,
    "grass-material",
    new Color3(0.3, 0.68, 0.32),
  );
  const trunk = createMaterial(
    scene,
    "trunk-material",
    new Color3(0.38, 0.21, 0.1),
  );
  const leaves = createMaterial(
    scene,
    "leaves-material",
    new Color3(0.12, 0.48, 0.24),
  );
  const rock = createMaterial(
    scene,
    "rock-material",
    new Color3(0.38, 0.43, 0.44),
  );
  const player = createMaterial(
    scene,
    "player-material",
    new Color3(0.92, 0.3, 0.18),
  );
  const shelterRoof = createMaterial(
    scene,
    "shelter-roof-material",
    new Color3(0.66, 0.4, 0.18),
  );

  return {
    water,
    sand,
    grass,
    trunk,
    leaves,
    rock,
    player,
    shelterRoof,
  };
}
