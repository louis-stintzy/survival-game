import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Raft } from "../../models/createRaft";
import { PLAYER_HALF_HEIGHT } from "../../models/createPlayer";
import type { PlayerCollisionQuery } from "../collision/playerWorldCollision";
import type { CollisionContact } from "../collision/collisionTypes";
import type { TerrainSampler } from "../../world/terrain/terrainTypes";

const RAFT_MOVEMENT_SPEED = 6;
const MAX_HORIZONTAL_MOVEMENT_STEP = 0.25;
const DISEMBARK_RADII = [2, 2.5, 3];
const DISEMBARK_DIRECTION_COUNT = 16;
const DISEMBARK_CACHE_REFRESH_SECONDS = 0.25;
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
  camera: ArcRotateCamera;
  player: Mesh;
  raft: Raft;
  sampleTerrain: TerrainSampler;
  waterHeight: number;
  getPlayerCollision: (
    query: PlayerCollisionQuery,
  ) => CollisionContact | undefined;
}

/**
 * Pilote l'unique radeau du prototype et maintient le joueur à son bord.
 * La navigation et le débarquement interrogent le même TerrainSampler afin
 * que rendu Babylon et règles de déplacement restent découplés.
 */
export function createRaftNavigation(options: RaftNavigationOptions) {
  const {
    camera,
    player,
    raft,
    sampleTerrain,
    waterHeight,
    getPlayerCollision,
  } = options;
  const pressedKeys = new Set<string>();
  const { halfWidth, halfLength } = raft.navigationFootprint;
  const navigationCheckpoints = [
    { x: 0, z: 0 },
    { x: -halfWidth, z: -halfLength },
    { x: -halfWidth, z: halfLength },
    { x: halfWidth, z: -halfLength },
    { x: halfWidth, z: halfLength },
    { x: 0, z: -halfLength },
    { x: 0, z: halfLength },
  ];
  let embarked = false;
  let cachedDisembarkPosition: Vector3 | undefined;
  let disembarkCacheElapsed = DISEMBARK_CACHE_REFRESH_SECONDS;

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
    canDisembark: () => embarked && cachedDisembarkPosition !== undefined,
    board() {
      if (embarked) return;
      embarked = true;
      cachedDisembarkPosition = undefined;
      disembarkCacheElapsed = DISEMBARK_CACHE_REFRESH_SECONDS;
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

      const candidateRotation = Math.atan2(direction.x, direction.z);
      const moved = moveHorizontally(
        direction.x * RAFT_MOVEMENT_SPEED * deltaTimeInSeconds,
        direction.z * RAFT_MOVEMENT_SPEED * deltaTimeInSeconds,
        candidateRotation,
      );
      if (moved) raft.root.rotation.y = candidateRotation;
    }

    attachPlayerToRaft();
    updateDisembarkCache(deltaTimeInSeconds);
  }

  function moveHorizontally(
    movementX: number,
    movementZ: number,
    candidateRotation: number,
  ) {
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
      const navigable = isNavigableFootprint(x, z, candidateRotation);

      if (!navigable) break;
      raft.root.position.set(x, waterHeight, z);
      moved = true;
    }
    return moved;
  }

  function tryDisembark(): boolean {
    // Le cache pilote seulement le prompt : l'action revalide toujours la
    // candidate afin de tenir compte du terrain et des collisions actuels.
    const position = findDisembarkPosition();
    cachedDisembarkPosition = position;
    disembarkCacheElapsed = 0;
    if (!position) return false;

    embarked = false;
    player.position.copyFrom(position);
    cachedDisembarkPosition = undefined;
    return true;
  }

  function findDisembarkPosition(): Vector3 | undefined {
    for (const radius of DISEMBARK_RADII) {
      for (let index = 0; index < DISEMBARK_DIRECTION_COUNT; index += 1) {
        const angle = (index / DISEMBARK_DIRECTION_COUNT) * Math.PI * 2;
        const x = raft.root.position.x + Math.cos(angle) * radius;
        const z = raft.root.position.z + Math.sin(angle) * radius;
        const ground = sampleTerrain(x, z);
        if (!ground?.isLand) continue;

        const collision = getPlayerCollision({
          candidate: { x, z },
          reference: { x: raft.root.position.x, z: raft.root.position.z },
        });
        if (collision) continue;

        // Le joueur n'est détaché qu'après avoir trouvé à la fois une surface
        // praticable supérieure et une position libre des collisions du monde.
        return new Vector3(x, ground.height + PLAYER_HALF_HEIGHT, z);
      }
    }
    return undefined;
  }

  function updateDisembarkCache(deltaTimeInSeconds: number) {
    disembarkCacheElapsed += deltaTimeInSeconds;
    if (disembarkCacheElapsed < DISEMBARK_CACHE_REFRESH_SECONDS) return;

    cachedDisembarkPosition = findDisembarkPosition();
    disembarkCacheElapsed = 0;
  }

  function isNavigableFootprint(
    x: number,
    z: number,
    rotation: number,
  ) {
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    for (const checkpoint of navigationCheckpoints) {
      const worldX = x + checkpoint.x * cosine + checkpoint.z * sine;
      const worldZ = z - checkpoint.x * sine + checkpoint.z * cosine;
      const ground = sampleTerrain(worldX, worldZ);

      if (ground?.surface !== "water") return false;
    }

    return true;
  }

  function attachPlayerToRaft() {
    player.position.set(
      raft.root.position.x,
      raft.root.position.y + raft.riderOffsetY,
      raft.root.position.z,
    );
  }
}
