import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type {
  HarvestableResource,
  HarvestableResourceType,
} from "./resourceTypes";

const INTERACTION_DISTANCE = 2.75;
const HARVEST_FEEDBACK_DURATION_SECONDS = 1.5;

const RESOURCE_TEXT: Record<
  HarvestableResourceType,
  { interaction: string; harvested: string }
> = {
  wood: {
    interaction: "E — Récolter du bois",
    harvested: "Bois récolté",
  },
  stone: {
    interaction: "E — Récolter de la pierre",
    harvested: "Pierre récoltée",
  },
};

function findNearestResource(
  player: Mesh,
  resources: readonly HarvestableResource[],
): HarvestableResource | undefined {
  const maximumDistanceSquared = INTERACTION_DISTANCE ** 2;
  let nearestResource: HarvestableResource | undefined;
  let nearestDistanceSquared = maximumDistanceSquared;

  // Une seule cible est retenue : la ressource active dont la distance
  // horizontale avec le joueur est la plus courte.
  for (const resource of resources) {
    if (resource.harvested) continue;

    const distanceX = resource.position.x - player.position.x;
    const distanceZ = resource.position.z - player.position.z;
    const distanceSquared = distanceX ** 2 + distanceZ ** 2;

    if (distanceSquared <= nearestDistanceSquared) {
      nearestResource = resource;
      nearestDistanceSquared = distanceSquared;
    }
  }

  return nearestResource;
}

export function createResourceInteraction(
  player: Mesh,
  resources: readonly HarvestableResource[],
  onHarvest: (type: HarvestableResourceType) => void,
) {
  const interactionPrompt = document.querySelector<HTMLElement>(
    "#interaction-prompt",
  );
  const harvestFeedback = document.querySelector<HTMLElement>(
    "#harvest-feedback",
  );

  if (!interactionPrompt || !harvestFeedback) {
    throw new Error("L'interface d'interaction avec les ressources est absente.");
  }

  let interactionRequested = false;
  let feedbackTimeRemaining = 0;

  window.addEventListener("keydown", (event) => {
    // Ignorer la répétition automatique garantit une seule récolte par appui.
    if (event.key.toLowerCase() === "e" && !event.repeat) {
      interactionRequested = true;
      event.preventDefault();
    }
  });

  window.addEventListener("blur", () => {
    interactionRequested = false;
  });

  return (deltaTimeInSeconds: number) => {
    const nearestResource = findNearestResource(player, resources);

    interactionPrompt.hidden = !nearestResource;
    interactionPrompt.textContent = nearestResource
      ? RESOURCE_TEXT[nearestResource.type].interaction
      : "";

    if (interactionRequested) {
      interactionRequested = false;

      if (nearestResource) {
        nearestResource.harvested = true;
        nearestResource.meshes.forEach((mesh) => mesh.setEnabled(false));
        onHarvest(nearestResource.type);
        interactionPrompt.hidden = true;
        harvestFeedback.textContent =
          RESOURCE_TEXT[nearestResource.type].harvested;
        feedbackTimeRemaining = HARVEST_FEEDBACK_DURATION_SECONDS;
      }
    }

    feedbackTimeRemaining = Math.max(
      0,
      feedbackTimeRemaining - deltaTimeInSeconds,
    );
    harvestFeedback.hidden = feedbackTimeRemaining === 0;
  };
}
