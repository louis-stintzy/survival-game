import type { WorldClock } from "./createWorldClock";

const TIME_JUMP_HOURS = 3;
const NORMAL_TIME_SCALE = 1;
const FAST_TIME_SCALE = 30;

/**
 * Ajoute des contrôles temporels réservés au développement.
 *
 * T         : avance de 3 heures.
 * Shift + T : bascule entre vitesse normale et accélérée.
 * P         : met en pause ou reprend l'horloge.
 */
export function createWorldTimeDevControls(worldClock: WorldClock): void {
  if (!import.meta.env.DEV) {
    return;
  }

  let runningTimeScale =
    worldClock.getTimeScale() === 0
      ? NORMAL_TIME_SCALE
      : worldClock.getTimeScale();

  window.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "t") {
      if (event.shiftKey) {
        runningTimeScale =
          runningTimeScale === FAST_TIME_SCALE
            ? NORMAL_TIME_SCALE
            : FAST_TIME_SCALE;

        // Changer la vitesse pendant une pause prépare simplement
        // la vitesse qui sera utilisée à la reprise.
        if (worldClock.getTimeScale() !== 0) {
          worldClock.setTimeScale(runningTimeScale);
        }
      } else {
        worldClock.advanceHours(TIME_JUMP_HOURS);
      }

      event.preventDefault();
      return;
    }

    if (key === "p") {
      const currentTimeScale = worldClock.getTimeScale();

      if (currentTimeScale === 0) {
        worldClock.setTimeScale(runningTimeScale);
      } else {
        runningTimeScale = currentTimeScale;
        worldClock.setTimeScale(0);
      }

      event.preventDefault();
    }
  });
}
