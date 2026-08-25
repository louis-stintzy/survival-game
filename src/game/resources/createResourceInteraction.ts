import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type {
  HarvestableResource,
  HarvestableResourceType,
} from "./resourceTypes";
import { HARVEST_DURATION_SECONDS } from "./harvestingDefinitions";

const INTERACTION_DISTANCE = 2.75;
const HARVEST_FEEDBACK_DURATION_SECONDS = 1.5;

const RESOURCE_TEXT: Record<
  HarvestableResourceType,
  { interaction: string; harvesting: string; harvested: string }
> = {
  wood: {
    interaction: "Maintenir E — Récolter du bois",
    harvesting: "Récolte du bois",
    harvested: "Bois récolté",
  },
  stone: {
    interaction: "Maintenir E — Récolter de la pierre",
    harvesting: "Récolte de la pierre",
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
  const harvestProgress = document.querySelector<HTMLElement>(
    "#harvest-progress",
  );
  const harvestProgressLabel = document.querySelector<HTMLElement>(
    "#harvest-progress-label",
  );
  const harvestProgressBar =
    document.querySelector<HTMLProgressElement>("#harvest-progress-bar");

  if (
    !interactionPrompt ||
    !harvestFeedback ||
    !harvestProgress ||
    !harvestProgressLabel ||
    !harvestProgressBar
  ) {
    throw new Error("L'interface d'interaction avec les ressources est absente.");
  }

  let interactionHeld = false;
  let waitForInteractionRelease = false;
  let harvestTarget: HarvestableResource | undefined;
  let harvestElapsedSeconds = 0;
  let displayedProgressType: HarvestableResourceType | undefined;
  let feedbackTimeRemaining = 0;

  const resetHarvestProgress = () => {
    harvestTarget = undefined;
    harvestElapsedSeconds = 0;
    harvestProgressBar.value = 0;
    harvestProgress.hidden = true;
  };

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "e") return;

    event.preventDefault();

    // Le clavier mémorise seulement l'intention : la boucle de jeu mesure
    // ensuite la durée réelle de l'action, indépendamment du framerate.
    if (!event.repeat && !waitForInteractionRelease) interactionHeld = true;
  });

  window.addEventListener("keyup", (event) => {
    if (event.key.toLowerCase() !== "e") return;

    event.preventDefault();
    interactionHeld = false;
    waitForInteractionRelease = false;
    resetHarvestProgress();
  });

  window.addEventListener("blur", () => {
    interactionHeld = false;
    waitForInteractionRelease = false;
    resetHarvestProgress();
  });

  return (deltaTimeInSeconds: number) => {
    const nearestResource = findNearestResource(player, resources);

    interactionPrompt.hidden = !nearestResource || waitForInteractionRelease;
    interactionPrompt.textContent = nearestResource
      ? RESOURCE_TEXT[nearestResource.type].interaction
      : "";

    if (!interactionHeld || waitForInteractionRelease || !nearestResource) {
      resetHarvestProgress();
    } else {
      if (harvestTarget !== nearestResource) {
        // Une progression appartient uniquement à l'interaction courante :
        // changer de cible recommence donc immédiatement à zéro.
        resetHarvestProgress();
        harvestTarget = nearestResource;
        harvestProgress.hidden = false;

        if (displayedProgressType !== nearestResource.type) {
          harvestProgressLabel.textContent =
            RESOURCE_TEXT[nearestResource.type].harvesting;
          displayedProgressType = nearestResource.type;
        }
      }

      const harvestDuration = HARVEST_DURATION_SECONDS[nearestResource.type];
      harvestElapsedSeconds += deltaTimeInSeconds;
      harvestProgressBar.value = Math.min(
        harvestElapsedSeconds / harvestDuration,
        1,
      );

      if (harvestElapsedSeconds >= harvestDuration) {
        nearestResource.harvested = true;
        nearestResource.meshes.forEach((mesh) => mesh.setEnabled(false));
        onHarvest(nearestResource.type);
        harvestFeedback.textContent =
          RESOURCE_TEXT[nearestResource.type].harvested;
        feedbackTimeRemaining = HARVEST_FEEDBACK_DURATION_SECONDS;

        // Une pression maintenue ne récolte qu'une ressource. Le keyup doit
        // lever ce verrou avant qu'une nouvelle progression puisse commencer.
        waitForInteractionRelease = true;
        interactionPrompt.hidden = true;
        resetHarvestProgress();
      }
    }

    feedbackTimeRemaining = Math.max(
      0,
      feedbackTimeRemaining - deltaTimeInSeconds,
    );
    harvestFeedback.hidden = feedbackTimeRemaining === 0;
  };
}
