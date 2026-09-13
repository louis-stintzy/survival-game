import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Ray } from "@babylonjs/core/Culling/ray";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Raft } from "../../models/createRaft";
import { PLAYER_HALF_HEIGHT } from "../../models/createPlayer";
import type { PlayerCollisionQuery } from "../collision/playerWorldCollision";
import type { CollisionContact } from "../collision/collisionTypes";

const RAFT_MOVEMENT_SPEED = 6;
const MAX_HORIZONTAL_MOVEMENT_STEP = 0.25;
const TERRAIN_RAY_START_HEIGHT = 10;
const TERRAIN_RAY_LENGTH = 20;
const DISEMBARK_RADII = [2, 2.5, 3];
const DISEMBARK_DIRECTION_COUNT = 16;
const MOVEMENT_KEYS = new Set([
  "z",
  "w",
  "s",
  "q",
  "a",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

interface RaftNavigationOptions {
  scene: Scene;
  camera: ArcRotateCamera;
  player: Mesh;
  raft: Raft;
  walkableSurfaces: readonly AbstractMesh[];
  navigableSurfaces: readonly AbstractMesh[];
  getPlayerCollision: (
    query: PlayerCollisionQuery,
  ) => CollisionContact | undefined;
}

/**
 * Pilote l'unique radeau du prototype et maintient le joueur à son bord.
 * La navigation et le débarquement partagent le même raycast vertical afin
 * que la strate de terrain visible depuis le haut reste la source de vérité.
 */
export function createRaftNavigation(options: RaftNavigationOptions) {
  const {
    scene,
    camera,
    player,
    raft,
    walkableSurfaces,
    navigableSurfaces,
    getPlayerCollision,
  } = options;
  const pressedKeys = new Set<string>();
  const walkableSurfaceSet = new Set(walkableSurfaces);
  const navigableSurfaceSet = new Set(navigableSurfaces);
  const terrainSurfaceSet = new Set([
    ...walkableSurfaces,
    ...navigableSurfaces,
  ]);
  let embarked = false;

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!MOVEMENT_KEYS.has(key)) return;
    pressedKeys.add(key);
    event.preventDefault();
  });
  window.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key.toLowerCase());
  });
  window.addEventListener("blur", () => pressedKeys.clear());

  return {
    raft,
    isEmbarked: () => embarked,
    board() {
      if (embarked) return;
      embarked = true;
      attachPlayerToRaft();
    },
    tryDisembark,
    update,
  };

  function update(deltaTimeInSeconds: number) {
    if (!embarked) return;

    const forwardInput =
      Number(
        pressedKeys.has("z") ||
          pressedKeys.has("w") ||
          pressedKeys.has("arrowup"),
      ) - Number(pressedKeys.has("s") || pressedKeys.has("arrowdown"));
    const rightInput =
      Number(pressedKeys.has("d") || pressedKeys.has("arrowright")) -
      Number(
        pressedKeys.has("q") ||
          pressedKeys.has("a") ||
          pressedKeys.has("arrowleft"),
      );

    if (forwardInput !== 0 || rightInput !== 0) {
      const cameraForward = camera.target.subtract(camera.position);
      cameraForward.y = 0;
      cameraForward.normalize();

      const cameraRight = camera.getDirection(Vector3.Right());
      cameraRight.y = 0;
      cameraRight.normalize();

      const direction = cameraForward
        .scale(forwardInput)
        .add(cameraRight.scale(rightInput));
      direction.normalize();

      const moved = moveHorizontally(
        direction.x * RAFT_MOVEMENT_SPEED * deltaTimeInSeconds,
        direction.z * RAFT_MOVEMENT_SPEED * deltaTimeInSeconds,
      );
      if (moved) raft.root.rotation.y = Math.atan2(direction.x, direction.z);
    }

    attachPlayerToRaft();
  }

  function moveHorizontally(movementX: number, movementZ: number) {
    const distance = Math.hypot(movementX, movementZ);
    const stepCount = Math.max(
      1,
      Math.ceil(distance / MAX_HORIZONTAL_MOVEMENT_STEP),
    );
    const stepX = movementX / stepCount;
    const stepZ = movementZ / stepCount;

    let moved = false;
    for (let step = 0; step < stepCount; step += 1) {
      const x = raft.root.position.x + stepX;
      const z = raft.root.position.z + stepZ;
      const ground = getTopTerrainAt(x, z);

      // L'eau existe sous toute l'île : seul le premier mesh touché depuis le
      // haut décide si la candidate appartient réellement à l'espace navigable.
      if (!ground || !navigableSurfaceSet.has(ground.surface)) break;
      raft.root.position.set(x, ground.point.y, z);
      moved = true;
    }
    return moved;
  }

  function tryDisembark(): boolean {
    for (const radius of DISEMBARK_RADII) {
      for (let index = 0; index < DISEMBARK_DIRECTION_COUNT; index += 1) {
        const angle = (index / DISEMBARK_DIRECTION_COUNT) * Math.PI * 2;
        const x = raft.root.position.x + Math.cos(angle) * radius;
        const z = raft.root.position.z + Math.sin(angle) * radius;
        const ground = getTopTerrainAt(x, z);
        if (!ground || !walkableSurfaceSet.has(ground.surface)) continue;

        const collision = getPlayerCollision({
          candidate: { x, z },
          reference: { x: raft.root.position.x, z: raft.root.position.z },
        });
        if (collision) continue;

        // Le joueur n'est détaché qu'après avoir trouvé à la fois une surface
        // praticable supérieure et une position libre des collisions du monde.
        embarked = false;
        player.position.set(x, ground.point.y + PLAYER_HALF_HEIGHT, z);
        return true;
      }
    }
    return false;
  }

  function getTopTerrainAt(x: number, z: number) {
    const ray = new Ray(
      new Vector3(x, TERRAIN_RAY_START_HEIGHT, z),
      Vector3.Down(),
      TERRAIN_RAY_LENGTH,
    );
    const hit = scene.pickWithRay(ray, (mesh) => terrainSurfaceSet.has(mesh));
    if (!hit?.pickedPoint || !hit.pickedMesh) return undefined;
    return { point: hit.pickedPoint, surface: hit.pickedMesh };
  }

  function attachPlayerToRaft() {
    player.position.set(
      raft.root.position.x,
      raft.root.position.y + raft.riderOffsetY,
      raft.root.position.z,
    );
  }
}
