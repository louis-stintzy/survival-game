import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldTime } from "../gameplay/time/createWorldClock";
import type { GameLighting } from "./createLighting";

const SUNRISE_HOUR = 5;
const SUNSET_HOUR = 21;

const SUN_SHADOW_DISTANCE = 100;

interface DayNightKeyframe {
  hour: number;
  sunIntensity: number;
  skyLightIntensity: number;
  sunColor: Color3;
  skyLightColor: Color3;
  skyLightGroundColor: Color3;
  backgroundColor: Color4;
}

const DAY_NIGHT_KEYFRAMES: DayNightKeyframe[] = [
  {
    hour: 0,
    sunIntensity: 0,
    skyLightIntensity: 0.18,
    sunColor: new Color3(1, 0.85, 0.7),
    skyLightColor: new Color3(0.35, 0.45, 0.7),
    skyLightGroundColor: new Color3(0.08, 0.12, 0.2),
    backgroundColor: new Color4(0.04, 0.08, 0.18, 1),
  },

  {
    hour: 5,
    sunIntensity: 0,
    skyLightIntensity: 0.22,
    sunColor: new Color3(1, 0.65, 0.4),
    skyLightColor: new Color3(0.45, 0.45, 0.65),
    skyLightGroundColor: new Color3(0.1, 0.13, 0.2),
    backgroundColor: new Color4(0.12, 0.16, 0.3, 1),
  },

  {
    hour: 7,
    sunIntensity: 1.0,
    skyLightIntensity: 0.35,
    sunColor: new Color3(1, 0.8, 0.55),
    skyLightColor: new Color3(0.8, 0.9, 1),
    skyLightGroundColor: new Color3(0.2, 0.3, 0.35),
    backgroundColor: new Color4(0.48, 0.72, 0.85, 1),
  },

  {
    hour: 12,
    sunIntensity: 1.5,
    skyLightIntensity: 0.45,
    sunColor: new Color3(1, 1, 0.95),
    skyLightColor: new Color3(1, 1, 1),
    skyLightGroundColor: new Color3(0.25, 0.4, 0.45),
    backgroundColor: new Color4(0.56, 0.84, 0.91, 1),
  },

  {
    hour: 19,
    sunIntensity: 0.9,
    skyLightIntensity: 0.3,
    sunColor: new Color3(1, 0.62, 0.35),
    skyLightColor: new Color3(0.85, 0.7, 0.65),
    skyLightGroundColor: new Color3(0.18, 0.22, 0.3),
    backgroundColor: new Color4(0.75, 0.48, 0.42, 1),
  },

  {
    hour: 21,
    sunIntensity: 0,
    skyLightIntensity: 0.18,
    sunColor: new Color3(1, 0.55, 0.3),
    skyLightColor: new Color3(0.4, 0.48, 0.72),
    skyLightGroundColor: new Color3(0.08, 0.12, 0.2),
    backgroundColor: new Color4(0.08, 0.12, 0.24, 1),
  },

  {
    hour: 24,
    sunIntensity: 0,
    skyLightIntensity: 0.18,
    sunColor: new Color3(1, 0.85, 0.7),
    skyLightColor: new Color3(0.35, 0.45, 0.7),
    skyLightGroundColor: new Color3(0.08, 0.12, 0.2),
    backgroundColor: new Color4(0.04, 0.08, 0.18, 1),
  },
];

function getSurroundingKeyframes(hour: number) {
  for (let index = 0; index < DAY_NIGHT_KEYFRAMES.length - 1; index += 1) {
    const current = DAY_NIGHT_KEYFRAMES[index];
    const next = DAY_NIGHT_KEYFRAMES[index + 1];

    if (hour >= current.hour && hour <= next.hour) {
      return {
        current,
        next,
        progress: (hour - current.hour) / (next.hour - current.hour),
      };
    }
  }

  throw new Error(`No lighting keyframe found for hour ${hour}`);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function lerpColor3(start: Color3, end: Color3, progress: number): Color3 {
  return new Color3(
    lerp(start.r, end.r, progress),
    lerp(start.g, end.g, progress),
    lerp(start.b, end.b, progress),
  );
}

function lerpColor4(start: Color4, end: Color4, progress: number): Color4 {
  return new Color4(
    lerp(start.r, end.r, progress),
    lerp(start.g, end.g, progress),
    lerp(start.b, end.b, progress),
    lerp(start.a, end.a, progress),
  );
}

function getSunDirection(hour: number): Vector3 {
  const daylightProgress = (hour - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);

  const angle = daylightProgress * Math.PI;

  const horizontalX = Math.cos(angle);
  const verticalY = Math.sin(angle);

  return new Vector3(
    -horizontalX,
    -Math.max(verticalY, 0.1),
    -0.35,
  ).normalize();
}

/**
 * Crée le système visuel du cycle jour/nuit.
 *
 * Le temps lui-même appartient au gameplay. Ce système se contente
 * de traduire l'heure courante en éclairage et en ambiance visuelle.
 */
export function createDayNightLighting(scene: Scene, lighting: GameLighting) {
  return (worldTime: WorldTime) => {
    const { current, next, progress } = getSurroundingKeyframes(worldTime.hour);

    lighting.sun.intensity = lerp(
      current.sunIntensity,
      next.sunIntensity,
      progress,
    );

    lighting.skyLight.intensity = lerp(
      current.skyLightIntensity,
      next.skyLightIntensity,
      progress,
    );

    lighting.sun.diffuse = lerpColor3(
      current.sunColor,
      next.sunColor,
      progress,
    );

    lighting.skyLight.diffuse = lerpColor3(
      current.skyLightColor,
      next.skyLightColor,
      progress,
    );

    lighting.skyLight.groundColor = lerpColor3(
      current.skyLightGroundColor,
      next.skyLightGroundColor,
      progress,
    );

    scene.clearColor = lerpColor4(
      current.backgroundColor,
      next.backgroundColor,
      progress,
    );

    const sunDirection = getSunDirection(worldTime.hour);

    lighting.sun.direction = sunDirection;

    // La lumière directionnelle éclaire à distance infinie, mais Babylon utilise
    // également sa position pour construire la vue servant à la shadow map.
    // On garde donc cette position cohérente avec la trajectoire du soleil.
    lighting.sun.position = sunDirection.scale(-SUN_SHADOW_DISTANCE);
  };
}
