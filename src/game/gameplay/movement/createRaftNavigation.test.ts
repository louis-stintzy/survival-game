import { describe, expect, test } from "vitest";
import { selectRaftStepRotation } from "./createRaftNavigation";

describe("selectRaftStepRotation", () => {
  test("translates with the current rotation, then adopts the candidate when valid", () => {
    const currentRotation = 0;
    const candidateRotation = Math.PI / 4;
    let candidateIsNavigable = false;
    const isNavigable = (rotation: number) =>
      rotation === currentRotation ||
      (rotation === candidateRotation && candidateIsNavigable);

    expect(
      selectRaftStepRotation(
        candidateRotation,
        currentRotation,
        isNavigable,
      ),
    ).toBe(currentRotation);

    candidateIsNavigable = true;

    expect(
      selectRaftStepRotation(
        candidateRotation,
        currentRotation,
        isNavigable,
      ),
    ).toBe(candidateRotation);
  });

  test("rejects the step when neither orientation is navigable", () => {
    expect(selectRaftStepRotation(Math.PI / 4, 0, () => false)).toBeUndefined();
  });
});
