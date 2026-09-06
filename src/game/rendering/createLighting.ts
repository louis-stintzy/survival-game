import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Scene } from "@babylonjs/core/scene";

export interface GameLighting {
  sun: DirectionalLight;
  skyLight: HemisphericLight;
  shadows: ShadowGenerator;
}

export function createLighting(scene: Scene): GameLighting {
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
  shadows.useKernelBlur = true;
  shadows.blurKernel = 4;
  shadows.blurScale = 1;

  return {
    sun,
    skyLight,
    shadows,
  };
}
