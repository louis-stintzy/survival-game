import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { createPlayerMovement } from "./player/createPlayerMovement";
import { createResourceInteraction } from "./resources/createResourceInteraction";
import { createIsland } from "./world/createIsland";

const VIEW_HEIGHT = 28;

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

export function createScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.56, 0.84, 0.91, 1);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 4,
    Math.PI / 3.2,
    30,
    Vector3.Zero(),
    scene,
  );
  camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
  camera.inputs.clear();

  // Une caméra orthographique ne rétrécit pas les objets avec la distance.
  // Ses limites doivent suivre le ratio du viewport pour conserver le cadrage.
  const updateOrthographicBounds = () => {
    const aspectRatio = engine.getRenderWidth() / engine.getRenderHeight();
    camera.orthoTop = VIEW_HEIGHT / 2;
    camera.orthoBottom = -VIEW_HEIGHT / 2;
    camera.orthoLeft = (-VIEW_HEIGHT * aspectRatio) / 2;
    camera.orthoRight = (VIEW_HEIGHT * aspectRatio) / 2;
  };
  updateOrthographicBounds();
  engine.onResizeObservable.add(updateOrthographicBounds);

  const sun = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
  sun.position = new Vector3(12, 20, 10);
  sun.intensity = 1.5;
  const skyLight = new HemisphericLight(
    "sky-light",
    new Vector3(0, 1, 0),
    scene,
  );
  skyLight.intensity = 0.45;
  skyLight.groundColor = new Color3(0.25, 0.4, 0.45);
  const shadows = new ShadowGenerator(1024, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 24;

  const waterMaterial = createMaterial(
    scene,
    "water-material",
    new Color3(0.18, 0.62, 0.78),
  );
  waterMaterial.alpha = 0.92;
  const sandMaterial = createMaterial(
    scene,
    "sand-material",
    new Color3(0.91, 0.75, 0.46),
  );
  const grassMaterial = createMaterial(
    scene,
    "grass-material",
    new Color3(0.3, 0.68, 0.32),
  );
  const trunkMaterial = createMaterial(
    scene,
    "trunk-material",
    new Color3(0.38, 0.21, 0.1),
  );
  const leavesMaterial = createMaterial(
    scene,
    "leaves-material",
    new Color3(0.12, 0.48, 0.24),
  );
  const rockMaterial = createMaterial(
    scene,
    "rock-material",
    new Color3(0.38, 0.43, 0.44),
  );
  const playerMaterial = createMaterial(
    scene,
    "player-material",
    new Color3(0.92, 0.3, 0.18),
  );

  const island = createIsland(scene, {
    water: waterMaterial,
    sand: sandMaterial,
    grass: grassMaterial,
    trunk: trunkMaterial,
    leaves: leavesMaterial,
    rock: rockMaterial,
  });

  const player = MeshBuilder.CreateCapsule(
    "player",
    { height: 2.2, radius: 0.55, tessellation: 8 },
    scene,
  );
  player.position = new Vector3(0, 1.85, 0);
  player.material = playerMaterial;
  // Seuls les éléments au-dessus du sol projettent une ombre ; les surfaces
  // de l'île les reçoivent pour mieux ancrer les formes dans le diorama.
  [player, ...island.shadowCasters].forEach((mesh) =>
    shadows.addShadowCaster(mesh),
  );

  const updatePlayerMovement = createPlayerMovement(
    player,
    camera,
    island.walkableSurfaces,
  );
  const updateResourceInteraction = createResourceInteraction(
    player,
    island.harvestableResources,
  );
  scene.onBeforeRenderObservable.add(() => {
    const deltaTimeInSeconds = engine.getDeltaTime() / 1000;
    updatePlayerMovement(deltaTimeInSeconds);
    updateResourceInteraction(deltaTimeInSeconds);
  });

  return scene;
}
