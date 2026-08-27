import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { HarvestableResource } from "../resources/resourceTypes";
import type { EquippedItem } from "../tools/toolDefinitions";
import { getResourceInteractionPrompt } from "../resources/createResourceInteraction";
import { getHarvestDurationSeconds } from "../resources/harvestingDefinitions";

const INTERACTION_DISTANCE = 2.75;
const NO_WORKBENCHES: readonly TransformNode[] = [];

interface ResourceInteraction {
  update(
    deltaTimeInSeconds: number,
    target: HarvestableResource | undefined,
    interactionHeld: boolean,
    equippedItem: EquippedItem,
  ): boolean;
  cancel(): void;
}

interface WorkbenchCrafting {
  open(workbench: TransformNode): void;
  close(): void;
  update(deltaTimeInSeconds: number, interactionPressed: boolean): void;
  isOpen(): boolean;
  getActiveWorkbench(): TransformNode | undefined;
}

type WorldInteractionTarget =
  | { kind: "resource"; resource: HarvestableResource; distanceSquared: number }
  | { kind: "workbench"; workbench: TransformNode; distanceSquared: number };

export function createWorldInteraction(
  player: Mesh,
  resources: readonly HarvestableResource[],
  workbenches: readonly TransformNode[],
  resourceInteraction: ResourceInteraction,
  workbenchCrafting: WorkbenchCrafting,
  getEquippedItem: () => EquippedItem,
) {
  const interactionPrompt = getElement("#interaction-prompt");

  let interactionHeld = false;
  let interactionPressed = false;
  let waitForInteractionRelease = false;
  let heldTargetKind: WorldInteractionTarget["kind"] | undefined;
  let harvestChainActive = false;

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "e") return;

    event.preventDefault();
    if (event.repeat || interactionHeld) return;

    // E exprime une intention unique ; le coordinateur décide ensuite si elle
    // appartient à la récolte continue ou à l'action ponctuelle de l'établi.
    interactionHeld = true;
    interactionPressed = true;
    harvestChainActive = false;
  });

  window.addEventListener("keyup", (event) => {
    if (event.key.toLowerCase() !== "e") return;

    event.preventDefault();
    interactionHeld = false;
    waitForInteractionRelease = false;
    heldTargetKind = undefined;
    harvestChainActive = false;
    resourceInteraction.cancel();
  });

  window.addEventListener("blur", () => {
    interactionHeld = false;
    interactionPressed = false;
    waitForInteractionRelease = false;
    heldTargetKind = undefined;
    harvestChainActive = false;
    resourceInteraction.cancel();
    workbenchCrafting.close();
  });

  return (deltaTimeInSeconds: number) => {
    const equippedItem = getEquippedItem();

    if (workbenchCrafting.isOpen()) {
      hidePrompt();
      resourceInteraction.update(
        deltaTimeInSeconds,
        undefined,
        false,
        equippedItem,
      );

      if (interactionPressed) {
        heldTargetKind = "workbench";
        waitForInteractionRelease = interactionHeld;
      }

      const activeWorkbench = workbenchCrafting.getActiveWorkbench();
      if (
        !activeWorkbench ||
        getDistanceSquared(player, activeWorkbench.position) >
          INTERACTION_DISTANCE ** 2
      ) {
        workbenchCrafting.close();
      } else {
        workbenchCrafting.update(deltaTimeInSeconds, interactionPressed);
      }

      interactionPressed = false;
      return;
    }

    const target = harvestChainActive
      ? findNearestTarget(
          player,
          resources,
          NO_WORKBENCHES,
          (resource) =>
            getHarvestDurationSeconds(resource.type, equippedItem) !== undefined,
        ) ?? findNearestTarget(player, resources, workbenches)
      : findNearestTarget(player, resources, workbenches);
    updatePrompt(target, equippedItem);

    if (waitForInteractionRelease) {
      resourceInteraction.update(
        deltaTimeInSeconds,
        undefined,
        false,
        equippedItem,
      );
      hidePrompt();
      interactionPressed = false;
      return;
    }

    if (target?.kind === "resource") {
      if (interactionHeld && heldTargetKind !== "workbench") {
        heldTargetKind = "resource";
        const harvestCompleted = resourceInteraction.update(
          deltaTimeInSeconds,
          target.resource,
          true,
          equippedItem,
        );
        if (harvestCompleted) harvestChainActive = true;
      } else {
        resourceInteraction.update(
          deltaTimeInSeconds,
          undefined,
          false,
          equippedItem,
        );
      }
    } else {
      resourceInteraction.update(
        deltaTimeInSeconds,
        undefined,
        false,
        equippedItem,
      );

      if (
        target?.kind === "workbench" &&
        interactionHeld &&
        heldTargetKind === "resource"
      ) {
        // Un maintien commencé pour récolter ne peut pas ouvrir un établi
        // devenu plus proche : un relâchement est nécessaire.
        waitForInteractionRelease = true;
        hidePrompt();
      } else if (target?.kind === "workbench" && interactionPressed) {
        heldTargetKind = "workbench";
        waitForInteractionRelease = interactionHeld;
        workbenchCrafting.open(target.workbench);
        hidePrompt();
      }
    }

    interactionPressed = false;
  };

  function updatePrompt(
    target: WorldInteractionTarget | undefined,
    equippedItem: EquippedItem,
  ) {
    const text =
      target?.kind === "resource"
        ? getResourceInteractionPrompt(target.resource.type, equippedItem)
        : target?.kind === "workbench"
          ? "E — Utiliser l'établi"
          : "";
    if (interactionPrompt.textContent !== text) {
      interactionPrompt.textContent = text;
    }
    interactionPrompt.hidden = !target;
  }

  function hidePrompt() {
    interactionPrompt.hidden = true;
  }
}

function findNearestTarget(
  player: Mesh,
  resources: readonly HarvestableResource[],
  workbenches: readonly TransformNode[],
  isResourceCandidate: (resource: HarvestableResource) => boolean = () => true,
): WorldInteractionTarget | undefined {
  const maximumDistanceSquared = INTERACTION_DISTANCE ** 2;
  let nearestTarget: WorldInteractionTarget | undefined;
  let nearestDistanceSquared = maximumDistanceSquared;

  for (const resource of resources) {
    if (resource.harvested || !isResourceCandidate(resource)) continue;

    const distanceSquared = getDistanceSquared(player, resource.position);
    if (distanceSquared <= nearestDistanceSquared) {
      nearestTarget = { kind: "resource", resource, distanceSquared };
      nearestDistanceSquared = distanceSquared;
    }
  }

  for (const workbench of workbenches) {
    const distanceSquared = getDistanceSquared(player, workbench.position);
    // En cas d'égalité exacte, la ressource déjà retenue reste prioritaire.
    if (
      distanceSquared < nearestDistanceSquared ||
      (!nearestTarget && distanceSquared <= nearestDistanceSquared)
    ) {
      nearestTarget = { kind: "workbench", workbench, distanceSquared };
      nearestDistanceSquared = distanceSquared;
    }
  }

  return nearestTarget;
}

function getDistanceSquared(
  player: Mesh,
  targetPosition: { x: number; z: number },
) {
  const distanceX = targetPosition.x - player.position.x;
  const distanceZ = targetPosition.z - player.position.z;
  return distanceX ** 2 + distanceZ ** 2;
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`L'élément ${selector} est absent.`);
  return element;
}
