import type {
  HarvestableResource,
  HarvestableResourceType,
} from "./resourceTypes";
import type { EquippedItem } from "../tools/toolDefinitions";
import { getHarvestDurationSeconds } from "./harvestingDefinitions";

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

export function getResourceInteractionPrompt(
  type: HarvestableResourceType,
  equippedItem: EquippedItem,
): string {
  if (getHarvestDurationSeconds(type, equippedItem) === undefined) {
    return type === "wood"
      ? "Outil inadapté — utilisez les mains ou la hache"
      : "Outil inadapté — utilisez les mains ou la pioche";
  }
  return RESOURCE_TEXT[type].interaction;
}

export function createResourceInteraction(
  onHarvest: (type: HarvestableResourceType) => void,
) {
  const harvestFeedback = getElement("#harvest-feedback");
  const harvestProgress = getElement("#harvest-progress");
  const harvestProgressLabel = getElement("#harvest-progress-label");
  const harvestProgressBar = getElement<HTMLProgressElement>(
    "#harvest-progress-bar",
  );

  let harvestTarget: HarvestableResource | undefined;
  let harvestEquippedItem: EquippedItem | undefined;
  let harvestElapsedSeconds = 0;
  let displayedProgressType: HarvestableResourceType | undefined;
  let feedbackTimeRemaining = 0;

  const resetHarvestProgress = () => {
    harvestTarget = undefined;
    harvestEquippedItem = undefined;
    harvestElapsedSeconds = 0;
    harvestProgressBar.value = 0;
    harvestProgress.hidden = true;
  };

  function update(
    deltaTimeInSeconds: number,
    target: HarvestableResource | undefined,
    interactionHeld: boolean,
    equippedItem: EquippedItem,
  ): boolean {
    let harvestCompleted = false;
    const harvestDuration = target
      ? getHarvestDurationSeconds(target.type, equippedItem)
      : undefined;

    if (!interactionHeld || !target || harvestDuration === undefined) {
      resetHarvestProgress();
    } else {
      if (
        harvestTarget !== target ||
        harvestEquippedItem !== equippedItem
      ) {
        // Une progression appartient uniquement à l'interaction courante :
        // changer de cible ou d'équipement recommence immédiatement à zéro.
        resetHarvestProgress();
        harvestTarget = target;
        harvestEquippedItem = equippedItem;
        harvestProgress.hidden = false;

        if (displayedProgressType !== target.type) {
          harvestProgressLabel.textContent =
            RESOURCE_TEXT[target.type].harvesting;
          displayedProgressType = target.type;
        }
      }

      harvestElapsedSeconds += deltaTimeInSeconds;
      harvestProgressBar.value = Math.min(
        harvestElapsedSeconds / harvestDuration,
        1,
      );

      if (harvestElapsedSeconds >= harvestDuration) {
        target.harvested = true;
        target.meshes.forEach((mesh) => mesh.setEnabled(false));
        onHarvest(target.type);
        harvestFeedback.textContent =
          RESOURCE_TEXT[target.type].harvested;
        feedbackTimeRemaining = HARVEST_FEEDBACK_DURATION_SECONDS;
        harvestCompleted = true;
        resetHarvestProgress();
      }
    }

    feedbackTimeRemaining = Math.max(
      0,
      feedbackTimeRemaining - deltaTimeInSeconds,
    );
    harvestFeedback.hidden = feedbackTimeRemaining === 0;

    return harvestCompleted;
  }

  return {
    update,
    cancel: resetHarvestProgress,
  };
}

function getElement<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`L'élément de récolte ${selector} est absent.`);
  return element;
}
