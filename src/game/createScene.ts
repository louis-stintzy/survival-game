import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { createPlayerMovement } from "./player/createPlayerMovement";

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

function createTree(
  scene: Scene,
  position: Vector3,
  trunkMaterial: StandardMaterial,
  leavesMaterial: StandardMaterial,
): Mesh[] {
  const trunk = MeshBuilder.CreateCylinder(
    "tree-trunk",
    { height: 2.2, diameterTop: 0.42, diameterBottom: 0.6, tessellation: 7 },
    scene,
  );
  trunk.position = position.add(new Vector3(0, 1.1, 0));
  trunk.material = trunkMaterial;
  const crown = MeshBuilder.CreatePolyhedron(
    "tree-crown",
    { type: 2, size: 1.65 },
    scene,
  );
  crown.position = position.add(new Vector3(0, 3, 0));
  crown.scaling = new Vector3(0.9, 1.2, 0.9);
  crown.rotation.y = position.x;
  crown.material = leavesMaterial;
  return [trunk, crown];
}

function createRock(
  scene: Scene,
  position: Vector3,
  material: StandardMaterial,
  scale: number,
): Mesh {
  const rock = MeshBuilder.CreatePolyhedron(
    "rock",
    { type: 1, size: 1 },
    scene,
  );
  rock.position = position.add(new Vector3(0, scale * 0.55, 0));
  rock.scaling = new Vector3(scale, scale * 0.75, scale * 0.85);
  rock.rotation = new Vector3(0.12, position.z, -0.08);
  rock.material = material;
  return rock;
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

  const water = MeshBuilder.CreateCylinder(
    "water",
    { diameter: 30, height: 0.6, tessellation: 48 },
    scene,
  );
  water.position.y = -0.55;
  water.material = waterMaterial;
  water.receiveShadows = true;
  const beach = MeshBuilder.CreateCylinder(
    "beach",
    { diameter: 18, height: 1.1, tessellation: 12 },
    scene,
  );
  beach.position.y = -0.2;
  beach.scaling.z = 0.82;
  beach.rotation.y = 0.08;
  beach.material = sandMaterial;
  beach.receiveShadows = true;
  const grass = MeshBuilder.CreateCylinder(
    "grass",
    { diameter: 15.5, height: 1, tessellation: 11 },
    scene,
  );
  grass.position.y = 0.25;
  grass.scaling.z = 0.8;
  grass.rotation.y = -0.06;
  grass.material = grassMaterial;
  grass.receiveShadows = true;
  const rockyPlateau = MeshBuilder.CreateCylinder(
    "rocky-plateau",
    { diameter: 4, height: 0.35, tessellation: 7 },
    scene,
  );
  rockyPlateau.position = new Vector3(2.4, 0.925, 1.5);
  rockyPlateau.scaling.z = 0.72;
  rockyPlateau.rotation.y = 0.2;
  rockyPlateau.material = rockMaterial;
  rockyPlateau.receiveShadows = true;

  const player = MeshBuilder.CreateCapsule(
    "player",
    { height: 2.2, radius: 0.55, tessellation: 8 },
    scene,
  );
  player.position = new Vector3(0, 1.85, 0);
  player.material = playerMaterial;
  const trees = [
    new Vector3(-4.8, 0.75, -2.4),
    new Vector3(-5.6, 0.75, 1.3),
    new Vector3(-2.9, 0.75, 3.4),
    new Vector3(4.5, 0.75, 2.2),
    new Vector3(5.2, 0.75, -1.4),
  ].flatMap((position) =>
    createTree(scene, position, trunkMaterial, leavesMaterial),
  );
  const rocks = [
    createRock(scene, new Vector3(-1.9, 0.75, -4.4), rockMaterial, 1.1),
    createRock(scene, new Vector3(3.1, 0.75, -3.5), rockMaterial, 0.9),
    createRock(scene, new Vector3(5.7, 0.3, 0.6), rockMaterial, 0.7),
  ];

  // Seuls les éléments au-dessus du sol projettent une ombre ; les surfaces
  // de l'île les reçoivent pour mieux ancrer les formes dans le diorama.
  [player, ...trees, ...rocks].forEach((mesh) => shadows.addShadowCaster(mesh));

  const walkableSurfaces = [grass, beach, rockyPlateau];
  const updatePlayerMovement = createPlayerMovement(
    player,
    camera,
    walkableSurfaces,
  );
  scene.onBeforeRenderObservable.add(() => {
    updatePlayerMovement(engine.getDeltaTime() / 1000);
  });

  return scene;
}
