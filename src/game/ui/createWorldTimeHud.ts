import type { WorldTime } from "../gameplay/time/createWorldClock";

export function createWorldTimeHud() {
  const dayElement = getElement("#world-day");
  const clockElement = getElement("#world-clock");

  let lastDisplayedTime = "";

  return {
    update(worldTime: WorldTime) {
      const totalMinutes = Math.floor(worldTime.hour * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const displayedTime = `${worldTime.day}-${hours}-${minutes}`;

      if (displayedTime === lastDisplayedTime) {
        return;
      }

      dayElement.textContent = `Jour ${worldTime.day}`;
      clockElement.textContent =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}`;

      lastDisplayedTime = displayedTime;
    },
  };
}

function getElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`L'élément d'interface ${selector} est absent.`);
  }

  return element;
}
