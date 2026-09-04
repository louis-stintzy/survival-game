import { describe, expect, test } from "vitest";
import { createWorldClock, type WorldClock } from "./createWorldClock";

/**
 * Fait avancer une horloge pendant une durée réelle en utilisant
 * de petites updates, comme le ferait normalement la game loop.
 */
function updateClockFor(clock: WorldClock, durationSeconds: number): void {
  const step = 0.25;
  let remaining = durationSeconds;

  while (remaining > 0) {
    const currentStep = Math.min(step, remaining);
    clock.update(currentStep);
    remaining -= currentStep;
  }
}

describe("createWorldClock", () => {
  test("commence au jour et à l'heure demandés", () => {
    const clock = createWorldClock({
      dayDurationSeconds: 24,
      initialDay: 1,
      initialHour: 8,
    });

    expect(clock.getTime()).toEqual({
      day: 1,
      hour: 8,
    });
  });

  test("fait avancer l'heure avec le temps réel", () => {
    const clock = createWorldClock({
      dayDurationSeconds: 24,
      initialHour: 8,
    });

    // Pour ce test, une journée dure 24 secondes :
    // une seconde réelle correspond donc à une heure fictive.
    updateClockFor(clock, 1);

    expect(clock.getTime().day).toBe(1);
    expect(clock.getTime().hour).toBeCloseTo(9);
  });

  test("passe au jour suivant après minuit", () => {
    const clock = createWorldClock({
      dayDurationSeconds: 24,
      initialDay: 1,
      initialHour: 23.75,
    });

    clock.update(0.25);

    expect(clock.getTime().day).toBe(2);
    expect(clock.getTime().hour).toBeCloseTo(0);
  });

  test("revient à la même heure après une journée complète", () => {
    const clock = createWorldClock({
      dayDurationSeconds: 24,
      initialDay: 1,
      initialHour: 8,
    });

    updateClockFor(clock, 24);

    expect(clock.getTime().day).toBe(2);
    expect(clock.getTime().hour).toBeCloseTo(8);
  });

  test("applique le facteur d'accélération du temps", () => {
    const clock = createWorldClock({
      dayDurationSeconds: 24,
      initialHour: 8,
    });

    clock.setTimeScale(4);
    clock.update(0.25);

    expect(clock.getTime().hour).toBeCloseTo(9);
  });

  test("permet de modifier directement le jour et l'heure", () => {
    const clock = createWorldClock({
      dayDurationSeconds: 24,
    });

    clock.setTime(3, 18.5);

    expect(clock.getTime()).toEqual({
      day: 3,
      hour: 18.5,
    });
  });

  test("limite les très grands delta time", () => {
    const clock = createWorldClock({
      dayDurationSeconds: 24,
      initialHour: 8,
    });

    clock.update(10);

    // Le delta utilisé est plafonné à 0,25 seconde.
    expect(clock.getTime().hour).toBeCloseTo(8.25);
  });
});
