const HOURS_PER_DAY = 24;

/**
 * Durée réelle maximale qu'une seule update de l'horloge peut prendre
 * en compte.
 *
 * Cela évite qu'un breakpoint, un onglet suspendu ou un gros freeze
 * fasse brutalement avancer le monde de plusieurs heures.
 */
const MAX_WORLD_CLOCK_DELTA_SECONDS = 0.25;

export interface WorldTime {
  day: number;
  hour: number;
}

export interface WorldClockOptions {
  dayDurationSeconds: number;
  initialDay?: number;
  initialHour?: number;
  initialTimeScale?: number;
}

export interface WorldClock {
  update(deltaTimeInSeconds: number): void;
  getTime(): WorldTime;
  setTime(day: number, hour: number): void;
  setTimeScale(timeScale: number): void;
  getTimeScale(): number;
}

/**
 * Crée l'horloge du monde.
 *
 * L'horloge est indépendante du rendu : elle ne connaît ni Babylon,
 * ni les lumières, ni la scène. Une journée complète correspond à
 * `dayDurationSeconds` secondes réelles lorsque `timeScale` vaut 1.
 *
 * @param options Configuration initiale de l'horloge.
 * @returns Une horloge pouvant être mise à jour à chaque frame.
 */
export function createWorldClock(options: WorldClockOptions): WorldClock {
  const {
    dayDurationSeconds,
    initialDay = 1,
    initialHour = 0,
    initialTimeScale = 1,
  } = options;

  validateDayDuration(dayDurationSeconds);
  validateDay(initialDay);
  validateHour(initialHour);
  validateTimeScale(initialTimeScale);

  const gameHoursPerRealSecond = HOURS_PER_DAY / dayDurationSeconds;

  let day = initialDay;
  let hour = initialHour;
  let timeScale = initialTimeScale;

  return {
    update(deltaTimeInSeconds: number) {
      if (!Number.isFinite(deltaTimeInSeconds) || deltaTimeInSeconds < 0) {
        throw new Error("deltaTimeInSeconds must be a finite positive value");
      }

      const safeDeltaTime = Math.min(
        deltaTimeInSeconds,
        MAX_WORLD_CLOCK_DELTA_SECONDS,
      );

      hour += safeDeltaTime * gameHoursPerRealSecond * timeScale;

      if (hour >= HOURS_PER_DAY) {
        const elapsedDays = Math.floor(hour / HOURS_PER_DAY);

        day += elapsedDays;
        hour %= HOURS_PER_DAY;
      }
    },

    getTime() {
      return { day, hour };
    },

    setTime(newDay: number, newHour: number) {
      validateDay(newDay);
      validateHour(newHour);

      day = newDay;
      hour = newHour;
    },

    setTimeScale(newTimeScale: number) {
      validateTimeScale(newTimeScale);
      timeScale = newTimeScale;
    },

    getTimeScale() {
      return timeScale;
    },
  };
}

function validateDayDuration(dayDurationSeconds: number): void {
  if (!Number.isFinite(dayDurationSeconds) || dayDurationSeconds <= 0) {
    throw new Error("dayDurationSeconds must be greater than 0");
  }
}

function validateDay(day: number): void {
  if (!Number.isInteger(day) || day < 1) {
    throw new Error("day must be an integer greater than or equal to 1");
  }
}

function validateHour(hour: number): void {
  if (!Number.isFinite(hour) || hour < 0 || hour >= HOURS_PER_DAY) {
    throw new Error("hour must be between 0 included and 24 excluded");
  }
}

function validateTimeScale(timeScale: number): void {
  if (!Number.isFinite(timeScale) || timeScale < 0) {
    throw new Error("timeScale must be a finite positive or zero value");
  }
}
